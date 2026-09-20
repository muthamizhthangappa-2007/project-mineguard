import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '', variant = 'dark' }) => {
  const { currentLanguage, setLanguage, languages } = useTranslation();

  const baseStyle =
    variant === 'dark'
      ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-amber-500/50'
      : 'bg-white border-slate-300 text-slate-800 hover:border-blue-500';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className={`w-4 h-4 absolute left-2.5 pointer-events-none ${variant === 'dark' ? 'text-amber-400' : 'text-blue-600'}`} />
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        className={`text-xs font-semibold pl-8 pr-7 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none transition-all ${baseStyle}`}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 pointer-events-none text-[10px] text-slate-400">▼</span>
    </div>
  );
};
