import { Service } from '../types';
import * as XLSX from 'xlsx';

// Corrige texto con doble-encoding UTF-8 (ej: "Cádiz" → "Cádiz")
function fixEncoding(str: string): string {
    if (!str) return str;
    try {
        // Solo intentar si hay caracteres sospechosos (Ã seguido de otro char)
        if (!/[\xC0-\xFF]/.test(str)) return str;
        const bytes = new Uint8Array(str.split('').map(c => c.charCodeAt(0) & 0xFF));
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        return decoded;
    } catch {
        return str;
    }
}

function parseSpanishDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'undefined' || dateStr.toLowerCase() === 'null') {
        return null;
    }
    try {
        const cleanStr = dateStr.replace(/[^\x20-\x7E\s/:]/g, '').trim();
        if (cleanStr.length < 5) return null;
        const parts = cleanStr.split(/[\s/:]/);
        if (parts.length >= 5) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) year = `20${year}`;
            const hour = parts[3].padStart(2, '0');
            const minute = parts[4].padStart(2, '0');
            const iso = `${year}-${month}-${day}T${hour}:${minute}:00`;
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : iso;
        }
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? null : d.toISOString();
    } catch (e) {
        return null;
    }
}

function parseSpanishNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    try {
        const numStr = String(val).replace(/[^\d,.-]/g, '');
        return parseFloat(numStr.replace(',', '.'));
    } catch (e) {
        return 0;
    }
}

interface ColumnMap {
    ticket: number;
    timestamp: number;
    type: number;
    origin: number;
    destination: number;
    amount: number;
}

function cleanHeader(h: string): string {
    let head = String(h || '').trim().toUpperCase();
    head = head.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Todos los patrones de encoding rotos que hemos visto
    head = head.replace(/[ÃÂ][^\sA-Z]*/g, (match) => {
        // Limpiar cualquier secuencia rota de encoding
        return '';
    });
    // Limpiezas específicas que hemos visto en los logs
    head = head.replace(/[^\x20-\x7E]/g, ''); // Eliminar TODOS los caracteres no-ASCII
    return head.trim();
}

function findColumnIndices(headers: string[]): ColumnMap {
    const map: ColumnMap = { ticket: -1, timestamp: -1, type: -1, origin: -1, destination: -1, amount: -1 };

    console.log(`--- ANALIZANDO ${headers.length} CABECERAS ---`);
    headers.forEach((h, i) => {
        const head = cleanHeader(h);
        if (!head) return;
        if (i < 20) console.log(`  Col ${i}: "${head}"`);

        if (head === 'SERVICIO' || head === 'TICKET' || head === 'ID') {
            if (map.ticket === -1) map.ticket = i;
        } else if (head.includes('FECHA') && head.includes('INICIO')) {
            if (map.timestamp === -1) map.timestamp = i;
        } else if (head === 'FECHA' || head === 'FECHA/HORA' || head === 'MOMENTO' || head === 'DATE') {
            if (map.timestamp === -1) map.timestamp = i;
        } else if (head.includes('TOTAL EUR') || head.includes('TOTAL')) {
            if (map.amount === -1) map.amount = i;
        } else if (head.includes('IMPORTE') && (head.includes('TAX') || head.includes('EUR'))) {
            if (map.amount === -1) map.amount = i;
        } else if (head.includes('DIRECCI') && head.includes('INICIO')) {
            if (map.origin === -1) map.origin = i;
        } else if (head.includes('DIRECCI') && head.includes('FIN')) {
            if (map.destination === -1) map.destination = i;
        } else if (head.includes('TIPO DE SERVICIO') || head === 'TIPO') {
            if (map.type === -1) map.type = i;
        }
    });

    // Fallbacks con búsqueda parcial
    if (map.timestamp === -1) {
        map.timestamp = headers.findIndex(h => {
            const s = cleanHeader(h);
            return s.includes('FECHA') && !s.includes('FIN');
        });
    }
    if (map.amount === -1) {
        map.amount = headers.findIndex(h => {
            const s = cleanHeader(h);
            return (s.includes('TOTAL') || s.includes('IMPORTE')) && !s.includes('KM');
        });
    }
    if (map.origin === -1) {
        map.origin = headers.findIndex(h => cleanHeader(h).includes('DIRECCI') && cleanHeader(h).includes('INICIO'));
    }
    if (map.destination === -1) {
        map.destination = headers.findIndex(h => cleanHeader(h).includes('DIRECCI') && cleanHeader(h).includes('FIN'));
    }
    if (map.ticket === -1) {
        map.ticket = headers.findIndex(h => cleanHeader(h).includes('SERVICIO'));
    }

    console.log('MAPEO FINAL:', map);
    return map;
}

// ============================================================
// Split CSV que respeta comillas (robusto)
// ============================================================
function csvSplitLine(line: string, delim: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const ch = line[i];

        if (inQuotes) {
            if (ch === '"') {
                // Mirar si es comilla escapada ""
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    // Fin de campo entrecomillado
                    inQuotes = false;
                    i++;
                }
            } else {
                current += ch;
                i++;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
            } else if (ch === delim) {
                fields.push(current.trim());
                current = '';
                i++;
            } else {
                current += ch;
                i++;
            }
        }
    }
    fields.push(current.trim());
    return fields;
}

// ============================================================
// Parser principal xlsx -> detecta si todo está en 1 columna
// ============================================================
export function parseServicesExcel(buffer: ArrayBuffer): Omit<Service, 'id'>[] {
    const data = new Uint8Array(buffer);

    let workbook;
    try {
        workbook = XLSX.read(data, { type: 'array', cellDates: true });
    } catch (err) {
        console.error('xlsx no pudo leer el archivo:', err);
        return [];
    }

    console.log('Hojas:', workbook.SheetNames);
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    console.log('Rango:', ws['!ref']);

    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    console.log(`Total filas xlsx: ${rows.length}`);

    if (rows.length < 2) {
        console.warn("Excel vacío.");
        return [];
    }

    const headerRow = rows[0] as any[];
    console.log(`Cabeceras xlsx: ${headerRow.length} cols`);

    // FIX: xlsx leyó todo en 1 columna (XLSX con CSV interno)
    if (headerRow.length <= 2 && typeof headerRow[0] === 'string' && headerRow[0].includes(',')) {
        console.warn('xlsx concatenó columnas. Re-parseando como CSV...');
        const csvLines = rows.map(row => String((row as any[])[0] || ''));
        return parseCsvLines(csvLines);
    }

    // Excel normal con múltiples columnas
    const colMap = findColumnIndices(headerRow.map(h => String(h || '')));
    const services: Omit<Service, 'id'>[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (!row || row.length === 0) continue;

        try {
            const timestampVal = colMap.timestamp !== -1 ? row[colMap.timestamp] : null;
            let timestamp: string | null;
            if (timestampVal instanceof Date) {
                timestamp = timestampVal.toISOString();
            } else {
                timestamp = parseSpanishDate(String(timestampVal || ''));
            }
            if (!timestamp) continue;

            const amount = colMap.amount !== -1 ? parseSpanishNumber(row[colMap.amount]) : 0;
            const ticket = colMap.ticket !== -1 ? String(row[colMap.ticket]) : 'N/A';
            const typeSrv = colMap.type !== -1 ? fixEncoding(String(row[colMap.type] || '')) : '';
            const orig = colMap.origin !== -1 ? fixEncoding(String(row[colMap.origin] || '')) : '';
            const dest = colMap.destination !== -1 ? fixEncoding(String(row[colMap.destination] || '')) : '';

            services.push({
                timestamp,
                amount,
                type: 'normal',
                observation: `Ticket #${ticket} - ${typeSrv}. Orig: ${orig} Dest: ${dest}`.trim(),
                source: 'manual'
            });
        } catch (err) {
            console.error(`Error fila Excel ${i}:`, err);
        }
    }

    console.log(`parseServicesExcel: ${services.length} servicios.`);
    return services;
}

// ============================================================
// Parser CSV con split que respeta comillas
// ============================================================
function parseCsvLines(lines: string[]): Omit<Service, 'id'>[] {
    console.log('--- parseCsvLines ---');
    if (lines.length < 2) return [];

    // Detectar delimitador: contar comas vs puntoycomas fuera de comillas
    const firstLine = lines[0];
    // Para la detección, hacer un split rápido
    const commas = (firstLine.match(/,/g) || []).length;
    const semis = (firstLine.match(/;/g) || []).length;
    const delim = commas >= semis ? ',' : ';';

    // Parsear cabeceras con split que respeta comillas
    const headers = csvSplitLine(firstLine, delim);
    console.log(`CSV: ${headers.length} cols, delim="${delim}"`);
    console.log('Primeras 5:', headers.slice(0, 5));

    const colMap = findColumnIndices(headers);
    const services: Omit<Service, 'id'>[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = csvSplitLine(lines[i], delim);

        try {
            const timestampRaw = colMap.timestamp !== -1 ? row[colMap.timestamp] : '';
            const timestamp = parseSpanishDate(timestampRaw);
            if (!timestamp) {
                if (i <= 3) console.log(`  Fila ${i} skip: fecha "${timestampRaw}"`);
                continue;
            }

            const amount = colMap.amount !== -1 ? parseSpanishNumber(row[colMap.amount]) : 0;
            const ticket = colMap.ticket !== -1 ? row[colMap.ticket] : 'N/A';
            const typeSrv = colMap.type !== -1 ? fixEncoding(row[colMap.type] || '') : '';
            const orig = colMap.origin !== -1 ? fixEncoding(row[colMap.origin] || '') : '';
            const dest = colMap.destination !== -1 ? fixEncoding(row[colMap.destination] || '') : '';

            if (i <= 3) {
                console.log(`  Fila ${i} OK: ticket=${ticket}, fecha=${timestamp}, importe=${amount}€`);
            }

            services.push({
                timestamp,
                amount,
                type: 'normal',
                observation: `Ticket #${ticket} - ${typeSrv}. Orig: ${orig} Dest: ${dest}`.trim(),
                source: 'manual'
            });
        } catch (err) {
            console.error(`Error CSV línea ${i}:`, err);
        }
    }

    console.log(`parseCsvLines: ${services.length} servicios.`);
    return services;
}

export function parseServicesCsv(csvTextInput: string): Omit<Service, 'id'>[] {
    console.log("--- INICIO PARSEO CSV ---");

    let csvText = csvTextInput.trim().replace(/^\ufeff/, '');

    // Quitar comilla inicial parásita
    if (csvText.startsWith('"')) {
        const fc = csvText.indexOf(',');
        const fq = csvText.indexOf('"', 1);
        if (fc !== -1 && (fq === -1 || fq > fc)) {
            csvText = csvText.substring(1);
        }
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        console.warn("CSV insuficiente.");
        return [];
    }

    return parseCsvLines(lines);
}
