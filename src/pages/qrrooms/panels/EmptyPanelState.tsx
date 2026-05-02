// src/pages/qrrooms/panels/EmptyPanelState.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  message: string;
}

const EmptyPanelState: React.FC<Props> = ({ icon: Icon, title, message }) => {
  return (
    <div className="qrr-empty">
      <div className="qrr-empty-icon">
        <Icon size={32} strokeWidth={1.8} />
      </div>
      <h3 className="qrr-empty-title">{title}</h3>
      <p className="qrr-empty-text">{message}</p>
    </div>
  );
};

export default EmptyPanelState;