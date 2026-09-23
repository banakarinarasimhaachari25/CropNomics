import React, { useState } from 'react';
import { CropNomicsLogo } from './CropNomicsLogo';
import { AppScreen, LanguageCode, UserRole } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { LoginSignUpModal } from './LoginSignUpModal';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenAiSuite?: (tab?: 'voice' | 'transcribe' | 'chat' | 'maps' | 'search' | 'video') => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  language,
  onLanguageChange,
  role,
  onRoleChange,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenAiSuite,
  currentUser,
  onGoogleLogin,
  onLogout,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const handleDashboardSwitch = (targetRole: UserRole) => {
    // If the user is currently already active in this role and dashboard, close the drawer and remain
    if (role === targetRole && currentScreen === (targetRole as AppScreen)) {
      setMobileDrawerOpen(false);
      setRoleMenuOpen(false);
      return;
    }

    // Intercept and prompt for login credentials first
    setPendingRole(targetRole);
    setLoginModalOpen(true);
    setMobileDrawerOpen(false);
    setRoleMenuOpen(false);
  };

  const handleLoginSuccess = (
    authenticatedRole: UserRole,
    _userDetails: { name: string; phone: string; username?: string; isNewAccount: boolean }
  ) => {
    setLoginModalOpen(false);
    onRoleChange(authenticatedRole);
    onNavigate(authenticatedRole as AppScreen);
    setPendingRole(null);
  };

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'en', label: 'English', flag: '🇮🇳' },
    { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const roles: { code: UserRole; label: string; icon: string; desc: string }[] = [
    { code: 'farmer', label: 'Farmer View', icon: 'agriculture', desc: 'Crop registration & price prediction' },
    { code: 'trader', label: 'Trader View', icon: 'local_shipping', desc: 'Sourcing farmers & margin calculator' },
    { code: 'retailer', label: 'Retailer View', icon: 'storefront', desc: 'Available lots & consumer markup' },
    { code: 'consumer', label: 'Consumer View', icon: 'shopping_basket', desc: 'Direct farm produce & grocery store' },
    { code: 'admin', label: 'Admin View', icon: 'admin_panel_settings', desc: 'Issues resolution & feedback overview' },
  ];

  return (
    <>
      {/* Government Updates Ticker (Hidden on Home and Welcome Pages) */}
      {currentScreen !== 'home' && currentScreen !== 'welcome' && (
        <div
          id="gov-update-ticker"
          className="ticker-wrap h-10 flex items-center font-label-sm text-label-sm shadow-inner cursor-pointer"
          onClick={onOpenAlerts}
          title="Click to view all government alerts"
        >
          <div className="ticker font-bold tracking-widest px-4 flex items-center gap-8">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>
              AP GOVT UPDATE: PADDY MSP FIXED AT ₹2,300/QUINTAL AT ALL 2000+ RBKs.
            </span>
            <span>•</span>
            <span>GUNTUR CHILLI YARD: ZERO MARKET FEE ON DIRECT DIGITAL TRADES.</span>
            <span>•</span>
            <span>AP MICRO-IRRIGATION 90% SUBSIDY ACTIVE FOR RAYALASEEMA & PRAKASAM.</span>
            <span>•</span>
            <span>COASTAL WEATHER ADVISORY: MODERATE RAINS FORECASTED IN GODAVARI DELTA.</span>
            <span>•</span>
            <span className="underline decoration-dotted text-[#261a00]">CLICK TO READ DETAILS &rarr;</span>
          </div>
        </div>
      )}

      {/* TopAppBar */}
      <header className="bg-white dark:bg-slate-900 bg-surface border-b border-outline-variant/80 shadow-xs top-0 z-40 sticky isolate backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 h-14 max-w-7xl mx-auto">
          {/* Left: Menu & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="header-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            <div
              className="flex items-baseline cursor-pointer select-none py-0.5 tracking-tight font-black"
              onClick={() => onNavigate('welcome')}
              title="Return to Front Slide & Role Portal"
            >
              <span className="font-black text-[#0b5229] text-xl sm:text-2xl" style={{ letterSpacing: '-0.035em' }}>
                Crop
              </span>
              <span className="font-black text-[#c06a1c] text-xl sm:text-2xl" style={{ letterSpacing: '-0.035em' }}>
                Nomics
              </span>
            </div>

            {/* Quick role switch icon button */}
            <div className="relative ml-2 hidden md:block">
              <button
                id="role-switch-btn"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                title={`Current Role: ${role.toUpperCase()} (Click to switch)`}
                aria-label={`Current Role: ${role}`}
                className="w-10 h-10 flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-primary rounded-xl border border-outline-variant transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[22px] text-secondary">
                  {role === 'farmer' ? 'agriculture' : role === 'trader' ? 'local_shipping' : role === 'retailer' ? 'storefront' : role === 'consumer' ? 'shopping_basket' : 'admin_panel_settings'}
                </span>
              </button>

              {roleMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-label-sm border-b border-outline-variant">
                    Switch Workspace Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => handleDashboardSwitch(r.code)}
                      className={`w-full px-3 py-2.5 text-left flex items-start gap-3 hover:bg-surface-container transition-colors ${
                        role === r.code ? 'bg-secondary-container/20 text-primary font-bold' : 'text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-secondary mt-0.5">
                        {r.icon}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{r.label}</div>
                        <div className="text-xs text-on-surface-variant font-normal">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Navigation (Desktop) - Pure Icon Buttons */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            <button
              id="desktop-nav-welcome"
              onClick={() => onNavigate('welcome')}
              title={language === 'te' ? 'పోర్టల్ & లాగిన్ (Portal)' : 'Portal & Login'}
              aria-label="Portal"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'welcome'
                  ? 'bg-[#0d5c2e] text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">home</span>
              <span>{language === 'te' ? 'హోమ్' : 'Home'}</span>
            </button>
            <button
              id="desktop-nav-farmer"
              onClick={() => handleDashboardSwitch('farmer')}
              title={language === 'te' ? 'రైతు డాష్‌బోర్డ్ (Farmer Dashboard)' : 'Farmer Dashboard'}
              aria-label="Farmer Dashboard"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'farmer' || currentScreen === 'home' || currentScreen === 'analysis'
                  ? 'bg-emerald-700 text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">agriculture</span>
              <span>{language === 'te' ? 'రైతు' : 'Farmer'}</span>
            </button>
            <button
              id="desktop-nav-trader"
              onClick={() => handleDashboardSwitch('trader')}
              title={language === 'te' ? 'ట్రేడర్ సోర్సింగ్ (Trader Dashboard)' : 'Trader Dashboard'}
              aria-label="Trader Dashboard"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'trader'
                  ? 'bg-amber-700 text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">local_shipping</span>
              <span>{language === 'te' ? 'ట్రేడర్' : 'Trader'}</span>
            </button>
            <button
              id="desktop-nav-retailer"
              onClick={() => handleDashboardSwitch('retailer')}
              title={language === 'te' ? 'రిటైలర్ డాష్‌బోర్డ్ (Retailer Dashboard)' : 'Retailer Dashboard'}
              aria-label="Retailer Dashboard"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'retailer'
                  ? 'bg-indigo-700 text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">storefront</span>
              <span>{language === 'te' ? 'రిటైలర్' : 'Retailer'}</span>
            </button>
            <button
              id="desktop-nav-consumer"
              onClick={() => handleDashboardSwitch('consumer')}
              title={language === 'te' ? 'వినియోగదారుల స్టోర్ (Consumer Store)' : 'Consumer Store'}
              aria-label="Consumer Store"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'consumer'
                  ? 'bg-teal-700 text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">shopping_basket</span>
              <span>{language === 'te' ? 'వినియోగదారు' : 'Consumer'}</span>
            </button>
            <button
              id="desktop-nav-admin"
              onClick={() => handleDashboardSwitch('admin')}
              title={language === 'te' ? 'అడ్మిన్ డాష్‌బోర్డ్ (Admin Dashboard)' : 'Admin Dashboard'}
              aria-label="Admin Dashboard"
              className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 ${
                currentScreen === 'admin' || currentScreen === 'help'
                  ? 'bg-blue-700 text-white shadow-md scale-105'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
              <span>{language === 'te' ? 'అడ్మిన్' : 'Admin'}</span>
            </button>
          </nav>

          {/* Right: AI Studio, Language, Dark/Light Mode, Notifications & Google Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* CropNomics Gemini AI Hub trigger */}
            {onOpenAiSuite && (
              <button
                id="ai-studio-btn"
                onClick={() => onOpenAiSuite('voice')}
                title="CropNomics Gemini AI Studio (Voice, Transcribe, Chat, Maps, Search, Veo Video)"
                className="bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-300 animate-pulse">auto_awesome</span>
                <span className="hidden sm:inline font-mono">Gemini AI</span>
              </button>
            )}

            {/* Google Firebase Auth Chip */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-xl border border-outline-variant/60">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-[11px]">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[70px] truncate hidden md:inline">
                  {currentUser.displayName || currentUser.email}
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out (Firebase Auth)"
                    className="text-on-surface-variant hover:text-error p-0.5 rounded cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                  </button>
                )}
              </div>
            ) : (
              onGoogleLogin && (
                <button
                  onClick={onGoogleLogin}
                  title="Sign in with Google (Firebase Auth)"
                  className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/80 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-on-surface"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google Sign In</span>
                </button>
              )
            )}

            {/* Theme Toggle (Dark/Light Mode) */}
            <ThemeToggle />

            {/* Language Selector Dropdown as Icon Button */}
            <div className="relative">
              <button
                id="language-dropdown-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                title={`Change Language (${language === 'te' ? 'తెలుగు' : 'English'})`}
                aria-label="Change Language"
                className="w-10 h-10 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center border border-outline-variant/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">translate</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        onLanguageChange(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center justify-between text-sm hover:bg-surface-container transition-colors ${
                        language === l.code ? 'font-bold text-primary bg-surface-container-low' : 'text-on-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && (
                        <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              id="notifications-bell-btn"
              onClick={onOpenAlerts}
              aria-label="View notifications"
              className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full w-10 h-10 flex items-center justify-center relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadAlertsCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-on-background/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-surface-container-lowest h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
                <div
                  className="flex items-baseline tracking-tight font-black cursor-pointer select-none"
                  onClick={() => {
                    onNavigate('welcome');
                    setMobileDrawerOpen(false);
                  }}
                  title="Return to Front Slide & Role Portal"
                >
                  <span className="font-black text-[#0b5229] text-xl" style={{ letterSpacing: '-0.035em' }}>
                    Crop
                  </span>
                  <span className="font-black text-[#c06a1c] text-xl" style={{ letterSpacing: '-0.035em' }}>
                    Nomics
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Roles Section */}
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 font-label-sm">
                  Active Persona
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => handleDashboardSwitch(r.code)}
                      className={`p-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                        role === r.code
                          ? 'border-primary bg-primary-container/20 text-primary'
                          : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">{r.icon}</span>
                      <span className="capitalize">{r.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 flex flex-col gap-1">
                <button
                  onClick={() => {
                    onNavigate('welcome');
                    setMobileDrawerOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'welcome' ? 'bg-[#0d5c2e] text-white' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">home</span>
                  <span>Front Slide & Login</span>
                </button>
                {onOpenAiSuite && (
                  <button
                    onClick={() => {
                      onOpenAiSuite('voice');
                      setMobileDrawerOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-linear-to-r from-emerald-600 to-teal-700 text-white transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-amber-300">auto_awesome</span>
                    <span>✨ Gemini AI Hub</span>
                  </button>
                )}
                <button
                  onClick={() => handleDashboardSwitch('farmer')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'farmer' || currentScreen === 'home' ? 'bg-emerald-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">agriculture</span>
                  <span>🌾 Farmer Dashboard</span>
                </button>
                <button
                  onClick={() => handleDashboardSwitch('trader')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'trader' ? 'bg-amber-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">local_shipping</span>
                  <span>🚚 Trader Dashboard</span>
                </button>
                <button
                  onClick={() => handleDashboardSwitch('retailer')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'retailer' ? 'bg-indigo-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">storefront</span>
                  <span>🏪 Retailer Dashboard</span>
                </button>
                <button
                  onClick={() => handleDashboardSwitch('consumer')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'consumer' ? 'bg-teal-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">shopping_basket</span>
                  <span>🛒 Consumer Store</span>
                </button>
                <button
                  onClick={() => handleDashboardSwitch('admin')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'admin' ? 'bg-blue-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                  <span>🛡️ Admin Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('analysis');
                    setMobileDrawerOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'analysis' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">analytics</span>
                  <span>Crop Profit Analysis</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('alerts');
                    setMobileDrawerOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    currentScreen === 'alerts' ? 'bg-rose-700 text-white font-bold' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined">campaign</span>
                  <span className="flex-1">Government Updates</span>
                  {unreadAlertsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-error text-on-error text-xs flex items-center justify-center">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant text-xs text-on-surface-variant">
              <p className="font-semibold text-primary">CropNomics Supply Network</p>
              <p className="text-[11px] mt-1">Connecting Farmers, Traders, & Retailers directly with transparent pricing.</p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Login / Sign Up Modal: Intercepts switching to dashboards */}
      <LoginSignUpModal
        isOpen={loginModalOpen}
        targetRole={pendingRole}
        language={language}
        initialMode="login"
        onClose={() => {
          setLoginModalOpen(false);
          setPendingRole(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};
