// src/pages/qrrooms/panels/OrdersPanel.tsx
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

const OrdersPanel: React.FC<Props> = () => {
  return (
    <EmptyPanelState
      icon={ShoppingCart}
      title="No orders yet"
      message="Guest orders from QR room pages will appear here"
    />
  );
};

export default OrdersPanel;