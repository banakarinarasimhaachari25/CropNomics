import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.warn(e);
    }
    return 'light';
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      localStorage.setItem('cropnomics_theme', theme);
    } catch (e) {
      console.warn(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark/light mode"
      className={`h-10 px-3 rounded-full flex items-center gap-1.5 font-mono text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
        theme === 'dark'
          ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
          : 'bg-surface-container text-slate-700 border-outline-variant/60 hover:bg-surface-container-high'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
      </span>
      <span className="hidden sm:inline">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};
