import PDFDocument from "pdfkit";
import { env } from "@/lib/env";
import type { QuotationDTO } from "@indiamart-crm/shared";

export function generateQuotationPdf(quotation: QuotationDTO): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").text(env.companyName, { continued: false });
    if (env.companyAddress) doc.fontSize(9).font("Helvetica").fillColor("#555").text(env.companyAddress);
    if (env.companyGstin) doc.fontSize(9).fillColor("#555").text(`GSTIN: ${env.companyGstin}`);
    doc.moveDown(1.5);

    doc.fillColor("#111").fontSize(16).font("Helvetica-Bold").text("QUOTATION");
    doc.fontSize(9).font("Helvetica").fillColor("#555").text(`Quotation #${quotation.id.slice(-8).toUpperCase()}`);
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString("en-IN")}`);
    doc.moveDown(1);

    doc.fillColor("#111").fontSize(11).font("Helvetica-Bold").text("Bill To");
    doc.font("Helvetica").fontSize(10).fillColor("#333");
    doc.text(quotation.customer.name);
    if (quotation.customer.company) doc.text(quotation.customer.company);
    doc.text(quotation.customer.phone);
    const location = [quotation.customer.city, quotation.customer.state].filter(Boolean).join(", ");
    if (location) doc.text(location);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const col = { name: 50, qty: 300, price: 370, total: 460 };
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111");
    doc.text("Item", col.name, tableTop);
    doc.text("Qty", col.qty, tableTop);
    doc.text("Unit Price", col.price, tableTop);
    doc.text("Total", col.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#ccc").stroke();

    let y = tableTop + 22;
    doc.font("Helvetica").fontSize(10).fillColor("#333");
    for (const item of quotation.items) {
      doc.text(item.name, col.name, y, { width: 240 });
      doc.text(String(item.quantity), col.qty, y);
      doc.text(`Rs. ${item.unitPrice.toLocaleString("en-IN")}`, col.price, y);
      doc.text(`Rs. ${item.lineTotal.toLocaleString("en-IN")}`, col.total, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor("#ccc").stroke();
    y += 15;

    const summaryX = 370;
    doc.font("Helvetica").fontSize(10).fillColor("#333");
    doc.text("Subtotal", summaryX, y);
    doc.text(`Rs. ${quotation.subtotal.toLocaleString("en-IN")}`, col.total, y);
    y += 18;
    if (quotation.discount > 0) {
      doc.text("Discount", summaryX, y);
      doc.text(`- Rs. ${quotation.discount.toLocaleString("en-IN")}`, col.total, y);
      y += 18;
    }
    doc.text(`GST (${quotation.gstPercent}%)`, summaryX, y);
    const taxable = quotation.subtotal - quotation.discount;
    const gstAmount = (taxable * quotation.gstPercent) / 100;
    doc.text(`Rs. ${gstAmount.toLocaleString("en-IN")}`, col.total, y);
    y += 22;
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#111");
    doc.text("Total", summaryX, y);
    doc.text(`Rs. ${quotation.total.toLocaleString("en-IN")}`, col.total, y);

    doc.moveDown(4);
    doc.font("Helvetica").fontSize(9).fillColor("#888").text("Thank you for your business.", 50, doc.y, { align: "center", width: 495 });

    doc.end();
  });
}
