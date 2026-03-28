import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { isSameDay, format, es } from '../../utils/dateHelpers';
import { useToast } from '../../hooks/useToast';
import { useServices } from '../../context/ServiceContext';
import { useAuth } from '../../context/AuthContext';

const PDFExportButton: React.FC = () => {
    const { services, expenses } = useServices();
    const { user } = useAuth();
    const toast = useToast();
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generatePDF = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);
            const doc = new jsPDF();
            const today = new Date();
            const dateStr = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });
            const fileName = `codiatx_informe_${format(today, 'yyyy-MM-dd')}.pdf`;

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
            doc.text(`Recaudaciï¿½n Bruta:`, 20, 58);
            doc.text(`${dailyIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 58, { align: 'right' });

            doc.setTextColor(220, 38, 38);
            doc.text(`Gastos Laborales:`, 20, 64);
            doc.text(`-${dailyLaborExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 64, { align: 'right' });

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`Recaudaciï¿½n Limpia:`, 20, 70);
            doc.text(`${netIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`, 150, 70, { align: 'right' });
            doc.setFont("helvetica", "normal");

            const tableData: string[][] = dailyServices.map(s => [
                format(new Date(s.timestamp), 'HH:mm'),
                s.type === 'company' ? (s.companyName || 'Compaï¿½ï¿½a') : 'Normal',
                s.observation || '-',
                s.amount.toFixed(2) + ' ï¿½'
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
            }            doc.save(fileName);

        } catch (err) {
            console.error(err);
            toast.error("Ocurriï¿½ un error al generar el PDF");
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
                <FileDown size={18} />
            }
            Exportar Informe PDF
        </button>
    );
};

export default PDFExportButton;


