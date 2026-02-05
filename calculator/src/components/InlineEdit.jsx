import { useState, useRef, useEffect } from 'react';

export function InlineEdit({ 
  value, 
  onSave, 
  className = '', 
  inputClassName = '',
  placeholder = 'Click to edit',
  multiline = false,
  maxLength,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== (value || '').trim()) {
      onSave(trimmed || null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    return (
      <InputComponent
        ref={inputRef}
        type={multiline ? undefined : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        rows={multiline ? 2 : undefined}
        className={`w-full px-1.5 py-0.5 border border-neutral-300 rounded-md focus:outline-none focus:border-emerald-400 ${inputClassName}`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span 
      onClick={handleClick}
      className={`cursor-text hover:bg-neutral-100 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-neutral-400 italic">{placeholder}</span>}
    </span>
  );
}

export default InlineEdit;
