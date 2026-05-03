// src/components/PageHeader/PageHeader.tsx
import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import './PageHeader.css';

export interface PageHeaderProps {
  /** Asosiy ikon */
  icon: LucideIcon;
  /** Ikon rangi */
  iconColor?: string;
  /** Sahifa sarlavhasi */
  title: string;
  /** Subtitle (ixtiyoriy) */
  subtitle?: string;
  /** O'ng tomondagi actions (tugmalar) */
  actions?: ReactNode;
  /** Back tugma URL'i (ixtiyoriy) */
  backTo?: string;
  /** Back tugma matni (default: 'Back') */
  backText?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  iconColor = '#f97316',
  title,
  subtitle,
  actions,
  backTo,
  backText = 'Back',
}) => {
  return (
    <div className="ph-header">
      <div className="ph-left">
        <h1 className="ph-title">
          <Icon
            size={22}
            strokeWidth={2.2}
            style={{ color: iconColor, marginRight: 10 }}
          />
          {title}
        </h1>
        {subtitle && <p className="ph-subtitle">{subtitle}</p>}
      </div>

      <div className="ph-right">
        {actions}
        {backTo && (
          <Link to={backTo} className="ph-back-btn">
            <ArrowLeft size={14} strokeWidth={2.2} />
            <span>{backText}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageHeader;