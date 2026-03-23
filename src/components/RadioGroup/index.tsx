import styles from './index.module.css';

type RadioOption<T> = {
  value: T;
  label: string;
  disabled?: boolean;
}

type RadioProps<T> = {
  name: string;
  options: RadioOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
  className?: string;
}

export default function RadioGroup<T>({
  name,
  options,
  value,
  onChange,
  direction = 'vertical',
  disabled = false,
  className = ''
}: RadioProps<T>) {
  const handleChange = (optionValue: T) => {
    if (disabled) return;
    onChange?.(optionValue);
  };

  return (
    <div
      className={`
        ${styles.container}
        ${styles[direction]}
        ${className}
      `}
      role="radiogroup"
    >
      {options.map((option) => {
        const isChecked = value === option.value;
        const isDisabled = (disabled || option.disabled) && !isChecked;

        return (
          <label
            key={option.value as string}
            className={`
              ${styles.radioLabel}
              ${isChecked ? styles.checked : ''}
              ${isDisabled ? styles.optionDisabled : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value as string}
              checked={isChecked}
              onChange={() => handleChange(option.value)}
              disabled={isDisabled}
              className={styles.hiddenInput}
            />
            <span className={styles.radioCustom}>
              {isChecked && <span className={styles.radioDot} />}
            </span>
            <span className={styles.radioText}>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}