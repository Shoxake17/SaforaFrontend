// src/hooks/useHotel.ts
import { useEffect, useState } from 'react';
import useAuth from './useAuth';
import { fetchHotelBySlug } from '@services/auth';

/**
 * Loads hotel data — uses context first, falls back to API.
 * Used by pages that need the hotel even when context isn't ready.
 */
export const useHotel = (slug: string | undefined, isAuthenticated: boolean) => {
  const { hotel: contextHotel } = useAuth();
  const [hotel, setHotel] = useState(contextHotel);
  const [hotelLoading, setHotelLoading] = useState(!contextHotel);

  useEffect(() => {
    if (contextHotel) {
      setHotel(contextHotel);
      setHotelLoading(false);
      return;
    }

    if (slug && isAuthenticated) {
      fetchHotelBySlug(slug).then((result) => {
        if (result.success && result.hotel) {
          setHotel(result.hotel);
        }
        setHotelLoading(false);
      });
    }
  }, [contextHotel, slug, isAuthenticated]);

  return { hotel, hotelLoading };
};

export default useHotel;