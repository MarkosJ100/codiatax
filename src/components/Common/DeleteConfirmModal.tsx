import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemLabel?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Eliminar registro?',
    message = 'Esta acción no se puede deshacer y el registro se perderá permanentemente.',
    itemLabel
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1000,
                        }}
                    />
                    
                    {/* Modal Content */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        zIndex: 1001,
                        pointerEvents: 'none'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                background: 'var(--bg-elevated)',
                                borderRadius: '28px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-floating)',
                                padding: '1.75rem',
                                pointerEvents: 'auto',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative element */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, var(--danger), #ff8a8a)'
                            }} />

                            <div className="flex flex-col items-center text-center gap-4">
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '20px',
                                    background: 'rgba(var(--danger-rgb), 0.1)',
                                    color: 'var(--danger)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.5rem'
                                }}>
                                    <Trash2 size={32} />
                                </div>

                                <div className="space-y-2">
                                    <h3 style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: '800', 
                                        color: 'var(--text-primary)',
                                        margin: 0
                                    }}>
                                        {title}
                                    </h3>
                                    {itemLabel && (
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: '700',
                                            color: 'var(--text-muted)',
                                            background: 'var(--bg-secondary)',
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            display: 'inline-block',
                                            marginTop: '4px'
                                        }}>
                                            {itemLabel}
                                        </div>
                                    )}
                                    <p style={{ 
                                        fontSize: '0.95rem', 
                                        color: 'var(--text-muted)', 
                                        lineHeight: '1.5',
                                        marginTop: '0.75rem'
                                    }}>
                                        {message}
                                    </p>
                                </div>

                                <div className="flex flex-col w-full gap-3 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onConfirm}
                                        style={{
                                            width: '100%',
                                            padding: '1.1rem',
                                            borderRadius: '18px',
                                            background: 'var(--danger)',
                                            color: 'white',
                                            border: 'none',
                                            fontWeight: '800',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(var(--danger-rgb), 0.2)'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                        <span>Eliminar Ahora</span>
                                    </motion.button>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '18px',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            border: '1px solid var(--border-color)',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmModal;
