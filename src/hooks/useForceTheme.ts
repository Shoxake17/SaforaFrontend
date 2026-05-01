// src/hooks/useForceTheme.ts
import { useEffect } from 'react';
import { useTheme, type Theme } from '@contexts/ThemeContext';

/**
 * Sahifaga kirganda theme'ni majburiy o'zgartiradi,
 * sahifadan chiqqanda eski theme'ga qaytadi.
 *
 * @param forced — majburiy theme: 'light' yoki 'dark'
 *
 * @example
 * const Home = () => {
 *   useForceTheme('light');
 *   return <div>...</div>;
 * };
 */
export const useForceTheme = (forced: Theme) => {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const previous = theme;
    setTheme(forced);
    return () => {
      setTheme(previous);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced]);
};

export default useForceTheme;