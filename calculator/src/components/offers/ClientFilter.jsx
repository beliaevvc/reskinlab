import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function ClientFilter({ clients, value, onChange, className = '' }) {
  const { t } = useTranslation('offers');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Find selected client
  const selectedClient = clients.find(c => c.id === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (clientId) => {
    onChange(clientId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="block text-xs font-medium text-neutral-500 mb-1">
        {t('page.filter.client')}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded border border-neutral-300 bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      >
        <span className={value ? 'text-neutral-900' : 'text-neutral-500'}>
          {selectedClient ? selectedClient.name : t('page.filter.allClients')}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-neutral-100 rounded"
              title={t('page.clear')}
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-neutral-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('filter.searchClients', { defaultValue: 'Search clients...' })}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto">
            {/* All Clients option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between ${
                !value
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{t('page.filter.allClients')}</span>
              {!value && (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Client options */}
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client.id)}
                  className={`w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between ${
                    client.id === value
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span>{client.name}</span>
                  {client.id === value && (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2.5 text-sm text-neutral-500 text-center">
                {t('filter.noClientsFound', { defaultValue: 'No clients found' })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
