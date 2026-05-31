import fs from 'fs';

const filePath = 'src/utils/importData.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Definir reemplazo para parseServicesExcel
const excelOld = `            services.push({
                timestamp,
                amount,
                type: 'normal',
                observation: \`Ticket #\${ticket} - \${typeSrv}. Orig: \${orig} Dest: \${dest}\`.trim(),
                source: 'manual'
            });`;

const excelNew = `            const srvType = detectAbonado(orig, dest);

            services.push({
                timestamp,
                amount,
                type: srvType.type,
                companyName: srvType.companyName,
                observation: \`Ticket #\${ticket} - \${typeSrv}. Orig: \${orig} Dest: \${dest}\`.trim(),
                source: 'manual'
            });`;

// Definir reemplazo para parseCsvLines
const csvOld = `            services.push({
                timestamp,
                amount,
                type: 'normal',
                observation: \`Ticket #\${ticket} - \${typeSrv}. Orig: \${orig} Dest: \${dest}\`.trim(),
                source: 'manual'
            });`;
// Notar que csvOld es igual a excelOld. 

// Reemplazar ambos (si findUnique falló es porque quizás hay espacios distintos)
// Usamos regex con flag g para pillar ambos si son idénticos o uno por uno
content = content.replace(excelOld, excelNew);
// Como son idénticos en texto plano, el primero .replace lo habrá hecho en la primera ocurrencia (Excel).
// Volvemos a intentar para la segunda (CSV).
content = content.replace(excelOld, excelNew);

fs.writeFileSync(filePath, content);
console.log('Patch applied successfully');
