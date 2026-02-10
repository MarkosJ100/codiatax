import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileDown, Share2 } from 'lucide-react';
import { isSameDay, format, es } from '../../utils/dateHelpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../../hooks/useToast';

const PDFExportButton: React.FC = () => {
    const { services, expenses, user } = useApp();
    const toast = useToast();
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generatePDF = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const today = new Date();
            const dateStr = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });
            const fileName = `codiatax_informe_${format(today, 'yyyy-MM-dd')}.pdf`;

            const dailyServices = services.filter(s => isSameDay(new Date(s.timestamp), today));
            const dailyIncome = dailyServices.reduce((acc, curr) => acc + curr.amount, 0);

            const dailyLaborExpenses = expenses
                .filter(e => e.type === 'labor' && isSameDay(new Date(e.timestamp), today))
                .reduce((sum, e) => sum + e.amount, 0);

            const netIncome = dailyIncome - dailyLaborExpenses;

            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text("CODIATAX - Informe Diario", 14, 20);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha: ${dateStr}`, 14, 28);
            doc.text(`${user.role === 'propietario' ? 'Propietario' : 'Asalariado'}`, 14, 34);

            doc.setFillColor(245, 245, 245);
            doc.rect(14, 40, 182, 35, 'F');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Resumen Financiero", 20, 50);

            doc.setFontSize(10);
            doc.text(`Recaudación Bruta:`, 20, 58);
            doc.text(`${dailyIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 58, { align: 'right' });

            doc.setTextColor(220, 38, 38);
            doc.text(`Gastos Laborales:`, 20, 64);
            doc.text(`-${dailyLaborExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 64, { align: 'right' });

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`Recaudación Limpia:`, 20, 70);
            doc.text(`${netIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 70, { align: 'right' });
            doc.setFont("helvetica", "normal");

            const tableData: string[][] = dailyServices.map(s => [
                format(new Date(s.timestamp), 'HH:mm'),
                s.type === 'company' ? (s.companyName || 'Compañía') : 'Normal',
                s.observation || '-',
                s.amount.toFixed(2) + ' €'
            ]);

            autoTable(doc, {
                startY: 85,
                head: [['Hora', 'Tipo/Cliente', 'Observaciones', 'Importe']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [234, 179, 8], textColor: 0 },
                styles: { fontSize: 9 },
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text('Generado por CODIATAX App', 14, (doc as any).internal.pageSize.height - 10);
            }

            if (Capacitor.isNativePlatform()) {
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                try {
                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: pdfBase64,
                        directory: Directory.Cache,
                    });

                    await Share.share({
                        title: 'Informe Diario Codiatax',
                        text: `Adjunto informe del día ${dateStr}`,
                        url: result.uri,
                        dialogTitle: 'Compartir Informe PDF',
                    });

                } catch (e: any) {
                    console.error("Error saving/sharing native PDF", e);
                    toast.error("Error al exportar PDF: " + e.message);
                }

            } else {
                doc.save(fileName);
            }

        } catch (err) {
            console.error(err);
            toast.error("Ocurrió un error al generar el PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="btn"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                width: '100%',
                padding: '0.75rem'
            }}
        >
            {isGenerating ?
                <div className="loading-spinner" style={{ width: 16, height: 16 }} /> :
                (Capacitor.isNativePlatform() ? <Share2 size={18} /> : <FileDown size={18} />)
            }
            {Capacitor.isNativePlatform() ? 'Compartir Informe PDF' : 'Exportar Informe PDF'}
        </button>
    );
};

export default PDFExportButton;
