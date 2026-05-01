// src/components/ui/PasswordInput.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ═══════════════════════════════════════════════════════
// 🔐 Universal PasswordInput komponenti
// 3 ta variant: default, login, role-login
// ═══════════════════════════════════════════════════════
type PasswordVariant = 'default' | 'login' | 'role-login';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  name?: string;
  id?: string;
  autoFocus?: boolean;

  // ⭐ YANGI prop — qaysi sahifada ishlatilishi
  variant?: PasswordVariant;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'current-password',
  name,
  id,
  autoFocus = false,
  variant = 'default',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // ─────────────────────────────────────────────
  // Variant 1: LOGIN (pf-* CSS klasslar)
  // ─────────────────────────────────────────────
  if (variant === 'login') {
    return (
      <div className="pf-input-wrap">
        <i className="fa-solid fa-lock fi"></i>
        <input
          className="pf-input"
          type={showPassword ? 'text' : 'password'}
          name={name}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="pf-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Variant 2: ROLE-LOGIN (rl-* CSS klasslar)
  // ─────────────────────────────────────────────
  if (variant === 'role-login') {
    return (
      <div className="rl-input-wrap">
        <i className="fa-solid fa-lock fi"></i>
        <input
          className="rl-input"
          type={showPassword ? 'text' : 'password'}
          name={name}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="rl-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Variant 3: DEFAULT (Register/StepDetailsFour uchun)
  // ─────────────────────────────────────────────
  return (
    <div className="password-input-wrap" style={{ position: 'relative' }}>
      <input
        type={showPassword ? 'text' : 'password'}
        className="form-control"
        name={name}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: '#6b7280',
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;