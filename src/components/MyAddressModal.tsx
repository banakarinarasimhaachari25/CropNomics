import React, { useState, useEffect } from 'react';
import { ANDHRA_PRADESH_DISTRICTS } from '../data/mockData';
import { LanguageCode } from '../types';

export interface UserAddressData {
  name: string;
  phone: string;
  doorNo: string;
  street: string;
  landmark: string;
  city: string;
  district: string;
  pincode: string;
}

interface MyAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'consumer' | 'farmer' | 'trader' | 'retailer' | 'admin';
  language?: LanguageCode;
  initialData?: Partial<UserAddressData>;
  onSave: (savedAddress: UserAddressData) => void;
}

export const MyAddressModal: React.FC<MyAddressModalProps> = ({
  isOpen,
  onClose,
  role,
  language = 'en',
  initialData,
  onSave,
}) => {
  const storageKey = `cropnomics_${role}_address`;

  const getRoleDefaults = (): UserAddressData => {
    switch (role) {
      case 'farmer':
        return {
          name: 'రామేష్ వర్మ (Ramesh Varma)',
          phone: '+91 98480 23456',
          doorNo: 'Farm Survey No. 42/B',
          street: 'Krishna Canal Bund Road, Kollipara',
          landmark: 'Near Rythu Bharosa Kendram (RBK Gate 1)',
          city: 'Tenali Mandalam',
          district: 'Guntur',
          pincode: '522201',
        };
      case 'trader':
        return {
          name: 'ఎం. శ్రీకాంత్ రెడ్డి (M. Srikanth Reddy)',
          phone: '+91 98480 12345',
          doorNo: 'Shop No. 18, Commercial Yard Gate 2',
          street: 'GT Road, Lalapet Commercial Corridor',
          landmark: 'Near APMC Wholesale Mirchi Yard',
          city: 'Guntur',
          district: 'Guntur',
          pincode: '522004',
        };
      case 'retailer':
        return {
          name: 'కె. సీతారామయ్య (K. Sitaramayya)',
          phone: '+91 98481 99887',
          doorNo: 'Shop 14, Fresh Veg & Fruit Counter',
          street: 'Main Commercial Street, 4th Line',
          landmark: 'Near Rythu Bazar Circle, Arundelpet',
          city: 'Guntur',
          district: 'Guntur',
          pincode: '522002',
        };
      case 'admin':
        return {
          name: 'డాక్టర్ సురేష్ కుమార్ IAS (Dr. Suresh Kumar IAS)',
          phone: '+91 86323 45678',
          doorNo: 'APMC Bhavan, 4th Floor',
          street: 'Agri-Secretariat Expressway',
          landmark: 'Near Nelapadu Junction',
          city: 'Amaravati',
          district: 'Guntur',
          pincode: '522237',
        };
      case 'consumer':
      default:
        return {
          name: 'అనిత రెడ్డి (Anitha Reddy)',
          phone: '+91 98489 55667',
          doorNo: 'Flat 302, Sri Sai Nilayam',
          street: 'MG Road, Arundelpet',
          landmark: 'Near Rythu Bazar Circle',
          city: 'Vijayawada',
          district: 'Krishna',
          pincode: '520010',
        };
    }
  };

  const [address, setAddress] = useState<UserAddressData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...getRoleDefaults(), ...JSON.parse(saved), ...initialData };
      }
    } catch (e) {
      console.error(e);
    }
    return { ...getRoleDefaults(), ...initialData };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if initialData changes
  useEffect(() => {
    if (initialData) {
      setAddress((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const getRoleHeader = () => {
    switch (role) {
      case 'farmer':
        return {
          icon: 'agriculture',
          title: language === 'te' ? 'రైతు కమతం & పంట గోదాము చిరునామా' : 'Farmgate & Storage Address',
          subtitle:
            language === 'te'
              ? 'కోత నాణ్యత తనిఖీ, శీతల రవాణా వాహనాల పికప్ & AP రైతు సేవా కేంద్రం అధికారిక చిరునామా'
              : 'Official farmgate pickup address for harvest lots, cold-chain trucks & AP Rythu Seva dispatch',
          doorLabel: language === 'te' ? 'సర్వే నం. / కమతం నం. / ఇల్లు' : 'Survey No. / Farmgate / Door No. *',
          doorPlaceholder: 'e.g. Survey No. 42/B, Farm Shed 3',
          streetLabel: language === 'te' ? 'గ్రామం / కాలువ గట్టు రోడ్డు' : 'Village / Canal Road / Area *',
          streetPlaceholder: 'e.g. Krishna Canal Bund Road, Kollipara',
          btnText: language === 'te' ? 'రైతు చిరునామాను భద్రపరచండి' : 'Save Farmgate Address',
        };
      case 'trader':
        return {
          icon: 'local_shipping',
          title: language === 'te' ? 'ట్రేడర్ డిపో & డెలివరీ చిరునామా' : 'Mandi Depot & Delivery Hub Address',
          subtitle:
            language === 'te'
              ? 'రైతుల నుండి సరుకు సేకరణ, వే బ్రిడ్జి తనిఖీ & రిటైలర్ రవాణా కోసం డిపో చిరునామా'
              : 'Logistics depot address for farm gate pickups, AMC market yard transit & retailer dispatch',
          doorLabel: language === 'te' ? 'డిపో నం. / షాప్ నం. / గోదాము' : 'Depot / Shop / Warehouse No. *',
          doorPlaceholder: 'e.g. Shop No. 18, Commercial Yard Gate 2',
          streetLabel: language === 'te' ? 'మార్కెట్ యార్డ్ / ప్రధాన రహదారి' : 'Market Yard / Commercial Road *',
          streetPlaceholder: 'e.g. GT Road, Lalapet Commercial Corridor',
          btnText: language === 'te' ? 'డిపో చిరునామాను భద్రపరచండి' : 'Save Depot Address',
        };
      case 'retailer':
        return {
          icon: 'storefront',
          title: language === 'te' ? 'రిటైలర్ దుకాణం & హోల్‌సేల్ డెలివరీ చిరునామా' : 'Retail Outlet & Store Address',
          subtitle:
            language === 'te'
              ? 'హోల్‌సేల్ సరుకు రవాణా మరియు వినియోగదారుల దుకాణ పికప్ కోసం రిటైల్ చిరునామా'
              : 'Official store counter & stock delivery destination for wholesale procurement and consumer pickups',
          doorLabel: language === 'te' ? 'దుకాణం నం. / అవుట్‌లెట్ నం.' : 'Shop / Counter / Stall No. *',
          doorPlaceholder: 'e.g. Shop 14, Ground Floor',
          streetLabel: language === 'te' ? 'వాణిజ్య వీధి / మార్కెట్ ప్రాంతం' : 'Commercial Street / Market Area *',
          streetPlaceholder: 'e.g. Main Commercial Street, 4th Line',
          btnText: language === 'te' ? 'దుకాణం చిరునామాను భద్రపరచండి' : 'Save Store Address',
        };
      case 'admin':
        return {
          icon: 'account_balance',
          title: language === 'te' ? 'వ్యవసాయ మార్కెటింగ్ శాఖ కార్యాలయ చిరునామా' : 'AP Marketing Board & Secretariat Address',
          subtitle:
            language === 'te'
              ? 'ఆంధ్రప్రదేశ్ వ్యవసాయ ఉత్పత్తుల మార్కెట్ కమిటీ కేంద్ర పరిపాలన కార్యాలయ చిరునామా'
              : 'Central Administrative Headquarters, AP Agricultural Produce Market Committee Directorate',
          doorLabel: language === 'te' ? 'భవనం / ఛాంబర్ / అంతస్తు' : 'Bhavan / Chamber / Floor No. *',
          doorPlaceholder: 'e.g. APMC Bhavan, 4th Floor',
          streetLabel: language === 'te' ? 'సచివాలయ రహదారి / మార్గ్' : 'Secretariat Road / Avenue *',
          streetPlaceholder: 'e.g. Agri-Secretariat Expressway',
          btnText: language === 'te' ? 'కార్యాలయ చిరునామాను భద్రపరచండి' : 'Save Directorate Address',
        };
      case 'consumer':
      default:
        return {
          icon: 'home_pin',
          title: language === 'te' ? 'డెలివరీ & పికప్ చిరునామా' : 'Delivery & Pickup Address',
          subtitle:
            language === 'te'
              ? 'మీ ఆంధ్రప్రదేశ్ వ్యవసాయ ఉత్పత్తుల ఆర్డర్లు మరియు దుకాణ పికప్ కోసం భద్రపరచిన చిరునామా'
              : 'Saved address for your Andhra Pradesh farm-direct orders & store pickups',
          doorLabel: language === 'te' ? 'ఫ్లాట్ / ఇల్లు / డోర్ నంబర్' : 'Flat / House / Door No. *',
          doorPlaceholder: 'e.g. Flat 302, Sri Sai Nilayam',
          streetLabel: language === 'te' ? 'వీధి / కాలనీ / ఏరియా' : 'Street / Colony / Area *',
          streetPlaceholder: 'e.g. MG Road, Arundelpet',
          btnText: language === 'te' ? 'డెలివరీ చిరునామాను భద్రపరచండి' : 'Save Delivery Address',
        };
    }
  };

  const headerInfo = getRoleHeader();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(address));
      // Also update role-specific profiles for backward compatibility
      if (role === 'consumer') {
        localStorage.setItem('cropnomics_consumer_profile', JSON.stringify(address));
      }
    } catch (err) {
      console.error(err);
    }
    onSave(address);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id={`my-address-modal-${role}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">{headerInfo.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {headerInfo.title}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  {role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
            <span>{language === 'te' ? 'చిరునామా విజయవంతంగా భద్రపరచబడింది!' : 'Address saved successfully!'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'సంప్రదింపు పేరు' : 'Contact Name'} *
              </label>
              <input
                type="text"
                required
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'మొబైల్ (+91)' : 'Mobile (+91)'} *
              </label>
              <input
                type="tel"
                required
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Door / Premises */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {headerInfo.doorLabel}
            </label>
            <input
              type="text"
              required
              value={address.doorNo}
              onChange={(e) => setAddress({ ...address, doorNo: e.target.value })}
              placeholder={headerInfo.doorPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Street / Road */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {headerInfo.streetLabel}
            </label>
            <input
              type="text"
              required
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder={headerInfo.streetPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Landmark & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'గుర్తు (Landmark)' : 'Landmark'} *
              </label>
              <input
                type="text"
                required
                value={address.landmark}
                onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                placeholder="e.g. Near Rythu Bazar / RBK Center"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'పిన్‌కోడ్' : 'Pincode'} *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="e.g. 522001"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* City & AP District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'నగరం / మండలం / పట్టణం' : 'City / Mandal / Town'} *
              </label>
              <input
                type="text"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="e.g. Tenali / Guntur / Vijayawada"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'te' ? 'ఆంధ్రప్రదేశ్ జిల్లా' : 'AP District'} *
              </label>
              <select
                value={address.district}
                onChange={(e) => setAddress({ ...address, district: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden cursor-pointer"
              >
                {ANDHRA_PRADESH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Full Address Preview */}
          <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">place</span>
              <span>Formatted Address Preview:</span>
            </span>
            <p className="font-mono text-slate-700 dark:text-slate-200">
              {address.doorNo ? `${address.doorNo}, ` : ''}
              {address.street ? `${address.street}, ` : ''}
              {address.landmark ? `(Landmark: ${address.landmark}), ` : ''}
              {address.city ? `${address.city}, ` : ''}
              {address.district ? `${address.district} District, Andhra Pradesh` : 'Andhra Pradesh'}
              {address.pincode ? ` - ${address.pincode}` : ''}
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{headerInfo.btnText}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition-colors"
            >
              {language === 'te' ? 'రద్దు' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
