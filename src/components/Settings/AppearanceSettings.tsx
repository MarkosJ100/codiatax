import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const AppearanceSettings: React.FC = () => {
    const { theme, toggleTheme } = useApp();

    return (
        <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <Palette size={24} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Apariencia</h3>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'rgba(var(--accent-primary-rgb), 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {theme === 'dark' ? (
                        <Moon size={24} color="var(--accent-primary)" />
                    ) : (
                        <Sun size={24} color="var(--warning)" />
                    )}
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                            Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {theme === 'dark' ? 'Ahorro de batería y descanso visual' : 'Claridad máxima para exteriores'}
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    style={{
                        width: '60px',
                        height: '32px',
                        borderRadius: '20px',
                        backgroundColor: theme === 'dark' ? 'var(--bg-secondary)' : '#e2e8f0',
                        border: '2px solid var(--border-light)',
                        position: 'relative',
                        padding: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <motion.div
                        animate={{ x: theme === 'dark' ? 28 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: theme === 'dark' ? 'var(--accent-primary)' : 'var(--bg-card)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {theme === 'dark' ? <Moon size={14} color="#000" /> : <Sun size={14} color="var(--warning)" />}
                    </motion.div>
                </motion.button>
            </div>
        </div>
    );
};

export default AppearanceSettings;
