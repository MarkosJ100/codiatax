import React from 'react';
import { Download } from 'lucide-react';

interface QuickLinksCardProps {
    links: Array<{ name: string; url: string; icon: any }>;
    openFlightInfo: (url: string) => void;
    downloadCalendar: () => void;
}

const QuickLinksCard: React.FC<QuickLinksCardProps> = ({ links, openFlightInfo, downloadCalendar }) => {
    return (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {links.map((link, idx) => (
                    <button
                        key={idx}
                        onClick={() => openFlightInfo(link.url)}
                        className="btn-ghost"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                    >
                        <link.icon size={16} color="var(--accent-primary)" />
                        {link.name}
                    </button>
                ))}
            </div>

            <button
                onClick={downloadCalendar}
                className="btn-ghost"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px dashed var(--accent-primary)',
                    borderRadius: '10px',
                    color: 'var(--accent-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                }}
            >
                <Download size={18} /> Sincronizar con Calendario (ICS)
            </button>
        </div>
    );
};

export default QuickLinksCard;
