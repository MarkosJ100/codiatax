import React from 'react';
import './Common.css';

interface TabOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabSelectorProps {
    options: TabOption[];
    activeId: string;
    onChange: (id: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

const TabSelector: React.FC<TabSelectorProps> = ({
    options,
    activeId,
    onChange,
    className = '',
    style
}) => {
    return (
        <div className={`tab-selector ${className}`} style={style}>
            {options.map(option => (
                <button
                    key={option.id}
                    className={`tab-btn ${activeId === option.id ? 'active' : ''}`}
                    onClick={() => onChange(option.id)}
                >
                    {option.icon && <span className="tab-icon">{option.icon}</span>}
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default TabSelector;
