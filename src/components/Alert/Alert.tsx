// src/components/Alert/Alert.tsx
import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  type LucideIcon,
} from 'lucide-react';
import './Alert.css';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

export interface AlertProps {
  /** Alert turi */
  variant: AlertVariant;
  /** Asosiy xabar */
  message: string;
  /** Sarlavha (ixtiyoriy) */
  title?: string;
  /** Yopish tugmasi (ixtiyoriy) */
  onClose?: () => void;
  /** Maxsus icon (default: variant'ga qarab) */
  icon?: LucideIcon;
  /** Qo'shimcha CSS klass */
  className?: string;
}

const VARIANT_ICONS: Record<AlertVariant, LucideIcon> = {
  error:   AlertCircle,
  success: CheckCircle,
  info:    Info,
  warning: AlertTriangle,
};

const Alert: React.FC<AlertProps> = ({
  variant,
  message,
  title,
  onClose,
  icon,
  className = '',
}) => {
  const Icon = icon || VARIANT_ICONS[variant];

  return (
    <div className={`al-alert al-${variant} ${className}`} role="alert">
      <Icon size={16} strokeWidth={2.2} className="al-icon" />

      <div className="al-text">
        {title && <div className="al-title">{title}</div>}
        <div className="al-message">{message}</div>
      </div>

      {onClose && (
        <button
          type="button"
          className="al-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};

export default Alert;