import fs from 'fs';

const filePath = 'src/utils/importData.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Buscamos el push de servicios y reemplazamos por la versión con detectAbonado
// Usamos regex para ignorar variaciones de espacios/tabs
const regex = /services\.push\(\{\s*timestamp,\s*amount,\s*type:\s*'normal',\s*observation:\s*`Ticket #\$\{ticket\} - \$\{typeSrv\}\. Orig: \$\{orig\} Dest: \$\{dest\}`\.trim\(\),\s*source:\s*'manual'\s*\}\);/g;

const replacement = `const srvType = detectAbonado(orig, dest);

            services.push({
                timestamp,
                amount,
                type: srvType.type,
                companyName: srvType.companyName,
                observation: \`Ticket #\${ticket} - \${typeSrv}. Orig: \${orig} Dest: \${dest}\`.trim(),
                source: 'manual'
            });`;

const newContent = content.replace(regex, replacement);

if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log('Patch applied successfully with Regex');
} else {
    console.log('Patch failed: Regex did not match');
    // Fallback: mostrar un trozo para depurar
    console.log('Snippet sample:', content.substring(content.indexOf('services.push'), content.indexOf('services.push') + 200));
}
