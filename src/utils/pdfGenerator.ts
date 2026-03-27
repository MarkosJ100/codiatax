import type { jsPDF } from 'jspdf';
import { Invoice, DriverProfile } from '../types';
import QRCode from 'qrcode';

// Helper to generate QR Code Data URL
export const generateQRCodeDataUrl = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 150,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        return '';
    }
};

export const generateInvoicePDF = async (invoice: Invoice, profile: DriverProfile): Promise<jsPDF> => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF() as any;

    // Colors
    const primaryColor = [250, 204, 21]; // Amber-400 (matches --accent-primary)
    const textColor = [31, 41, 55];
    const mutedColor = [107, 114, 128];

    // --- QR CODE GENERATION ---
    // Format: Factura: 2026/XXX\nEmisor: [NIF]\nTotal: XX.XX â‚¬\nFecha: DD/MM/AAAA
    const invoiceSummary = `Factura: ${invoice.series || ''}${invoice.number}\nEmisor: ${profile.nif}\nTotal: ${invoice.totalAmount.toFixed(2)} â‚¬\nFecha: ${new Date(invoice.dateEmission).toLocaleDateString('es-ES')}`;
    const qrDataUrl = await generateQRCodeDataUrl(invoiceSummary);

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FACTURA', 105, 20, { align: 'center' }); // Centered Title

    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`NÃºmero: ${invoice.series || ''}${invoice.number}`, 105, 30, { align: 'center' });
    doc.text(`Fecha de emisiÃ³n: ${new Date(invoice.dateEmission).toLocaleDateString('es-ES')}`, 105, 35, { align: 'center' });

    // Emisor (Driver) - Left Column
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EMISOR', 20, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.fullName, 20, 57);
    doc.text(`NIF: ${profile.nif}`, 20, 62);

    // Multi-line address handling
    const addressLines = doc.splitTextToSize(profile.address, 70);
    doc.text(addressLines, 20, 67);

    let yPos = 67 + (addressLines.length * 5);
    doc.text(`Licencia Taxi nÂº ${profile.licenseNo} (${profile.municipality})`, 20, yPos);
    yPos += 5;
    doc.text(`Tlf: ${profile.phone || ''} | Email: ${profile.email || ''}`, 20, yPos);
    yPos += 5;
    doc.text(profile.regime, 20, yPos);

    // Cliente - Right Column
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 120, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (invoice.clientName) {
        doc.text(invoice.clientName, 120, 57);
        if (invoice.clientNif) doc.text(`NIF/CIF: ${invoice.clientNif}`, 120, 62);

        if (invoice.clientAddress) {
            const clientAddressLines = doc.splitTextToSize(invoice.clientAddress, 70);
            doc.text(clientAddressLines, 120, 67);
        }
    } else {
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text('(Cliente no especificado)', 120, 57);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }

    // Add QR Code to PDF (Top Right Corner)
    if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 170, 10, 25, 25);
    }

    // Separator Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 95, 190, 95);

    // Service Details Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL SERVICIO', 20, 105);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Service Info Block
    doc.text(`Fecha del servicio: ${new Date(invoice.dateService).toLocaleDateString('es-ES')}`, 20, 115);
    doc.text(`Concepto: Servicio de taxi`, 20, 120);
    doc.text(`Recogida: ${invoice.origin}`, 20, 125);
    doc.text(`Destino: ${invoice.destination}`, 20, 130);

    if (invoice.timeStart || invoice.km) {
        let details = '';
        if (invoice.timeStart) details += `${invoice.timeStart} - ${invoice.timeEnd || ''} `;
        if (invoice.km) details += `(${invoice.km} km)`;
        doc.text(details.trim(), 20, 135);
    }

    // Amount for the service line (Aligned Right)
    doc.text(`${invoice.baseAmount.toFixed(2)} â‚¬`, 190, 120, { align: 'right' });


    // Totals Box (Bottom Right)
    const startY = 150;

    // Background Rect for Totals
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(120, startY, 70, 35, 'F');

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Base Header & Value
    doc.text('Base Imponible:', 125, startY + 8);
    doc.text(`${invoice.baseAmount.toFixed(2)} â‚¬`, 185, startY + 8, { align: 'right' });

    // IVA Header & Value
    doc.text(`IVA (${invoice.ivaRate}%):`, 125, startY + 16);
    doc.text(`${invoice.ivaAmount.toFixed(2)} â‚¬`, 185, startY + 16, { align: 'right' });

    // Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(125, startY + 22, 185, startY + 22);

    // Total Header & Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 125, startY + 30);
    doc.text(`${invoice.totalAmount.toFixed(2)} â‚¬`, 185, startY + 30, { align: 'right' });

    // Payment Method (Bottom Left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Forma de pago: ${invoice.paymentMethod}`, 20, startY + 30);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Gracias por su confianza.', 105, 280, { align: 'center' });

    return doc;
};

export const downloadInvoicePDF = async (invoice: Invoice, profile: DriverProfile) => {
    try {
        const doc = await generateInvoicePDF(invoice, profile);
        const fileName = `Factura_${(invoice.series || '')}${invoice.number.replace('/', '-')}.pdf`;
        doc.save(fileName);
        return true;
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error al descargar el PDF. Por favor, intÃ©ntalo de nuevo.');
        return false;
    }
};

export const printInvoicePDF = async (invoice: Invoice, profile: DriverProfile) => {
    try {
        const doc = await generateInvoicePDF(invoice, profile);
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
        console.error('Error printing PDF:', error);
    }
};

export const sendInvoiceByEmail = async (invoice: Invoice, profile: DriverProfile) => {
    try {
        const subject = encodeURIComponent(`Factura ${invoice.series || ''}${invoice.number} - ${profile.fullName}`);
        const body = encodeURIComponent(`Estimado cliente,\n\nAdjunto le remito la factura ${invoice.series || ''}${invoice.number} correspondiente al servicio de taxi realizado el ${new Date(invoice.dateService).toLocaleDateString('es-ES')}.\n\nAtentamente,\n${profile.fullName}`);
        const mailtoLink = `mailto:${invoice.clientEmail || ''}?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
        const doc = await generateInvoicePDF(invoice, profile);
        doc.save(`Factura_${(invoice.series || '')}${invoice.number.replace('/', '-')}.pdf`);
        return 'web_fallback';
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

