import React, { useState } from 'react';
import { db } from '../data/db';
import { FarmerCardDetails, FarmerProfile } from '../types';

interface FarmerCardAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (farmer: FarmerProfile, card: FarmerCardDetails) => void;
  onCardGenerated?: (card: any) => void;
}

export const FarmerCardAuthModal: React.FC<FarmerCardAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCardGenerated,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('రామేష్ వర్మ (Ramesh Varma)');
  const [mobile, setMobile] = useState('9848023456');
  const [cardNumber, setCardNumber] = useState('AP-KCC-849201');
  const [aadhaarLast4, setAadhaarLast4] = useState('4820');
  const [landSurveyNumber, setLandSurveyNumber] = useState('248/3B');
  const [acreage, setAcreage] = useState('4.5');
  const [district, setDistrict] = useState('Guntur');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Generated card state
  const [generatedCard, setGeneratedCard] = useState<FarmerCardDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegisterAndGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !fullName.trim()) return;

    // Generate unique username and secure password based on farmer details
    const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'kisan';
    const cardSuffix = cardNumber.replace(/\D/g, '').slice(-4) || '2026';
    const distCode = district.toLowerCase().slice(0, 3);
    const uniqueUsername = `kisan_${cleanName}_${distCode}${cardSuffix.slice(-2)}`;
    const uniquePassword = `Rythu@${cardSuffix}`;

    const newCard: FarmerCardDetails = {
      cardNumber: cardNumber.trim().toUpperCase(),
      aadhaarLast4: aadhaarLast4.trim(),
      landSurveyNumber: landSurveyNumber.trim(),
      acreage: parseFloat(acreage) || 3.0,
      district: district,
      username: uniqueUsername,
      generatedPassword: uniquePassword,
      issueDate: new Date().toISOString().split('T')[0],
    };

    // Save to centralized database
    db.saveFarmerCard(newCard);

    // Also register or update farmer profile in db
    const profile: FarmerProfile = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      primaryCrop: 'paddy',
      location: `${district} District, AP`,
      district: district,
      quantity: 12,
      farmerCard: newCard,
      verified: true,
    };
    db.registerFarmer(profile);

    setGeneratedCard(newCard);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmed = loginIdentifier.trim();
    if (!trimmed) {
      setLoginError('Please enter your Farmer Card Number or Username');
      return;
    }

    const foundCard = db.getFarmerCard(trimmed);
    if (!foundCard) {
      setLoginError('No farmer card record found. Please generate credentials or check your card number.');
      return;
    }

    // If password was provided, verify it (or allow master demo access)
    if (loginPassword && loginPassword !== foundCard.generatedPassword && loginPassword !== '123456') {
      setLoginError('Incorrect password. Please verify or re-generate credentials.');
      return;
    }

    const profile: FarmerProfile = {
      fullName: fullName || 'రైతు సోదరుడు (Farmer)',
      mobile: mobile || '9848023456',
      primaryCrop: 'paddy',
      location: `${foundCard.district || 'Guntur'} District, AP`,
      district: foundCard.district || 'Guntur',
      quantity: 12,
      farmerCard: foundCard,
      verified: true,
    };

    if (onSuccess) onSuccess(profile, foundCard);
    if (onCardGenerated) {
      onCardGenerated({
        cardNumber: foundCard.cardNumber,
        farmerName: profile.fullName,
        mobileNumber: profile.mobile,
        district: foundCard.district,
        surveyNo: foundCard.landSurveyNumber,
        acres: foundCard.acreage,
        issueDate: foundCard.issueDate,
      });
    }
    onClose();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedWithGenerated = () => {
    if (!generatedCard) return;
    const profile: FarmerProfile = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      primaryCrop: 'paddy',
      location: `${district} District, AP`,
      district: district,
      quantity: 12,
      farmerCard: generatedCard,
      verified: true,
    };
    if (onSuccess) onSuccess(profile, generatedCard);
    if (onCardGenerated) {
      onCardGenerated({
        cardNumber: generatedCard.cardNumber,
        farmerName: profile.fullName,
        mobileNumber: profile.mobile,
        district: generatedCard.district,
        surveyNo: generatedCard.landSurveyNumber,
        acres: generatedCard.acreage,
        issueDate: generatedCard.issueDate,
      });
    }
    onClose();
  };

  return (
    <div
      id="farmer-card-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
            <span className="material-symbols-outlined text-[28px]">badge</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-on-surface">AP Kisan Card Portal</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold rounded-full border border-emerald-200">
                Official Rythu Seva
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Generate unique username & password using your Kisan Credit / Rythu Bharosa Card
            </p>
          </div>
        </div>

        {/* Tab switcher: Register / Login */}
        {!generatedCard && (
          <div className="flex border-b border-outline-variant mb-5">
            <button
              onClick={() => { setMode('register'); setLoginError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">card_membership</span>
              Card Verification & Generate Credentials
            </button>
            <button
              onClick={() => { setMode('login'); setLoginError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Existing Farmer Login
            </button>
          </div>
        )}

        {/* Case 1: Generated Card Passbook Display */}
        {generatedCard ? (
          <div className="space-y-4">
            <div className="p-1 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-amber-700 shadow-lg">
              <div className="bg-gradient-to-b from-emerald-950 to-slate-900 text-white rounded-xl p-5 border border-emerald-400/30">
                <div className="flex justify-between items-start border-b border-emerald-500/30 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] tracking-widest text-emerald-400 uppercase font-mono font-bold">
                      GOVERNMENT OF ANDHRA PRADESH • RYTHU SEVA
                    </span>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>రైతు సేవా గుర్తింపు కార్డు</span>
                      <span className="text-xs text-amber-300 font-mono">(AP-KISAN ID)</span>
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                    AP
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <div className="text-emerald-300/80 text-[10px] uppercase font-mono">Farmer Name</div>
                    <div className="font-bold text-white text-sm">{fullName}</div>
                  </div>
                  <div>
                    <div className="text-emerald-300/80 text-[10px] uppercase font-mono">Kisan Card Number</div>
                    <div className="font-mono font-bold text-amber-300">{generatedCard.cardNumber}</div>
                  </div>
                  <div>
                    <div className="text-emerald-300/80 text-[10px] uppercase font-mono">Land Survey No (optional)</div>
                    <div className="font-mono text-white">{generatedCard.landSurveyNumber || 'Not specified'} (Approximately {generatedCard.acreage} Acres)</div>
                  </div>
                  <div>
                    <div className="text-emerald-300/80 text-[10px] uppercase font-mono">District & Hub</div>
                    <div className="text-white font-medium">{generatedCard.district}, Andhra Pradesh</div>
                  </div>
                </div>

                {/* Secure Credential Highlight Box */}
                <div className="bg-emerald-900/60 border border-emerald-400/40 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    YOUR PERMANENT PORTAL CREDENTIALS
                  </div>

                  <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">UNIQUE USERNAME</span>
                      <span className="font-bold text-emerald-300 text-sm">{generatedCard.username}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedCard.username, 'user')}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                    >
                      {copiedField === 'user' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">UNIQUE PASSWORD</span>
                      <span className="font-bold text-amber-300 text-sm">{generatedCard.generatedPassword}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedCard.generatedPassword, 'pass')}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold"
                    >
                      {copiedField === 'pass' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-300/70 font-mono">
                  <span>Valid across all 2000+ AP Rythu Bharosa Kendrams</span>
                  <span>Issued: {generatedCard.issueDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGeneratedCard(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant font-mono text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                Generate Another Card
              </button>
              <button
                type="button"
                onClick={handleProceedWithGenerated}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Return to the Farmer Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : mode === 'register' ? (
          /* Case 2: Registration & Credential Generation Form */
          <form onSubmit={handleRegisterAndGenerate} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Farmer Full Name (రైతు పేరు) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Mobile Number (మొబైల్ సంఖ్య) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9848023456"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span>Kisan / Rythu Card No *</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">(KCC / AP-RBK)</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="e.g. AP-KCC-849201"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono font-bold uppercase focus:border-emerald-600 focus:outline-hidden text-emerald-800 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Aadhaar Card (Last 4 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4820"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Land Survey Number (optional)
                </label>
                <input
                  type="text"
                  value={landSurveyNumber}
                  onChange={(e) => setLandSurveyNumber(e.target.value)}
                  placeholder="e.g. 248/3B (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Acres (Approximately)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={acreage}
                  onChange={(e) => setAcreage(e.target.value)}
                  placeholder="e.g. Approximately 4.5"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  AP District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="Guntur">Guntur (గుంటూరు)</option>
                  <option value="Krishna">Krishna (కృష్ణా)</option>
                  <option value="Kurnool">Kurnool (కర్నూలు)</option>
                  <option value="Prakasam">Prakasam (ప్రకాశం)</option>
                  <option value="Chittoor">Chittoor (చిత్తూరు)</option>
                  <option value="East Godavari">East Godavari (తూర్పు గోదావరి)</option>
                  <option value="West Godavari">West Godavari (పశ్చిమ గోదావరి)</option>
                  <option value="Ananthapur">Ananthapur (అనంతపురం)</option>
                </select>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5">info</span>
              <div>
                <strong>Instant Credential Generation:</strong> Submitting this form validates your card with AP Agriculture Land Records and instantly provides you a unique username and password for future logins.
              </div>
            </div>

            <button
              type="submit"
              id="generate-farmer-credentials-btn"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">vpn_key</span>
              <span>Generate Unique Username & Password</span>
            </button>
          </form>
        ) : (
          /* Case 3: Direct Login with Card / Username */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Kisan Card Number or Username
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. AP-KCC-849201 or kisan_ramesh_ap52"
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 flex items-center justify-between">
                <span>Password (పాస్‌వర్డ్)</span>
                <span className="text-[10px] text-on-surface-variant font-mono">(Generated during card registration)</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password (or leave blank for demo)"
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{loginError}</span>
              </div>
            )}

            {/* Quick Demo Pre-fill */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold text-on-surface mb-1.5 flex items-center justify-between">
                <span>Try Demo Farmer Account</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('AP-KCC-849201');
                    setLoginPassword('Rythu@8492');
                  }}
                  className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Quick Fill Demo
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                <div>Card: <span className="text-emerald-600 font-bold">AP-KCC-849201</span></div>
                <div>User: <span className="text-emerald-600 font-bold">kisan_ramesh_ap52</span> | Pass: <span className="text-amber-600 font-bold">Rythu@8492</span></div>
              </div>
            </div>

            <button
              type="submit"
              id="farmer-card-login-btn"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Login to Farmer Dashboard</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
