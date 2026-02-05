import { Service, Expense } from '../types';
import * as XLSX from 'xlsx';

export const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

export const exportToExcel = (services: Service[], expenses: Expense[], filename: string) => {
    const workbook = XLSX.utils.book_new();

    // Services sheet
    const servicesData = services.map(s => ({
        'Fecha': new Date(s.timestamp).toLocaleString('es-ES'),
        'Tipo': s.type === 'company' ? 'Compañía' : 'Normal',
        'Compañía': s.companyName || '-',
        'Importe': s.amount,
        'Observaciones': s.observation || '-'
    }));
    const servicesSheet = XLSX.utils.json_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Servicios');

    // Expenses sheet
    const expensesData = expenses.map(e => ({
        'Fecha': new Date(e.timestamp).toLocaleString('es-ES'),
        'Categoría': e.category,
        'Tipo': e.type || '-',
        'Importe': e.amount,
        'Descripción': e.description
    }));
    const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos');

    // Summary sheet
    const totalIncome = services.reduce((sum, s) => sum + s.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const summaryData = [
        { 'Concepto': 'Total Ingresos', 'Importe': totalIncome },
        { 'Concepto': 'Total Gastos', 'Importe': totalExpenses },
        { 'Concepto': 'Balance', 'Importe': totalIncome - totalExpenses }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    XLSX.writeFile(workbook, filename);
};

export const exportServicesToCSV = (services: Service[]) => {
    const data = services.map(s => ({
        fecha: new Date(s.timestamp).toLocaleString('es-ES'),
        tipo: s.type,
        compania: s.companyName || '',
        importe: s.amount,
        observaciones: s.observation || ''
    }));
    exportToCSV(data, `servicios_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportExpensesToCSV = (expenses: Expense[]) => {
    const data = expenses.map(e => ({
        fecha: new Date(e.timestamp).toLocaleString('es-ES'),
        categoria: e.category,
        tipo: e.type || '',
        importe: e.amount,
        descripcion: e.description
    }));
    exportToCSV(data, `gastos_${new Date().toISOString().split('T')[0]}.csv`);
};
