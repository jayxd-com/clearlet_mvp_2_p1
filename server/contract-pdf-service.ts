import PDFDocument from "pdfkit";
import { putObject, getPublicImageUrl } from "./s3";

interface ContractPdfData {
  contractId: number;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  landlordEmail: string;
  landlordId: string; // DNI/NIE or ID
  tenantName: string;
  tenantEmail: string;
  tenantId: string; // DNI/NIE or ID
  tenantHasPets?: boolean;
  tenantPetType?: string;
  tenantPetCount?: number;
  tenantNumberOfOccupants?: number;
  tenantOccupantDetails?: string;
  tenantRequirements?: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  terms: string;
  specialConditions?: string;
  landlordSignature?: string; // base64 image
  tenantSignature?: string; // base64 image
  landlordSignedAt?: Date;
  tenantSignedAt?: Date;
  checklistItems?: any; // Parsed checklist items
  currency?: string;
  language?: "en" | "es";
}

const TRANSLATIONS = {
  en: {
    title: "RENTAL AGREEMENT",
    id_label: "Contract ID",
    generated_via: "Generated via ClearLet",
    parties_header: "1. THE PARTIES",
    landlord_label: "LANDLORD / OWNER",
    tenant_label: "TENANT",
    name_label: "Name",
    id_doc_label: "ID/Passport",
    email_label: "Email",
    occupants_label: "Occupants",
    summary_header: "2. KEY TERMS SUMMARY",
    property_label: "Property",
    duration_label: "Duration",
    to_label: "to",
    rent_label: "Rent",
    deposit_label: "Deposit",
    month_label: "month",
    terms_header: "3. TERMS AND CONDITIONS",
    no_terms: "No custom terms provided.",
    special_conditions_header: "SPECIAL CONDITIONS",
    annex_header: "ANNEX I: MOVE-IN INVENTORY & CONDITION",
    annex_intro: "The following inventory details the condition of the property at handover:",
    no_items: "No items recorded",
    signatures_header: "SIGNATURES",
    signed_label: "Signed:",
  },
  es: {
    title: "CONTRATO DE ARRENDAMIENTO",
    id_label: "Contrato ID",
    generated_via: "Generado vía ClearLet",
    parties_header: "1. LAS PARTES",
    landlord_label: "ARRENDADOR / PROPIETARIO",
    tenant_label: "ARRENDATARIO",
    name_label: "Nombre",
    id_doc_label: "DNI/NIE/Pasaporte",
    email_label: "Email",
    occupants_label: "Ocupantes",
    summary_header: "2. RESUMEN DE TÉRMINOS CLAVE",
    property_label: "Propiedad",
    duration_label: "Duración",
    to_label: "a",
    rent_label: "Renta",
    deposit_label: "Fianza",
    month_label: "mes",
    terms_header: "3. TÉRMINOS Y CONDICIONES",
    no_terms: "Sin términos personalizados.",
    special_conditions_header: "CONDICIONES ESPECIALES",
    annex_header: "ANEXO I: INVENTARIO Y ESTADO",
    annex_intro: "El siguiente inventario detalla el estado de la vivienda en el momento de la entrega:",
    no_items: "Sin elementos registrados",
    signatures_header: "FIRMAS",
    signed_label: "Firmado:",
  }
};

/**
 * Generate a PDF document using the "Wrapper" model.
 * 1. Auto-generated Header (Parties & Summary)
 * 2. User-defined Body (Terms)
 * 3. Auto-generated Footer (Signatures & Checklist)
 */
export async function generateContractPdf(data: ContractPdfData): Promise<string> {
  const lang = data.language || "en";
  const t = TRANSLATIONS[lang];

  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          
          // Upload to S3
          const fileKey = `contracts/contract-${data.contractId}-${Date.now()}.pdf`;
          
          // Use 'public-read' for consistency with current setup
          await putObject(fileKey, pdfBuffer, "application/pdf", "public-read");
          
          const url = getPublicImageUrl(fileKey);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });

      // ==========================================
      // 1. HEADER SECTION (Identity & Summary)
      // ==========================================

      // Document Title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(t.title, { align: "center" })
        .moveDown(0.3);

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`${t.id_label}: #${data.contractId} | ${t.generated_via}`, { align: "center", color: "grey" })
        .moveDown(1.5);

      // PARTIES (Reunidos)
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text(t.parties_header, { underline: true })
        .moveDown(0.5);

      // Landlord Box
      const startY = doc.y;
      doc.rect(50, startY, 240, 80).stroke();
      
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(t.landlord_label, 60, startY + 10);
      
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`${t.name_label}: ${data.landlordName}`, 60, startY + 30)
        .text(`${t.id_doc_label}: ${data.landlordId || "N/A"}`)
        .text(`${t.email_label}: ${data.landlordEmail}`);

      // Tenant Box
      doc.rect(300, startY, 240, 80).stroke();
      
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(t.tenant_label, 310, startY + 10);
      
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`${t.name_label}: ${data.tenantName}`, 310, startY + 30)
        .text(`${t.id_doc_label}: ${data.tenantId || "N/A"}`)
        .text(`${t.email_label}: ${data.tenantEmail}`)
        .text(`${t.occupants_label}: ${data.tenantNumberOfOccupants || 1}`);

      doc.x = 50; // Reset X to margin after boxes
      doc.y = startY + 95; // Move below boxes

      // KEY TERMS SUMMARY (Platform Data)
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(t.summary_header, 50, doc.y, { underline: true })
        .moveDown(0.5);

      const tableTop = doc.y;
      const rowHeight = 20;
      
      // Draw Table Header
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text(t.property_label, 50, tableTop);
      doc.text(data.propertyTitle + " - " + data.propertyAddress, 150, tableTop);
      
      doc.text(t.duration_label, 50, tableTop + rowHeight);
      doc.text(`${data.startDate} ${t.to_label} ${data.endDate}`, 150, tableTop + rowHeight);
      
      doc.text(t.rent_label, 50, tableTop + (rowHeight * 2));
      const currency = data.currency || "EUR";
      doc.text(`${(data.monthlyRent / 100).toFixed(2)} ${currency} / ${t.month_label}`, 150, tableTop + (rowHeight * 2));
      
      doc.text(t.deposit_label, 50, tableTop + (rowHeight * 3));
      doc.text(`${(data.securityDeposit / 100).toFixed(2)} ${currency}`, 150, tableTop + (rowHeight * 3));

      doc.x = 50; // Ensure X is reset
      doc.moveDown(4);

      // ==========================================
      // 2. BODY SECTION (User Defined Terms)
      // ==========================================

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(t.terms_header, 50, doc.y, { underline: true })
        .moveDown(0.8);

      // Helper function to render Markdown-like text
      const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        
        lines.forEach(line => {
          const trimmed = line.trim();
          
          if (!trimmed) {
            doc.moveDown(0.5);
            return;
          }

          // Headers
          if (trimmed.startsWith('## ')) {
            doc
              .fontSize(11)
              .font("Helvetica-Bold")
              .text(trimmed.substring(3), { align: 'left' })
              .font("Helvetica") // Reset
              .fontSize(9)
              .moveDown(0.3);
            return;
          }
          
          if (trimmed.startsWith('# ')) {
            doc
              .fontSize(12)
              .font("Helvetica-Bold")
              .text(trimmed.substring(2), { align: 'left' })
              .font("Helvetica") // Reset
              .fontSize(9)
              .moveDown(0.5);
            return;
          }

          // Lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            doc
              .fontSize(9)
              .text("• " + trimmed.substring(2), { indent: 15, align: 'justify', lineGap: 2 });
            return;
          }

          // Numbered Lists (1. Item)
          if (/^\d+\.\s/.test(trimmed)) {
             doc
              .fontSize(9)
              .text(trimmed, { indent: 15, align: 'justify', lineGap: 2 });
             return;
          }

          // Standard Paragraph with Inline Formatting (Bold)
          // Simple parser for **bold**
          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          
          if (parts.length === 1) {
            doc.fontSize(9).font("Helvetica").text(trimmed, { align: 'justify', lineGap: 2 });
          } else {
            // Render parts with continued text
            doc.fontSize(9).font("Helvetica"); // Ensure starting state
            
            parts.forEach((part, index) => {
              const isLast = index === parts.length - 1;
              
              if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                const content = part.substring(2, part.length - 2);
                doc.font("Helvetica-Bold").text(content, { continued: !isLast, align: 'justify', lineGap: 2 });
              } else if (part) {
                // Regular text
                doc.font("Helvetica").text(part, { continued: !isLast, align: 'justify', lineGap: 2 });
              } else if (!isLast) {
                 // Empty part but not last (e.g. adjacent bolds), maintain continuity logic if needed
                 // For now, doing nothing is fine, but PDFKit 'continued' requires next text call.
                 // This simple split might produce empty strings.
              }
            });
            // Ensure we reset for next line if the last part was continued (though logic above tries to handle isLast)
            // If the line ended with a continuation, PDFKit expects more. 
            // Our logic: `continued: !isLast`. So last part is NOT continued. That terminates the paragraph.
          }
        });
      };

      renderMarkdown(data.terms || t.no_terms);

      // Special Conditions (if any)
      if (data.specialConditions) {
        doc.moveDown(1);
        doc.x = 50;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(t.special_conditions_header)
          .moveDown(0.4);

        renderMarkdown(data.specialConditions);
        
        doc.moveDown(1);
      }

      // ==========================================
      // 3. ANNEX & SIGNATURES (Appended)
      // ==========================================

      // CHECKLIST ANNEX (Now before signatures, as requested)
      if (data.checklistItems && Array.isArray(data.checklistItems) && data.checklistItems.length > 0) {
        doc.moveDown(2);
        doc.x = 50;
        
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(t.annex_header, { align: "center" })
          .moveDown(1);

        doc
          .fontSize(9)
          .font("Helvetica")
          .text(t.annex_intro, { align: "justify" })
          .moveDown(1);

        data.checklistItems.forEach((room: any) => {
          doc.x = 50;
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(room.room)
            .moveDown(0.3);

          if (room.items && room.items.length > 0) {
            room.items.forEach((item: any) => {
              const condition = item.condition ? ` (${item.condition})` : "";
              const notes = item.notes ? ` - ${item.notes}` : "";
              doc
                .fontSize(9)
                .font("Helvetica")
                .text(`• ${item.name}${condition}${notes}`, { indent: 10 })
                .moveDown(0.2);
            });
          } else {
            doc.fontSize(9).font("Helvetica-Oblique").text(t.no_items, { indent: 10 }).moveDown(0.2);
          }
          doc.moveDown(0.5);
        });
      }

      // SIGNATURES SECTION
      doc.moveDown(3);
      doc.x = 50;

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(t.signatures_header, { align: "center" })
        .moveDown(2);

      const pageWidth = doc.page.width;
      const leftMargin = 50;
      const rightMargin = pageWidth - 50;
      const centerX = pageWidth / 2;
      const signatureBlockTop = doc.y;

      // --- LEFT COLUMN: LANDLORD ---
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(t.landlord_label, leftMargin, signatureBlockTop, { width: centerX - leftMargin - 20 });

      const signatureImageY = signatureBlockTop + 20;
      
      if (data.landlordSignature) {
        try {
          const base64Data = data.landlordSignature.replace(/^data:image\/\w+;base64,/, "");
          const signatureBuffer = Buffer.from(base64Data, "base64");
          doc.image(signatureBuffer, leftMargin, signatureImageY, { width: 150, height: 60 });
        } catch (error) {
          console.error("Failed to embed landlord signature:", error);
        }
      }

      const detailsStartY = signatureImageY + 70;
      doc.moveTo(leftMargin, detailsStartY).lineTo(centerX - 20, detailsStartY).stroke();
      doc.fontSize(9).font("Helvetica").text(data.landlordName, leftMargin, detailsStartY + 5);
      
      if (data.landlordSignedAt) {
        doc.text(`${t.signed_label} ${new Date(data.landlordSignedAt).toLocaleDateString()}`);
      }

      // --- RIGHT COLUMN: TENANT ---
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(t.tenant_label, centerX + 20, signatureBlockTop, { width: rightMargin - centerX - 20 });

      if (data.tenantSignature) {
        try {
          const base64Data = data.tenantSignature.replace(/^data:image\/\w+;base64,/, "");
          const signatureBuffer = Buffer.from(base64Data, "base64");
          doc.image(signatureBuffer, centerX + 20, signatureImageY, { width: 150, height: 60 });
        } catch (error) {
          console.error("Failed to embed tenant signature:", error);
        }
      }

      doc.moveTo(centerX + 20, detailsStartY).lineTo(rightMargin, detailsStartY).stroke();
      doc.fontSize(9).font("Helvetica").text(data.tenantName, centerX + 20, detailsStartY + 5);
      
      if (data.tenantSignedAt) {
        doc.text(`${t.signed_label} ${new Date(data.tenantSignedAt).toLocaleDateString()}`, centerX + 20);
      }

      // Global Footer
      // Note: Page numbering is complex in PDFKit without explicit tracking, skipping for now to ensure stability
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}