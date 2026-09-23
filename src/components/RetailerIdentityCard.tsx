import React, { useState, useEffect } from 'react';
import { LanguageCode, RetailerIdentity } from '../types';

interface RetailerIdentityCardProps {
  language: LanguageCode;
  retailerIdentity: RetailerIdentity | null;
  onSaveRetailerIdentity: (identity: RetailerIdentity) => void;
}

export const RetailerIdentityCard: React.FC<RetailerIdentityCardProps> = ({
  language,
  retailerIdentity,
  onSaveRetailerIdentity,
}) => {
  const [name, setName] = useState<string>(retailerIdentity?.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(retailerIdentity?.phoneNumber || '');
  const [shopName, setShopName] = useState<string>(retailerIdentity?.shopName || 'Sri Lakshmi Super Vegetables & Fruits');
  const [district, setDistrict] = useState<string>(retailerIdentity?.district || 'Krishna');
  const [manualAddress, setManualAddress] = useState<string>(retailerIdentity?.manualAddress || 'Shop 14, Main Road, Arundelpet');
  const [landmark, setLandmark] = useState<string>(retailerIdentity?.landmark || 'Near Rythu Bazaar Gate 2');
  const [pincode, setPincode] = useState<string>(retailerIdentity?.pincode || '522002');
  const [isEditing, setIsEditing] = useState<boolean>(!retailerIdentity || !retailerIdentity.name);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (retailerIdentity) {
      setName(retailerIdentity.name || '');
      setPhoneNumber(retailerIdentity.phoneNumber || '');
      if (retailerIdentity.shopName) setShopName(retailerIdentity.shopName);
      if (retailerIdentity.district) setDistrict(retailerIdentity.district);
      if (retailerIdentity.manualAddress) setManualAddress(retailerIdentity.manualAddress);
      if (retailerIdentity.landmark) setLandmark(retailerIdentity.landmark);
      if (retailerIdentity.pincode) setPincode(retailerIdentity.pincode);
      if (retailerIdentity.name && retailerIdentity.phoneNumber) {
        setIsEditing(false);
      }
    }
  }, [retailerIdentity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;

    const cleanedPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const fullAddress = `${manualAddress.trim()}, ${landmark.trim() ? 'Near ' + landmark.trim() + ', ' : ''}${district}, AP - ${pincode.trim()}`;
    const identity: RetailerIdentity = {
      name: name.trim(),
      phoneNumber: cleanedPhone,
      shopName: shopName.trim() || 'AP Verified Retail Store',
      district,
      manualAddress: manualAddress.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      address: fullAddress,
      savedAt: new Date().toISOString(),
    };

    onSaveRetailerIdentity(identity);
    setIsEditing(false);
    setSaveSuccessMsg(
      language === 'te'
        ? 'రిటైలర్ చిరునామా & వివరాలు విజయవంతంగా సేవ్ అయ్యాయి! హోల్‌సేల్ కొనుగోలు మరియు ఇన్వాయిస్‌లకు వర్తిస్తుంది.'
        : 'Retailer manual address & profile saved! Ready for wholesale batch reservations & retail bills.'
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div
      id="retailer-identity-registration-card"
      className="mb-6 rounded-2xl border-2 border-[#0d5c2e]/30 bg-gradient-to-br from-[#f0fdf4] via-white to-[#fffbeb] shadow-lg overflow-hidden transition-all"
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#0d5c2e] via-[#14532d] to-[#0f766e] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c06a1c] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[20px]">store</span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>{language === 'te' ? 'రిటైలర్ దుకాణ నమోదు వివరాలు' : 'Retailer Wholesale Profile & Shop Identity'}</span>
              <span className="text-[10px] font-mono font-bold bg-[#c06a1c] text-white px-2 py-0.5 rounded-full uppercase">
                {retailerIdentity?.name ? 'Active Profile' : 'Required'}
              </span>
            </h3>
            <p className="text-[11px] text-[#bcf0ae]">
              {language === 'te'
                ? 'హోల్‌సేల్ బ్యాచ్ రిజర్వేషన్, రిటైల్ రసీదులు & డెలివరీ టోకెన్ల కోసం ఈ వివరాలు ఉపయోగించబడతాయి'
                : 'Used to stamp wholesale batch orders, dispatch tokens & retail customer price tags'}
            </p>
          </div>
        </div>

        {retailerIdentity?.name && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span>{language === 'te' ? 'సవరించండి' : 'Edit Profile'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('');
                setPhoneNumber('');
                setIsEditing(true);
              }}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-[#c06a1c] hover:bg-[#b45309] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">person_add</span>
              <span>{language === 'te' ? 'కొత్త నమోదు' : 'New Sign-up'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="bg-[#0d5c2e]/10 border-b border-[#0d5c2e]/30 px-5 py-2.5 flex items-center gap-2 text-xs font-bold text-[#0d5c2e] animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Body: Form or Verified Card */}
      <div className="p-5 sm:p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question 1: Name */}
              <div>
                <label className="block text-xs font-bold text-[#0d5c2e] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>{language === 'te' ? 'మీ పేరు (Retailer Name) *' : 'Retailer / Store Owner Full Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'te' ? 'ఉదా: కె. సురేష్ కుమార్' : 'e.g. K. Suresh Kumar'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-white border-2 border-[#0d5c2e]/40 focus:border-[#0d5c2e] rounded-xl px-3.5 text-sm font-semibold text-slate-800 outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#0d5c2e]/20"
                />
              </div>

              {/* Question 2: Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#c06a1c] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>{language === 'te' ? 'ఫోన్ నంబర్ (Phone Number) *' : 'Mobile / WhatsApp Number *'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-mono font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="94401 23456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full h-11 bg-white border-2 border-[#c06a1c]/40 focus:border-[#c06a1c] rounded-xl pl-12 pr-3.5 text-sm font-mono font-bold text-slate-800 outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#c06a1c]/20"
                  />
                </div>
              </div>

              {/* Shop / Store Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>{language === 'te' ? 'దుకాణం / స్టోర్ పేరు (Shop Name)' : 'Shop / Supermarket / Stall Name'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sri Venkateswara Daily Fresh"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-300 focus:border-[#0d5c2e] rounded-xl px-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Operating District / City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>{language === 'te' ? 'జిల్లా / నగరం (Market Location)' : 'Retail Market Location (AP District)'}</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-300 focus:border-[#0d5c2e] rounded-xl px-3.5 text-sm font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                >
                  <option value="Krishna">Krishna (విజయవాడ Rythu Bazaar)</option>
                  <option value="Guntur">Guntur (గుంటూరు టౌన్)</option>
                  <option value="Visakhapatnam">Visakhapatnam (వైజాగ్)</option>
                  <option value="Tirupati">Tirupati (తిరుపతి)</option>
                  <option value="Kurnool">Kurnool (కర్నూలు)</option>
                  <option value="East Godavari">East Godavari (రాజమండ్రి)</option>
                </select>
              </div>

              {/* Manual Shop Address (Requirement 17) */}
              <div className="sm:col-span-2 space-y-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0d5c2e] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                    <span>{language === 'te' ? 'ఖచ్చితమైన దుకాణం చిరునామా (Manual Shop Address) *' : 'Shop / Storefront Address (Manual Entry) *'}</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Mandatory for Dispatch
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Door No, Shop No, Street / Main Road, Market Area"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="w-full h-10 bg-white border border-emerald-300 focus:border-[#0d5c2e] rounded-xl px-3 text-xs font-medium text-slate-800 outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Landmark (e.g. Near Gate 2)"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full h-10 bg-white border border-emerald-300 focus:border-[#0d5c2e] rounded-xl px-3 text-xs font-medium text-slate-800 outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="PIN Code (e.g. 522002)"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full h-10 bg-white border border-emerald-300 focus:border-[#0d5c2e] rounded-xl px-3 text-xs font-mono font-bold text-slate-800 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#0d5c2e]/20">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0d5c2e] text-[16px]">lock</span>
                <span>{language === 'te' ? 'ఈ వివరాలు భద్రపరచబడి మీ హోల్‌సేల్ ఆర్డర్లకు ఆటో-స్టాంప్ చేయబడతాయి' : 'Information saved locally to auto-generate wholesale procurement tokens & bills'}</span>
              </span>

              <button
                id="btn-save-retailer-identity"
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-[#0d5c2e] to-[#c06a1c] hover:opacity-95 text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{language === 'te' ? 'వివరాలను సేవ్ చేయండి & ఆర్డర్ ప్రారంభించండి' : 'Save Details & Use for Next Processes'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Verified Identity Display Badge */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0d5c2e] text-white flex items-center justify-center text-xl font-bold font-mono shadow-md border-2 border-white">
                {(retailerIdentity?.name || 'R').charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-base sm:text-lg text-[#0d5c2e]">
                    {retailerIdentity.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 bg-[#0d5c2e]/10 text-[#0d5c2e] font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-[#0d5c2e]/30">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>AP Rythu Retail Merchant</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-mono mt-1">
                  <span className="flex items-center gap-1 font-bold text-[#c06a1c]">
                    <span className="material-symbols-outlined text-[15px]">call</span>
                    <span>{retailerIdentity.phoneNumber}</span>
                  </span>
                  <span>•</span>
                  <span>{retailerIdentity.shopName || 'Retail Store'}</span>
                  <span>•</span>
                  <span>{retailerIdentity.district} Market Hub</span>
                </div>

                {/* Display Address */}
                {(retailerIdentity.manualAddress || retailerIdentity.address) && (
                  <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-700">place</span>
                    <span>{retailerIdentity.address || `${retailerIdentity.manualAddress}, ${retailerIdentity.landmark ? retailerIdentity.landmark + ', ' : ''}${retailerIdentity.district}`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Process Utilization Badges */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="bg-white/80 border border-[#0d5c2e]/30 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-[#0d5c2e] flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[16px] text-[#0d5c2e]">receipt_long</span>
                <span>Auto-stamping Wholesale Orders</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
