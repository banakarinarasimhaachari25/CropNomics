import React, { useState, useEffect } from 'react';
import { UserRole, LanguageCode, UserAccount } from '../types';
import { db } from '../data/db';

export interface LoginSignUpModalProps {
  isOpen: boolean;
  targetRole: UserRole | null;
  language: LanguageCode;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (
    role: UserRole,
    userDetails: {
      name: string;
      phone: string;
      username?: string;
      isNewAccount: boolean;
    }
  ) => void;
}

interface RoleConfig {
  titleEn: string;
  titleTe: string;
  descEn: string;
  descTe: string;
  icon: string;
  colorClass: string;
  badgeBg: string;
  defaultPhoneOrId: string;
  defaultPassword: string;
  defaultFullName: string;
  defaultPhone: string;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  farmer: {
    titleEn: 'Farmer (రైతు)',
    titleTe: 'రైతు (Farmer)',
    descEn: 'Cultivator, harvest registration, and cold storage management',
    descTe: 'పంట నమోదు, మార్కెట్ యార్డులు మరియు కోల్డ్ స్టోరేజ్ వివరాలు',
    icon: 'agriculture',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
    badgeBg: 'bg-emerald-700 text-white',
    defaultPhoneOrId: '9848023456',
    defaultPassword: 'farmer@2026',
    defaultFullName: 'రామేష్ వర్మ (Ramesh Varma)',
    defaultPhone: '9848023456',
  },
  trader: {
    titleEn: 'Trader / Bulk Buyer (ట్రేడర్)',
    titleTe: 'ట్రేడర్ (Trader)',
    descEn: 'Wholesale lot sourcing, direct farmer bidding, and transport routing',
    descTe: 'హోల్‌సేల్ మండి పంటలు, ప్రత్యక్ష బిడ్డింగ్ మరియు రవాణా నిర్వహణ',
    icon: 'local_shipping',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
    badgeBg: 'bg-amber-700 text-white',
    defaultPhoneOrId: '9848277889',
    defaultPassword: 'trader@2026',
    defaultFullName: 'వెంకటేశ్వర రావు (Venkateswara Rao)',
    defaultPhone: '9848277889',
  },
  retailer: {
    titleEn: 'Retailer / Store (రిటైలర్)',
    titleTe: 'రిటైలర్ (Retailer)',
    descEn: 'Store inventory, wholesale orders, and retail consumer deliveries',
    descTe: 'దుకాణ నిల్వలు, లాభాల శాతాలు మరియు కస్టమర్ ఆర్డర్ల నిర్వహణ',
    icon: 'storefront',
    colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300',
    badgeBg: 'bg-indigo-700 text-white',
    defaultPhoneOrId: '9848511223',
    defaultPassword: 'retail@2026',
    defaultFullName: 'శ్రీనివాస్ కుమార్ (Srinivas Kumar)',
    defaultPhone: '9848511223',
  },
  consumer: {
    titleEn: 'Consumer / Household (వినియోగదారుడు)',
    titleTe: 'వినియోగదారుడు (Consumer)',
    descEn: 'Direct fresh produce orders, local shop pickups, and quality grading',
    descTe: 'తాజా పంటల కొనుగోలు, ఆన్‌లైన్ బుకింగ్ మరియు తాజా కూరగాయల ఆర్డర్లు',
    icon: 'shopping_basket',
    colorClass: 'text-teal-700 bg-teal-50 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300',
    badgeBg: 'bg-teal-700 text-white',
    defaultPhoneOrId: '9848944321',
    defaultPassword: 'consumer@2026',
    defaultFullName: 'లక్ష్మి దేవి (Lakshmi Devi)',
    defaultPhone: '9848944321',
  },
  admin: {
    titleEn: 'Admin / Committee Officer (అడ్మిన్)',
    titleTe: 'అడ్మిన్ / కమిటీ (Admin)',
    descEn: 'Market governance, SLA dispute resolution, and regulatory oversight',
    descTe: 'మార్కెట్ పర్యవేక్షణ, వివాదాల పరిష్కారాలు మరియు నియంత్రణ',
    icon: 'admin_panel_settings',
    colorClass: 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
    badgeBg: 'bg-blue-700 text-white',
    defaultPhoneOrId: 'admin@cropnomics.gov',
    defaultPassword: 'pass123',
    defaultFullName: 'APAM Governance Admin Officer',
    defaultPhone: '9440188990',
  },
};

export const LoginSignUpModal: React.FC<LoginSignUpModalProps> = ({
  isOpen,
  targetRole,
  language,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const currentRole: UserRole = targetRole || 'farmer';
  const roleConfig = ROLE_CONFIGS[currentRole];

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Sign Up fields
  const [signUpFullName, setSignUpFullName] = useState<string>('');
  const [signUpPhone, setSignUpPhone] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');

  // Login fields
  const [loginPhoneOrId, setLoginPhoneOrId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Common UI state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Reset or initialize when modal opens or targetRole changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessNotice(null);
      setIsSubmitting(false);
      setShowPassword(false);

      // Pre-fill login with role demo defaults for testing convenience
      setLoginPhoneOrId(roleConfig.defaultPhoneOrId);
      setLoginPassword(roleConfig.defaultPassword);

      // Default sample sign up values
      setSignUpFullName(roleConfig.defaultFullName);
      setSignUpPhone(roleConfig.defaultPhone);
      setSignUpPassword('');
    }
  }, [isOpen, targetRole, initialMode, roleConfig]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetRole) return null;

  // Handle Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = signUpFullName.trim();
    const phone = signUpPhone.trim();
    const password = signUpPassword.trim();

    if (!name) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి (Please enter your full name)'
          : 'Please enter your full name'
      );
      return;
    }

    if (!phone || phone.length < 10) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage(
        language === 'te'
          ? 'పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి (Password must be at least 4 characters)'
          : 'Password must be at least 4 characters long'
      );
      return;
    }

    setIsSubmitting(true);

    // Save registered user account in local storage & DB
    setTimeout(() => {
      try {
        const storedAccounts: UserAccount[] = JSON.parse(
          localStorage.getItem('cropnomics_user_accounts') || '[]'
        );

        const newAccount: UserAccount = {
          id: `usr-${Date.now()}`,
          fullName: name,
          phoneNumber: phone,
          role: currentRole,
          password: password,
          createdAt: new Date().toISOString(),
        };

        storedAccounts.push(newAccount);
        localStorage.setItem('cropnomics_user_accounts', JSON.stringify(storedAccounts));

        // Register user account into Supabase & DB
        db.registerUserAccount(newAccount);

        // Sync with respective DB registry
        if (currentRole === 'farmer') {
          db.registerFarmer({
            fullName: name,
            mobile: phone.startsWith('+91') ? phone : `+91 ${phone}`,
            location: 'Andhra Pradesh',
            primaryCrop: 'paddy',
            harvestDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            sowingDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cropDurationDays: 120,
            quantity: 20,
            unit: 'Ton (Metric)',
          });
        } else if (currentRole === 'trader') {
          db.registerTrader(
            {
              name: name,
              phoneNumber: phone,
              tradingFirm: `${name} Agro Wholesale Co.`,
              district: 'Guntur',
            },
            {
              cropId: 'Paddy (వరి)',
              district: 'Guntur',
              minQuantityTons: 15,
              maxPricePerTon: 55000,
              qualityGrade: 'Grade A',
            }
          );
        } else if (currentRole === 'retailer') {
          db.registerRetailer({
            name: name,
            phoneNumber: phone,
            shopName: `${name} Fresh Mart & Kirana`,
            district: 'Vijayawada',
          });
        }

        setSuccessNotice(
          language === 'te'
            ? 'ఖాతా విజయవంతంగా సృష్టించబడింది! డాష్‌బోర్డ్‌లోకి ప్రవేశిస్తున్నారు...'
            : 'Account created successfully! Entering dashboard...'
        );

        setTimeout(() => {
          setIsSubmitting(false);
          onSuccess(currentRole, {
            name: name,
            phone: phone,
            username: phone,
            isNewAccount: true,
          });
        }, 500);
      } catch (err) {
        setIsSubmitting(false);
        setErrorMessage('Failed to create account. Please try again.');
      }
    }, 450);
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const phoneOrId = loginPhoneOrId.trim();
    const password = loginPassword.trim();

    if (!phoneOrId) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ ఫోన్ నంబర్ లేదా యూజర్ ఐడి నమోదు చేయండి'
          : 'Please enter your Phone number or User ID'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ పాస్‌వర్డ్ నమోదు చేయండి'
          : 'Please enter your password'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate strictly against live Supabase / database records
      const authResult = await db.authenticateUser(phoneOrId, password, currentRole);

      if (!authResult.success) {
        setIsSubmitting(false);
        if (authResult.isPermissionDenied || authResult.error === 'Access Denied: Insufficient Permissions') {
          setErrorMessage('Access Denied: Insufficient Permissions');
        } else {
          setErrorMessage(
            authResult.error ||
              (language === 'te'
                ? 'చెల్లని వివరాలు. దయచేసి మళ్లీ ప్రయత్నించండి.'
                : 'Invalid credentials. Please verify your details.')
          );
        }
        return;
      }

      const verifiedUser = authResult.user!;
      const resolvedName = verifiedUser.fullName || roleConfig.defaultFullName;
      const resolvedPhone = verifiedUser.phoneNumber || phoneOrId;

      setSuccessNotice(
        language === 'te'
          ? 'లాగిన్ విజయవంతమైంది! డాష్‌బోర్డ్‌లోకి ప్రవేశిస్తున్నారు...'
          : 'Login successful! Entering dashboard...'
      );

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(currentRole, {
          name: resolvedName,
          phone: resolvedPhone,
          username: verifiedUser.username || phoneOrId,
          isNewAccount: false,
        });
      }, 400);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Authentication error occurred.');
    }
  };

  // Autofill helper for demo testing
  const handleAutofillDemo = () => {
    if (mode === 'login') {
      setLoginPhoneOrId(roleConfig.defaultPhoneOrId);
      setLoginPassword(roleConfig.defaultPassword);
      setErrorMessage(null);
    } else {
      setSignUpFullName(roleConfig.defaultFullName);
      setSignUpPhone(roleConfig.defaultPhone);
      setSignUpPassword('pass@2026');
      setErrorMessage(null);
    }
  };

  return (
    <div
      id="login-signup-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-outline-variant overflow-hidden transform animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Role Overview */}
        <div className="px-6 pt-5 pb-4 border-b border-outline-variant flex items-start justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${roleConfig.badgeBg}`}
            >
              <span className="material-symbols-outlined text-[26px]">{roleConfig.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="auth-modal-title" className="text-lg sm:text-xl font-black text-on-surface">
                  {language === 'te'
                    ? mode === 'login'
                      ? 'డాష్‌బోర్డ్ లాగిన్'
                      : 'కొత్త ఖాతా సైన్ అప్'
                    : mode === 'login'
                    ? 'Dashboard Login'
                    : 'Create New Account'}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleConfig.colorClass}`}
                >
                  {currentRole}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {language === 'te' ? roleConfig.descTe : roleConfig.descEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Authentication Modal"
            title={language === 'te' ? 'మూసివేయి' : 'Close'}
            className="w-8 h-8 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Toggle Switcher Tabs: Login vs Sign Up */}
        <div className="px-6 pt-4 pb-2 bg-surface-container-low/30 border-b border-outline-variant/40">
          <div className="flex bg-surface-container p-1 rounded-2xl border border-outline-variant/50">
            <button
              id="tab-login-mode"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-black'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{language === 'te' ? 'లాగిన్ (Login)' : 'Already have an account? Login'}</span>
            </button>

            <button
              id="tab-signup-mode"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-black'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{language === 'te' ? 'సైన్ అప్ (Sign Up)' : 'New user? Sign Up'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body & Forms */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Status notices */}
          {errorMessage && (
            <div
              id="auth-error-notice"
              className={`p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in transition-all ${
                errorMessage.includes('Access Denied')
                  ? 'bg-red-50 dark:bg-red-950/80 border-2 border-red-500 text-red-700 dark:text-red-200 shadow-sm'
                  : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 shrink-0 font-bold">
                gpp_bad
              </span>
              <span className={errorMessage.includes('Access Denied') ? 'text-xs sm:text-sm font-black text-red-700 dark:text-red-300 tracking-tight' : 'text-xs'}>
                {errorMessage}
              </span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
                check_circle
              </span>
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Demo Autofill Banner */}
          <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs">
            <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary">tips_and_updates</span>
              <span>
                {mode === 'login'
                  ? language === 'te'
                    ? 'పరీక్షించడానికి డెమో వివరాలు ఉపయోగించండి:'
                    : 'Use demo test credentials:'
                  : language === 'te'
                  ? 'త్వరిత నమోదుకు నమూనా వివరాలు నింపండి:'
                  : 'Fill sample registration details:'}
              </span>
            </span>
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-[11px] transition-colors cursor-pointer"
            >
              {language === 'te' ? 'ఆటోఫిల్ డెమో' : 'Autofill Demo'}
            </button>
          </div>

          {/* ======================================================== */}
          {/* MODE 1: SIGN UP FORM                                     */}
          {/* ======================================================== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                  <span>{language === 'te' ? 'పూర్తి పేరు (Full Name)' : 'Full Name'}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-fullname-input"
                    type="text"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder={language === 'te' ? 'రామేష్ వర్మ (Ramesh Varma)' : 'e.g. Ramesh Varma'}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* 2. Phone Number */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">phone_android</span>
                  <span>{language === 'te' ? 'మొబైల్ ఫోన్ నంబర్ (Phone Number)' : 'Phone Number (+91)'}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-phone-input"
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="9848012345"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* 3. Role (Auto-filled based on selection) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                    <span>{language === 'te' ? 'పాత్ర (Role)' : 'Role'}</span>
                  </label>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ {language === 'te' ? 'ఎంపిక ప్రకారం స్వయంచాలకంగా పూరించబడింది' : 'Auto-filled based on selection'}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border-2 border-primary/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleConfig.badgeBg}`}>
                      <span className="material-symbols-outlined text-[18px]">{roleConfig.icon}</span>
                    </div>
                    <div>
                      <div className="font-black text-sm text-on-surface capitalize">
                        {language === 'te' ? roleConfig.titleTe : roleConfig.titleEn}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        AP Agriculture Portal • Role: <span className="font-mono font-bold uppercase">{currentRole}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* 4. Create Password */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                  <span>{language === 'te' ? 'పాస్‌వర్డ్ సృష్టించండి (Create Password)' : 'Create Password'}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface rounded-md cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {language === 'te'
                    ? 'కనీసం 4 అక్షరాలు లేదా సంఖ్యలను ఉపయోగించండి'
                    : 'Use at least 4 characters or digits for security'}
                </p>
              </div>

              {/* Sign Up Action Button */}
              <div className="pt-2">
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-sm font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    roleConfig.badgeBg
                  } ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {language === 'te'
                          ? 'ఖాతా సృష్టిస్తోంది...'
                          : 'Creating Account & Accessing Dashboard...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      <span>
                        {language === 'te'
                          ? 'ఖాతా సృష్టించండి & డాష్‌బోర్డ్‌లోకి ప్రవేశించండి →'
                          : 'Create Account & Enter Dashboard →'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle to Login */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  {language === 'te' ? (
                    <>
                      ఇప్పటికే ఖాతా ఉందా? <span className="font-bold text-primary underline">లాగిన్ అవ్వండి</span>
                    </>
                  ) : (
                    <>
                      Already have an account? <span className="font-bold text-primary underline">Login</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODE 2: LOGIN FORM                                       */}
          {/* ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* 1. Phone or ID */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">account_circle</span>
                    <span>{language === 'te' ? 'ఫోన్ నంబర్ / యూజర్ ఐడి (Phone/ID)' : 'Phone Number or User ID'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    ID / Mobile
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    phone_android
                  </span>
                  <input
                    id="login-phone-id-input"
                    type="text"
                    value={loginPhoneOrId}
                    onChange={(e) => setLoginPhoneOrId(e.target.value)}
                    placeholder={roleConfig.defaultPhoneOrId}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* 2. Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                    <span>{language === 'te' ? 'పాస్‌వర్డ్ (Password)' : 'Password'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    lock
                  </span>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface rounded-md cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Role Summary Confirmation */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-on-surface-variant font-medium">
                    {language === 'te' ? 'లాగిన్ అవుతున్న పోర్టల్:' : 'Target Portal:'}
                  </span>
                  <div className="font-bold text-on-surface mt-0.5">
                    {language === 'te' ? roleConfig.titleTe : roleConfig.titleEn}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border ${roleConfig.colorClass}`}>
                  {currentRole}
                </span>
              </div>

              {/* Login Action Button */}
              <div className="pt-2">
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-sm font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    roleConfig.badgeBg
                  } ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {language === 'te'
                          ? 'ధృవీకరిస్తోంది...'
                          : 'Authenticating & Accessing Dashboard...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      <span>
                        {language === 'te'
                          ? 'లాగిన్ & ప్రవేశించండి →'
                          : 'Log In & Enter Dashboard →'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle to Sign Up */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  {language === 'te' ? (
                    <>
                      ఖాతా లేదా? <span className="font-bold text-primary underline">కొత్త ఖాతా సైన్ అప్ చేయండి</span>
                    </>
                  ) : (
                    <>
                      New user? <span className="font-bold text-primary underline">Sign Up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
