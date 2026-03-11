// components/ui/InputText.tsx
import React from "react";
import styles from "./index.module.css";

interface InputTextProps {
  setValue?: ((text: string) => void) | undefined;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  value?: string | undefined;
  placeholder?: string | undefined;
  style?: React.CSSProperties;
  type?: React.HTMLInputTypeAttribute | undefined;
  multiline?: boolean | undefined;
  className?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean
}

export default function InputText({
  setValue,
  onKeyDown,
  value,
  placeholder,
  style,
  type = "text",
  multiline = false,
  className = "",
  rows = 3,
  disabled=false,
  maxLength,
  required
}: InputTextProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue?.(e.target.value);
  };

  const commonProps = {
    placeholder: required ? `${placeholder} *` : placeholder,
    value: value || "",
    onChange: handleChange,
    onKeyDown: onKeyDown,
    className: `${styles.input} ${className}`,
    style: { ...style, color: "var(--fg)" },
    "aria-placeholder": placeholder,
    maxLength: maxLength
  };

  if (multiline) {
    return (
      <textarea
        {...commonProps}
        rows={rows}
        style={{
          ...commonProps.style,
          minHeight: "40px",
          resize: "vertical"
        }}
        className={`${styles.textarea} ${commonProps.className}`}
        required={required}
      />
    );
  }

  return (
    // @ts-ignore
    <input
      {...commonProps}
      type={type}
      style={commonProps.style}
      disabled={disabled}
      required={required}
    />
  );
}