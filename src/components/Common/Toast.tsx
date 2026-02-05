import React from 'react';
import { useApp } from '../../context/AppContext';

interface ToastProps {
    // Add props if needed, currently it might be internal or passed from context
}

const Toast: React.FC = () => {
    const { toast } = useApp();

    if (!toast) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--text-primary)',
            color: 'var(--bg-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {toast.message}
        </div>
    );
};

export default Toast;
