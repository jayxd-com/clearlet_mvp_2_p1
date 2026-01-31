import { getDb } from "./db";
import { documents, userProfiles, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Calculate Verification Score (0-100)
 * Based on uploaded and verified documents
 */
export async function calculateVerificationScore(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Fetch user documents
  const userDocs = await db.query.documents.findMany({
    where: eq(documents.userId, userId),
  });

  let score = 0;

  // 1. Identity Verification (40 points)
  const identityDocs = userDocs.filter(
    (d) => 
      (d.type === "passport" || d.type === "id_card" || d.type === "dni_nie") && 
      d.verificationStatus === "verified"
  );
  if (identityDocs.length > 0) score += 40;

  // 2. Income Verification (40 points)
  const incomeDocs = userDocs.filter(
    (d) => 
      (d.type === "payslip" || d.type === "tax_return" || d.type === "contract") && 
      d.verificationStatus === "verified"
  );
  if (incomeDocs.length > 0) score += 40;

  // 3. Additional Documents (20 points max)
  // e.g. bank statements, reference letters
  const otherDocs = userDocs.filter(
    (d) => 
      d.type !== "passport" && 
      d.type !== "id_card" && 
      d.type !== "dni_nie" && 
      d.type !== "payslip" && 
      d.type !== "tax_return" && 
      d.type !== "contract" && 
      d.verificationStatus === "verified"
  );
  
  if (otherDocs.length > 0) score += 20;

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Update User Verification Status based on Score
 */
export async function updateVerificationStatus(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const score = await calculateVerificationScore(userId);
  const status = score >= 80 ? "verified" : score > 0 ? "pending" : "unverified";

  // Update Profile Score
  await db.update(userProfiles)
    .set({ verificationScore: score })
    .where(eq(userProfiles.userId, userId));

  // Update User Status
  await db.update(users)
    .set({ verificationStatus: status })
    .where(eq(users.id, userId));
}
