import PDFDocument from "pdfkit";
import type { RegistrationContract } from "@shared/schema";
import type { Response } from "express";

export class PdfGenerator {
  /**
   * Generate a PDF for a registration contract and stream it to the response
   */
  static async generateContractPdf(contract: RegistrationContract, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="registration-${contract.reservationNumber}.pdf"`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Add header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("Hotel Registration Contract", { align: "center" });
        
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Contract ID: ${contract.id}`, { align: "center" });
        
        doc.moveDown(2);

        // Guest Information Section
        doc.fontSize(14).font("Helvetica-Bold").text("Guest Information");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");

        const guestInfo = [
          ["Guest Name:", contract.guestName],
          ["Email:", contract.email || "N/A"],
          ["Phone:", contract.phone || "N/A"],
          ["Address:", contract.address || "N/A"],
          ["ID Number:", contract.idNumber || "N/A"],
        ];

        guestInfo.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });

        doc.moveDown(1.5);

        // Reservation Details Section
        doc.fontSize(14).font("Helvetica-Bold").text("Reservation Details");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");

        const reservationInfo = [
          ["Reservation Number:", contract.reservationNumber],
          ["Confirmation Number:", contract.confirmationNumber || "N/A"],
          ["Room Number:", contract.roomNumber || "N/A"],
          ["Room Type:", contract.roomType || "N/A"],
          ["Number of Guests:", contract.numberOfGuests?.toString() || "N/A"],
        ];

        reservationInfo.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });

        doc.moveDown(1.5);

        // Stay Details Section
        doc.fontSize(14).font("Helvetica-Bold").text("Stay Details");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");

        const stayInfo = [
          ["Check-In Date:", contract.arrivalDate],
          ["Check-Out Date:", contract.departureDate],
          ["Number of Nights:", contract.numberOfNights?.toString() || "N/A"],
        ];

        stayInfo.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });

        if (contract.specialRequests) {
          doc.moveDown(0.5);
          doc.text(`Special Requests: ${contract.specialRequests}`);
        }

        doc.moveDown(1.5);

        // Registration Information
        doc.fontSize(14).font("Helvetica-Bold").text("Registration Information");
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");

        const registrationDate = contract.registeredAt
          ? new Date(contract.registeredAt).toLocaleString()
          : "N/A";
        
        doc.text(`Registered At: ${registrationDate}`);
        doc.text(`PMS Source: ${contract.pmsSource || "Manual"}`);
        doc.text(`Status: ${contract.status || "Completed"}`);

        // Add signature if available
        if (contract.signatureDataUrl) {
          doc.moveDown(2);
          doc.fontSize(14).font("Helvetica-Bold").text("Guest Signature");
          doc.moveDown(0.5);

          try {
            // Extract base64 data from data URL
            const base64Data = contract.signatureDataUrl.split(",")[1];
            const imageBuffer = Buffer.from(base64Data, "base64");

            // Add signature image
            doc.image(imageBuffer, {
              fit: [200, 100],
            });
          } catch (error) {
            console.error("Error adding signature to PDF:", error);
            doc.fontSize(10).text("Signature image unavailable");
          }
        }

        // Add footer
        doc.moveDown(2);
        doc
          .fontSize(8)
          .font("Helvetica")
          .text(
            "This is an official registration contract. Please keep for your records.",
            { align: "center" }
          );

        // Finalize PDF
        doc.end();

        doc.on("finish", () => {
          resolve();
        });

        doc.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
