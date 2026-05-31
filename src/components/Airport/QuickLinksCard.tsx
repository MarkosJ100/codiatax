import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickLinksCardProps {
    links: Array<{ name: string; url: string; icon: any }>;
    openFlightInfo: (url: string) => void;
    downloadCalendar: () => void;
}

const QuickLinksCard: React.FC<QuickLinksCardProps> = ({ links, openFlightInfo, downloadCalendar }) => {
    return (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {links.map((link, idx) => (
                    <motion.button
                        key={idx}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => openFlightInfo(link.url)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '0.85rem',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-premium)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ 
                            padding: '6px', 
                            borderRadius: '10px', 
                            backgroundColor: 'rgba(250, 204, 21, 0.1)', 
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <link.icon size={16} />
                        </div>
                        <span style={{ flex: 1 }}>{link.name}</span>
                        <ExternalLink size={12} style={{ opacity: 0.3 }} />
                    </motion.button>
                ))}
            </div>

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={downloadCalendar}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '1rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '2px dashed rgba(59, 130, 246, 0.3)',
                    borderRadius: '20px',
                    color: '#2563eb',
                    fontWeight: '900',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Download size={20} /> Sincronizar Calendario (ICS)
            </motion.button>
        </div>
    );
};

export default QuickLinksCard;
