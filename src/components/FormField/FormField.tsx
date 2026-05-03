// src/components/FormField/FormField.tsx
import React, { type ReactNode } from 'react';
import './FormField.css';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Input value */
  value: string;
  /** Value o'zgarganda */
  onChange: (value: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Input turi */
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url';
  /** Majburiy maydon */
  required?: boolean;
  /** Faqat o'qish */
  readOnly?: boolean;
  /** O'chirilgan */
  disabled?: boolean;
  /** Chap tomondagi icon */
  iconLeft?: ReactNode;
  /** O'ng tomondagi icon yoki tugma */
  iconRight?: ReactNode;
  /** Pastdagi yordam matni */
  hint?: string;
  /** Xato xabari */
  error?: string;
  /** Maydonning to'liq enini olishi */
  fullWidth?: boolean;
  /** Input nomi */
  name?: string;
  /** AutoComplete */
  autoComplete?: string;
  /** AutoFocus */
  autoFocus?: boolean;
  /** Min uzunlik (number turida) */
  min?: number;
  /** Max uzunlik (number turida) */
  max?: number;
  /** Step (number turida) */
  step?: number | string;
  /** Maksimal belgilar soni */
  maxLength?: number;
  /** Qo'shimcha CSS klass */
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  readOnly,
  disabled,
  iconLeft,
  iconRight,
  hint,
  error,
  fullWidth,
  name,
  autoComplete,
  autoFocus,
  min,
  max,
  step,
  maxLength,
  className = '',
}) => {
  return (
    <div className={`ff-field ${fullWidth ? 'ff-full' : ''} ${className}`}>
      <label className="ff-label">
        {label}
        {required && <span className="ff-required">*</span>}
      </label>

      <div className={`ff-input-wrap ${iconLeft ? 'ff-has-left' : ''} ${iconRight ? 'ff-has-right' : ''} ${error ? 'ff-error' : ''}`}>
        {iconLeft && <span className="ff-icon ff-icon-left">{iconLeft}</span>}

        <input
          className="ff-input"
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
        />

        {iconRight && <span className="ff-icon ff-icon-right">{iconRight}</span>}
      </div>

      {error && <div className="ff-error-text">{error}</div>}
      {!error && hint && <div className="ff-hint">{hint}</div>}
    </div>
  );
};

export default FormField;