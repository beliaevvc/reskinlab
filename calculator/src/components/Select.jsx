import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export function Select({ value, options, onChange, disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Найти текущую опцию
  const currentOption = options.find(opt => opt.value === value) || options[0];

  // Закрыть при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрыть при Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded border outline-none transition-colors duration-150 cursor-pointer text-left ${
          disabled
            ? 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-emerald-500 ring-1 ring-emerald-500'
            : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-900'
        }`}
      >
        <span className={disabled ? 'text-neutral-400' : ''}>{currentOption?.label}</span>
        <Icon 
          name="chevronDown" 
          size={16} 
          className={`text-neutral-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors duration-100 cursor-pointer flex items-center justify-between ${
                option.value === value
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Icon name="check" size={16} className="text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;
