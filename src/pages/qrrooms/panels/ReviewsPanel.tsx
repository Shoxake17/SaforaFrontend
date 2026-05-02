// src/pages/qrrooms/panels/ReviewsPanel.tsx
import React from 'react';
import { Star } from 'lucide-react';
import EmptyPanelState from './EmptyPanelState';

interface Props {
  hotelSlug?: string;
  accentColor: string;
}

const ReviewsPanel: React.FC<Props> = () => {
  return (
    <EmptyPanelState
      icon={Star}
      title="No reviews yet"
      message="Guest reviews will appear here when guests leave feedback"
    />
  );
};

export default ReviewsPanel;