import React from 'react';
import './Common.css';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
    className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon,
    variant = 'neutral',
    className = ''
}) => {
    return (
        <div className={`metric-card variant-${variant} ${className}`}>
            <div className="metric-header">
                <span className="metric-label">{label}</span>
                {icon && <div className="metric-icon">{icon}</div>}
            </div>
            <div className="metric-value">{value}</div>
        </div>
    );
};

export default MetricCard;
