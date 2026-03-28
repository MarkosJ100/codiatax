import React, { useRef, useState } from 'react';
import { useServices } from '../../context/ServiceContext';
import { useToast } from '../../hooks/useToast';
import { FileDown, FileUp, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
    direction?: 'up' | 'down';
    onOpenChange?: (isOpen: boolean) => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ direction = 'down', onOpenChange }) => {
    const { services, expenses, addService } = useServices();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportExcel = async () => {
        try {
            const { exportToExcel } = await import('../../utils/exportData');
            exportToExcel(services, expenses, `codiatx_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Exportado a Excel correctamente');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar a Excel');
            console.error(error);
        }
    };

    const handleExportServicesCSV = async () => {
        try {
            const { exportServicesToCSV } = await import('../../utils/exportData');
            exportServicesToCSV(services);
            toast.success('Servicios exportados a CSV');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar servicios');
            console.error(error);
        }
    };

    const handleExportExpensesCSV = async () => {
        try {
            const { exportExpensesToCSV } = await import('../../utils/exportData');
            exportExpensesToCSV(expenses);
            toast.success('Gastos exportados a CSV');
            setIsOpen(false);
        } catch (error) {
            toast.error('Error al exportar gastos');
            console.error(error);
        }
    };

    const handleImportCSVClick = () => {
        fileInputRef.current?.click();
    };

    const toggleMenu = () => {
        setIsOpen((prev) => {
            const next = !prev;
            onOpenChange?.(next);
            return next;
        });
    };

    const closeMenu = () => {
        setIsOpen(false);
        onOpenChange?.(false);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log(`--- IMPORTANDO ARCHIVO: "${file.name}" (${file.size} bytes, tipo: ${file.type}) ---`);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const [{ parseServicesCsv, parseServicesExcel }] = await Promise.all([
                    import('../../utils/importData')
                ]);
                const buffer = e.target?.result as ArrayBuffer;
                let newServices: any[] = [];

                // Intentar SIEMPRE con xlsx primero (soporta CSV, XLS, XLSX)
                console.log('Intentando parsear con xlsx library...');
                newServices = parseServicesExcel(buffer);

                // Si xlsx no encontrï¿½ servicios y es un .csv, intentar parser de texto
                if (newServices.length === 0 && file.name.toLowerCase().endsWith('.csv')) {
                    console.log('xlsx no encontrï¿½ servicios, intentando parser CSV de texto...');
                    const decoder = new TextDecoder('iso-8859-1');
                    const text = decoder.decode(buffer);
                    newServices = parseServicesCsv(text);
                }

                if (newServices.length === 0) {
                    toast.warning('No se encontraron servicios vï¿½lidos. Asegï¿½rate de usar el formato de App Taxi.');
                    return;
                }

                // Filtrar duplicados contra los servicios existentes y contra los propios del archivo
                const processedKeys = new Set<string>();
                let importCount = 0;
                let skipCount = 0;

                // Aï¿½adir los servicios existentes al set de "ya procesados"
                services.forEach(s => {
                    const timeMs = new Date(s.timestamp).getTime();
                    // Normalizar el importe y la observaciï¿½n para la clave
                    const normObs = String(s.observation || '').trim();
                    const key = `${timeMs}_${normObs}`;
                    processedKeys.add(key);
                });

                const servicesToImport = [...newServices];

                // Verificar importes altos (>100ï¿½) y preguntar al usuario
                const highAmounts = servicesToImport.filter(s => s.amount >= 100);
                if (highAmounts.length > 0) {
                    const examples = highAmounts.slice(0, 3).map(s => `${s.amount}ï¿½`).join(', ');
                    const msg = `Se han detectado ${highAmounts.length} servicios con importes superiores a 100ï¿½ (ej: ${examples}).\n\nï¿½Son correctos estos importes?\n\nSi pulsas CANCELAR, se importarï¿½n igualmente pero te recomendamos revisarlos en el historial.`;
                    
                    if (!window.confirm(msg)) {
                        // El usuario cancelï¿½ la confirmaciï¿½n de importes altos.
                        // Segï¿½n la peticiï¿½n del usuario "me preguntas si el importe es correcto"
                        // Podrï¿½amos incluso ofrecer dividirlos por 100 aquï¿½ si no lo hizo el parser automï¿½tico.
                    }
                }

                for (const service of servicesToImport) {
                    const timeMs = new Date(service.timestamp).getTime();

                    // Usamos solo el tiempo y la observaciï¿½n como clave de deduplicaciï¿½n.
                    // Esto evita que si un importe se parseï¿½ mal una vez (ej: 6.42 vs 642)
                    // se considere un servicio distinto.
                    const normObs = String(service.observation || '').trim();
                    const key = `${timeMs}_${normObs}`;

                    if (processedKeys.has(key)) {
                        console.log(`[Deduplicaciï¿½n] Saltando duplicatado: ${key}`);
                        skipCount++;
                        continue;
                    }

                    processedKeys.add(key);
                    await addService(service);
                    importCount++;
                }

                if (skipCount > 0) {
                    if (importCount > 0) {
                        toast.success(`${importCount} importados, ${skipCount} duplicados ignorados`);
                    } else {
                        toast.warning(`Todos los ${skipCount} servicios ya existï¿½an (ignorados)`);
                    }
                } else {
                    toast.success(`${importCount} servicios importados correctamente`);
                }

                setIsOpen(false);
            } catch (error) {
                console.error('Error importing file:', error);
                toast.error('Error al procesar el archivo');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
                type="file"
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button
                onClick={toggleMenu}
                className="btn"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.75rem 1rem'
                }}
            >
                <FileDown size={18} />
                Gestionar Datos
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: direction === 'down' ? '100%' : undefined,
                    bottom: direction === 'up' ? '100%' : undefined,
                    right: 0,
                    marginTop: direction === 'down' ? '8px' : undefined,
                    marginBottom: direction === 'up' ? '8px' : undefined,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '220px',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Exportar
                    </div>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileSpreadsheet size={18} color="var(--success)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Excel Completo</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Servicios, gastos y resumen</div>
                        </div>
                    </button>

                    <button
                        onClick={handleExportServicesCSV}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileText size={18} color="var(--accent-primary)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>CSV Servicios</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo servicios</div>
                        </div>
                    </button>

                    <button
                        onClick={handleExportExpensesCSV}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileText size={18} color="var(--danger)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>CSV Gastos</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo gastos</div>
                        </div>
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                    <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Importar
                    </div>

                    <button
                        onClick={handleImportCSVClick}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FileUp size={18} color="var(--warning)" />
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Reporte App Taxi</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soportado .csv y .xlsx</div>
                        </div>
                    </button>

                </div>
            )}

            {isOpen && (
                <div
                    onClick={closeMenu}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                />
            )}
        </div>
    );
};

export default ExportMenu;

