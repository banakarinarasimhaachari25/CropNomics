import React, { useState } from 'react';
import { CROPS_DATA } from '../data/mockData';

const EXCLUDED_FARMER_CROP_IDS = ['cotton', 'groundnut', 'turmeric', 'sugarcane', 'pulses'];
const ADVISORY_CROPS = CROPS_DATA.filter((c) => !EXCLUDED_FARMER_CROP_IDS.includes(c.id.toLowerCase()));

interface SeasonalPriceAdvisoryPortalProps {
  initialCropId?: string;
  farmerDistrict?: string;
}

export const SeasonalPriceAdvisoryPortal: React.FC<SeasonalPriceAdvisoryPortalProps> = ({
  initialCropId = 'paddy',
  farmerDistrict = 'Guntur',
}) => {
  const [selectedCropId, setSelectedCropId] = useState(() => {
    return EXCLUDED_FARMER_CROP_IDS.includes(initialCropId.toLowerCase()) ? 'paddy' : initialCropId;
  });
  const [harvestDate, setHarvestDate] = useState(
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [storageType, setStorageType] = useState<'ambient_shed' | 'cold_storage' | 'market_godown' | 'custom_facility'>('ambient_shed');
  const [customStorageFacilityName, setCustomStorageFacilityName] = useState<string>('Village Rythu Seva Godown & Silo');
  const [estimatedQuantity, setEstimatedQuantity] = useState(10); // Tons

  const currentCrop = ADVISORY_CROPS.find((c) => c.id === selectedCropId) || ADVISORY_CROPS[0];

  // Calculate days elapsed since harvest
  const daysSinceHarvest = Math.max(
    0,
    Math.floor((Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Advisory calculations
  const basePricePerTon = currentCrop.basePricePerTon || 24000;
  const isPerishable = ['tomatoes', 'chilli', 'onion'].includes(currentCrop.id);

  // Price adjustment based on harvest age and storage
  let recommendedSellPrice = basePricePerTon;
  let advisoryStatus = 'Optimal Sell Window';
  let statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
  let moistureLossPercent = 0;

  if (isPerishable) {
    if (storageType === 'ambient_shed') {
      if (daysSinceHarvest > 4) {
        recommendedSellPrice = Math.round(basePricePerTon * 0.88);
        advisoryStatus = 'Emergency Sell Urged (High Perishability Risk)';
        statusColor = 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-300';
        moistureLossPercent = 4.5;
      } else {
        recommendedSellPrice = Math.round(basePricePerTon * 1.05);
        advisoryStatus = 'Fresh Harvest Premium (Sell Within 48 Hours)';
      }
    } else {
      recommendedSellPrice = Math.round(basePricePerTon * 1.12);
      advisoryStatus = 'Cold Storage Preserved (Hold for Peak Market Window)';
    }
  } else {
    // Grain / dry crop (Paddy, Cotton, Maize, Turmeric)
    if (daysSinceHarvest < 15) {
      recommendedSellPrice = Math.round(basePricePerTon * 1.02);
      advisoryStatus = 'Fair Average Quality (FAQ) Standard Market Rate';
    } else if (daysSinceHarvest >= 15 && daysSinceHarvest <= 60) {
      recommendedSellPrice = Math.round(basePricePerTon * 1.08);
      advisoryStatus = 'Cured Produce Peak Price (Prime Wholesale Buyer Demand)';
    } else {
      recommendedSellPrice = Math.round(basePricePerTon * 0.96);
      moistureLossPercent = 2.1;
      advisoryStatus = 'Extended Holding (Discounted due to storage shrinkage)';
    }
  }

  // Seasonal cycle and farmer free-time calculation
  const seasonalCalendars: Record<
    string,
    {
      season: string;
      sowingMonth: string;
      harvestMonth: string;
      freeTimeSpan: string;
      freeDaysEstimate: number;
      freeTimeSuggestion: string;
      catchCropSuggestion: string;
    }
  > = {
    paddy: {
      season: 'Kharif (Sarva) to Rabi (Dalwa)',
      sowingMonth: 'June - July',
      harvestMonth: 'October - November',
      freeTimeSpan: 'November 15 to December 25',
      freeDaysEstimate: 40,
      freeTimeSuggestion: 'High downtime window! Soil is fertile with residual canal moisture.',
      catchCropSuggestion: 'Broadcast 60-day Urad Dal (మినుములు) or Sunhemp green manure for ₹35,000 added profit before Rabi planting.',
    },
    chilli: {
      season: 'Late Kharif / Extended Annual',
      sowingMonth: 'August - September',
      harvestMonth: 'January - March (Multiple Pickings)',
      freeTimeSpan: 'April 15 to June 30',
      freeDaysEstimate: 75,
      freeTimeSuggestion: 'Hot summer fallow season. Intense sun permits deep summer ploughing.',
      catchCropSuggestion: 'Summer solarization to kill soil-borne wilt pathogens and prepare organic FYM manure beds.',
    },
    cotton: {
      season: 'Kharif Monsoonal',
      sowingMonth: 'June - July',
      harvestMonth: 'November - January',
      freeTimeSpan: 'February 1 to May 15',
      freeDaysEstimate: 90,
      freeTimeSuggestion: 'Post-cotton picking land vacancy.',
      catchCropSuggestion: 'Short-duration watermelon, cucumber, or fodder sorghum crop under drip irrigation.',
    },
    tomatoes: {
      season: 'Perpetual Multi-Season (Madanapalle Track)',
      sowingMonth: 'Year-round rotations (90-day cycles)',
      harvestMonth: 'Continuous 30-day harvest window',
      freeTimeSpan: '15 - 20 days between bed renewal',
      freeDaysEstimate: 18,
      freeTimeSuggestion: 'Quick turn-around between crop blocks.',
      catchCropSuggestion: 'Quick marigold intercropping to repel soil nematodes and sell festive flowers.',
    },
    maize: {
      season: 'Kharif / Rabi dual cycle',
      sowingMonth: 'October - November (Rabi)',
      harvestMonth: 'February - March',
      freeTimeSpan: 'April 1 to June 10',
      freeDaysEstimate: 70,
      freeTimeSuggestion: 'Pre-monsoon downtime before Kharif arrival.',
      catchCropSuggestion: 'Short-season cowpea or sesame (నువ్వులు) rotation for soil nitrogen enrichment.',
    },
  };

  const cropSchedule = seasonalCalendars[selectedCropId] || seasonalCalendars.paddy;

  return (
    <div
      id="seasonal-price-advisory-portal"
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-6"
    >
      {/* Portal Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ₹
            </span>
            <h2 className="text-xl font-black text-on-surface">Seasonal Crop Price & Harvest Advisory</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Data-backed guidance on optimal selling prices based on harvest age, storage condition, and agricultural downtime
          </p>
        </div>

        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 rounded-full font-mono text-xs font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span>{farmerDistrict} AP Agro-Climatic Zone</span>
        </div>
      </div>

      {/* Visual Crop Image Selector Strip */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-emerald-600 text-base">photo_library</span>
          <span>Select Commodity to View Advisory</span>
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {ADVISORY_CROPS.map((c) => {
            const isSelected = c.id === selectedCropId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCropId(c.id)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-surface border-outline-variant hover:border-emerald-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                  <img
                    src={c.image}
                    alt={c.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-on-surface whitespace-nowrap">
                    {c.name.split('(')[0].trim()}
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-mono">
                    ₹{(c.basePricePerTon || 24000).toLocaleString('en-IN')}/T
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Crop Spotlight Banner */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden shrink-0 border border-outline-variant shadow-xs">
          <img
            src={currentCrop.image}
            alt={currentCrop.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-black text-on-surface">{currentCrop.name}</h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              {currentCrop.teluguName}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant line-clamp-2 mb-2 leading-relaxed">
            {currentCrop.tagline || currentCrop.description}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant text-on-surface font-mono font-bold">
              Base MSP: ₹{(currentCrop.basePricePerTon || 24000).toLocaleString('en-IN')}/Ton
            </span>
            <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant text-on-surface">
              Perishability: {currentCrop.perishabilityLevel || 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Input Form Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Select Your Crop (పంట)
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-medium focus:border-emerald-600 focus:outline-hidden"
          >
            {ADVISORY_CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.teluguName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Harvest Date (కోత కోసిన తేదీ)
          </label>
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
          >
          </input>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Storage Facility Available
          </label>
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-medium focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ambient_shed">Farm Gate Ambient Shed (ఓపెన్ షెడ్)</option>
            <option value="cold_storage">RBK / Commercial Cold Storage (శీతల గోదాము)</option>
            <option value="market_godown">APMC Agricultural Market Godown (మార్కెట్ యార్డ్)</option>
            <option value="custom_facility">✍️ Enter Custom / Own Storage Facility Manually</option>
          </select>

          {storageType === 'custom_facility' && (
            <div className="mt-2 animate-in fade-in">
              <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                Custom Storage Facility Name / Location *
              </label>
              <input
                type="text"
                value={customStorageFacilityName}
                onChange={(e) => setCustomStorageFacilityName(e.target.value)}
                placeholder="e.g. Sri Venkateswara Godown, Chilakaluripet or On-farm Aerated Silo"
                className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs font-medium focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Produce Lot Size (Tons)
          </label>
          <input
            type="number"
            min="1"
            value={estimatedQuantity}
            onChange={(e) => setEstimatedQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Target Price Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recommended Price Callout */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                RECOMMENDED SELLING PRICE RECOMMENDATION
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                Harvest Age: {daysSinceHarvest} Days Ago
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono">
                ₹{recommendedSellPrice.toLocaleString('en-IN')}{' '}
                <span className="text-lg text-white font-normal font-sans">/ Ton</span>
              </div>
              <div className="text-sm font-mono text-emerald-300">
                (≈ ₹{Math.round(recommendedSellPrice / 10).toLocaleString('en-IN')} / Quintal)
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs font-medium ${statusColor}`}>
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                {advisoryStatus}
              </div>
              <p className="mt-0.5 opacity-90">
                {storageType === 'custom_facility'
                  ? `Produce stored at ${customStorageFacilityName || 'Manual Storage Facility'}: calibrated for optimal shelf life and market rate protection.`
                  : isPerishable
                  ? 'Perishable commodity: high moisture transpiration reduces saleable crate weight. Direct sale to verified trader provides highest net realization.'
                  : 'Storable grain: Market arrival volumes in Guntur & Krishna are steady. Current price exceeds AP Govt Minimum Support Price (MSP).'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[10px]">Total Est. Value</div>
                <div className="font-bold text-white text-sm">
                  ₹{(recommendedSellPrice * estimatedQuantity).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[10px]">Market Benchmark</div>
                <div className="font-bold text-emerald-400 text-sm">
                  ₹{basePricePerTon.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[10px]">Moisture Decay</div>
                <div className="font-bold text-amber-400 text-sm">
                  {moistureLossPercent > 0 ? `-${moistureLossPercent}%` : 'Negligible'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free-Time & Seasonal Downtime Planner (Feature 14 requirement) */}
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-700 text-[22px]">event_available</span>
              <h3 className="font-bold text-on-surface text-sm">Seasonal Free-Time Planner</h3>
            </div>

            <div className="bg-amber-100/60 dark:bg-amber-900/40 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-xs mb-3">
              <div className="text-[10px] uppercase font-mono text-amber-900 dark:text-amber-200 font-bold">
                Upcoming Agricultural Fallow Window
              </div>
              <div className="font-black text-amber-950 dark:text-amber-100 text-base font-mono">
                {cropSchedule.freeDaysEstimate} Days Free ({cropSchedule.freeTimeSpan})
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                {cropSchedule.freeTimeSuggestion}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">psychology</span>
                High-Value Free-Time Action
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                {cropSchedule.catchCropSuggestion}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200 dark:border-amber-800 text-[10px] text-on-surface-variant flex items-center justify-between font-mono">
            <span>Cycle: {cropSchedule.season}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">AP Agro Guide</span>
          </div>
        </div>
      </div>
    </div>
  );
};
