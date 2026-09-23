import React, { useState, useEffect, useMemo } from 'react';
import { ANDHRA_PRADESH_DISTRICTS, CROPS_DATA, INITIAL_FARMER_LISTINGS, TRANSLATIONS } from '../data/mockData';
import { db, getTraderFarmerListingsForCrop, matchesCrop } from '../data/db';
import { AppScreen, FarmerListing, LanguageCode, TraderIdentity, RetailerBooking } from '../types';
import { getCropImageByName } from '../utils/cropImageHelper';
import { TraderIdentityCard } from './TraderIdentityCard';
import { TraderOnboardingGate } from './TraderOnboardingGate';
import { SendTradeRequestModal } from './SendTradeRequestModal';
import { TraderRouteMapModal } from './TraderRouteMapModal';
import { TradeRequestsPortal } from './TradeRequestsPortal';
import { OfflineReceiptModal } from './OfflineReceiptModal';
import { TraderBidSlipModal, TermsAndConditionsModal, QuickFeedbackModal } from './Modals';
import { MyAddressModal } from './MyAddressModal';

interface TraderMarketScreenProps {
  language: LanguageCode;
  onContactFarmer: (farmer: FarmerListing) => void;
  onSendMessage: (farmer: FarmerListing) => void;
  onNavigateToDashboard?: (screen: AppScreen) => void;
}

export const TraderMarketScreen: React.FC<TraderMarketScreenProps> = ({
  language,
  onContactFarmer,
  onSendMessage,
  onNavigateToDashboard,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy (వరి)');
  const [customCropSearch, setCustomCropSearch] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Guntur');
  const [quantityFilter, setQuantityFilter] = useState<number>(30);
  
  const effectiveCrop = (customCropSearch.trim() || selectedCrop);

  // Helper to get strictly matching farmer listings for this crop with recently added farmers on top
  const getCropFarmers = (crop: string, district: string, qty: number): FarmerListing[] => {
    return getTraderFarmerListingsForCrop(crop, district, qty);
  };

  const [farmersList, setFarmersList] = useState<FarmerListing[]>(() => 
    getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter)
  );

  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(() => {
    const initial = getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter);
    return initial[0]?.id || 'farmer-1';
  });

  const [targetMargin, setTargetMargin] = useState<number>(15.5);
  const [filterAppliedMessage, setFilterAppliedMessage] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

  // Update listings whenever effectiveCrop, district, or quantity changes or central DB changes
  useEffect(() => {
    const updated = getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter);
    setFarmersList(updated);
    if (updated.length > 0) {
      setSelectedFarmerId((prev) => {
        const stillExists = updated.find((f) => f.id === prev);
        return stillExists ? prev : updated[0].id;
      });
    }
  }, [effectiveCrop, selectedDistrict, quantityFilter]);

  // Subscribe to DB updates (e.g. when a farmer registers or adds a crop lot)
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const updated = getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter);
      setFarmersList(updated);
    });
    return unsubscribe;
  }, [effectiveCrop, selectedDistrict, quantityFilter]);

  // Trader Identity State
  const [traderIdentity, setTraderIdentity] = useState<TraderIdentity | null>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_trader_identity');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isTraderSaved, setIsTraderSaved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_trader_identity');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed?.name && parsed?.phoneNumber);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const handleSaveTraderIdentity = (identity: TraderIdentity) => {
    setTraderIdentity(identity);
    setIsTraderSaved(true);
    try {
      localStorage.setItem('cropnomics_trader_identity', JSON.stringify(identity));
    } catch (e) {
      console.error(e);
    }
  };

  const [showSendRequestModal, setShowSendRequestModal] = useState<boolean>(false);
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);
  const [traderSubTab, setTraderSubTab] = useState<'sourcing' | 'requests' | 'retailer_bookings'>('sourcing');
  const [showOfflineReceiptModal, setShowOfflineReceiptModal] = useState<boolean>(false);
  const [showTraderBidSlipModal, setShowTraderBidSlipModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);

  // Central Database State for Retailer Bookings (Requirement 13)
  const [dbTick, setDbTick] = useState<number>(0);
  useEffect(() => {
    return db.subscribe(() => setDbTick((c) => c + 1));
  }, []);

  const retailerBookings = useMemo(() => {
    return db.getTraderRetailBookings(traderIdentity?.phoneNumber);
  }, [dbTick, traderIdentity?.phoneNumber]);

  const paymentUpdates = useMemo(() => {
    return db.getPaymentUpdates('trader');
  }, [dbTick]);

  const activeFarmer = farmersList.find((f) => f.id === selectedFarmerId) || farmersList[0] || INITIAL_FARMER_LISTINGS[0];

  // Dynamic calculations based on margin
  const buyingPrice = activeFarmer?.estPriceTotal || 45000;
  const targetSellingPrice = Math.round(buyingPrice * (1 + targetMargin / 100));

  const handleApplyFilters = () => {
    setIsFilterLoading(true);

    setTimeout(() => {
      const updated = getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter);
      setFarmersList(updated);
      if (updated.length > 0) {
        setSelectedFarmerId(updated[0].id);
      }
      setIsFilterLoading(false);
      
      const successMsg = language === 'te' 
        ? `${effectiveCrop} కోసం తాజా రైతుల జాబితా లోడ్ చేయబడింది (${updated.length} మంది)!`
        : `Showing latest lots for ${effectiveCrop} in ${selectedDistrict} (${updated.length} verified farmers).`;
      
      setFilterAppliedMessage(successMsg);
      setTimeout(() => setFilterAppliedMessage(null), 4000);
    }, 300);
  };

  if (!isTraderSaved) {
    return (
      <div className="w-full max-w-4xl mx-auto py-2">
        <TraderOnboardingGate
          language={language}
          initialData={traderIdentity}
          onSaveAndContinue={handleSaveTraderIdentity}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ========================================================= */}
      {/* DEDICATED TRADER DASHBOARD HERO HEADER                    */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2a1708] via-[#201205] to-[#120802] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {language === 'te'
                  ? 'ఆంధ్రప్రదేశ్ ప్రత్యక్ష ట్రేడర్ నెట్‌వర్క్'
                  : 'AP Direct Wholesale Silos'}
              </span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-400 text-3xl sm:text-4xl">
                local_shipping
              </span>
              <span>
                {language === 'te'
                  ? 'ట్రేడర్ డాష్‌బోర్డ్ (Trader Dashboard)'
                  : 'Trader Procurement & Logistics Dashboard'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-2xl mt-1.5 leading-relaxed">
              {language === 'te'
                ? 'రైతుల శోధన, తేమ శాతం ధృవీకరణ, హోల్‌సేల్ మార్జిన్ విశ్లేషణ, ప్రత్యక్ష బిడ్డింగ్ & లాజిస్టిక్స్ రవాణా.'
                : 'Direct AP farmer lot sourcing, moisture verification, wholesale margin analyzer, trade requests & cold-chain transit.'}
            </p>
          </div>
        </div>

        {/* Live Trader Sub-Tab Navigation Bar with Clear Descriptive Labels */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 gap-2">
            <button
              id="trader-subtab-sourcing"
              type="button"
              onClick={() => setTraderSubTab('sourcing')}
              title={language === 'te' ? 'రైతుల లాట్లు & సోర్సింగ్' : 'AP Farm Sourcing & Lots'}
              aria-label="Farm Sourcing"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                traderSubTab === 'sourcing'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">manage_search</span>
              <span>{language === 'te' ? 'రైతుల లాట్లు' : 'Farm Lots Sourcing'}</span>
            </button>

            <button
              id="trader-subtab-requests"
              type="button"
              onClick={() => setTraderSubTab('requests')}
              title={
                language === 'te'
                  ? 'వ్యాపార అభ్యర్థనలు & రసీదులు'
                  : 'Trade Requests & Receipts'
              }
              aria-label="Trade Requests"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                traderSubTab === 'requests'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>{language === 'te' ? 'ట్రేడ్ అభ్యర్థనలు' : 'Trade Requests'}</span>
            </button>

            <button
              id="trader-subtab-retailer-bookings"
              type="button"
              onClick={() => setTraderSubTab('retailer_bookings')}
              title={
                language === 'te'
                  ? 'రిటైలర్ల నుండి ఆర్డర్లు (హోల్‌సేల్ బుకింగ్‌లు)'
                  : `Retailer Orders (${retailerBookings.length})`
              }
              aria-label="Retailer Orders"
              className={`relative px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                traderSubTab === 'retailer_bookings'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">store</span>
              <span>{language === 'te' ? 'రిటైలర్ ఆర్డర్లు' : 'Retailer Orders'}</span>
              {retailerBookings.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-mono font-bold">
                  {retailerBookings.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOfflineReceiptModal(true)}
              title={language === 'te' ? 'ఆఫ్‌లైన్ రసీదు అప్‌లోడ్' : 'Upload Offline Receipt'}
              aria-label="Upload Offline Receipt"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs hover:scale-105"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>{language === 'te' ? 'రసీదు అప్‌లోడ్' : 'Upload Receipt'}</span>
            </button>

            {/* My Address Trigger (as in consumer dashboard) */}
            <button
              type="button"
              id="btn-trader-profile-address"
              onClick={() => setShowAddressModal(true)}
              title={language === 'te' ? 'నా చిరునామా (వేర్‌హౌస్ & మండి డిపో)' : 'My Address (Warehouse & Mandi Depot)'}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
              <span>{language === 'te' ? 'నా చిరునామా' : 'My Address'}</span>
            </button>

            <button
              type="button"
              id="btn-trader-terms"
              onClick={() => setShowTermsModal(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Terms & Rules"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">gavel</span>
              <span className="hidden sm:inline">Terms & Rules</span>
            </button>

            <button
              type="button"
              id="btn-trader-feedback"
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Feedback"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">rate_review</span>
              <span className="hidden sm:inline">Feedback</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trader Identity Card */}
      <TraderIdentityCard
        language={language}
        traderIdentity={traderIdentity}
        onSaveTraderIdentity={handleSaveTraderIdentity}
      />

      {/* SUB-VIEW 1: TRADE REQUESTS & RECEIPTS */}
      {traderSubTab === 'requests' ? (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
          {/* Step Back Button */}
          <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <button
              id="btn-back-to-trader-sourcing"
              type="button"
              onClick={() => {
                setTraderSubTab('sourcing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {language === 'te' ? 'వ్యాపార అభ్యర్థనలు & రసీదులు' : 'Trade Requests & Offline Receipts'}
            </span>
          </div>

          <TradeRequestsPortal
            role="trader"
            userPhoneOrId={traderIdentity?.phoneNumber || '+91 98482 77889'}
            userName={traderIdentity?.name || 'Venkateswara Rao'}
            onRequestAccepted={() => {
              setFarmersList(getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter));
            }}
          />
        </div>
      ) : traderSubTab === 'retailer_bookings' ? (
        /* SUB-VIEW 3: RETAILER PROCUREMENT BOOKINGS (Req 13) */
        <div className="w-full space-y-6 animate-in fade-in">
          {/* Step Back Button */}
          <div className="pb-1 flex items-center justify-between">
            <button
              id="btn-back-to-trader-sourcing-from-bookings"
              type="button"
              onClick={() => {
                setTraderSubTab('sourcing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back to Sourcing'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back to Farm Lots'}</span>
            </button>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
              {language === 'te' ? 'రిటైలర్ల ఆర్డర్లు & హోల్‌సేల్ రవాణా' : 'Retailer Wholesale Mandi Orders & Logistics'}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-2xl">store</span>
                <h2 className="text-xl font-black text-slate-900">
                  {language === 'te' ? 'రిటైలర్ ఆర్డర్లు (హోల్‌సేల్ బుకింగ్‌లు)' : 'Retailer Mandi Procurement Bookings'}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'te'
                  ? 'ఆంధ్రప్రదేశ్ మార్కెట్ యార్డులో రిటైలర్ల నుండి వచ్చిన కొనుగోలు ఆర్డర్లు, ఎస్క్రో రక్షణ మరియు రవాణా వివరాలు'
                  : 'Orders placed by registered retailers across AP with funds held securely in AP Digital Escrow.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">verified_user</span>
                <span>Direct Escrow Settlements</span>
              </span>
            </div>
          </div>

          {retailerBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-amber-700 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">inbox</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">No Retailer Bookings Received Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When retailers book lots from your active Mandi inventory, their orders will appear here for dispatch and payment release.
              </p>
              <button
                type="button"
                onClick={() => setTraderSubTab('sourcing')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all"
              >
                View Farmer Lots Sourcing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {retailerBookings.map((booking) => {
                const bookingImg = getCropImageByName(booking.cropName);
                const cleanPhone = (booking.retailerPhone || '').replace(/[^0-9+]/g, '');

                return (
                  <div
                    key={booking.id || booking.orderNumber}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Header row */}
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-800">
                              #{booking.orderNumber || booking.id}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                booking.status === 'completed' || booking.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : booking.status === 'dispatched' || booking.status === 'In Transit'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            Received: {new Date(booking.bookedAt || booking.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="font-price-display font-black text-base text-emerald-700">
                          ₹{booking.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="flex gap-4 pt-3 items-center">
                        <div className="w-18 h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={bookingImg}
                            alt={booking.cropName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{booking.cropName}</h4>
                          <p className="text-xs text-slate-600 font-mono">
                            Quantity: <strong>{booking.bags} Bags</strong> (~{booking.tons} Tons) @ ₹{booking.pricePerBag}/bag
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="material-symbols-outlined text-[14px] text-amber-600">storefront</span>
                            <span>Retailer: <strong className="text-slate-900">{booking.retailerName}</strong></span>
                            {booking.retailerShopName && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{booking.retailerShopName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Escrow Status Bar */}
                      <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] flex justify-between items-center text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                          <span>Escrow: <strong className="text-emerald-700">{booking.paymentStatus === 'settled' ? 'Released to Account' : 'Locked & Guaranteed'}</strong></span>
                        </div>
                        <span className="font-mono text-slate-500">
                          {booking.retailerAddress || 'AP Retail Delivery'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="bg-[#0d5c2e] hover:bg-[#14532d] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        title="Contact Retailer Directly"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>Contact this number ({booking.retailerPhone})</span>
                      </a>

                      <div className="flex items-center gap-2">
                        {booking.status === 'booked' && (
                          <button
                            type="button"
                            onClick={() => {
                              db.updateRetailerBookingStatus(booking.id || booking.orderNumber || '', 'confirmed');
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                            <span>Confirm Order</span>
                          </button>
                        )}

                        {(booking.status === 'confirmed' || booking.status === 'booked') && (
                          <button
                            type="button"
                            onClick={() => {
                              db.updateRetailerBookingStatus(booking.id || booking.orderNumber || '', 'In Transit');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                            <span>Dispatch Lot</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                          title="Print Gate Pass / Invoice"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trader Payment Updates Ledger (Requirement 19) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-2xl">account_balance_wallet</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Trader Settlements & Clearing Ledger</h3>
                  <p className="text-xs text-slate-500">Live incoming escrow guarantees and farmer payment settlements</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                AP Mandi Clearing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paymentUpdates.slice(0, 6).map((update) => (
                <div
                  key={update.id}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] text-slate-500">#{update.referenceId || update.utrNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        update.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {update.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-900 font-semibold truncate max-w-[180px]">{update.description || update.purpose}</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      ₹{update.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                    <span>{update.date || new Date(update.timestamp).toLocaleDateString('en-IN')}</span>
                    <span>{update.paymentMethod || update.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* SUB-VIEW 2: SOURCING & DIRECT LOTS */
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6">

      {/* Toast message if filter applied */}
      {filterAppliedMessage && (
        <div className="col-span-12 bg-primary/10 border border-primary/30 text-primary p-3.5 rounded-xl flex items-center justify-between text-sm font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{filterAppliedMessage}</span>
          </div>
          <span className="text-xs bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-mono font-bold">
            Live AP Trade
          </span>
        </div>
      )}

      {/* Left Column: Search & Filters */}
      <aside className="col-span-1 md:col-span-3 space-y-6">
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 sm:p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
              {t.marketFilters}
            </h2>
            <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">
              CropNomics Direct
            </span>
          </div>

          <div className="space-y-4">
            {/* Crop Type Dropdown */}
            <div>
              <label
                htmlFor="filter-crop-type"
                className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 uppercase font-medium"
              >
                {t.cropType}
              </label>
              <div className="relative">
                <select
                  id="filter-crop-type"
                  value={selectedCrop}
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    setCustomCropSearch('');
                  }}
                  className="w-full h-12 bg-surface-container border border-outline-variant rounded-lg px-4 font-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Paddy (వరి)">Paddy / Rice (వరి - BPT/Sona Masoori)</option>
                  <option value="Chilli (మిర్చి)">Red Chilli (గుంటూరు మిర్చి - Teja/Guntur)</option>
                  <option value="Cotton (పత్తి)">Cotton (పత్తి - BT Cotton)</option>
                  <option value="Maize (మొక్కజొన్న)">Maize / Corn (మొక్కజొన్న)</option>
                  <option value="Tomatoes (టమోటా)">Tomatoes (టమోటా - Madanapalle)</option>
                  <option value="Groundnut (వేరుశనగ)">Groundnut (వేరుశనగ - Anantapur)</option>
                  <option value="Turmeric (పసుపు)">Turmeric (పసుపు - Duggirala/Guntur)</option>
                  <option value="Sugarcane (చెరకు)">Sugarcane (చెరకు - Anakapalle)</option>
                  <option value="Pulses (కందులు / మినుములు)">Pulses / Red Gram (కందులు / మినుములు)</option>
                  <option value="Bengal Gram (శనగలు)">Bengal Gram / Chickpea (శనగలు - Prakasam/Kurnool)</option>
                  <option value="Onion (ఉల్లిపాయలు)">Onion (ఉల్లిపాయలు - Kurnool)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Custom Crop Search / Type */}
            <div>
              <label
                htmlFor="filter-crop-search"
                className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 uppercase font-medium"
              >
                {language === 'te' ? 'పంట పేరు వెతకండి / టైప్ చేయండి' : 'Or Type Required Crop'}
              </label>
              <div className="relative">
                <input
                  id="filter-crop-search"
                  type="text"
                  value={customCropSearch}
                  onChange={(e) => setCustomCropSearch(e.target.value)}
                  placeholder={language === 'te' ? 'ఉదా: వరి, మిర్చి, పసుపు, టమాట...' : 'e.g. Paddy, Turmeric, Chilli, Onion...'}
                  className="w-full h-11 bg-surface-container border border-outline-variant rounded-lg pl-9 pr-8 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-[18px]">
                  search
                </span>
                {customCropSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomCropSearch('')}
                    className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-[18px] hover:text-on-surface"
                  >
                    close
                  </button>
                )}
              </div>
            </div>

            {/* AP Location / District */}
            <div>
              <label
                htmlFor="filter-location"
                className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 uppercase font-medium"
              >
                {t.nearbyArea} (AP District)
              </label>
              <div className="relative">
                <select
                  id="filter-location"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full h-12 bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 font-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {ANDHRA_PRADESH_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">
                  location_on
                </span>
                <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Quantity Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="filter-quantity-slider"
                  className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium"
                >
                  {t.quantityTons} / Quintals
                </label>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {quantityFilter} Tons
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1 font-mono">
                <span>5 Tons</span>
                <span>100+ Tons</span>
              </div>
              <input
                id="filter-quantity-slider"
                type="range"
                min="5"
                max="100"
                step="5"
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-variant rounded-full appearance-none accent-primary cursor-pointer"
              />
            </div>

            <button
              id="btn-apply-market-filters"
              type="button"
              onClick={handleApplyFilters}
              disabled={isFilterLoading}
              className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm cursor-pointer mt-2 active:scale-98 disabled:opacity-60"
            >
              {isFilterLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>{language === 'te' ? 'జాబితా లోడ్ అవుతోంది...' : 'Fetching Farmers...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  <span>{t.applyFilters}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Grain Quality Guide banner */}
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 font-bold text-primary mb-1">
            <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
            <span>AP Agmarknet Quality Standards</span>
          </div>
          <p>Grade A standard: ≤ 12.5% moisture. Direct digital test certificates included with every Andhra Pradesh listed lot.</p>
        </div>
      </aside>

      {/* Middle Column: Results List */}
      <section className="col-span-1 md:col-span-5 space-y-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
              {t.availableFarmers}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {selectedDistrict} District ({selectedCrop})
            </p>
          </div>
          <span className="font-label-sm text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-bold">
            {farmersList.length} {t.results}
          </span>
        </div>

        <div className="space-y-3.5">
          {farmersList.map((farmer) => {
            const isSelected = activeFarmer?.id === farmer.id;
            return (
              <div
                key={farmer.id}
                id={`farmer-listing-${farmer.id}`}
                onClick={() => setSelectedFarmerId(farmer.id)}
                className={`bg-surface-container-lowest rounded-xl overflow-hidden cursor-pointer relative transition-all duration-200 ${
                  isSelected
                    ? 'border-2 border-primary shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-1 ring-primary/20 scale-[1.01]'
                    : 'border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-primary opacity-85 hover:opacity-100'
                }`}
              >
                {/* Recently Added by Farmer Badge */}
                {((farmer.id && farmer.id.startsWith('listing-ap-')) || db.getState().farmerListings.some(l => l.id === farmer.id)) && (
                  <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                    <span>{language === 'te' ? 'తాజా నమోదు' : 'Recently Added'}</span>
                  </div>
                )}

                {/* Grade Badge */}
                <div
                  className={`absolute top-3 right-3 font-label-sm text-xs px-2.5 py-1 rounded-full z-10 flex items-center gap-1 font-bold shadow-xs ${
                    (farmer.grade || '').includes('A')
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {(farmer.grade || '').includes('A') ? 'star' : 'verified'}
                  </span>
                  <span>{farmer.grade || 'Standard Grade'}</span>
                </div>

                <div className="flex flex-col sm:flex-row h-full">
                  <div className="sm:w-1/3 h-32 sm:h-auto relative overflow-hidden bg-surface-container">
                    <img
                      src={farmer.image || getCropImageByName(farmer.cropName || farmer.variety || effectiveCrop)}
                      alt={farmer.cropName || farmer.farmerName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCropImageByName(farmer.cropName || farmer.variety || effectiveCrop);
                      }}
                    />
                  </div>
                  <div className="p-4 sm:w-2/3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-body-lg text-body-lg font-bold text-on-surface">
                          {farmer.farmerName}
                        </h3>
                        {farmer.verified && (
                          <span
                            className="material-symbols-outlined text-secondary text-[16px]"
                            title="Verified AP Farmer"
                          >
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {farmer.cropName}
                      </p>
                      <p className="font-body-md text-on-surface-variant text-xs mt-0.5 line-clamp-1">
                        {farmer.variety}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-outline-variant/30 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-outline text-[16px]">scale</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                          {farmer.tons} Tons
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-outline text-[16px]">
                          location_on
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {farmer.distanceMiles} km away
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Right Column: Details & Price Analysis */}
      <section className="col-span-1 md:col-span-4 flex flex-col gap-5">
        {/* Contact Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] p-5 sm:p-6 border-t-4 border-primary border-x border-b border-outline-variant/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-highest shadow-sm border-2 border-emerald-500/30 flex-shrink-0">
              <img
                src={activeFarmer?.image || getCropImageByName(activeFarmer?.cropName || activeFarmer?.variety || effectiveCrop)}
                alt={activeFarmer?.cropName || activeFarmer?.farmerName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCropImageByName(activeFarmer?.cropName || effectiveCrop);
                }}
              />
            </div>
            <div>
              <h2 className="font-headline-lg-mobile text-xl font-bold text-on-surface">
                {activeFarmer?.farmerName}
              </h2>
              <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm">AP Verified Farmer • {activeFarmer?.tons || 20} Tons</span>
              </div>
              <span className="text-xs text-on-surface-variant">{activeFarmer?.location}</span>
            </div>
          </div>

          <p className="font-body-md text-sm text-on-surface-variant mb-5 italic bg-surface-container-low p-3 rounded-lg border-l-2 border-primary">
            "{activeFarmer?.description}"
          </p>

          {/* Action Buttons converted to Icon Buttons with tooltips */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            <button
              id="btn-trader-screen-send-req"
              type="button"
              onClick={() => setShowSendRequestModal(true)}
              title={language === 'te' ? 'కొనుగోలు అభ్యర్థనను పంపండి (Send Request)' : 'Send Procurement Request'}
              aria-label="Send Procurement Request"
              className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
            </button>

            <button
              id="btn-trader-screen-route-map"
              type="button"
              onClick={() => setShowRouteModal(true)}
              title={language === 'te' ? 'రైతు వద్దకు రూట్ మ్యాప్ & నావిగేషన్ (Route Map)' : 'Minimap & Optimized Route'}
              aria-label="Minimap & Optimized Route"
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">map</span>
            </button>

            <button
              id="btn-trader-bid-slip"
              type="button"
              onClick={() => setShowTraderBidSlipModal(true)}
              title={language === 'te' ? 'రసీదు / అధికారిక బిడ్ స్లిప్ (Stamped Bid Slip)' : 'Generate AP Stamped Bid Slip'}
              aria-label="Generate AP Stamped Bid Slip"
              className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            </button>

            <button
              id="btn-trader-upload-receipt-direct"
              type="button"
              onClick={() => setShowOfflineReceiptModal(true)}
              title={language === 'te' ? 'రసీదు అప్‌లోడ్ (Upload Receipt)' : 'Upload Offline / Paid Receipt'}
              aria-label="Upload Paid Receipt"
              className="h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </button>

            <button
              id="btn-contact-farmer"
              type="button"
              onClick={() => onContactFarmer(activeFarmer)}
              title={language === 'te' ? 'రైతుకు సందేశం / కాల్ (Message Farmer)' : 'Direct Message / Contact Farmer'}
              aria-label="Contact Farmer"
              className="h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary-container transition-all shadow-sm cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">call</span>
            </button>

            <button
              id="btn-send-message-farmer"
              type="button"
              onClick={() => onSendMessage(activeFarmer)}
              title={t.sendMessage || 'Chat / Message'}
              aria-label="Chat / Message"
              className="h-12 bg-surface text-primary border-2 border-primary rounded-xl flex items-center justify-center hover:bg-surface-container transition-all cursor-pointer hover:scale-105"
            >
              <span className="material-symbols-outlined text-[22px]">chat</span>
            </button>
          </div>
        </div>

        {/* Price Analysis Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 sm:p-6 border border-outline-variant/30">
          <h3 className="font-headline-lg-mobile text-xl font-bold text-on-surface mb-1">
            {t.priceAnalysis}
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-5">
            {t.marginRangeNote}
          </p>

          <div className="space-y-5">
            <div className="flex justify-between items-end border-b border-outline-variant pb-2">
              <span className="font-body-md text-on-surface-variant text-sm">
                {t.estBuyingPrice}
              </span>
              <span className="font-price-display text-2xl font-extrabold text-on-surface">
                ₹{buyingPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-body-md font-bold text-on-surface text-sm">
                  {t.targetSellingPrice}
                </span>
                <span className="font-body-lg text-xl font-bold text-primary">
                  ₹{targetSellingPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Visual Slider for Margin */}
              <div className="relative pt-6 pb-2">
                {/* Track */}
                <div className="h-4 bg-surface-container-high rounded-full w-full absolute top-1/2 -translate-y-1/2"></div>

                {/* Highlighted Target Range (12-18% sweet spot) */}
                <div
                  className="h-4 bg-secondary-container rounded-full absolute top-1/2 -translate-y-1/2 border border-secondary/30"
                  style={{ left: '12%', width: '15%' }}
                  title="Recommended target zone: 12% - 20%"
                ></div>

                {/* Real input slider overlaid */}
                <input
                  id="target-margin-slider"
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value))}
                  className="w-full absolute top-1/2 -translate-y-1/2 opacity-0 h-8 cursor-pointer z-20"
                />

                {/* Custom Styled Current Marker */}
                <div
                  className="w-8 h-8 bg-secondary border-2 border-surface-container-lowest rounded-full absolute top-1/2 -translate-y-1/2 shadow-md cursor-pointer flex items-center justify-center transition-all pointer-events-none z-10 -ml-4"
                  style={{ left: `${Math.min(95, Math.max(5, (targetMargin / 50) * 100))}%` }}
                >
                  <span className="material-symbols-outlined text-on-secondary text-[16px]">
                    drag_indicator
                  </span>
                </div>

                {/* Labels */}
                <div className="flex justify-between mt-6 text-xs font-mono">
                  <span className="text-on-surface-variant font-label-sm">0%</span>
                  <span className="text-secondary font-bold font-label-sm bg-secondary-container/40 px-2 py-0.5 rounded">
                    {targetMargin.toFixed(1)}% {language === 'te' ? 'మార్జిన్' : 'Margin'}
                  </span>
                  <span className="text-on-surface-variant font-label-sm">50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
      )}

      {/* Feature 2: Send Trade Request Modal */}
      {showSendRequestModal && (
        <SendTradeRequestModal
          isOpen={showSendRequestModal}
          onClose={() => setShowSendRequestModal(false)}
          farmerListing={activeFarmer}
          traderIdentity={traderIdentity}
          onSuccess={() => {
            setShowSendRequestModal(false);
          }}
        />
      )}

      {/* Feature 3 & 9: Route Minimap & Route Optimization Modal */}
      {showRouteModal && (
        <TraderRouteMapModal
          isOpen={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          farmerListing={activeFarmer}
          traderLocation={traderIdentity?.location}
        />
      )}

      {/* Offline Receipt Upload Modal */}
      {showOfflineReceiptModal && (
        <OfflineReceiptModal
          isOpen={showOfflineReceiptModal}
          onClose={() => setShowOfflineReceiptModal(false)}
          role="trader"
          uploaderName={traderIdentity?.name || 'Venkateswara Rao (AP Trader)'}
          uploaderPhone={traderIdentity?.phoneNumber || '+91 98482 77889'}
          targetRequest={
            activeFarmer
              ? {
                  id: `req-${activeFarmer.id}`,
                  farmerId: activeFarmer.id,
                  farmerName: activeFarmer.farmerName,
                  farmerPhone: activeFarmer.phone,
                  traderId: traderIdentity?.phoneNumber || 'trader-1',
                  traderName: traderIdentity?.name || 'AP Trader',
                  traderPhone: traderIdentity?.phoneNumber || '+91 98482 77889',
                  traderLocation: traderIdentity?.manualAddress || traderIdentity?.location || 'Guntur APMC',
                  cropName: activeFarmer.variety || activeFarmer.cropName,
                  requestedQuantity: activeFarmer.tons || 20,
                  offeredPricePerTon: buyingPrice ? Math.round(buyingPrice / (activeFarmer.tons || 20)) : 24000,
                  totalAmount: buyingPrice || 480000,
                  status: 'accepted',
                  notes: 'Direct farm lot trade procurement and settlement.',
                  createdAt: new Date().toISOString(),
                }
              : null
          }
          onReceiptUploaded={() => {
            setFarmersList(getCropFarmers(effectiveCrop, selectedDistrict, quantityFilter));
          }}
        />
      )}

      {/* Trader Official Bid Slip Modal */}
      {showTraderBidSlipModal && (
        <TraderBidSlipModal
          traderIdentity={traderIdentity}
          farmer={activeFarmer}
          cropName={effectiveCrop}
          targetPrice={buyingPrice}
          onClose={() => setShowTraderBidSlipModal(false)}
          onUploadReceipt={() => setShowOfflineReceiptModal(true)}
        />
      )}

      {/* Terms & Conditions Modal (Requirement 21) */}
      {showTermsModal && (
        <TermsAndConditionsModal
          role="trader"
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* Quick Feedback Modal (Requirement 22) */}
      {showFeedbackModal && (
        <QuickFeedbackModal
          role="trader"
          userName={traderIdentity?.name}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* My Address Modal (Requirement: Add My Address in all dashboards as in consumer dashboard) */}
      {showAddressModal && (
        <MyAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          role="trader"
          language={language}
          initialData={{
            fullName: traderIdentity?.name || 'M. Srikanth Reddy (శ్రీకాంత్ రెడ్డి)',
            phone: traderIdentity?.phoneNumber || '+91 98480 12345',
            streetAddress: 'Guntur APMC Wholesale Mirchi Yard, Godown Bay No. 14, Lalapet Main Road',
            landmark: 'Opposite State Bank Agri-Branch & State Warehousing Corporation',
            cityVillage: 'Guntur',
            mandal: 'Guntur Urban',
            district: traderIdentity?.district || 'Guntur',
            pincode: '522004',
            latitude: '16.3067',
            longitude: '80.4365',
            notes: 'Cold storage warehouse capacity: 250 MT. Loading bay operational 06:00 AM - 08:00 PM.',
          }}
          onSave={(data) => {
            if (traderIdentity) {
              handleSaveTraderIdentity({
                ...traderIdentity,
                district: data.district,
                phoneNumber: data.phone || traderIdentity.phoneNumber,
                name: data.fullName || traderIdentity.name,
              });
            }
          }}
        />
      )}
    </div>
  );
};
