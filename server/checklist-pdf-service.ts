import PDFDocument from "pdfkit";
import { putObject, getPublicImageUrl } from "./s3";
import axios from "axios";

interface ChecklistPdfData {
  checklistId: number;
  contractId: number;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  tenantName: string;
  checklistItems: any; // Parsed checklist items
  landlordSignature?: string; // base64
  tenantSignature?: string; // base64
  landlordSignedAt?: Date;
  tenantSignedAt?: Date;
  landlordNotes?: string;
  tenantNotes?: string;
}

/**
 * Generate a PDF document for the completed checklist.
 */
export async function generateChecklistPdf(data: ChecklistPdfData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileKey = `checklists/${data.checklistId}/Checklist-Report-${data.checklistId}-${Date.now()}.pdf`;
          await putObject(fileKey, pdfBuffer, "application/pdf", "public-read");
          const url = getPublicImageUrl(fileKey);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("MOVE-IN CONDITION REPORT", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Report ID: #${data.checklistId} | Contract ID: #${data.contractId}`, { align: "center", color: "grey" })
        .moveDown(1);

      // Property Details
      doc.rect(50, doc.y, 495, 60).stroke();
      const startY = doc.y + 10;
      
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("PROPERTY DETAILS", 60, startY)
        .font("Helvetica")
        .text(`${data.propertyTitle}`, 60, startY + 15)
        .text(`${data.propertyAddress}`, 60, startY + 30);

      doc.y = startY + 60;
      doc.moveDown(1);

      // Parties
      const partiesY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").text("TENANT", 50, partiesY);
      doc.font("Helvetica").text(data.tenantName, 50, partiesY + 15);
      
      doc.fontSize(10).font("Helvetica-Bold").text("LANDLORD", 300, partiesY);
      doc.font("Helvetica").text(data.landlordName, 300, partiesY + 15);
      
      doc.moveDown(2);

      // Checklist Items
      if (data.checklistItems && data.checklistItems.rooms) {
        data.checklistItems.rooms.forEach((room: any) => {
          // Check for page break
          if (doc.y > 700) doc.addPage();

          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("black")
            .text(room.room.toUpperCase(), { underline: true })
            .moveDown(0.5);

          if (room.items && room.items.length > 0) {
            room.items.forEach((item: any) => {
              if (doc.y > 720) doc.addPage();

              const condition = item.condition || "Not Rated";
              let conditionColor = "black";
              if (condition === "Excellent" || condition === "Good") conditionColor = "green";
              else if (condition === "Fair") conditionColor = "orange";
              else if (condition === "Poor" || condition === "Damaged") conditionColor = "red";

              doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(item.name, { continued: true })
                .font("Helvetica")
                .text(` - Condition: ${condition}`); // Color support is tricky inline with standard fonts in simple mode

              if (item.notes) {
                doc
                  .fontSize(9)
                  .font("Helvetica-Oblique")
                  .text(`   Notes: ${item.notes}`, { indent: 10, color: "grey" });
              }
              
              doc.moveDown(0.5);
            });
          } else {
            doc.fontSize(10).font("Helvetica-Oblique").text("No items listed.");
          }
          doc.moveDown(1);
        });
      }

      // General Notes
      if (data.tenantNotes || data.landlordNotes) {
        if (doc.y > 650) doc.addPage();
        
        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica-Bold").text("GENERAL REMARKS");
        doc.moveDown(0.5);

        if (data.tenantNotes) {
          doc.fontSize(10).font("Helvetica-Bold").text("Tenant Notes:");
          doc.font("Helvetica").text(data.tenantNotes).moveDown(0.5);
        }
        if (data.landlordNotes) {
          doc.fontSize(10).font("Helvetica-Bold").text("Landlord Notes:");
          doc.font("Helvetica").text(data.landlordNotes).moveDown(0.5);
        }
      }

      // Signatures
      if (doc.y > 600) doc.addPage();
      doc.moveDown(2);
      
      const sigY = doc.y;
      
      // Tenant Signature
      doc.fontSize(10).font("Helvetica-Bold").text("TENANT SIGNATURE", 50, sigY);
      if (data.tenantSignature) {
        try {
          const base64Data = data.tenantSignature.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          doc.image(buffer, 50, sigY + 15, { width: 150, height: 60 });
        } catch (e) {
          doc.text("(Signature Error)", 50, sigY + 30);
        }
      }
      doc.text(data.tenantSignedAt ? new Date(data.tenantSignedAt).toLocaleDateString() : "Pending", 50, sigY + 80);

      // Landlord Signature
      doc.fontSize(10).font("Helvetica-Bold").text("LANDLORD SIGNATURE", 300, sigY);
      if (data.landlordSignature) {
        try {
          const base64Data = data.landlordSignature.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          doc.image(buffer, 300, sigY + 15, { width: 150, height: 60 });
        } catch (e) {
          doc.text("(Signature Error)", 300, sigY + 30);
        }
      }
      doc.text(data.landlordSignedAt ? new Date(data.landlordSignedAt).toLocaleDateString() : "Pending", 300, sigY + 80);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}
