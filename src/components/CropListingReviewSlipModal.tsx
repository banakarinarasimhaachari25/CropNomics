import React from 'react';

interface CropListingReviewSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSell: () => void;
  cropName: string;
  cropTeluguName?: string;
  cropImage?: string;
  quantityTons: number;
  expectedPricePerTon: number;
  farmerName?: string;
  farmerPhone?: string;
  location?: string;
  storageCondition?: string;
  harvestDate?: string;
  language?: 'en' | 'te';
}

export const CropListingReviewSlipModal: React.FC<CropListingReviewSlipModalProps> = ({
  isOpen,
  onClose,
  onConfirmSell,
  cropName,
  cropTeluguName,
  cropImage,
  quantityTons,
  expectedPricePerTon,
  farmerName = 'రామేష్ వర్మ (Ramesh Varma)',
  farmerPhone = '+91 98480 23456',
  location = 'Guntur, Andhra Pradesh',
  storageCondition = 'ambient',
  harvestDate,
  language = 'en',
}) => {
  if (!isOpen) return null;

  const totalLotValue = quantityTons * expectedPricePerTon;
  const quintals = quantityTons * 10;
  const bags = quantityTons * 20;
  const pricePerQuintal = Math.round(expectedPricePerTon / 10);
  const slipId = `AP-LOT-${Date.now().toString().slice(-6)}`;

  return (
    <div
      id="crop-listing-review-slip-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-7 relative text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step-Back / Close Button at top left & right */}
        <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 dark:border-slate-800 mb-4">
          <button
            type="button"
            onClick={onClose}
            id="btn-slip-step-back"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title={language === 'te' ? 'వెనుకకు' : 'Back'}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400">Slip ID: {slipId}</span>
        </div>

        {/* Official AP Government Slip Header */}
        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-2 shadow-xs border border-emerald-300 dark:border-emerald-700">
            <span className="material-symbols-outlined text-[28px]">verified_user</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
            <span>GOVERNMENT OF ANDHRA PRADESH • AP RYTHU BHAROSA</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {language === 'te' ? 'మార్కెట్ విక్రయ రసీదు స్లిప్' : 'AP Crop Market Listing Review Slip'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'te'
              ? 'మార్కెట్‌లో నమోదు చేయడానికి ముందు మీ పంట వివరాలను ధృవీకరించండి'
              : 'Review your crop lot details before publishing to registered AP buyers'}
          </p>
        </div>

        {/* Crop Details Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-3">
            {cropImage && (
              <img
                src={cropImage}
                alt={cropName}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400">
                {language === 'te' ? 'ఎంచుకున్న పంట' : 'Selected Commodity'}
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                {cropName}
              </h3>
              {cropTeluguName && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{cropTeluguName}</p>
              )}
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-mono font-bold">
                Grade A+ Produce
              </span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                {language === 'te' ? 'మొత్తం పరిమాణం' : 'Harvest Quantity'}
              </span>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                {quantityTons} Tons
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                ({quintals} Quintals / {bags} Bags)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                {language === 'te' ? 'ఆశించిన ధర' : 'Expected Rate'}
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                ₹{expectedPricePerTon.toLocaleString('en-IN')}{' '}
                <span className="text-[10px] text-slate-400 font-normal">/ Ton</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                (₹{pricePerQuintal.toLocaleString('en-IN')} / Quintal)
              </span>
            </div>
          </div>

          {/* Total Valuation Row */}
          <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                {language === 'te' ? 'అంచనా మొత్తం ఆదాయం' : 'Total Expected Lot Value'}
              </span>
              <span className="text-xs text-emerald-900 dark:text-emerald-400">
                100% Direct AP Rythu Settlement
              </span>
            </div>
            <div className="font-black text-xl text-emerald-800 dark:text-emerald-300 font-mono">
              ₹{totalLotValue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Farmer & Location Info */}
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-mono text-[11px]">Farmer Beneficiary:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{farmerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-mono text-[11px]">Contact Mobile:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{farmerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-mono text-[11px]">Farm Gate Location:</span>
            <span className="text-slate-800 dark:text-slate-200">{location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-mono text-[11px]">Storage Condition:</span>
            <span className="text-slate-800 dark:text-slate-200 capitalize">
              {storageCondition === 'cold_storage' ? 'Refrigerated Cold Storage' : 'Ambient Shade Storage'}
            </span>
          </div>
          {harvestDate && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono text-[11px]">Harvest Date:</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono">{harvestDate}</span>
            </div>
          )}
        </div>

        {/* Quality & Market Disclaimer */}
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
          <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">info</span>
          <span>
            {language === 'te'
              ? 'ఈ స్లిప్‌ను ధృవీకరించిన తర్వాత, మీ పంట లాట్ ఆంధ్రప్రదేశ్ హోల్‌సేల్ మార్కెట్ నెట్‌వర్క్‌లో ట్రేడర్‌లు మరియు రిటైలర్‌లకు కనిపిస్తుంది.'
              : 'Upon clicking "Sell", this crop lot will be registered into the AP Crop Market where licensed traders can send direct purchase requests.'}
          </span>
        </div>

        {/* Action Buttons: Step Back & Prominent 'Sell' Button */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            id="btn-review-slip-back"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title={language === 'te' ? 'వెనుకకు' : 'Back'}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
          </button>

          <button
            type="button"
            id="btn-review-slip-sell"
            onClick={onConfirmSell}
            className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title={language === 'te' ? 'విక్రయించండి' : 'Sell Produce on AP Market'}
          >
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
            <span>{language === 'te' ? 'విక్రయించండి (Sell)' : 'Sell'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
