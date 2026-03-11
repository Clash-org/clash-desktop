import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import styles from './index.module.css';

interface InputNumberProps {
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
}

export default function InputNumber({
  value,
  setValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
  placeholder = '0',
  size = 'medium',
  required
}: InputNumberProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Синхронизация с внешним value
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Разрешаем только цифры и минус (если min < 0)
    if (newValue === '' || /^-?\d*$/.test(newValue)) {
      setInputValue(newValue);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);

    let numericValue = parseInt(inputValue, 10);

    if (isNaN(numericValue)) {
      numericValue = min;
    }

    // Ограничиваем значение min/max
    const clampedValue = Math.min(Math.max(numericValue, min), max);
    setInputValue(clampedValue.toString());
    setValue(clampedValue);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const increment = () => {
    if (!disabled) {
      const newValue = Math.min(value + step, max);
      setInputValue(newValue.toString())
      setValue(newValue);
    }
  };

  const decrement = () => {
    if (!disabled) {
      const newValue = Math.max(value - step, min);
      setInputValue(newValue.toString())
      setValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const sizeClass = styles[`size-${size}`];
  const disabledClass = disabled ? styles.disabled : '';

  return (
    <div className={`${styles.container} ${sizeClass} ${disabledClass} ${className}`} tabIndex={-1}>
      <button
        type="button"
        className={styles.button}
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Уменьшить"
      >
        <Minus size={16} />
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className={styles.input}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={required ? `${placeholder} *` : placeholder}
        aria-label="Числовое значение"
        required={required}
      />

      <button
        type="button"
        className={styles.button}
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label="Увеличить"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}