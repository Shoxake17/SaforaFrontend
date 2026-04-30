// src/components/ui/PasswordInput.tsx

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  /** Qo'shimcha validatsiya xabari */
  error?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'new-password',
  disabled = false,
  className = '',
  error,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        className={`form-control password-input ${error ? 'is-invalid' : ''} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        disabled={disabled}
      >
        {show
          ? <EyeOff size={18} strokeWidth={2} />
          : <Eye size={18} strokeWidth={2} />
        }
      </button>
      {error && (
        <div className="invalid-feedback">{error}</div>
      )}
    </div>
  );
};

export default PasswordInput;