import React, { useState } from 'react';
import { db } from '../data/db';
import { CROPS_DATA, TRANSLATIONS } from '../data/mockData';
import { FarmerProfile, LanguageCode } from '../types';
import { CropListingReviewSlipModal } from './CropListingReviewSlipModal';

interface AnalysisScreenProps {
  profile: FarmerProfile;
  onNavigateToMarket: () => void;
  language: LanguageCode;
  onListingCreated: () => void;
  onBack?: () => void;
}

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  profile,
  onNavigateToMarket,
  language,
  onListingCreated,
  onBack,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isListing, setIsListing] = useState(false);
  const [showReviewSlipModal, setShowReviewSlipModal] = useState(false);

  const crop = CROPS_DATA.find((c) => c.id === profile.primaryCrop) || CROPS_DATA[0];
  const effectiveBasePrice = profile.basePricePerTon || crop.basePricePerTon;

  // Dynamic calculations based on user's registered crop & quantity
  const qty = profile.quantity > 0 ? profile.quantity : 20;
  const unitMultiplier =
    profile.unit === 'KG' ? 0.001 : profile.unit === 'Bags' ? 0.05 : profile.unit === 'Bushel' ? 0.027 : 1;
  const effectiveTons = Math.max(1, qty * unitMultiplier);

  const sellingPrice = Math.round(effectiveBasePrice * effectiveTons * 1.05);
  const transportCost = Math.round(crop.transportCostRate * effectiveTons * 0.9 + 500);
  const serviceFee = Math.round(sellingPrice * 0.02);
  const totalCosts = transportCost + serviceFee;
  const netProfit = Math.max(1000, sellingPrice - totalCosts);

  // Lifetime duration and days to harvest
  const durationDays = profile.cropDurationDays || crop.cropDurationDays || 120;
  const sowingDate = profile.sowingDate ? new Date(profile.sowingDate) : new Date(Date.now() - 65 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysPassed = Math.max(0, Math.floor((today.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, durationDays - daysPassed);
  const growthPercent = Math.min(100, Math.max(5, Math.round((daysPassed / durationDays) * 100)));

  // Supply chain stages with calculated prices in INR
  const supplyChainStages = [
    {
      id: 'farmer',
      title: language === 'te' ? 'రైతు (మీరు)' : 'Farmer',
      subtitle: t.farmerCurrent,
      amount: `₹${netProfit.toLocaleString('en-IN')}`,
      icon: 'agriculture',
      color: 'bg-primary text-on-primary',
      description: language === 'te' 
        ? 'నేరుగా రైతు క్షేత్రం నుండి లేదా AP మార్కెట్ యార్డ్ నుండి మీ ఆదాయం.'
        : 'Your estimated payout after direct farmgate sale.',
    },
    {
      id: 'trader',
      title: language === 'te' ? 'ట్రేడర్' : 'Trader',
      subtitle: language === 'te' ? 'హోల్‌సేల్ రవాణా' : 'Wholesale Transport',
      amount: `₹${Math.round(sellingPrice * 1.18).toLocaleString('en-IN')}`,
      icon: 'local_shipping',
      color: 'bg-surface-container-high text-on-surface',
      description: language === 'te'
        ? 'పంటను సేకరించి, కోల్డ్ స్టోరేజ్ & AP అంతర్-జిల్లా రవాణా ఖర్చులను భరిస్తుంది.'
        : 'Aggregates harvest, covers climate-controlled transport and bulk trade insurance.',
    },
    {
      id: 'retailer',
      title: language === 'te' ? 'రిటైలర్' : 'Retailer',
      subtitle: language === 'te' ? 'మార్కెట్ ప్యాకేజింగ్' : 'Market Packaging',
      amount: `₹${Math.round(sellingPrice * 1.48).toLocaleString('en-IN')}`,
      icon: 'store',
      color: 'bg-surface-container-high text-on-surface',
      description: language === 'te'
        ? 'శుద్ధి చేసి, వినియోగదారు ప్యాక్‌లుగా మార్చి మార్కెట్‌లో విక్రయిస్తుంది.'
        : 'Cleans, packages into consumer units, and stores on retail supermarket shelves.',
    },
    {
      id: 'consumer',
      title: language === 'te' ? 'వినియోగదారుడు' : 'Consumer',
      subtitle: language === 'te' ? 'చివరి మార్కెట్ ధర' : 'Final Basket Price',
      amount: `₹${Math.round(sellingPrice * 1.72).toLocaleString('en-IN')}`,
      icon: 'shopping_bag',
      color: 'bg-surface-container-high text-on-surface',
      description: language === 'te'
        ? 'CropNomics AP డైరెక్ట్ లెడ్జర్ ద్వారా పారదర్శకమైన తుది కొనుగోలు ధర.'
        : 'End customer price transparency guaranteed by CropNomics Direct ledger.',
    },
  ];

  const handleListDirectlyOnMarket = () => {
    // Open review slip modal rather than immediate redirect
    setShowReviewSlipModal(true);
  };

  const handleConfirmSell = async () => {
    setIsListing(true);

    // Save listing into centralized database & live Supabase crops table
    await db.addManualFarmerCrop({
      id: `listing-ap-${Date.now()}`,
      farmerName: profile.fullName || 'రామేష్ వర్మ (Ramesh Varma)',
      phone: profile.mobile || '9848012345',
      cropName: crop.name,
      variety: 'AP Super Fine Grade A',
      grade: 'Grade A',
      tons: effectiveTons,
      distanceMiles: 12,
      location: profile.location || 'Guntur, Andhra Pradesh',
      estPriceTotal: sellingPrice,
      pricePerTon: Math.round(sellingPrice / effectiveTons),
      moistureContent: '12.4% (Optimal)',
      description: `Freshly harvested ${crop.name} registered on AP Crop Market.`,
      image: crop.image,
      verified: true,
    });

    setShowReviewSlipModal(false);
    onListingCreated();
  };

  return (
    <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
      {/* Step Back Button */}
      <div className="mb-4">
        <button
          type="button"
          id="btn-analysis-back-to-farmer"
          onClick={onBack || onNavigateToMarket}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          title={language === 'te' ? 'వెనుకకు' : 'Back'}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
        </button>
      </div>

      {/* Analysis Header */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-secondary">analytics</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
            {t.cropAnalysis}
          </span>
        </div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-black text-on-surface">
          {crop.name} {language === 'te' ? 'దిగుబడి విశ్లేషణ' : 'Harvest Analysis'}
        </h1>
        <p className="text-xs text-on-surface-variant">
          {language === 'te' ? 'నమోదు చేసిన రైతు:' : 'Registered by'}{' '}
          <strong className="text-on-surface">{profile.fullName || 'Farmer'}</strong> • {profile.location || 'Guntur, Andhra Pradesh'} • {qty} {profile.unit} (~{effectiveTons.toFixed(1)} Tons)
        </p>
      </div>

      {/* Crop Lifetime & Growth Lifecycle Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">eco</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">
                {t.cropLifetime}: {durationDays} {t.days}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {t.sowingDate}: {profile.sowingDate || 'N/A'} • {daysPassed} {t.days} {language === 'te' ? 'గడిచాయి' : 'elapsed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {daysRemaining > 0 ? `${daysRemaining} ${t.daysToHarvest}` : (language === 'te' ? 'కోతకు సిద్ధంగా ఉంది' : 'Ready for Harvest')}
            </span>
          </div>
        </div>

        {/* Growth Progress Bar */}
        <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden relative mb-2">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
            style={{ width: `${growthPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
          <span>{language === 'te' ? 'విత్తనం నాటడం' : 'Sowing (Day 1)'}</span>
          <span>{language === 'te' ? 'పూత దశ' : 'Flowering'}</span>
          <span>{language === 'te' ? 'కాయ పెరుగుదల' : 'Maturation'}</span>
          <span className="font-bold text-primary">{language === 'te' ? 'కోత (హార్వెస్ట్)' : 'Harvest'}</span>
        </div>
      </div>

      {/* Grid: Main Profit Card & Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Main Net Profit Card */}
        <div className="lg:col-span-8 bg-primary-container text-on-primary-container rounded-2xl p-6 sm:p-8 shadow-[0_8px_16px_0_rgba(0,0,0,0.12)] flex flex-col justify-between gap-6 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-10 -top-10 w-56 h-56 bg-primary-fixed opacity-20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col gap-2 relative z-10">
            <span className="font-label-sm text-label-sm uppercase opacity-90 tracking-wider">
              {t.expectedNetProfit}
            </span>
            <span className="font-display-lg text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              ₹{netProfit.toLocaleString('en-IN')}.00
            </span>
            <span className="font-body-md opacity-95 flex items-center gap-1 text-sm font-semibold text-[#bcf0ae]">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              +12% {language === 'te' ? 'గత నెలతో పోలిస్తే (AP సబ్సిడీ + అధిక డిమాండ్)' : 'vs last month (AP Subsidy + High Demand)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 pt-5 border-t border-on-primary-container/25">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm opacity-80 uppercase">
                {t.expectedSellingPrice}
              </span>
              <span className="font-price-display text-price-display text-white">
                ₹{sellingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] opacity-75">
                AP Market baseline @ ₹{crop.basePricePerTon}/Ton
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm opacity-80 uppercase">
                {t.estimatedCosts}
              </span>
              <span className="font-price-display text-price-display text-error-container">
                -₹{totalCosts.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] opacity-75">
                Transport (₹{transportCost.toLocaleString('en-IN')}) + Service fee (₹{serviceFee.toLocaleString('en-IN')})
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className="lg:col-span-4 bg-secondary-container text-on-secondary-container rounded-2xl p-6 sm:p-7 shadow-[0_8px_16px_0_rgba(0,0,0,0.1)] flex flex-col justify-between items-start gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
              {t.agrilinkSuggests}
            </span>
          </div>

          <p className="font-headline-lg-mobile text-xl sm:text-2xl font-bold leading-snug">
            {t.sellingRecommended}
          </p>

          <p className="text-xs text-on-secondary-container/85">
            {language === 'te' 
              ? 'ఆంధ్రప్రదేశ్ మార్కెట్ యార్డులలో కొనుగోలుదారులు సాధారణ ధర కంటే 8% అధికంగా బిడ్ చేస్తున్నారు. మీ రేటును ఇప్పుడే ఖరారు చేసుకోండి.'
              : 'Current AP Market buyer bids in your area are 8% above seasonal average. Lock in rate now.'}
          </p>

          <button
            id="btn-list-on-market"
            type="button"
            onClick={handleListDirectlyOnMarket}
            disabled={isListing}
            className="bg-secondary text-on-secondary px-6 h-14 rounded-full font-body-md font-bold flex items-center gap-2 hover:bg-secondary/90 transition-all mt-auto w-full justify-center shadow-sm cursor-pointer active:scale-98 disabled:opacity-75"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isListing ? 'sync' : 'sell'}
            </span>
            <span>
              {isListing
                ? (language === 'te' ? 'మార్కెట్‌లో నమోదు అవుతోంది...' : 'Publishing to AP Market...')
                : t.listOnMarket}
            </span>
          </button>
        </div>
      </div>

      {/* Supply Chain Value Journey Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">
            {t.supplyChainJourney}
          </h2>
          <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            Direct Farmgate to Table (AP Direct Trade)
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.06)] border border-outline-variant/30">
          {/* Desktop/Tablet Horizontal View */}
          <div className="hidden md:flex items-center justify-between relative py-4">
            {/* Connecting Line */}
            <div className="absolute left-[12%] right-[12%] top-1/2 -translate-y-1/2 h-1 bg-surface-container-highest z-0"></div>

            {supplyChainStages.map((stage, index) => {
              const isSelected = activeStageIndex === index;
              return (
                <div
                  key={stage.id}
                  onClick={() => setActiveStageIndex(index)}
                  className={`flex flex-col items-center gap-2 relative z-10 cursor-pointer group transition-all select-none ${
                    index === 0 ? 'opacity-100' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md border-4 border-surface-container-lowest transition-transform duration-200 ${
                      index === 0
                        ? 'bg-primary text-on-primary scale-110'
                        : isSelected
                        ? 'bg-secondary text-on-secondary scale-105'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[30px]">{stage.icon}</span>
                  </div>
                  <span
                    className={`font-body-md font-bold text-sm ${
                      index === 0 ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {stage.title}
                  </span>
                  <span className="font-price-display text-base font-extrabold text-primary">
                    {stage.amount}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    {stage.subtitle}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical View */}
          <div className="md:hidden flex flex-col gap-6 relative pl-6 py-2">
            {/* Vertical Connecting Line */}
            <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-surface-container-highest z-0"></div>

            {supplyChainStages.map((stage, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={stage.id}
                  onClick={() => setActiveStageIndex(index)}
                  className="flex items-center gap-4 relative z-10 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-4 border-surface-container-lowest flex-shrink-0 ${
                      isFirst
                        ? 'bg-primary text-on-primary ring-2 ring-primary/20'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{stage.icon}</span>
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-body-md font-bold ${
                          isFirst ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {stage.title}
                      </span>
                      <span className="font-price-display text-sm font-bold text-primary">
                        {stage.amount}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {stage.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Stage Inspector Details */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 bg-surface-container-low/60 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">info</span>
            <div>
              <div className="text-xs font-bold text-primary uppercase font-label-sm">
                Stage Detail: {supplyChainStages[activeStageIndex].title} ({supplyChainStages[activeStageIndex].subtitle})
              </div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                {supplyChainStages[activeStageIndex].description}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crop Listing Review Slip Confirmation Modal */}
      <CropListingReviewSlipModal
        isOpen={showReviewSlipModal}
        onClose={() => setShowReviewSlipModal(false)}
        onConfirmSell={handleConfirmSell}
        cropName={crop.name}
        cropTeluguName={crop.teluguName}
        cropImage={crop.image}
        quantityTons={effectiveTons}
        expectedPricePerTon={Math.round(sellingPrice / effectiveTons)}
        farmerName={profile.fullName}
        farmerPhone={profile.mobile}
        location={profile.location}
        storageCondition={profile.storageCondition}
        language={language === 'te' ? 'te' : 'en'}
      />
    </main>
  );
};
