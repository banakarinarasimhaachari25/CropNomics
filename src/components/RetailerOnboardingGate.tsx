import React, { useState } from 'react';
import { ANDHRA_PRADESH_DISTRICTS } from '../data/mockData';
import { LanguageCode, RetailerIdentity } from '../types';

interface RetailerOnboardingGateProps {
  language: LanguageCode;
  initialData?: RetailerIdentity | null;
  onSaveAndContinue: (identity: RetailerIdentity) => void;
}

export const RetailerOnboardingGate: React.FC<RetailerOnboardingGateProps> = ({
  language,
  initialData,
  onSaveAndContinue,
}) => {
  const [name, setName] = useState<string>(initialData?.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(initialData?.phoneNumber || '');
  const [shopName, setShopName] = useState<string>(initialData?.shopName || 'Sri Lakshmi Fresh Mart & Vegetables');
  const [district, setDistrict] = useState<string>(initialData?.district || 'Krishna');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(language === 'te' ? 'దయచేసి మీ పూర్తి పేరును నమోదు చేయండి' : 'Please enter your full name');
      return;
    }
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(
        language === 'te'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    const identity: RetailerIdentity = {
      name: name.trim(),
      phoneNumber: cleanPhone,
      shopName: shopName.trim() || 'AP Fresh Mart',
      district: district || 'Krishna',
      savedAt: new Date().toISOString(),
    };

    onSaveAndContinue(identity);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl border-2 border-[#0d5c2e]/20 shadow-2xl overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-[#0d5c2e] via-[#14532d] to-[#0f766e] text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c06a1c]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#34d399] mb-3 shadow-inner">
            <span className="material-symbols-outlined text-[36px]">storefront</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {language === 'te' ? 'రిటైలర్ సైన్ అప్ / నమోదు' : 'Retailer Registration & Sign Up'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto mt-1.5 leading-relaxed">
            {language === 'te'
              ? 'రిటైలర్ డాష్‌బోర్డ్‌లోకి ప్రవేశించడానికి దయచేసి మీ పేరు మరియు ఫోన్ నంబర్‌ను నమోదు చేసి సైన్ అప్ చేయండి.'
              : 'Please enter your details to register and browse wholesale lots with verified margins.'}
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Question 1: Name */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-[#0d5c2e] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>{language === 'te' ? '1. రిటైలర్ / దుకాణదారుడి పేరు (Full Name) *' : '1. Enter Retailer / Owner Full Name *'}</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={language === 'te' ? 'ఉదా: కె. సురేష్ కుమార్' : 'e.g. K. Suresh Kumar'}
              className="w-full h-12 bg-slate-50 border-2 border-slate-200 focus:border-[#0d5c2e] rounded-2xl px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#0d5c2e]/10 shadow-inner"
            />
          </div>

          {/* Question 2: Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-[#c06a1c] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>{language === 'te' ? '2. మీ మొబైల్ నంబర్ (Phone Number) *' : '2. Enter Your Mobile Phone Number *'}</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-mono font-bold text-slate-500 select-none">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="94401 23456"
                className="w-full h-12 bg-slate-50 border-2 border-slate-200 focus:border-[#c06a1c] rounded-2xl pl-14 pr-4 text-sm font-mono font-bold text-slate-800 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#c06a1c]/10 shadow-inner"
              />
            </div>
          </div>

          {/* Shop Name & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                {language === 'te' ? 'దుకాణం పేరు (Shop / Mart Name)' : 'Shop / Supermarket Name'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sri Lakshmi Fresh Mart"
                className="w-full h-11 bg-slate-50 border border-slate-300 focus:border-[#0d5c2e] rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                {language === 'te' ? 'ప్రధాన జిల్లా (AP District)' : 'Primary AP District'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-300 focus:border-[#0d5c2e] rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {ANDHRA_PRADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d} District</option>
                ))}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-13 bg-gradient-to-r from-[#0d5c2e] to-[#0f766e] hover:from-[#14532d] hover:to-[#042f2e] text-white rounded-2xl text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              <span>{language === 'te' ? 'నమోదు చేసి డాష్‌బోర్డ్‌కి వెళ్లండి' : 'Register & Open Retailer Dashboard'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
