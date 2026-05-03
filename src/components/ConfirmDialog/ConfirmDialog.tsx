// src/components/ConfirmDialog/ConfirmDialog.tsx
import React, { type ReactNode } from 'react';
import { AlertCircle, Loader2, type LucideIcon } from 'lucide-react';
import Modal from '@components/Modal';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  /** Dialog ko'rinishi */
  isOpen: boolean;
  /** Yopish funksiyasi */
  onClose: () => void;
  /** Tasdiqlash funksiyasi */
  onConfirm: () => void;
  /** Sarlavha */
  title: string;
  /** Asosiy matn */
  message: string;
  /** Tasdiqlash tugmasi matni (default: 'Confirm') */
  confirmText?: string;
  /** Bekor qilish tugmasi matni (default: 'Cancel') */
  cancelText?: string;
  /** Tasdiqlash tugma ko'rinishi */
  variant?: 'danger' | 'warning' | 'info' | 'success';
  /** Loading holati (tasdiqlanayotgan paytda) */
  loading?: boolean;
  /** Icon (ixtiyoriy, default: AlertCircle) */
  icon?: LucideIcon;
  /** Tasdiqlash tugmasi ichidagi icon */
  confirmIcon?: ReactNode;
}

const VARIANT_COLORS = {
  danger:  '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
  success: '#16a34a',
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon: Icon = AlertCircle,
  confirmIcon,
}) => {
  const color = VARIANT_COLORS[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="cd-content">
        <div
          className="cd-icon"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}40`,
          }}
        >
          <Icon size={28} color={color} strokeWidth={2.2} />
        </div>

        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>

        <div className="cd-actions">
          <button
            type="button"
            className="cd-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`cd-btn-confirm cd-btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="cd-spin" />
                Loading...
              </>
            ) : (
              <>
                {confirmIcon}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;