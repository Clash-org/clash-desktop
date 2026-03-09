// components/ui/Select/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import InputText from '../InputText';
import styles from './index.module.css';

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectProps<T> {
  options: SelectOption<T>[];
  value?: T | T[];
  setValue: (value: any) => void;
  placeholder?: string;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
  maxSelected?: number; // максимальное количество выбранных опций (для multiple)
}

export default function Select<T>({
  options,
  value,
  setValue,
  placeholder = 'Выберите...',
  error = false,
  fullWidth = true,
  disabled = false,
  className = '',
  multiple = false,
  maxSelected
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Нормализация value в зависимости от режима
  const selectedValues = multiple
    ? (Array.isArray(value) ? value : [])
    : (value !== undefined ? [value] : []);

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  // Фильтрация опций по поиску
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (multiple ? true : !selectedValues.includes(opt.value)) // в одиночном режиме скрываем выбранное
  );

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обработка клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelectOption = (option: SelectOption<T>) => {
    if (multiple) {
      // Режим множественного выбора
      let newValues: T[];

      if (selectedValues.includes(option.value)) {
        // Удаляем, если уже выбран
        newValues = selectedValues.filter(v => v !== option.value);
      } else {
        // Добавляем, если не выбран
        if (maxSelected && selectedValues.length >= maxSelected) {
          // Достигнут лимит, не добавляем
          return;
        }
        newValues = [...selectedValues, option.value];
      }

      setValue(newValues);
      // Не закрываем список в multiple режиме
      setSearchTerm('');
    } else {
      // Режим одиночного выбора
      setValue(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleRemoveOption = (optionValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!multiple) return;

    const newValues = selectedValues.filter(v => v !== optionValue);
    setValue(newValues);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!multiple) return;
    setValue([]);
  };

  const handleInputChange = (text: string) => {
    setSearchTerm(text);
    if (!isOpen) setIsOpen(true);
  };

  // Отображение выбранных опций в multiple режиме
  const renderSelectedTags = () => {
    if (!multiple || selectedOptions.length === 0) return null;

    return (
      <div className={styles.selectedTags}>
        {selectedOptions.map(option => (
          <span key={option.value as string} className={styles.tag}>
            {option.label}
            {!disabled && (
              <button
                className={styles.tagRemove}
                onClick={(e) => handleRemoveOption(option.value, e)}
                aria-label={`Удалить ${option.label}`}
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
        {maxSelected && selectedValues.length >= maxSelected && (
          <span className={styles.tagLimit}>
            Лимит: {maxSelected}
          </span>
        )}
        {selectedValues.length > 0 && !disabled && (
          <button
            className={styles.clearAll}
            onClick={handleClearAll}
            aria-label="Очистить все"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      ref={wrapperRef}
      className={`
        ${styles.wrapper}
        ${fullWidth ? styles.fullWidth : ''}
        ${disabled ? styles.disabled : ''}
        ${multiple ? styles.multiple : ''}
        ${className}
      `}
    >
      {multiple && renderSelectedTags()}
      <div
        ref={inputRef}
        className={`${styles.trigger} ${error ? styles.error : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-multiselectable={multiple}
      >

        <InputText
          value={isOpen ? searchTerm : (!multiple && selectedOptions[0]?.label) || ''}
          setValue={handleInputChange}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          className={`${styles.input} ${isOpen ? styles.inputOpen : ''}`}
          disabled={disabled}
        />

        <ChevronDown
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
          size={20}
        />
      </div>

      {/* Выпадающий список опций */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`
                    ${styles.option}
                    ${isSelected ? styles.selected : ''}
                    ${multiple ? styles.multipleOption : ''}
                  `}
                  onClick={() => handleSelectOption(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectOption(option);
                    }
                  }}
                  tabIndex={0}
                  role="option"
                  aria-selected={isSelected}
                >
                  {multiple && (
                    <span className={styles.checkbox}>
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                    </span>
                  )}
                  <span className={styles.optionLabel}>{option.label}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.noOptions}>
              Нет совпадений
            </div>
          )}
        </div>
      )}
    </div>
  );
}