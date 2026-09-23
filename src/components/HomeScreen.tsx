import React, { useState, useEffect } from 'react';
import { CropNomicsLogo } from './CropNomicsLogo';
import { FarmerCardAuthModal } from './FarmerCardAuthModal';
import { TradeRequestsPortal } from './TradeRequestsPortal';
import { FarmerEarningsDashboard } from './FarmerEarningsDashboard';
import { SeasonalPriceAdvisoryPortal } from './SeasonalPriceAdvisoryPortal';
import { TermsAndConditionsModal, QuickFeedbackModal } from './Modals';
import { MyAddressModal } from './MyAddressModal';
import { LoginSignUpModal } from './LoginSignUpModal';
import { db } from '../data/db';
import { CROPS_DATA, TRANSLATIONS } from '../data/mockData';
import { getCropImageByName } from '../utils/cropImageHelper';
import {
  AppScreen,
  CropOption,
  FarmerCardDetails,
  FarmerListing,
  FarmerProfile,
  LanguageCode,
  UserRole,
} from '../types';

interface HomeScreenProps {
  profile: FarmerProfile;
  onUpdateProfile: (profile: FarmerProfile) => void;
  onProceedToAnalysis: () => void;
  language: LanguageCode;
  onNavigateToDashboard?: (screen: AppScreen) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onUpdateProfile,
  onProceedToAnalysis,
  language,
  onNavigateToDashboard,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Central Database State Subscription
  const [dbState, setDbState] = useState(db.getState());
  useEffect(() => {
    return db.subscribe(() => {
      setDbState({ ...db.getState() });
    });
  }, []);

  // Excluded crops from farmer dashboard per requirement
  const EXCLUDED_FARMER_CROP_IDS = ['cotton', 'groundnut', 'turmeric', 'sugarcane', 'pulses'];

  // Custom crops state (allows manual crop addition), excluding cotton, groundnut, turmeric, sugarcane, pulses
  const [availableCrops, setAvailableCrops] = useState<CropOption[]>(() =>
    CROPS_DATA.filter((c) => !EXCLUDED_FARMER_CROP_IDS.includes(c.id.toLowerCase()))
  );
  const [showManualCropModal, setShowManualCropModal] = useState<boolean>(false);

  // Manual Crop Form fields
  const [customCropName, setCustomCropName] = useState<string>('');
  const [customTeluguName, setCustomTeluguName] = useState<string>('');
  const [customCropImage, setCustomCropImage] = useState<string>('https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80');
  const [customFreshnessAmbientDays, setCustomFreshnessAmbientDays] = useState<number>(14);
  const [customFreshnessColdStorageDays, setCustomFreshnessColdStorageDays] = useState<number>(45);
  const [customTransitDays, setCustomTransitDays] = useState<number>(2);
  const [customPerishability, setCustomPerishability] = useState<'High' | 'Moderate' | 'Low' | 'Non-Perishable'>('Moderate');
  const [customBasePrice, setCustomBasePrice] = useState<number>(35000);
  const [customCategory, setCustomCategory] = useState<string>('Grains');

  // Fast Reefer Dispatch / Transit Booking state
  const [fastTransitBooked, setFastTransitBooked] = useState<boolean>(false);
  const [transitBookingNote, setTransitBookingNote] = useState<string | null>(null);

  // Kisan Card Auth Modal State
  const [showFarmerCardModal, setShowFarmerCardModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [activeFarmerCard, setActiveFarmerCard] = useState<FarmerCardDetails | null>(() => {
    try {
      const saved = localStorage.getItem('agrilink_farmer_kisan_card');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Multi-Trader Divider Modal State
  const [showMultiTraderDividerModal, setShowMultiTraderDividerModal] = useState<boolean>(false);
  const [isDividedLot, setIsDividedLot] = useState<boolean>(false);
  const [dividedTradersCount, setDividedTradersCount] = useState<number>(3);

  // Authentication & Role Login Modal State (Strict Admin Role RBAC)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTargetRole, setAuthTargetRole] = useState<UserRole>('admin');

  const handleAuthSuccess = (
    authenticatedRole: UserRole,
    _userDetails: { name: string; phone: string; username?: string; isNewAccount: boolean }
  ) => {
    setShowAuthModal(false);
    if (authenticatedRole === 'admin') {
      onNavigateToDashboard?.('admin');
    } else if (authenticatedRole === 'farmer') {
      onNavigateToDashboard?.('farmer');
    } else if (authenticatedRole === 'trader') {
      onNavigateToDashboard?.('trader');
    } else if (authenticatedRole === 'retailer') {
      onNavigateToDashboard?.('retailer');
    } else if (authenticatedRole === 'consumer') {
      onNavigateToDashboard?.('consumer');
    }
  };

  // Farmer Sub-Portal Tabs ('setup' | 'requests' | 'earnings' | 'advisory')
  const [farmerSubPortal, setFarmerSubPortal] = useState<'setup' | 'requests' | 'earnings' | 'advisory'>('setup');

  // Selected crop for Farmer Dashboard
  const selectedCrop = availableCrops.find((c) => c.id === profile.primaryCrop) || availableCrops[0];

  // Official benchmark MSP and Farmer's active base price
  const officialMspRate = selectedCrop.mspPerTon || selectedCrop.basePricePerTon || 24500;
  const activeBasePrice = profile.basePricePerTon ?? selectedCrop.basePricePerTon ?? 24500;

  // Handler for selecting crop - sets both primary crop and corresponding base price
  const handleSelectCrop = (cropId: string) => {
    const targetCrop = availableCrops.find((c) => c.id === cropId) || availableCrops[0];
    onUpdateProfile({
      ...profile,
      primaryCrop: cropId,
      basePricePerTon: targetCrop?.basePricePerTon || 24500,
    });
  };

  // Handler for updating crop base price directly
  const handleBasePriceChange = (newPrice: number) => {
    const sanitized = Math.max(100, Math.round(newPrice));
    onUpdateProfile({
      ...profile,
      basePricePerTon: sanitized,
    });
    setAvailableCrops((prev) =>
      prev.map((c) => (c.id === selectedCrop.id ? { ...c, basePricePerTon: sanitized } : c))
    );
  };

  const handleIncrementBasePrice = (delta: number) => {
    handleBasePriceChange(activeBasePrice + delta);
  };

  // Auto-switch profile if selected crop was previously one of the removed crops
  useEffect(() => {
    if (EXCLUDED_FARMER_CROP_IDS.includes(profile.primaryCrop?.toLowerCase())) {
      onUpdateProfile({ ...profile, primaryCrop: availableCrops[0]?.id || 'paddy' });
    }
  }, [profile.primaryCrop, availableCrops]);

  // HARVEST FRESHNESS & CONSUMER TRANSIT CALCULATIONS
  const storageCondition = profile.storageCondition || 'ambient';
  const harvestDateStr = profile.harvestDate || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const harvestDateObj = new Date(harvestDateStr);
  const now = new Date();

  // Elapsed time since harvest
  const elapsedMillis = Math.max(0, now.getTime() - harvestDateObj.getTime());
  const daysSinceHarvest = Math.floor(elapsedMillis / (1000 * 60 * 60 * 24));
  const hoursSinceHarvest = Math.floor((elapsedMillis / (1000 * 60 * 60)) % 24);

  // Total freshness lifespan based on storage environment
  const ambientLifespan = profile.freshnessAmbientDays || selectedCrop.freshnessAmbientDays || 14;
  const coldStorageLifespan = profile.freshnessColdStorageDays || selectedCrop.freshnessColdStorageDays || 45;
  const totalFreshnessDays = storageCondition === 'cold_storage'
    ? coldStorageLifespan
    : storageCondition === 'aerated_shed'
      ? Math.round(ambientLifespan * 1.35)
      : ambientLifespan;

  // Days remaining for freshness
  const freshnessDaysRemaining = Math.max(0, totalFreshnessDays - daysSinceHarvest);
  const freshnessQualityPercent = Math.min(100, Math.max(0, Math.round((freshnessDaysRemaining / totalFreshnessDays) * 100)));

  // Consumer Transit Time & Safe Window upon reaching consumers
  const transitDays = profile.transitToConsumerDays || selectedCrop.transitToConsumerDays || 2;
  const effectiveTransitDays = fastTransitBooked ? Math.max(1, Math.round(transitDays * 0.4)) : transitDays;
  const consumerSafeWindowDays = Math.max(0, freshnessDaysRemaining - effectiveTransitDays);

  // Profit preview calculation
  const previewQuantity = profile.quantity || 20;
  const previewSellingPrice = Math.round(previewQuantity * activeBasePrice * 1.08);
  const previewEstCost = Math.round(previewQuantity * 11500);
  const previewNetProfit = Math.max(0, previewSellingPrice - previewEstCost);

  // Manual Crop Submission
  const handleAddManualCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCropName.trim()) return;

    const resolvedImage = (customCropImage && customCropImage.trim()) ? customCropImage.trim() : getCropImageByName(customCropName.trim());

    const newCropId = `custom-crop-${Date.now()}`;
    const newCropOption: CropOption = {
      id: newCropId,
      name: customCropName.trim(),
      teluguName: customTeluguName.trim() || customCropName.trim(),
      basePricePerTon: customBasePrice,
      mspPerTon: customBasePrice,
      transportCostRate: 15,
      image: resolvedImage,
      freshnessAmbientDays: customFreshnessAmbientDays,
      freshnessColdStorageDays: customFreshnessColdStorageDays,
      transitToConsumerDays: customTransitDays,
      perishabilityLevel: customPerishability,
      idealTemp: customPerishability === 'High' ? '4°C - 10°C' : '20°C - 28°C',
      idealHumidity: '65% - 75% RH',
      freshnessNotes: 'Ensure dry shade cooling before loading onto transport vehicles.',
      isCustom: true,
    };

    const updatedCrops = [...availableCrops, newCropOption];
    setAvailableCrops(updatedCrops);

    // Update farmer profile to newly added crop
    const updatedProfile = {
      ...profile,
      primaryCrop: newCropId,
      basePricePerTon: customBasePrice,
      freshnessAmbientDays: customFreshnessAmbientDays,
      freshnessColdStorageDays: customFreshnessColdStorageDays,
      transitToConsumerDays: customTransitDays,
      perishabilityLevel: customPerishability,
      storageCondition: 'ambient' as const,
      harvestDate: new Date().toISOString().split('T')[0],
    };
    onUpdateProfile(updatedProfile);

    // Store in Central DB & Live Supabase 'crops' table
    const newListing: FarmerListing = {
      id: `manual-crop-${Date.now()}`,
      farmerName: profile.fullName ? `${profile.fullName} (తాజా నమోదు / Recent)` : 'AP Registered Producer',
      cropName: `${customCropName.trim()} (${customTeluguName.trim() || customCropName.trim()})`,
      variety: 'Direct Farm Gate Lot',
      grade: 'Grade A+ (Certified AP Produce)',
      tons: profile.quantity || 15,
      distanceMiles: 4,
      location: profile.location || 'AP Agricultural Hub',
      estPriceTotal: customBasePrice * (profile.quantity || 15),
      pricePerTon: customBasePrice,
      moistureContent: 'Certified Harvest Fresh',
      description: `Newly entered manual crop: ${customCropName.trim()}. Direct farmgate supply ready for trade.`,
      image: newCropOption.image,
      verified: true,
      phone: profile.mobile || '+91 98480 23456',
    };
    await db.addManualFarmerCrop(newListing);

    setShowManualCropModal(false);
    setCustomCropName('');
    setCustomTeluguName('');
  };

  // Fast Reefer Transit Booking Handler
  const handleBookFastTransit = () => {
    setFastTransitBooked(true);
    setTransitBookingNote(
      language === 'te'
        ? `ఆంధ్రప్రదేశ్ శీతల రవాణా వాహనం బుక్ చేయబడింది! ${profile.location || 'గుంటూరు'} రైతు కేంద్రానికి 6 గంటల్లో రిఫ్రిజిరేటెడ్ ట్రక్ చేరుకుంటుంది.`
        : `AP Cold-Chain Express vehicle scheduled! Refrigerated truck arriving at ${profile.location || 'Guntur'} within 6 hours.`
    );
    setTimeout(() => {
      setTransitBookingNote(null);
    }, 8000);
  };

  return (
    <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
      {/* ------------------------------------------------------------- */}
      {/* MODAL: MANUAL CROP ENTRY / కొత్త పంట నమోదు                    */}
      {/* ------------------------------------------------------------- */}
      {showManualCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">add_circle</span>
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-900">
                    {t.addCropManually}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {language === 'te'
                      ? 'మీ స్వంత పంట వివరాలు & రవాణా సమయ పరిమితి నమోదు'
                      : 'Define custom crop, shelf lifespan and consumer transit window'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualCropModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddManualCrop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.cropNameEnglish} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmiri Garlic, Dragon Fruit, Organic Ragi"
                  value={customCropName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomCropName(val);
                    if (val.trim().length > 1) {
                      const detectedImg = getCropImageByName(val);
                      setCustomCropImage(detectedImg);
                    }
                  }}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.cropNameTelugu}
                </label>
                <input
                  type="text"
                  placeholder="e.g. రాగి / చిరుధాన్యాలు"
                  value={customTeluguName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTeluguName(val);
                    if (val.trim().length > 1 && !customCropName.trim()) {
                      const detectedImg = getCropImageByName(val);
                      setCustomCropImage(detectedImg);
                    }
                  }}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              {/* Crop Image Selection & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {language === 'te' ? 'పంట ఫోటో / చిత్రం (Crop Image)' : 'Crop Photo / Image'}
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-100 shadow-xs">
                    <img
                      src={customCropImage}
                      alt="Crop preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customCropImage}
                    onChange={(e) => setCustomCropImage(e.target.value)}
                    className="flex-1 h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-mono focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
                {/* Preset Image Options */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Mirchi / మిర్చి', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Paddy / వరి', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Mango / మామిడి', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Banana / అరటి', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Papaya / బొప్పాయి', url: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Tomato / టమోటా', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Millets / రాగులు', url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Sweet Lime / బత్తాయి', url: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCustomCropImage(preset.url)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition-colors ${
                        customCropImage === preset.url
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'te' ? 'సాధారణ నిల్వ (రోజులు)' : 'Ambient Shelf Life'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={customFreshnessAmbientDays}
                    onChange={(e) => setCustomFreshnessAmbientDays(parseInt(e.target.value) || 7)}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-mono focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'te' ? 'శీతల నిల్వ (రోజులు)' : 'Cold Storage Life'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={365}
                    value={customFreshnessColdStorageDays}
                    onChange={(e) => setCustomFreshnessColdStorageDays(parseInt(e.target.value) || 30)}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-mono focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'te' ? 'వినియోగదారు రవాణా (రోజులు)' : 'Transit to Consumer'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={15}
                    value={customTransitDays}
                    onChange={(e) => setCustomTransitDays(parseInt(e.target.value) || 2)}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-sm font-mono focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'te' ? 'పాడయ్యే స్థాయి' : 'Perishability'}
                  </label>
                  <select
                    value={customPerishability}
                    onChange={(e) => setCustomPerishability(e.target.value as any)}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-2 text-xs font-semibold focus:border-emerald-600 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="High">High (అతి వేగంగా పాడయ్యేది)</option>
                    <option value="Moderate">Moderate (మధ్యస్థం)</option>
                    <option value="Low">Low (తక్కువ)</option>
                    <option value="Non-Perishable">Non-Perishable (ధాన్యాలు)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {language === 'te' ? 'అంచనా కనీస ధర (₹/టన్ను)' : 'Base MSP Price (₹/Ton)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={5000}
                    step={500}
                    value={customBasePrice}
                    onChange={(e) => setCustomBasePrice(parseInt(e.target.value) || 25000)}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 text-sm font-mono focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md cursor-pointer text-xs"
                >
                  {language === 'te' ? 'పంటను జోడించండి & ఎంచుకోండి' : 'Add & Select Crop'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualCropModal(false)}
                  className="px-5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DEDICATED FARMER DASHBOARD HERO HEADER                        */}
      {/* ------------------------------------------------------------- */}
      <div className="mb-8 bg-gradient-to-br from-[#064e3b] via-[#043e30] to-[#022c22] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-white/95 p-3.5 rounded-2xl shadow-lg border border-white/20 shrink-0">
              <CropNomicsLogo size="md" showTagline={false} variant="light" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'te' ? 'రైతు కమాండ్ సెంటర్' : 'AP Farmer Command Center'}</span>
              </div>
              <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-3xl sm:text-4xl">agriculture</span>
                <span>{language === 'te' ? 'రైతు డాష్‌బోర్డ్ (Farmer Dashboard)' : 'Farmer Crop & Earnings Dashboard'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl mt-1.5 leading-relaxed">
                {language === 'te'
                  ? 'పంట నమోదు, కోత తర్వాత తాజాదనం విశ్లేషణ, మల్టీ-ట్రేడర్ విభజన, ప్రత్యక్ష వ్యాపార అభ్యర్థనలు & చెల్లింపులు.'
                  : 'Direct AP crop registration, post-harvest shelf lifespan, multi-trader lot division, trade requests & earnings.'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Farmer Action Bar & Sub-Portals with Clear Descriptive Labels */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="flex flex-wrap items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 gap-1.5">
            <button
              id="farmer-subtab-setup"
              type="button"
              onClick={() => setFarmerSubPortal('setup')}
              title={language === 'te' ? 'పంట జీవిత చక్రం & నిల్వ' : 'Crop Life Cycle & Storage'}
              aria-label="Crop Setup"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                farmerSubPortal === 'setup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">potted_plant</span>
              <span>{language === 'te' ? 'పంట వివరాలు' : 'Crop Setup'}</span>
            </button>

            <button
              id="farmer-subtab-requests"
              type="button"
              onClick={() => setFarmerSubPortal('requests')}
              title={language === 'te' ? 'ట్రేడర్ అభ్యర్థనలు' : 'Trade Requests & Receipts'}
              aria-label="Trade Requests"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                farmerSubPortal === 'requests'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>{language === 'te' ? 'ట్రేడ్ అభ్యర్థనలు' : 'Trade Requests'}</span>
            </button>

            <button
              id="farmer-subtab-earnings"
              type="button"
              onClick={() => setFarmerSubPortal('earnings')}
              title={language === 'te' ? 'ఆదాయం & లావాదేవీలు' : 'Earnings & Ledger'}
              aria-label="Earnings"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                farmerSubPortal === 'earnings'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">payments</span>
              <span>{language === 'te' ? 'ఆదాయం' : 'Earnings'}</span>
            </button>

            <button
              id="farmer-subtab-advisory"
              type="button"
              onClick={() => setFarmerSubPortal('advisory')}
              title={language === 'te' ? 'ధర సలహా & సమయ ప్రణాళిక' : 'Price Advisory & Downtime'}
              aria-label="Market Insights"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                farmerSubPortal === 'advisory'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">insights</span>
              <span>{language === 'te' ? 'మార్కెట్ విశ్లేషణ' : 'Market Insights'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-open-manual-crop-modal"
              type="button"
              onClick={() => setShowManualCropModal(true)}
              title={language === 'te' ? 'కొత్త పంట నమోదు' : 'Add Custom Crop'}
              aria-label="Add Custom Crop"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">post_add</span>
              <span>{language === 'te' ? 'కొత్త పంట నమోదు' : 'Add Custom Crop'}</span>
            </button>

            {/* My Address Trigger (as in consumer dashboard) */}
            <button
              type="button"
              id="btn-farmer-profile-address"
              onClick={() => setShowAddressModal(true)}
              title={language === 'te' ? 'నా చిరునామా (పొలం & సేకరణ కేంద్రం)' : 'My Address (Farmgate & Dispatch)'}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/20 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
              <span>{language === 'te' ? 'నా చిరునామా' : 'My Address'}</span>
            </button>

            <button
              id="btn-farmer-terms"
              type="button"
              onClick={() => setShowTermsModal(true)}
              title="Terms & APMC Rules"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-400">gavel</span>
              <span className="hidden sm:inline">Terms & Rules</span>
            </button>

            <button
              id="btn-farmer-feedback"
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              title="Feedback & Support"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-400">rate_review</span>
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Admin / Committee Protected Login Trigger */}
            <button
              id="btn-home-admin-login"
              type="button"
              onClick={() => {
                setAuthTargetRole('admin');
                setShowAuthModal(true);
              }}
              title={language === 'te' ? 'అడ్మిన్ / మార్కెట్ కమిటీ లాగిన్' : 'Admin / Committee Portal Login'}
              className="px-3.5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>{language === 'te' ? 'అడ్మిన్ లాగిన్' : 'Admin Login'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transit Booking Alert */}
      {transitBookingNote && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">local_shipping</span>
          <span>{transitBookingNote}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 1: CROP SETUP & SHELF LIFESPAN                    */}
      {/* ========================================================= */}
      {farmerSubPortal === 'setup' && (
        <section id="dashboard-section-farmer" className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Crop Configuration (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl">eco</span>
                      <span>{language === 'te' ? 'పంట ఎంపిక & పరిమాణం' : 'Crop Selection & Harvest Lots'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'te'
                        ? 'ఆంధ్రప్రదేశ్ మార్కెట్‌లో మీ పంట రకాన్ని మరియు ప్రస్తుత నిల్వను ఎంచుకోండి'
                        : 'Select produce type, quantity and storage condition for real-time valuation'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    MSP Guaranteed
                  </span>
                </div>

                {/* Visual Crop Image Gallery (Interactive Cards) */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-base">photo_library</span>
                      <span>{language === 'te' ? 'పంట చిత్రాలు (Select Crop by Photo)' : 'Crop Photo Selector'}</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-500">
                      {availableCrops.length} {language === 'te' ? 'పంటలు' : 'crops'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 max-h-[360px] overflow-y-auto p-1.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                    {availableCrops.map((c) => {
                      const isSelected = c.id === profile.primaryCrop;
                      const cardBasePrice = isSelected ? activeBasePrice : (c.mspPerTon || c.basePricePerTon);
                      const isPriceCustomized = isSelected && activeBasePrice !== (c.mspPerTon || c.basePricePerTon);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCrop(c.id)}
                          className={`relative group rounded-2xl p-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]'
                              : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                          }`}
                        >
                          {/* Crop Image Container */}
                          <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-100 shadow-inner">
                            <img
                              src={c.image}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                              }}
                            />
                            {/* Selected Checkmark Badge */}
                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </span>
                            )}
                            {/* Perishability Badge */}
                            <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md ${
                              c.perishabilityLevel === 'High'
                                ? 'bg-rose-900/80 text-rose-100'
                                : c.perishabilityLevel === 'Medium'
                                ? 'bg-amber-900/80 text-amber-100'
                                : 'bg-emerald-900/80 text-emerald-100'
                            }`}>
                              {c.perishabilityLevel || 'Low'}
                            </span>
                          </div>

                          {/* Crop Names and Price */}
                          <div>
                            <div className="font-bold text-xs text-slate-900 line-clamp-1 leading-tight">
                              {language === 'te' ? c.teluguName : c.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {isPriceCustomized ? (
                                <span className="text-emerald-700 font-bold">
                                  {language === 'te' ? 'ధర: ' : 'Base: '}₹{cardBasePrice?.toLocaleString('en-IN')}/T
                                </span>
                              ) : (
                                <span>MSP: ₹{c.basePricePerTon ? c.basePricePerTon.toLocaleString('en-IN') : 'N/A'}/T</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Add Custom Crop Card */}
                    <button
                      type="button"
                      onClick={() => setShowManualCropModal(true)}
                      className="rounded-2xl p-2 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 min-h-[140px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1.5">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{language === 'te' ? '+ కొత్త పంట' : '+ Custom Crop'}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{language === 'te' ? 'నమోదు చేయండి' : 'Add custom'}</span>
                    </button>
                  </div>
                </div>

                {/* Active Selected Crop Spotlight Card with Large Image & Metrics */}
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-40 h-32 sm:h-28 rounded-xl overflow-hidden shrink-0 shadow-sm border border-emerald-300/60">
                    <img
                      src={selectedCrop.image}
                      alt={selectedCrop.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                      AP Grade A
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-base font-black text-slate-900">
                        {selectedCrop.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-xs font-bold">
                        {selectedCrop.teluguName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2.5 leading-relaxed">
                      {selectedCrop.tagline || selectedCrop.description}
                    </p>

                    {/* Metric Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-emerald-600 text-[14px]">price_check</span>
                        <span>
                          {activeBasePrice !== officialMspRate ? (language === 'te' ? 'ధర: ' : 'Base Rate: ') : 'MSP: '}
                          <strong className="text-emerald-800">₹{activeBasePrice.toLocaleString('en-IN')}/T</strong>
                          {activeBasePrice !== officialMspRate && (
                            <span className="ml-1 text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">
                              {language === 'te' ? 'సవరించబడింది' : 'Custom'}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-blue-600 text-[14px]">calendar_month</span>
                        <span>{selectedCrop.cropDurationDays || 120} days cycle</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-amber-600 text-[14px]">thermostat</span>
                        <span>{selectedCrop.idealTemp || 'Ambient dry'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Select Crop */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t.selectCrop}
                    </label>
                    <select
                      id="farmer-select-primary-crop"
                      value={profile.primaryCrop}
                      onChange={(e) => handleSelectCrop(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
                    >
                      {availableCrops.map((c) => {
                        const isCurrent = c.id === profile.primaryCrop;
                        const displayPrice = isCurrent ? activeBasePrice : (c.mspPerTon || c.basePricePerTon);
                        return (
                          <option key={c.id} value={c.id}>
                            {language === 'te' ? c.teluguName : c.name} ({isCurrent && activeBasePrice !== (c.mspPerTon || c.basePricePerTon) ? 'Custom' : 'MSP'}: ₹{displayPrice?.toLocaleString('en-IN')}/Ton)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Storage Condition */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'te' ? 'నిల్వ పద్ధతి' : 'Storage Method'}
                    </label>
                    <select
                      value={profile.storageCondition || 'ambient'}
                      onChange={(e) => onUpdateProfile({ ...profile, storageCondition: e.target.value as any })}
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
                    >
                      <option value="ambient">Ambient Shed (సాధారణ షెడ్ నిల్వ)</option>
                      <option value="aerated_shed">Aerated Moisture Controlled (గాలి చొరబడే షెడ్)</option>
                      <option value="cold_storage">AP State Cold Storage (శీతల నిల్వ కేంద్రం)</option>
                    </select>
                  </div>

                  {/* Harvest Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'te' ? 'కోత తేది' : 'Harvest Date'}
                    </label>
                    <input
                      type="date"
                      value={profile.harvestDate || harvestDateStr}
                      onChange={(e) => onUpdateProfile({ ...profile, harvestDate: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  {/* Base Price Setting & Changing Module (Requirement: in farmer dashboard in crop selection the changing of base price should be included) */}
                  <div className="bg-emerald-50/70 border-2 border-emerald-300/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-emerald-700 text-base">currency_rupee</span>
                        <span>{language === 'te' ? 'పంట కనీస ధర మార్పు (Base Price / Ton)' : 'Crop Base Price (₹ / Ton)'}</span>
                      </label>
                      {activeBasePrice !== officialMspRate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>{language === 'te' ? 'రైతు నిర్ణయించిన ధర' : 'Custom Price'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {language === 'te' ? 'ప్రభుత్వ MSP' : 'Official Govt MSP'}
                        </span>
                      )}
                    </div>

                    {/* Numeric Input with Step Increments */}
                    <div className="flex items-center gap-1.5">
                      <button
                        id="btn-decrease-base-price"
                        type="button"
                        onClick={() => handleIncrementBasePrice(-500)}
                        title={language === 'te' ? '₹500 తగ్గించండి' : 'Decrease ₹500'}
                        className="h-10 px-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-0.5 transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                        <span className="text-[10px]">500</span>
                      </button>

                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                        <input
                          id="farmer-base-price-input"
                          type="number"
                          min={500}
                          step={100}
                          value={activeBasePrice}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleBasePriceChange(isNaN(val) ? 0 : val);
                          }}
                          className="w-full h-10 bg-white border-2 border-emerald-500 rounded-xl pl-7 pr-12 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
                          title="Base price per metric ton"
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] font-bold text-slate-500">/ MT</span>
                      </div>

                      <button
                        id="btn-increase-base-price"
                        type="button"
                        onClick={() => handleIncrementBasePrice(500)}
                        title={language === 'te' ? '₹500 పెంచండి' : 'Increase ₹500'}
                        className="h-10 px-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-0.5 transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span className="text-[10px]">500</span>
                      </button>
                    </div>

                    {/* Quick Adjustment Chips & Reset Button */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-0.5">
                          {language === 'te' ? 'త్వరిత:' : 'Presets:'}
                        </span>
                        <button
                          id="btn-preset-msp"
                          type="button"
                          onClick={() => handleBasePriceChange(officialMspRate)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                            activeBasePrice === officialMspRate
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          MSP (₹{officialMspRate.toLocaleString('en-IN')})
                        </button>

                        {[
                          { label: '+5%', value: Math.round((officialMspRate * 1.05) / 100) * 100 },
                          { label: '+10%', value: Math.round((officialMspRate * 1.10) / 100) * 100 },
                          { label: '+15%', value: Math.round((officialMspRate * 1.15) / 100) * 100 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleBasePriceChange(preset.value)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                              activeBasePrice === preset.value
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {activeBasePrice !== officialMspRate && (
                        <button
                          id="btn-reset-to-official-msp"
                          type="button"
                          onClick={() => handleBasePriceChange(officialMspRate)}
                          className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold underline flex items-center gap-0.5 cursor-pointer ml-auto"
                          title="Reset to official MSP"
                        >
                          <span className="material-symbols-outlined text-[12px]">restart_alt</span>
                          <span>{language === 'te' ? 'MSP కి రీసెట్' : 'Reset to MSP'}</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary Unit Equivalents (Quintal & Bag) */}
                    <div className="pt-1.5 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>
                        {language === 'te' ? 'క్వింటాల్:' : 'Per Quintal:'}{' '}
                        <strong className="text-emerald-900 font-bold">₹{Math.round(activeBasePrice / 10).toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        {language === 'te' ? '50కేజీ బస్తా:' : 'Per 50kg Bag:'}{' '}
                        <strong className="text-emerald-900 font-bold">₹{Math.round(activeBasePrice / 20).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Harvest Lot Sizing Block (Full Width) */}
                  <div className="sm:col-span-2 bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                    {/* Header with Title and Current Value Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">scale</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                            {t.quantity || (language === 'te' ? 'పంట పరిమాణం (లాట్ సైజు)' : 'Harvest Quantity (Lot Size)')}
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {language === 'te'
                              ? 'విక్రయ యోగ్యమైన మొత్తం పంట నిల్వ & రవాణా లాట్'
                              : 'Total marketable produce volume ready for trade'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-3 py-1 rounded-full shadow-2xs">
                          {profile.quantity} {t.tons || (language === 'te' ? 'టన్నులు' : 'Tons (Metric)')}
                        </span>
                        <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-2xs">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={profile.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateProfile({ ...profile, quantity: isNaN(val) ? 0 : Math.max(1, val) });
                            }}
                            className="w-14 text-xs font-mono font-bold text-right outline-none text-slate-800 pr-1"
                            title="Direct numeric input for tons"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">MT</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Description for Quantity */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0 mt-0.5">info</span>
                      <div className="space-y-1">
                        <p className="font-semibold text-emerald-900">
                          {language === 'te'
                            ? 'పరిమాణం వివరణ (Quantity Description):'
                            : 'About Harvest Quantity & Valuation:'}
                        </p>
                        <p className="text-[11.5px] text-slate-700 leading-normal">
                          {language === 'te'
                            ? 'ఈ పరిమాణం మీ వ్యవసాయ క్షేత్రం నుండి విక్రయానికి లేదా మార్కెట్ యార్డ్ సేకరణకు సిద్ధంగా ఉన్న మొత్తం పంటను సూచిస్తుంది. ఇది మెట్రిక్ టన్నులలో (Metric Tons) నమోదు చేయబడుతుంది: 1 టన్ను = 10 క్వింటాళ్లు = 1,000 కిలోలు (~20 ప్రామాణిక 50కిలోల బస్తాలు). ఈ సంఖ్య మీ ప్రభుత్వ హామీ కనీస మద్దతు ధర (MSP) మొత్తం విలువను, శీతల రవాణా వాహనం సైజును (బొలేరో/10-వీలర్ లారీ) మరియు మల్టీ-ట్రేడర్ లాట్ విభజనను నేరుగా నిర్దేశిస్తుంది.'
                            : 'This quantity represents the total harvest lot size available for farmgate sale or AP mandi procurement. It is recorded in Metric Tons (MT): 1 MT = 10 Quintals = 1,000 kg (approx. 20 standard 50kg gunny bags). This figure directly calculates your guaranteed MSP valuation, determines freight vehicle dispatch sizing (LCV vs multi-axle lorry), and governs multi-trader bidding lot allocations.'}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Slider & Quick Preset Buttons */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                        <span>Min: 5 MT</span>
                        <span className="font-bold text-slate-700">Slide to adjust: {profile.quantity} Tons</span>
                        <span>Max: 100 MT</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={profile.quantity}
                        onChange={(e) => onUpdateProfile({ ...profile, quantity: parseInt(e.target.value) || 20 })}
                        className="w-full accent-emerald-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
                      />

                      {/* Quick Quantity Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                          {language === 'te' ? 'త్వరిత ఎంపిక:' : 'Presets:'}
                        </span>
                        {[5, 10, 20, 25, 50, 75, 100].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => onUpdateProfile({ ...profile, quantity: preset })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                              profile.quantity === preset
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {preset}T
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Unit Breakdown & Conversion Cards */}
                    <div className="pt-2 border-t border-slate-200/70">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">calculate</span>
                        <span>{language === 'te' ? 'పరిమాణ సమానార్థక వివరాలు (Live Conversion)' : 'Quantity Equivalents & Logistics'}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Quintals */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {language === 'te' ? 'క్వింటాళ్లు (Quintals)' : 'Quintals (10 Qtl/T)'}
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                            {(profile.quantity * 10).toLocaleString('en-IN')} Qtl
                          </span>
                          <span className="text-[9px] text-slate-400">100 kg / quintal</span>
                        </div>

                        {/* Standard Gunny Bags */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {language === 'te' ? 'బస్తాలు (50kg Bags)' : 'Gunny Bags (~50kg)'}
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                            ~{(profile.quantity * 20).toLocaleString('en-IN')} Bags
                          </span>
                          <span className="text-[9px] text-slate-400">Standard AP gunny</span>
                        </div>

                        {/* Total Kilograms */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {language === 'te' ? 'కిలోగ్రాములు (Kg)' : 'Weight in Kilograms'}
                          </span>
                          <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                            {(profile.quantity * 1000).toLocaleString('en-IN')} kg
                          </span>
                          <span className="text-[9px] text-slate-400">1,000 kg / Metric Ton</span>
                        </div>

                        {/* Estimated MSP Gross Worth */}
                        <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                          <span className="text-[10px] text-emerald-800 block font-bold">
                            {language === 'te' ? 'హామీ కనీస విలువ (MSP)' : 'Base MSP Valuation'}
                          </span>
                          <span className="text-sm font-black font-mono text-emerald-900 mt-0.5 block">
                            ₹{((profile.quantity || 20) * activeBasePrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-emerald-700 font-medium">Direct farmgate base</span>
                        </div>
                      </div>

                      {/* Recommended Logistics Vehicle Badge */}
                      <div className="mt-2.5 p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">local_shipping</span>
                          <span className="font-medium text-[11px]">
                            {language === 'te' ? 'సిఫార్సు చేసిన రవాణా వాహనం:' : 'Dispatch Freight Sizing:'}
                          </span>
                        </div>
                        <span className="font-bold text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {profile.quantity <= 10
                            ? (language === 'te' ? 'చిన్న వాణిజ్య వాహనం (Bolero Maxi / LCV - 3 to 10T)' : 'Light Commercial (Bolero Maxi / LCV - up to 10T)')
                            : profile.quantity <= 25
                            ? (language === 'te' ? 'మధ్యస్థ సరుకు లారీ (6 / 10-Wheeler Truck - 15 to 25T)' : 'Medium Freight Truck (6/10-Wheeler - up to 25T)')
                            : (language === 'te' ? 'భారీ మల్టీ-యాక్సిల్ లారీ / బల్క్ మార్కెట్ లాట్ (25T+)' : 'Heavy Multi-Axle Freight / Bulk Mandi Lot (25T+)')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Freshness & Shelf Lifespan Journey */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs hidden sm:block bg-slate-100">
                      <img
                        src={selectedCrop.image}
                        alt={selectedCrop.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-2xl">hourglass_top</span>
                        <span>{language === 'te' ? 'తాజాదనం & రవాణా విండో' : 'Post-Harvest Freshness & Transit Window'}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {language === 'te'
                          ? 'కోత నుండి వినియోగదారుని వరకు నాణ్యత సూచిక'
                          : 'Real-time shelf life decay model tailored to Andhra Pradesh climate conditions'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {freshnessQualityPercent}% Quality Retained
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Elapsed: {daysSinceHarvest}d {hoursSinceHarvest}h</span>
                    <span>Remaining: {freshnessDaysRemaining} Days (Total {totalFreshnessDays}d)</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        freshnessQualityPercent > 60
                          ? 'bg-emerald-500'
                          : freshnessQualityPercent > 30
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${freshnessQualityPercent}%` }}
                    />
                  </div>
                </div>

                {/* 2 Metric Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Transit To Consumer
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1">
                      <span>{transitDays}</span>
                      <span className="text-xs text-slate-500 font-normal">Days</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Doorstep delivery window</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Consumer Safe Window
                    </span>
                    <div className="text-xl font-black text-emerald-700 mt-1 flex items-center gap-1">
                      <span>{consumerSafeWindowDays}</span>
                      <span className="text-xs text-slate-500 font-normal">Days</span>
                    </div>
                    <span className="text-[10px] text-slate-400">After delivery shelf life</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Profit Estimator & Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profit Preview Card */}
              <div className="bg-gradient-to-br from-[#064e3b] to-[#022c22] text-white rounded-3xl p-6 shadow-xl border border-emerald-900/50 flex flex-col justify-between">
                <div>
                  {/* Selected Crop Thumbnail in Profit Card */}
                  <div className="flex items-center gap-3 pb-3.5 mb-3.5 border-b border-white/10">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-400/40 shrink-0 shadow-md bg-emerald-950/60">
                      <img
                        src={selectedCrop.image}
                        alt={selectedCrop.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-emerald-300 font-mono uppercase tracking-wider font-bold">
                        {language === 'te' ? 'ఎంచుకున్న పంట' : 'Active Produce Lot'}
                      </div>
                      <div className="text-sm font-black text-white truncate">
                        {selectedCrop.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                      {language === 'te' ? 'అంచనా నికర లాభం' : 'Net Farmgate Profit'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      AP Grade A
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                    ₹{previewNetProfit.toLocaleString('en-IN')}.00
                  </div>

                  <p className="text-xs text-emerald-200/80 mt-1">
                    {activeBasePrice !== officialMspRate ? (language === 'te' ? 'రైతు నిర్ణయించిన ధర' : 'Base Rate') : 'MSP'}: ₹{activeBasePrice.toLocaleString('en-IN')}/Ton ({selectedCrop.name})
                  </p>
                </div>

                <div className="my-6 pt-5 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-emerald-100">
                    <span>Expected Gross Selling:</span>
                    <span className="font-bold font-mono">₹{previewSellingPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Estimated Input & Labor:</span>
                    <span className="font-bold font-mono">-₹{previewEstCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    id="btn-farmer-proceed-analysis"
                    type="button"
                    onClick={onProceedToAnalysis}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-98"
                  >
                    <span>{language === 'te' ? 'విశ్లేషణను చూడండి & మార్కెట్‌లో నమోదు చేయండి' : 'Detailed Analysis & List Lot'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  {/* Multi-Trader Lot Divider Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowMultiTraderDividerModal(!showMultiTraderDividerModal)}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">call_split</span>
                    <span>{language === 'te' ? 'మల్టీ-ట్రేడర్ విభజన (Partition Lot)' : 'Partition Lot for Multi-Traders'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Trader Partition Inline Card */}
              {showMultiTraderDividerModal && (
                <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">call_split</span>
                    <span>{language === 'te' ? 'లాట్ విభజన సెట్టింగులు' : 'Divide Lot for Multiple Bids'}</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Split {profile.quantity} tons into {dividedTradersCount} smaller lots to allow multiple AP mandi traders to procure simultaneously.
                  </p>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setDividedTradersCount(count)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          dividedTradersCount === count
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {count} Lots ({Math.round(profile.quantity / count)} T each)
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDividedLot(true);
                      setShowMultiTraderDividerModal(false);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm Partition
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 2: TRADE REQUESTS & RECEIPTS                     */}
      {/* ========================================================= */}
      {farmerSubPortal === 'requests' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in duration-200">
          {/* Step Back Button */}
          <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <button
              id="btn-back-to-farmer-setup"
              type="button"
              onClick={() => {
                setFarmerSubPortal('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {language === 'te' ? 'వ్యాపార అభ్యర్థనలు & రసీదులు' : 'Trade Requests & Receipts'}
            </span>
          </div>

          <TradeRequestsPortal
            role="farmer"
            userPhoneOrId={profile.mobile}
            userName={profile.fullName}
            language={language}
            onRequestAccepted={() => {
              setDbState({ ...db.getState() });
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 3: EARNINGS & SETTLEMENT DASHBOARD               */}
      {/* ========================================================= */}
      {farmerSubPortal === 'earnings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in duration-200">
          {/* Step Back Button */}
          <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <button
              id="btn-back-to-farmer-setup-from-earnings"
              type="button"
              onClick={() => {
                setFarmerSubPortal('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {language === 'te' ? 'ఆదాయాలు & చెల్లింపు రికార్డులు' : 'Direct Settlement & Earnings'}
            </span>
          </div>

          <FarmerEarningsDashboard
            farmerProfile={profile}
            tradeRequests={dbState.tradeRequests}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 4: SEASONAL PRICE ADVISORY & DOWNTIME PLANNER   */}
      {/* ========================================================= */}
      {farmerSubPortal === 'advisory' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in duration-200">
          {/* Step Back Button */}
          <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <button
              id="btn-back-to-farmer-setup-from-advisory"
              type="button"
              onClick={() => {
                setFarmerSubPortal('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {language === 'te' ? 'ధర సలహా & డౌన్‌టైమ్ ప్లానర్' : 'Price Advisory & Downtime Planner'}
            </span>
          </div>

          <SeasonalPriceAdvisoryPortal
            initialCropId={selectedCrop.id}
            farmerDistrict={profile.location.split(',')[0].trim()}
          />
        </div>
      )}

      {/* Kisan Card Auth Modal */}
      {showFarmerCardModal && (
        <FarmerCardAuthModal
          isOpen={showFarmerCardModal}
          onClose={() => setShowFarmerCardModal(false)}
          onCardGenerated={(card) => {
            setActiveFarmerCard(card);
            onUpdateProfile({
              ...profile,
              fullName: card.farmerName,
              mobile: card.mobileNumber,
              location: `${card.district}, Andhra Pradesh`,
            });
          }}
        />
      )}

      {/* Terms & Conditions Modal (Requirement 21) */}
      {showTermsModal && (
        <TermsAndConditionsModal
          role="farmer"
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* Quick Feedback Modal (Requirement 22) */}
      {showFeedbackModal && (
        <QuickFeedbackModal
          role="farmer"
          userName={profile.fullName}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* My Address Modal (Requirement: Add My Address in all dashboards as in consumer dashboard) */}
      {showAddressModal && (
        <MyAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          role="farmer"
          language={language}
          initialData={{
            fullName: profile.fullName || 'రామేష్ వర్మ (Ramesh Varma)',
            phone: profile.mobile || '+91 98480 23456',
            streetAddress: 'Tenali Rythu Seva Kendram, Krishna Canal Bund Road, Kollipara',
            landmark: 'Near Canal Sluice Gate No. 2 & Weighbridge',
            cityVillage: 'Tenali',
            mandal: 'Tenali Mandalam',
            district: profile.location?.includes('Guntur') ? 'Guntur' : (profile.location?.split(',')[0] || 'Guntur'),
            pincode: '522201',
            latitude: '16.2435',
            longitude: '80.6402',
            notes: 'Farmgate loading bay accessible for 10-wheel trucks and tractors.',
          }}
          onSave={(data) => {
            onUpdateProfile({
              ...profile,
              location: `${data.district}, Andhra Pradesh`,
              fullName: data.fullName || profile.fullName,
              mobile: data.phone || profile.mobile,
            });
          }}
        />
      )}

      {/* APMC Governance & Admin Protected Access Banner */}
      <div id="home-admin-governance-card" className="mt-10 mb-4 bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-3xl">shield_person</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm sm:text-base text-white">
                {language === 'te' ? 'APMC మార్కెట్ కమిటీ & నియంత్రణ పోర్టల్' : 'APMC Market Committee & Regulatory Portal'}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold tracking-wider uppercase">
                Protected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'te'
                ? 'అధికారిక అడ్మిన్ ఖాతా (admin@cropnomics.gov) కు మాత్రమే ప్రవేశం అనుమతించబడుతుంది. రైతు, ట్రేడర్ లేదా రిటైలర్ ప్రొఫైల్‌లకు యాక్సెస్ నిరాకరించబడుతుంది.'
                : 'Strictly restricted to verified AP Agricultural Governance Officers (admin@cropnomics.gov). Farmer, trader, and retailer profiles will be denied entry.'}
            </p>
          </div>
        </div>
        <button
          id="btn-admin-portal-verify"
          type="button"
          onClick={() => {
            setAuthTargetRole('admin');
            setShowAuthModal(true);
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          <span>{language === 'te' ? 'అడ్మిన్ లాగిన్' : 'Admin / Committee Login'}</span>
        </button>
      </div>

      {/* Role Authentication Modal (with strict RBAC for Admin role) */}
      {showAuthModal && (
        <LoginSignUpModal
          isOpen={showAuthModal}
          targetRole={authTargetRole}
          language={language}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </main>
  );
};
