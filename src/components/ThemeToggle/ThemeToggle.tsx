// src/components/ThemeToggle/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  size?: number;          // ikon o'lchami
  variant?: 'circle' | 'square';   // shakli
  className?: string;     // qo'shimcha klass
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 16,
  variant = 'circle',
  className = '',
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`tt-toggle tt-${variant} ${isDark ? 'tt-dark' : 'tt-light'} ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={size} strokeWidth={2.2} />
      ) : (
        <Moon size={size} strokeWidth={2.2} />
      )}
    </button>
  );
};

export default ThemeToggle;