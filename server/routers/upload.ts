import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createPresignedUploadUrl, getPublicImageUrl, createPresignedDownloadUrl, putObject, deleteObject } from "../s3";
import { getDb } from "../db";
import { documents, applications, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyDocumentUploaded } from "../notifications-service";

export const uploadRouter = router({
  createImageUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { fileName, fileType } = input;
      const userId = ctx.user.id;

      // Generate a unique key for the S3 object
      const key = `uploads/users/${userId}/${Date.now()}-${fileName}`;

      const uploadUrl = await createPresignedUploadUrl(key, fileType);
      const publicUrl = getPublicImageUrl(key);

      return { uploadUrl, publicUrl };
    }),

  getMyDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userDocs = await db.query.documents.findMany({
        where: (documents: any, { eq }: any) => eq(documents.userId, ctx.user.id),
        orderBy: (documents: any, { desc }: any) => [desc(documents.createdAt)],
      });

      return userDocs;
    }),

  deleteDocument: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input: docId }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const doc = await db.query.documents.findFirst({
        where: (documents: any, { and, eq }: any) => and(
          eq(documents.id, docId),
          eq(documents.userId, ctx.user.id)
        ),
      });

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // PREVENT DELETION IF VERIFIED
      if (doc.verificationStatus === "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete a verified document.",
        });
      }

      // EXTRACT KEY AND DELETE FROM S3
      if (doc.fileUrl) {
        try {
          const urlParts = doc.fileUrl.split("/");
          // Assuming the URL structure matches getPublicImageUrl logic
          // MinIO: http://host:port/bucket/key... -> slice(4)
          // S3: https://bucket.s3.../key... -> slice(3) if no path style
          // To be safe, let's try to extract key by known prefix if possible, or fallback to slice
          // Our keys start with "uploads/"
          const keyIndex = urlParts.findIndex((p: string) => p === "uploads");
          if (keyIndex !== -1) {
            const key = urlParts.slice(keyIndex).join("/");
            await deleteObject(key);
          } else {
            // Fallback for custom domains or unexpected structure
            // Just try deleting the last few segments if it looks like our path
             console.warn("Could not reliably extract S3 key from URL:", doc.fileUrl);
          }
        } catch (e) {
          console.error("Failed to delete file from S3:", e);
          // We continue to delete from DB to avoid ghost records, 
          // or we could throw if we want strict consistency. 
          // Usually better to clean up DB even if S3 fails.
        }
      }

      await db.delete(documents).where(eq(documents.id, docId));

      return { success: true };
    }),

  downloadDocument: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: docId }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const doc = await db.query.documents.findFirst({
        where: (documents: any, { eq }: any) => eq(documents.id, docId),
      });

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Access Control: Owner OR Landlord with active application OR Admin
      if (doc.userId !== ctx.user.id) {
        const application = await db.query.applications.findFirst({
          where: (applications: any, { and, eq }: any) => and(
            eq(applications.userId, doc.userId),
            eq(applications.landlordId, ctx.user.id)
          )
        });

        if (!application) {
           const caller = await db.query.users.findFirst({
             where: (users: any, { eq }: any) => eq(users.id, ctx.user.id)
           });
           
           if (caller?.role !== 'admin') {
             throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to access this document" });
           }
        }
      }

      // We need to extract the key from the public URL if it's stored that way
      // Or store the key separately in the database.
      // Based on schema, we have fileUrl. Assuming S3 key is extractable or stored in a way we can use.
      // For now, let's assume the key can be derived from the URL or we update schema later.
      const urlParts = doc.fileUrl.split("/");
      // If it's a MinIO URL like http://localhost:9008/bucket/key
      // urlParts will be ["http:", "", "localhost:9008", "bucket", "key..."]
      const key = urlParts.slice(4).join("/"); 

      const downloadUrl = await createPresignedDownloadUrl(key, {
        responseContentDisposition: `inline; filename="${doc.fileName}"`
      });
      return downloadUrl;
    }),

  verificationDocument: protectedProcedure
    .input(z.object({
      documentType: z.enum(["id", "income", "employment", "reference"]),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Extract base64 data
      const base64Data = input.fileData.split(',')[1];
      if (!base64Data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file data" });
      }
      const buffer = Buffer.from(base64Data, 'base64');

      const key = `uploads/verification/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      
      try {
        // Actual upload to MinIO - SECURE: Use 'private' ACL for verification docs
        await putObject(key, buffer, input.mimeType, 'private');
        
        const publicUrl = getPublicImageUrl(key);

        await db.insert(documents).values({
          userId: ctx.user.id,
          documentType: input.documentType,
          fileUrl: publicUrl,
          fileName: input.fileName,
          verificationStatus: "pending",
        });

        // Notify Admins
        try {
          await notifyDocumentUploaded({
            uploaderName: ctx.user.name || "A user",
            documentType: input.documentType,
          });
        } catch (err) {
          console.error("Failed to send admin notification:", err);
        }

        return { url: publicUrl };
      } catch (error: any) {
        console.error("[upload.verificationDocument] S3 Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload to storage: ${error.message}`,
        });
      }
    }),

  uploadImage: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const base64Data = input.fileData.split(',')[1];
      if (!base64Data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image data" });
      }
      const buffer = Buffer.from(base64Data, 'base64');

      const key = `uploads/properties/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      
      try {
        await putObject(key, buffer, input.mimeType);
        const publicUrl = getPublicImageUrl(key);
        return { url: publicUrl, key };
      } catch (error: any) {
        console.error("[upload.uploadImage] S3 Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload image: ${error.message}`,
        });
      }
    }),
});
