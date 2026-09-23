import React from 'react';
import { TRANSLATIONS } from '../data/mockData';
import { AppScreen, LanguageCode } from '../types';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  unreadAlertsCount: number;
  language?: LanguageCode;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  unreadAlertsCount,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (currentScreen === 'welcome') {
    return null;
  }

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-1.5 h-16 rounded-t-2xl bg-white dark:bg-slate-900 bg-surface-container-lowest shadow-[0_-4px_16px_0_rgba(0,0,0,0.1)] border-t border-outline-variant/40 isolate"
    >
      {/* 1. Home / Main Portal */}
      <button
        id="bottom-nav-home"
        onClick={() => onNavigate('welcome')}
        title={language === 'te' ? 'ప్రధాన పోర్టల్ (Home)' : 'Main Portal'}
        aria-label="Home"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'welcome'
            ? 'text-[#0d5c2e] font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'welcome' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          home
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'హోమ్' : 'Home'}
        </span>
      </button>

      {/* 2. Farmer Dashboard */}
      <button
        id="bottom-nav-farmer"
        onClick={() => onNavigate('farmer')}
        title={language === 'te' ? 'రైతు డాష్‌బోర్డ్' : 'Farmer Dashboard'}
        aria-label="Farmer Dashboard"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'farmer' || currentScreen === 'home' || currentScreen === 'analysis'
            ? 'text-emerald-700 font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'farmer' || currentScreen === 'home' || currentScreen === 'analysis' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          agriculture
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'రైతు' : 'Farmer'}
        </span>
      </button>

      {/* 3. Trader Dashboard */}
      <button
        id="bottom-nav-trader"
        onClick={() => onNavigate('trader')}
        title={language === 'te' ? 'ట్రేడర్ సోర్సింగ్' : 'Trader Sourcing'}
        aria-label="Trader Dashboard"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'trader'
            ? 'text-amber-700 font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'trader' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          local_shipping
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'ట్రేడర్' : 'Trader'}
        </span>
      </button>

      {/* 4. Retailer Dashboard */}
      <button
        id="bottom-nav-retailer"
        onClick={() => onNavigate('retailer')}
        title={language === 'te' ? 'రిటైలర్ షాప్' : 'Retailer Shop'}
        aria-label="Retailer Dashboard"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'retailer'
            ? 'text-indigo-700 font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'retailer' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          storefront
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'రిటైలర్' : 'Retailer'}
        </span>
      </button>

      {/* 5. Consumer Store */}
      <button
        id="bottom-nav-consumer"
        onClick={() => onNavigate('consumer')}
        title={language === 'te' ? 'వినియోగదారుల స్టోర్' : 'Consumer Store'}
        aria-label="Consumer Store"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'consumer'
            ? 'text-teal-700 font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'consumer' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          shopping_basket
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'స్టోర్' : 'Store'}
        </span>
      </button>

      {/* 6. Admin Oversight */}
      <button
        id="bottom-nav-help"
        onClick={() => onNavigate('admin')}
        title={language === 'te' ? 'అడ్మిన్ పర్యవేక్షణ' : 'Admin Oversight'}
        aria-label="Admin"
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
          currentScreen === 'help' || currentScreen === 'admin'
            ? 'text-blue-700 font-black scale-105'
            : 'text-on-surface-variant hover:text-secondary'
        }`}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={currentScreen === 'help' || currentScreen === 'admin' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          admin_panel_settings
        </span>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5">
          {language === 'te' ? 'అడ్మిన్' : 'Admin'}
        </span>
      </button>
    </nav>
  );
};
