import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import CustomCalendar from './CustomCalendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convertir string "YYYY-MM-DD" a objeto Date
    const selectedDate = value ? new Date(value + 'T00:00:00') : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (date: Date) => {
        const formatted = format(date, 'yyyy-MM-dd');
        onChange(formatted);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent 
          rounded-xl cursor-pointer transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isOpen ? 'ring-2 ring-[#FFC400] bg-white dark:bg-gray-900 border-[#FFC400]' : ''}
        `}
            >
                <CalendarIcon className="text-gray-400" size={20} />
                <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 left-0 md:left-auto md:right-0">
                    <CustomCalendar
                        selectedDate={selectedDate}
                        onSelect={handleSelect}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}

            {/* Hidden input for form compatibility */}
            <input type="hidden" value={value} required={required} />
        </div>
    );
};

export default DatePicker;
