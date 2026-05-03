// src/components/Modal/Modal.tsx
import React, { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export interface ModalProps {
  /** Modal ko'rinishi */
  isOpen: boolean;
  /** Yopish funksiyasi */
  onClose: () => void;
  /** Modal sarlavhasi (ixtiyoriy) */
  title?: string;
  /** Yopish tugmasi ko'rinadi (default: true) */
  showCloseButton?: boolean;
  /** Tashqarini bosganda yopiladi (default: true) */
  closeOnOverlayClick?: boolean;
  /** ESC bosganda yopiladi (default: true) */
  closeOnEscape?: boolean;
  /** Modal hajmi */
  size?: 'sm' | 'md' | 'lg';
  /** Modal ichidagi kontent */
  children: ReactNode;
  /** Qo'shimcha CSS klass */
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md',
  children,
  className = '',
}) => {
  // ESC tugma bilan yopish
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, closeOnEscape, onClose]);

  // Body scroll'ni o'chirib qo'yish modal ochiq paytda
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="md-overlay"
      onClick={() => closeOnOverlayClick && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`md-content md-${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Yopish tugmasi */}
        {showCloseButton && (
          <button
            type="button"
            className="md-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        )}

        {/* Sarlavha (agar berilgan bo'lsa) */}
        {title && (
          <div className="md-header">
            <h3 className="md-title">{title}</h3>
          </div>
        )}

        {/* Kontent */}
        <div className="md-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;