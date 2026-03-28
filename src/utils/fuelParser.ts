import { FuelTicket } from '../types';
import { endOfMonth, parse, isValid } from 'date-fns';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de pdf.js usando un CDN para evitar problemas de build en Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Analiza un archivo PDF de facturas de combustible (ej. Global Oil Petrolium)
 * Utiliza pdfjs-dist para extraer el texto y expresiones regulares para encontrar los tickets.
 */
export const parseFuelPDF = async (file: File): Promise<{
    month: string;
    year: string;
    totalAmount: number;
    tickets: FuelTicket[];
    lastDayOfMonth: string;
}> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Extraer texto de todas las pï¿½ginas
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Ordenar items por Y (arriba hacia abajo) y luego por X (izquierda a derecha)
            // En PDF.js, Y tï¿½picamente crece hacia arriba, asï¿½ que mayor Y = mï¿½s arriba.
            const items = textContent.items as any[];
            items.sort((a, b) => {
                const yA = a.transform[5];
                const yB = b.transform[5];
                if (Math.abs(yA - yB) > 5) {
                    return yB - yA;
                }
                const xA = a.transform[4];
                const xB = b.transform[4];
                return xA - xB;
            });

            let lastY = -1;
            const textItems = items.map((item) => {
                const currentY = item.transform[5];
                let prefix = ' ';
                if (lastY !== -1 && Math.abs(lastY - currentY) > 5) {
                    prefix = '\n';
                }
                lastY = currentY;
                return prefix + item.str.trim();
            });

            fullText += textItems.join('') + '\n';
        }

        console.log("=== TEXTO EXTRAï¿½DO DEL PDF ===");
        console.log(fullText);
        console.log("==============================");

        const tickets: FuelTicket[] = [];
        let totalAmount = 0;
        let foundMonth = '01';
        let foundYear = new Date().getFullYear().toString();

        const lines = fullText.split('\n');

        for (const line of lines) {
            // Buscar una fecha en la lï¿½nea: YYYY-MM-DD o DD/MM/YYYY o DD-MM-YYYY
            const dateMatch = line.match(/(\d{4})[/-](\d{2})[/-](\d{2})|(\d{2})[/-](\d{2})[/-](\d{2,4})/);
            if (dateMatch) {
                let year, month, day;
                if (dateMatch[1]) {
                    // YYYY-MM-DD
                    year = dateMatch[1];
                    month = dateMatch[2];
                    day = dateMatch[3];
                } else {
                    // DD-MM-YYYY
                    day = dateMatch[4];
                    month = dateMatch[5];
                    year = dateMatch[6];
                    if (year.length === 2) {
                        year = "20" + year;
                    }
                }

                foundMonth = month;
                foundYear = year;

                // Buscar nï¿½meros con decimales (litros y el importe)
                const numberMatches = line.match(/\d+[.,]\d+/g);

                if (numberMatches && numberMatches.length >= 2) {
                    const parseNumber = (str: string) => parseFloat(str.replace(',', '.'));
                    const nums = numberMatches.map(parseNumber);

                    let liters = 0;
                    let amount = 0;

                    if (nums.length >= 3) {
                        // Si hay 3 o mï¿½s nï¿½meros, normalmente son: [Litros, Precio Unitario, Importe Total]
                        liters = nums[0];
                        amount = nums[nums.length - 1]; // El ï¿½ltimo suele ser el importe total de la lï¿½nea
                    } else if (nums.length === 2) {
                        liters = nums[0];
                        amount = nums[1];
                    }

                    if (amount > 0 && liters > 0) {
                        tickets.push({
                            date: `${year}-${month}-${day}`, // formato YYYY-MM-DD
                            liters: liters,
                            amount: amount
                        });
                    }
                }
            }
        }

        if (tickets.length > 0) {
            totalAmount = tickets.reduce((sum, t) => sum + t.amount, 0);
        } else {
            // Ya no usamos fallback de prueba para evitar confusiones. 
            // Queremos que el usuario vea el error y nos pase el texto para ajustar el regex.
            throw new Error("No se detectaron tickets vï¿½lidos en este PDF. Revisa la consola para ver el texto extraï¿½do.");
        }

        const baseDate = parse(`${foundYear}-${foundMonth}-01`, 'yyyy-MM-dd', new Date());
        const lastDay = isValid(baseDate) ? endOfMonth(baseDate) : endOfMonth(new Date());

        return {
            month: foundMonth,
            year: foundYear,
            totalAmount: Number(totalAmount.toFixed(2)),
            tickets,
            lastDayOfMonth: lastDay.toISOString()
        };

    } catch (error) {
        console.error("Error al parsear el PDF:", error);
        throw new Error("No se pudo analizar el PDF correctamente.");
    }
};

