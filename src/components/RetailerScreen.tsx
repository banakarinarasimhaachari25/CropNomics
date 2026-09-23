import React, { useState, useEffect, useMemo } from 'react';
import { ANDHRA_PRADESH_DISTRICTS, CROPS_DATA, TRANSLATIONS } from '../data/mockData';
import { db, getRetailerTraderLotsForCropAndQuantity } from '../data/db';
import { ConsumerOrder, LanguageCode, RetailerIdentity, RetailerLot, RetailerProduct, AppScreen } from '../types';
import { RetailerIdentityCard } from './RetailerIdentityCard';
import { RetailerOnboardingGate } from './RetailerOnboardingGate';
import { ContactTraderModal, MessageTraderModal, PurchaseSuccessModal, TermsAndConditionsModal, QuickFeedbackModal } from './Modals';
import { MyAddressModal } from './MyAddressModal';
import { CropNomicsLogo } from './CropNomicsLogo';
import { getCropImageByName } from '../utils/cropImageHelper';

interface RetailerScreenProps {
  language: LanguageCode;
  onCallTrader?: (name: string, phone: string) => void;
  onConfirmPurchase: (lotSize: number, total: number) => void;
  onNavigateToDashboard?: (screen: AppScreen) => void;
}

export const RetailerScreen: React.FC<RetailerScreenProps> = ({
  language,
  onCallTrader,
  onConfirmPurchase,
  onNavigateToDashboard,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Sourcing Requirements State
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomatoes (టమాటాలు)');
  const [customCropSearch, setCustomCropSearch] = useState<string>('');
  const [quantityRequirementBags, setQuantityRequirementBags] = useState<number>(50);
  const [quantityUnit, setQuantityUnit] = useState<'bags' | 'tons' | 'quintals'>('bags');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'price_low' | 'rating' | 'fast_delivery'>('match');
  const [targetMargin, setTargetMargin] = useState<number>(20);

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [callingLot, setCallingLot] = useState<RetailerLot | null>(null);
  const [messagingLot, setMessagingLot] = useState<RetailerLot | null>(null);

  // Retailer Identity State
  const [retailerIdentity, setRetailerIdentity] = useState<RetailerIdentity | null>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_retailer_identity');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isRetailerSaved, setIsRetailerSaved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_retailer_identity');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed?.name && parsed?.phoneNumber);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const handleSaveRetailerIdentity = (identity: RetailerIdentity) => {
    setRetailerIdentity(identity);
    setIsRetailerSaved(true);
    try {
      localStorage.setItem('cropnomics_retailer_identity', JSON.stringify(identity));
      db.registerRetailer(identity);
    } catch (e) {
      console.error(e);
    }
  };

  // Sub-tab Navigation (Wholesale Sourcing, Products for Consumers, Consumer Orders)
  const [retailerSubTab, setRetailerSubTab] = useState<'sourcing' | 'store_products' | 'consumer_orders'>('sourcing');
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);

  // Central Database State
  const [dbState, setDbState] = useState(db.getState());

  // Add Product Modal & Form State (Requirement 14 & 12)
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('Madanapalle Red Tomatoes (Grade A)');
  const [newProductCategory, setNewProductCategory] = useState<'vegetables' | 'grains' | 'spices' | 'pulses' | 'fruits'>('vegetables');
  const [newProductPrice, setNewProductPrice] = useState<number>(38);
  const [newProductStock, setNewProductStock] = useState<number>(150);
  const [newProductUnit, setNewProductUnit] = useState<string>('kg');
  const [newProductMarket, setNewProductMarket] = useState<string>('Madanapalle Tomato Yard');
  const [newProductImage, setNewProductImage] = useState<string>(CROPS_DATA[4].image);
  const [newProductDesc, setNewProductDesc] = useState<string>('Directly sourced from AP farm lots, calibrated for daily household cooking.');

  const effectiveCrop = (customCropSearch.trim() || selectedCrop);

  // Query matching trader lots based on Crop, Quantity, and District
  const [matchingTraderLots, setMatchingTraderLots] = useState<RetailerLot[]>(() =>
    getRetailerTraderLotsForCropAndQuantity(
      effectiveCrop,
      quantityRequirementBags,
      selectedDistrict,
      sortBy
    )
  );

  // Selected active lot for margin and price journey calculation
  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    const initialLots = getRetailerTraderLotsForCropAndQuantity(
      effectiveCrop,
      quantityRequirementBags,
      selectedDistrict,
      sortBy
    );
    return initialLots[0]?.id || '';
  });

  // Re-fetch and update whenever crop, quantity, district, or sorting changes
  useEffect(() => {
    const updatedLots = getRetailerTraderLotsForCropAndQuantity(
      effectiveCrop,
      quantityRequirementBags,
      selectedDistrict,
      sortBy
    );
    setMatchingTraderLots(updatedLots);

    // Keep selected lot valid
    if (updatedLots.length > 0) {
      setSelectedLotId((prev) => {
        const exists = updatedLots.find((l) => l.id === prev);
        return exists ? prev : updatedLots[0].id;
      });
    }
  }, [effectiveCrop, quantityRequirementBags, selectedDistrict, sortBy]);

  // Subscribe to central DB updates
  useEffect(() => {
    const unsubscribe = db.subscribe((state) => {
      setDbState({ ...state });
      const updatedLots = getRetailerTraderLotsForCropAndQuantity(
        effectiveCrop,
        quantityRequirementBags,
        selectedDistrict,
        sortBy
      );
      setMatchingTraderLots(updatedLots);
    });
    return unsubscribe;
  }, [effectiveCrop, quantityRequirementBags, selectedDistrict, sortBy]);

  // Products & Orders from DB
  const retailerProducts = dbState.retailerProducts || [];
  const retailerOrders = dbState.consumerOrders || [];

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || newProductPrice <= 0 || newProductStock <= 0) {
      alert('Please fill out all product fields with valid values.');
      return;
    }

    db.addRetailerProduct({
      productName: newProductName.trim(),
      category: newProductCategory,
      retailerId: retailerIdentity?.id || 'retailer-ap-1',
      retailerShopName: retailerIdentity?.shopName || `${retailerIdentity?.name || 'AP'} Fresh Mart`,
      pricePerKg: Number(newProductPrice),
      availableStockKg: Number(newProductStock),
      unit: newProductUnit,
      imageUrl: newProductImage,
      description: newProductDesc.trim(),
      sourcedFromMarket: newProductMarket,
    });

    setShowAddProductModal(false);
    alert('Product successfully added to Consumer Storefront!');
  };

  const handleDeleteProduct = (productId: string) => {
    db.removeRetailerProduct(productId);
  };

  // Requirement 15: in retailer it should get a button called completed order
  const handleMarkOrderCompleted = (orderId: string) => {
    db.updateConsumerOrderStatus(orderId, 'completed');
  };

  const handleDispatchOrder = (orderId: string) => {
    db.updateConsumerOrderStatus(orderId, 'dispatched');
  };

  // Current selected lot object
  const activeLot: RetailerLot = useMemo(() => {
    const found = matchingTraderLots.find((l) => l.id === selectedLotId);
    return found || matchingTraderLots[0] || {
      id: 'default-lot',
      bags: quantityRequirementBags,
      tons: Number(((quantityRequirementBags * 25) / 1000).toFixed(2)),
      cropName: effectiveCrop,
      variety: 'Standard Grade A',
      buyingPriceTotal: quantityRequirementBags * 800,
      pricePerBag: 800,
      traderName: 'AP Verified Trader',
      traderRating: 4.8,
      traderPhone: '9848012345',
      image: CROPS_DATA[0].image,
    };
  }, [matchingTraderLots, selectedLotId, quantityRequirementBags, effectiveCrop]);

  // Current crop metadata
  const currentCropMetadata = useMemo(() => {
    const cKey = effectiveCrop.toLowerCase();
    return CROPS_DATA.find((c) =>
      c.id === cKey ||
      c.name.toLowerCase().includes(cKey) ||
      cKey.includes(c.id) ||
      c.teluguName?.includes(cKey)
    ) || CROPS_DATA[4];
  }, [effectiveCrop]);

  // Financial calculations
  const totalWholesaleCost = activeLot.buyingPriceTotal;
  const suggestedSellingPrice = Math.round(totalWholesaleCost * (1 + targetMargin / 100));
  const estimatedProfit = suggestedSellingPrice - totalWholesaleCost;
  const farmerBasePrice = Math.round(totalWholesaleCost * 0.72);
  const consumerEstPrice = Math.round(suggestedSellingPrice * 1.08);

  const pricePerRetailUnit = activeLot.bags > 0 ? (suggestedSellingPrice / activeLot.bags).toFixed(2) : '0';
  const profitPerRetailUnit = activeLot.bags > 0 ? (estimatedProfit / activeLot.bags).toFixed(2) : '0';

  if (!isRetailerSaved) {
    return (
      <div className="w-full max-w-4xl mx-auto py-2">
        <RetailerOnboardingGate
          language={language}
          initialData={retailerIdentity}
          onSaveAndContinue={handleSaveRetailerIdentity}
        />
      </div>
    );
  }

  // Pre-configured lot size buttons
  const lotPresets = [10, 25, 50, 100, 250];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* Dedicated Retailer Dashboard Hero Header */}
      <div className="col-span-12 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-white/95 p-3.5 rounded-2xl shadow-lg border border-white/20 shrink-0">
              <CropNomicsLogo size="md" showTagline={false} variant="light" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>{language === 'te' ? 'రిటైలర్ కమాండ్ సెంటర్' : 'AP Retailer Command Hub'}</span>
              </div>
              <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-3xl sm:text-4xl">storefront</span>
                <span>{language === 'te' ? 'రిటైలర్ డాష్‌బోర్డ్ (Retailer Dashboard)' : 'Retailer Wholesale & Storefront Dashboard'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl mt-1.5 leading-relaxed">
                {language === 'te'
                  ? 'హోల్‌సేల్ ఆర్డరింగ్, ఇన్వెంటరీ నిర్వహణ, రిటైల్ మార్జిన్లు & కస్టమర్ డెలివరీ నెట్‌వర్క్.'
                  : 'Procure wholesale mandi lots, manage store inventory, customize retail profit margins and fulfill consumer orders.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Retailer Identity Header Card */}
      <div className="col-span-12">
        <RetailerIdentityCard
          language={language}
          retailerIdentity={retailerIdentity}
          onSaveRetailerIdentity={handleSaveRetailerIdentity}
        />
      </div>

      {/* Retailer Main Functional Sub-Tabs with Clear Descriptive Labels */}
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/80 shadow-xs relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="tab-retailer-sourcing"
            onClick={() => setRetailerSubTab('sourcing')}
            title={language === 'te' ? 'ట్రేడర్ సోర్సింగ్ & హోల్‌సేల్ లాట్లు' : 'Wholesale Trader Sourcing'}
            aria-label="Wholesale Trader Sourcing"
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 ${
              retailerSubTab === 'sourcing'
                ? 'bg-secondary text-white shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            <span>{language === 'te' ? 'హోల్‌సేల్ సోర్సింగ్' : 'Wholesale Sourcing'}</span>
          </button>

          <button
            type="button"
            id="tab-retailer-products"
            onClick={() => setRetailerSubTab('store_products')}
            title={language === 'te' ? 'వినియోగదారుల దుకాణం (ఉత్పత్తుల జోడింపు)' : `Store Products (${retailerProducts.length})`}
            aria-label="Store Products"
            className={`relative px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 ${
              retailerSubTab === 'store_products'
                ? 'bg-secondary text-white shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span>{language === 'te' ? 'స్టోర్ ఉత్పత్తులు' : 'Store Products'}</span>
            {retailerProducts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-mono font-bold">
                {retailerProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-retailer-orders"
            onClick={() => setRetailerSubTab('consumer_orders')}
            title={language === 'te' ? 'వినియోగదారుల ఆర్డర్లు & ఆర్డర్ పూర్తి' : `Consumer Orders (${retailerOrders.length})`}
            aria-label="Consumer Orders"
            className={`relative px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 ${
              retailerSubTab === 'consumer_orders'
                ? 'bg-secondary text-white shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>{language === 'te' ? 'కస్టమర్ ఆర్డర్లు' : 'Consumer Orders'}</span>
            {retailerOrders.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-mono font-bold">
                {retailerOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {retailerSubTab === 'store_products' && (
            <button
              type="button"
              id="btn-add-new-retail-product"
              onClick={() => setShowAddProductModal(true)}
              title={language === 'te' ? 'కొత్త ఉత్పత్తిని జోడించండి' : 'Add Product to Store'}
              aria-label="Add Product to Store"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer transition-all hover:scale-105 whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>{language === 'te' ? 'ఉత్పత్తి జోడించండి' : 'Add Product'}</span>
            </button>
          )}

          {/* My Address Trigger (as in consumer dashboard) */}
          <button
            type="button"
            id="btn-retailer-profile-address"
            onClick={() => setShowAddressModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-300 dark:border-emerald-700 shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            title={language === 'te' ? 'నా చిరునామా (రిటైల్ షాప్ & డెలివరీ పాయింట్)' : 'My Address (Retail Shop & Delivery Point)'}
          >
            <span className="material-symbols-outlined text-[18px]">home_pin</span>
            <span>{language === 'te' ? 'నా చిరునామా' : 'My Address'}</span>
          </button>

          <button
            type="button"
            id="btn-retailer-terms"
            onClick={() => setShowTermsModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 whitespace-nowrap shrink-0"
            title="Terms & Conditions"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-700">gavel</span>
            <span className="hidden sm:inline">Terms & Rules</span>
          </button>

          <button
            type="button"
            id="btn-retailer-feedback"
            onClick={() => setShowFeedbackModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 whitespace-nowrap shrink-0"
            title="Feedback"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600">rate_review</span>
            <span className="hidden sm:inline">Feedback</span>
          </button>
        </div>
      </div>

      {/* 2. Sourcing & Requirements Control Center (Visible when sourcing tab active) */}
      {retailerSubTab === 'sourcing' && (
        <>
          <div className="col-span-12 bg-white dark:bg-slate-900 bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-outline-variant/70 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-5 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-2xl font-bold">tune</span>
              <h2 className="font-headline-lg-mobile text-xl sm:text-2xl font-black text-on-surface">
                {language === 'te'
                  ? 'రిటైలర్ సరుకు కొనుగోలు ఎంపికలు (Crop & Quantity Requirement)'
                  : 'Retailer Sourcing & Procurement Options'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {language === 'te'
                ? 'మీ షాపు అవసరానికి తగిన పంట, పరిమాణం మరియు జిల్లాను ఎంచుకుని నమోదైన AP ట్రేడర్లను యాక్సెస్ చేయండి'
                : 'Filter and access verified Andhra Pradesh traders based on your exact crop type, batch volume, and district'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-secondary-container/20 text-secondary text-xs font-mono font-bold px-3 py-1.5 rounded-full border border-secondary/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{matchingTraderLots.length} Traders Available</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Option A: Crop Selection */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-body-lg text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <span>{language === 'te' ? 'పంట రకం ఎంచుకోండి (Select Crop)' : 'Select Crop Requirement'}</span>
              </label>
              <span className="text-[11px] font-mono text-primary font-semibold">
                AP MSP Baseline: ₹{currentCropMetadata.basePricePerTon.toLocaleString('en-IN')}/Ton
              </span>
            </div>

            {/* Quick Crop Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CROPS_DATA.slice(0, 6).map((crop) => {
                const isSelected = selectedCrop === crop.name && !customCropSearch;
                return (
                  <button
                    key={crop.id}
                    id={`btn-crop-select-${crop.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(crop.name);
                      setCustomCropSearch('');
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-secondary text-white border-secondary shadow-sm ring-2 ring-secondary/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-outline-variant/80 text-on-surface'
                    }`}
                  >
                    <img
                      src={crop.image}
                      alt={crop.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">
                        {crop.name.split(' ')[0]}
                      </div>
                      <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>
                        {crop.teluguName ? crop.teluguName.split(' ')[0] : 'AP Crop'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Crop Search & More Crops Dropdown */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  id="input-crop-search"
                  type="text"
                  value={customCropSearch}
                  onChange={(e) => setCustomCropSearch(e.target.value)}
                  placeholder={
                    language === 'te'
                      ? 'ఇతర పంటలు వెతకండి (ఉదా: పసుపు, ఉల్లి, చెరకు...)'
                      : 'Search any crop (e.g. Turmeric, Onion, Groundnut...)'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 text-xs rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary text-on-surface"
                />
              </div>

              <select
                id="select-more-crops"
                value={selectedCrop}
                onChange={(e) => {
                  setSelectedCrop(e.target.value);
                  setCustomCropSearch('');
                }}
                className="bg-white dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-outline-variant font-medium text-on-surface cursor-pointer max-w-[140px]"
              >
                {CROPS_DATA.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Highlight Spec Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-outline-variant/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">eco</span>
                <span className="font-bold text-on-surface truncate">{effectiveCrop}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  currentCropMetadata.perishabilityLevel === 'High'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentCropMetadata.perishabilityLevel} Perishability
                </span>
                <span className="text-on-surface-variant hidden sm:inline">
                  Transit: {currentCropMetadata.transitToConsumerDays}d max
                </span>
              </div>
            </div>
          </div>

          {/* Option B: Quantity Requirement */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-body-lg text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <span>{language === 'te' ? 'కావాల్సిన పరిమాణం (Quantity Requirement)' : 'Specify Quantity Requirement'}</span>
              </label>

              {/* Unit selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-outline-variant/60 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setQuantityUnit('bags')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    quantityUnit === 'bags' ? 'bg-secondary text-white font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  Bags/Crates
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityUnit('quintals')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    quantityUnit === 'quintals' ? 'bg-secondary text-white font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  Quintals
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityUnit('tons')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    quantityUnit === 'tons' ? 'bg-secondary text-white font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  Metric Tons
                </button>
              </div>
            </div>

            {/* Quick Quantity Preset Cards */}
            <div className="grid grid-cols-5 gap-2">
              {lotPresets.map((size) => {
                const isSelected = quantityRequirementBags === size;
                return (
                  <button
                    key={size}
                    id={`btn-quantity-preset-${size}`}
                    type="button"
                    onClick={() => setQuantityRequirementBags(size)}
                    className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20 scale-[1.03]'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-outline-variant/80 text-on-surface'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black leading-tight">
                      {size}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                      Bags
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Quantity Slider and Custom Input */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-outline-variant/60 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-medium">
                  {language === 'te' ? 'ఖచ్చితమైన సంఖ్యను సర్దుబాటు చేయండి:' : 'Adjust Exact Requirement:'}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    id="input-quantity-number"
                    type="number"
                    min="5"
                    max="1000"
                    value={quantityRequirementBags}
                    onChange={(e) => setQuantityRequirementBags(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-outline-variant rounded font-mono font-bold text-right text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="font-mono text-xs font-bold text-secondary">Bags</span>
                </div>
              </div>

              <input
                id="slider-quantity-requirement"
                type="range"
                min="5"
                max="300"
                step="5"
                value={quantityRequirementBags}
                onChange={(e) => setQuantityRequirementBags(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-secondary"
              />

              <div className="flex justify-between items-center text-[11px] font-mono text-on-surface-variant pt-1 border-t border-outline-variant/30">
                <span>≈ {((quantityRequirementBags * 25) / 1000).toFixed(2)} Metric Tons</span>
                <span>≈ {(quantityRequirementBags * 25).toLocaleString('en-IN')} kg Net Produce</span>
                <span className="text-secondary font-bold">
                  {quantityRequirementBags <= 25 ? '🏪 Kirana/Rythu Stall' : quantityRequirementBags <= 100 ? '🛒 Supermarket Lot' : '🚛 Wholesale Lot'}
                </span>
              </div>
            </div>

            {/* Sourcing Hub and Sorting Controls */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                  {language === 'te' ? 'ట్రేడింగ్ హబ్ / జిల్లా' : 'Trading Hub / District'}
                </label>
                <select
                  id="select-district-filter"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-outline-variant font-medium text-on-surface cursor-pointer"
                >
                  <option value="All">All AP Trade Hubs</option>
                  {ANDHRA_PRADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                  {language === 'te' ? 'క్రమబద్ధీకరణ (Sort By)' : 'Sort Traders By'}
                </label>
                <select
                  id="select-sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-outline-variant font-medium text-on-surface cursor-pointer"
                >
                  <option value="match">Best Supply Match</option>
                  <option value="price_low">Lowest Price First (₹)</option>
                  <option value="rating">Highest Rated Trader (★)</option>
                  <option value="fast_delivery">Fastest Dispatch ETA</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Matching Traders Access List (Left/Main Column) */}
      <section className="lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl font-bold">local_shipping</span>
            <h3 className="font-headline-lg-mobile text-lg sm:text-xl font-bold text-on-surface">
              {language === 'te'
                ? `అందుబాటులో ఉన్న AP ట్రేడర్లు (${matchingTraderLots.length})`
                : `Verified Traders with Ready Stock (${matchingTraderLots.length})`}
            </h3>
          </div>
          <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-bold border border-outline-variant/30">
            {quantityRequirementBags} Bags • {effectiveCrop.split(' ')[0]}
          </span>
        </div>

        {matchingTraderLots.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/50">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">search_off</span>
            <p className="font-bold text-on-surface">No matching traders found for the selected filter.</p>
            <p className="text-xs text-on-surface-variant mt-1">Try switching to &quot;All AP Trade Hubs&quot; or selecting a different crop.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict('All');
                setCustomCropSearch('');
                setSelectedCrop('Tomatoes (టమాటాలు)');
              }}
              className="mt-4 px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matchingTraderLots.map((lotItem, index) => {
              const isSelected = activeLot.id === lotItem.id;
              return (
                <article
                  key={lotItem.id}
                  id={`trader-lot-card-${lotItem.id}`}
                  onClick={() => setSelectedLotId(lotItem.id)}
                  className={`w-full flex flex-col bg-white dark:bg-slate-900 bg-surface-container-lowest rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'border-2 border-secondary shadow-[0_8px_24px_rgba(17,35,59,0.12)] ring-2 ring-secondary/20 bg-secondary/2'
                      : 'border-outline-variant/50 hover:border-secondary/60 hover:shadow-md'
                  }`}
                >
                  {/* Top Bar: Trader Identity, Firm, License & Verified Badge */}
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-outline-variant/30">
                    <div className="w-full sm:w-auto flex-1 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-base flex-shrink-0 shrink-0 border border-secondary/20">
                        {(lotItem.traderName || 'T').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-body-lg text-base font-bold text-on-surface truncate">
                            {lotItem.traderName || 'AP Verified Trader'}
                          </h4>
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 shrink-0">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>AP Rythu Verified</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full flex-shrink-0 shrink-0">
                            {lotItem.traderRating || 4.8} ★ ({lotItem.dealsCount || 100 + index * 15} Deals)
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant font-medium mt-0.5">
                          <span className="text-secondary font-semibold">{lotItem.firmName || `${lotItem.traderName || 'Trader'} Agro Firm`}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-on-surface-variant">Lic: {lotItem.licenseNumber || `AP-MKT-2026-${1000 + index}`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-on-surface font-semibold bg-surface-container px-2.5 py-1 rounded-lg flex-shrink-0 shrink-0">
                      <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 shrink-0">call</span>
                      <span>{lotItem.traderPhone ? (lotItem.traderPhone.startsWith('+') ? lotItem.traderPhone : `+91 ${lotItem.traderPhone}`) : '+91 98480 12345'}</span>
                    </div>
                  </div>

                  {/* Body Grid: Visual Image + Comprehensive Structured Details */}
                  <div className="w-full flex flex-col sm:flex-row gap-4 items-stretch">
                    {/* Produce Crop Image & Cold Chain Indicator - No absolute positioning */}
                    <div className="w-full sm:w-36 md:w-44 flex-shrink-0 shrink-0 flex flex-col gap-1.5">
                      <div className="w-full h-32 sm:h-full min-h-[110px] rounded-xl overflow-hidden border border-outline-variant/40 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={lotItem.image}
                          alt={lotItem.cropName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="bg-slate-100 dark:bg-slate-800 text-on-surface text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-outline-variant/30 flex-shrink-0 shrink-0">
                          {lotItem.cropName.split(' ')[0]}
                        </span>
                        {lotItem.coldChainAvailable && (
                          <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0 shrink-0">
                            <span className="material-symbols-outlined text-[12px]">ac_unit</span>
                            <span>Cold-Chain</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detailed Metadata Grid: flex-1 and min-w-0 ensures no collapsing */}
                    <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="w-full min-w-0 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-outline-variant/40 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">Location & Terminal</span>
                          <span className="font-semibold text-on-surface flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 shrink-0">location_on</span>
                            <span className="truncate">{lotItem.location || `${lotItem.district} Central Yard`}</span>
                          </span>
                          <span className="text-[11px] text-secondary font-mono mt-0.5 truncate">District: {lotItem.district || 'AP'}</span>
                        </div>

                        <div className="w-full min-w-0 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-outline-variant/40 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">Logistics & Transit</span>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span className="material-symbols-outlined text-[15px] flex-shrink-0 shrink-0">local_shipping</span>
                            <span className="truncate">Dispatch ETA: ~{lotItem.transitHours || 6} Hours</span>
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate">
                            {lotItem.coldChainAvailable ? '❄️ Reefer Temp Controlled' : '🚚 Covered Express Freight'}
                          </span>
                        </div>

                        <div className="w-full min-w-0 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-outline-variant/40 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">Quality & Variety</span>
                          <span className="font-bold text-on-surface mt-0.5 truncate">{lotItem.variety || lotItem.cropName}</span>
                          <span className="text-[11px] font-mono text-secondary font-semibold mt-0.5 truncate">{lotItem.grade || 'Grade A+ Export Quality'}</span>
                        </div>

                        <div className="w-full min-w-0 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-outline-variant/40 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">Depot Stock & Min Order</span>
                          <span className="font-mono font-bold text-on-surface mt-0.5 truncate">
                            In-Stock: {lotItem.stockCapacityBags || 250} Bags
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate">
                            Min: {lotItem.minOrderBags || 10} Bags • Req: {lotItem.bags} Bags (~{lotItem.tons}T)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Direct Communication Action Row - Clean layout without negative margins */}
                  <div className="w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 mt-3 border-t border-outline-variant/30 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-mono font-bold text-on-surface-variant uppercase">Wholesale Total:</span>
                        <span className="font-price-display text-xl sm:text-2xl text-secondary font-black">
                          ₹{lotItem.buyingPriceTotal.toLocaleString('en-IN')}.00
                        </span>
                        <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          ₹{lotItem.pricePerBag.toFixed(2)} / bag
                        </span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate">
                        Terms: {lotItem.paymentTerms || 'AP Digital Escrow / UPI / Market Gate Pass'}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0 shrink-0">
                      <button
                        type="button"
                        id={`btn-call-trader-${lotItem.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onCallTrader) {
                            onCallTrader(lotItem.traderName, lotItem.traderPhone);
                          }
                          setCallingLot(lotItem);
                        }}
                        className="flex-1 sm:flex-none justify-center bg-surface-container-highest hover:bg-secondary hover:text-white text-secondary px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-outline-variant/40 whitespace-nowrap"
                        title="Call Trader"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        <span>Call Trader</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-msg-trader-${lotItem.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessagingLot(lotItem);
                        }}
                        className="flex-1 sm:flex-none justify-center bg-surface-container-highest hover:bg-secondary hover:text-white text-secondary px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-outline-variant/40 whitespace-nowrap"
                        title="Send Message / Requirement"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-select-lot-${lotItem.id}`}
                        onClick={() => setSelectedLotId(lotItem.id)}
                        className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                          isSelected
                            ? 'bg-secondary text-white shadow-xs'
                            : 'bg-primary text-white hover:bg-primary-dark'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <span>Select Lot</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Selected Lot Margin Calculator & Price Journey (Right Column) */}
      <section className="lg:col-span-5 flex flex-col gap-6">
        {/* Selected Lot Detail Card */}
        <article className="bg-white dark:bg-slate-900 bg-surface-container-lowest rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden border border-outline-variant/50">
          <div className="h-44 w-full relative overflow-hidden">
            <img
              src={activeLot.image}
              alt={activeLot.cropName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary-fixed bg-black/50 px-2 py-0.5 rounded font-bold">
                Selected Procurement Lot
              </span>
              <h3 className="font-headline-lg-mobile text-xl font-bold mt-1">
                {activeLot.variety || activeLot.cropName}
              </h3>
              <p className="text-xs font-mono text-white/90">
                {activeLot.bags} Bags • {activeLot.tons} Tons ({activeLot.district || 'AP'} Wholesale Depot)
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Structured Trader Details in Selected View */}
            <div className="bg-surface-container/60 rounded-xl p-3.5 border border-outline-variant/40 flex flex-col gap-2.5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center font-bold text-sm">
                    {(activeLot.traderName || 'T').charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                      <span>{activeLot.traderName || 'AP Verified Trader'}</span>
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-medium">
                      {activeLot.firmName || `${activeLot.traderName || 'Trader'} Agro Firm`}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full">
                  {activeLot.traderRating || 4.8} ★ ({activeLot.dealsCount || 120} Deals)
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-2 border-t border-outline-variant/30 text-on-surface-variant">
                <div className="flex-1 min-w-[130px]">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Phone & Contact</span>
                  <span className="font-bold text-on-surface">{activeLot.traderPhone ? (activeLot.traderPhone.startsWith('+') ? activeLot.traderPhone : `+91 ${activeLot.traderPhone}`) : '+91 98480 12345'}</span>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant">License ID</span>
                  <span className="font-bold text-secondary">{activeLot.licenseNumber || 'AP-MKT-2026-REG'}</span>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Location</span>
                  <span className="text-on-surface truncate block">{activeLot.location || activeLot.district}</span>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant">Logistics ETA</span>
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold block">~{activeLot.transitHours || 6}h Dispatch</span>
                </div>
              </div>

              {/* Quick Contact Buttons for Selected Trader */}
              <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    if (onCallTrader) onCallTrader(activeLot.traderName, activeLot.traderPhone);
                    setCallingLot(activeLot);
                  }}
                  className="flex-1 bg-surface-container-highest hover:bg-secondary hover:text-white text-secondary py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Call Trader</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMessagingLot(activeLot)}
                  className="flex-1 bg-surface-container-highest hover:bg-secondary hover:text-white text-secondary py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Wholesale Cost Bar */}
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <div>
                <p className="text-[11px] font-mono text-on-surface-variant uppercase font-semibold">
                  Wholesale Procurement Cost
                </p>
                <p className="font-price-display text-2xl font-black text-secondary">
                  ₹{activeLot.buyingPriceTotal.toLocaleString('en-IN')}.00
                </p>
                <p className="text-xs font-mono text-on-surface-variant">
                  ₹{activeLot.pricePerBag.toFixed(2)} per bag/crate
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant block">Requested Batch</span>
                <span className="text-base font-black text-on-surface font-mono">
                  {activeLot.bags} Bags
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono block">
                  ~{activeLot.tons} Metric Tons
                </span>
              </div>
            </div>

            {/* Profit Margin Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="retailer-target-margin"
                  className="font-body-lg text-sm font-bold text-on-surface"
                >
                  {t.targetMargin} (Retail Markup)
                </label>
                <span className="font-price-display text-xl font-extrabold text-secondary font-mono">
                  {targetMargin}%
                </span>
              </div>
              <input
                id="retailer-target-margin"
                type="range"
                min="5"
                max="40"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-[11px] text-on-surface-variant mt-1 font-mono">
                <span>5% Min</span>
                <span className="text-secondary font-bold">20% AP Rythu Standard</span>
                <span>40% Max</span>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="bg-surface-bright rounded-xl p-4 border border-outline-variant/60 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">
                    Suggested Selling Price
                  </p>
                  <p className="font-price-display text-2xl text-secondary font-black">
                    ₹{suggestedSellingPrice.toLocaleString('en-IN')}.00
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    ₹{pricePerRetailUnit} / bag retail
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">
                    Net Est. Retail Profit
                  </p>
                  <p className="font-price-display text-xl bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-lg font-black inline-block">
                    +₹{estimatedProfit.toLocaleString('en-IN')}.00
                  </p>
                  <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                    +₹{profitPerRetailUnit} / bag margin
                  </p>
                </div>
              </div>
            </div>

            {/* CropNomics Transparent Supply Chain Breakdown */}
            <div className="bg-surface rounded-xl p-4 border border-outline-variant/40">
              <h4 className="font-headline-lg-mobile text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                {t.supplyChainJourney} (CropNomics Transparency)
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-on-surface-variant block">Farmer Base</span>
                  <strong className="text-on-surface text-xs block mt-0.5">₹{farmerBasePrice.toLocaleString('en-IN')}</strong>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-on-surface-variant block">Trader Wholesale</span>
                  <strong className="text-secondary text-xs block mt-0.5">₹{totalWholesaleCost.toLocaleString('en-IN')}</strong>
                </div>
                <div className="bg-secondary text-white p-2 rounded-lg shadow-xs">
                  <span className="text-secondary-fixed block font-bold">You (Retail)</span>
                  <strong className="text-white text-xs block mt-0.5">₹{suggestedSellingPrice.toLocaleString('en-IN')}</strong>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-on-surface-variant block">Consumer Est.</span>
                  <strong className="text-on-surface text-xs block mt-0.5">₹{consumerEstPrice.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Purchase Order Action Button */}
            <button
              id="btn-confirm-retailer-purchase"
              type="button"
              onClick={() => {
                onConfirmPurchase(activeLot.bags, activeLot.buyingPriceTotal);
                db.placeRetailOrder({
                  lotId: activeLot.id,
                  cropName: activeLot.cropName,
                  bags: activeLot.bags,
                  totalAmount: activeLot.buyingPriceTotal,
                  retailerName: retailerIdentity?.name || 'Authorized AP Retail Merchant',
                  retailerPhone: retailerIdentity?.phoneNumber || '9440123456',
                });
                setShowReceiptModal(true);
              }}
              className="w-full bg-secondary hover:bg-brand-navy-light text-white font-headline-lg-mobile text-base sm:text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 min-h-[52px] cursor-pointer"
            >
              <span>{t.confirmPurchase} ({activeLot.bags} Bags)</span>
              <span className="material-symbols-outlined font-bold text-[20px]">arrow_forward</span>
            </button>
          </div>
        </article>
      </section>
      </>
      )}

      {/* ======================================================== */}
      {/* SUB-PORTAL 2: RETAIL STORE PRODUCTS MANAGER (Req 14)     */}
      {/* ======================================================== */}
      {retailerSubTab === 'store_products' && (
        <div className="col-span-12 space-y-6 animate-in fade-in">
          {/* Step Back Button */}
          <div className="pb-1 flex items-center justify-between">
            <button
              id="btn-back-to-retailer-sourcing-from-store"
              type="button"
              onClick={() => {
                setRetailerSubTab('sourcing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-on-surface-variant font-mono hidden sm:inline-block">
              {language === 'te' ? 'రిటైల్ ఇన్వెంటరీ కేటలాగ్' : 'Store Inventory & Pricing'}
            </span>
          </div>

          {/* Header Stats */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xs border border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">storefront</span>
                <h2 className="text-xl font-black text-on-surface">
                  {language === 'te' ? 'రిటైల్ ఉత్పత్తుల కేటలాగ్ (వినియోగదారులకు అమ్మకం)' : 'Retail Store Products (Sell to Consumers)'}
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {language === 'te'
                  ? 'ఇక్కడ జోడించిన ఉత్పత్తులు మాత్రమే వినియోగదారుల స్టోర్‌లో కనిపిస్తాయి మరియు ఆర్డర్ చేయబడతాయి.'
                  : 'Items listed here appear directly in the Consumer Direct Fresh Storefront for customer ordering.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-open-add-product-modal"
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>{language === 'te' ? '+ కొత్త ఉత్పత్తిని జోడించండి' : '+ Add Product to Store'}</span>
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          {retailerProducts.length === 0 ? (
            <div className="col-span-12 p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">inventory_2</span>
              <h3 className="text-base font-bold text-on-surface">No Products Listed in Consumer Store</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Click &quot;+ Add Product to Store&quot; above to list fresh produce, grains, or vegetables for local AP consumers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {retailerProducts.map((prod) => (
                <div
                  key={prod.id}
                  id={`retailer-product-${prod.id}`}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant hover:border-secondary transition-all shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-surface-container overflow-hidden">
                      <img
                        src={prod.imageUrl}
                        alt={prod.productName}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-mono uppercase">
                        {prod.category}
                      </span>
                      {prod.sourcedFromMarket && (
                        <span className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-900/80 backdrop-blur-xs text-emerald-200 text-[10px] font-mono truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          <span>{prod.sourcedFromMarket}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-sm text-on-surface leading-snug">{prod.productName}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{prod.pricePerKg}/{prod.unit}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {prod.description}
                      </p>
                      <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                        <span>Stock: <strong className="text-on-surface">{prod.availableStockKg} {prod.unit}</strong></span>
                        <span className="text-emerald-600 font-bold">Active in Consumer Store</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container/40 border-t border-outline-variant/60 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-on-surface-variant truncate">
                      Shop: {prod.retailerShopName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-bold p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-PORTAL 3: CONSUMER ORDERS & FULFILLMENT (Req 15)      */}
      {/* ======================================================== */}
      {retailerSubTab === 'consumer_orders' && (
        <div className="col-span-12 space-y-6 animate-in fade-in">
          {/* Step Back Button */}
          <div className="pb-1 flex items-center justify-between">
            <button
              id="btn-back-to-retailer-sourcing-from-orders"
              type="button"
              onClick={() => {
                setRetailerSubTab('sourcing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-on-surface-variant font-mono hidden sm:inline-block">
              {language === 'te' ? 'వినియోగదారుల ఆర్డర్లు & డెలివరీ' : 'Consumer Orders & Fulfillment'}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xs border border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">receipt_long</span>
                <h2 className="text-xl font-black text-on-surface">
                  {language === 'te' ? 'వినియోగదారుల ఆర్డర్లు & డెలివరీ నిర్వహణ' : 'Consumer Orders & Delivery Management'}
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {language === 'te'
                  ? 'వినియోగదారులు ఆర్డర్ చేసిన వస్తువులను పర్యవేక్షించండి మరియు "Completed Order" బటన్‌తో ఆర్డర్‌ను పూర్తి చేయండి.'
                  : 'Track incoming household orders and finalize delivery status with the dedicated "Completed Order" button.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-mono font-bold text-on-surface-variant">
                {retailerOrders.length} Orders Recorded
              </span>
            </div>
          </div>

          {retailerOrders.length === 0 ? (
            <div className="col-span-12 p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant space-y-3">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">order_approve</span>
              <h3 className="text-base font-bold text-on-surface">No Consumer Orders Received Yet</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Once customers place orders via the Consumer Storefront, they will appear here with instant dispatch and completion actions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {retailerOrders.map((order) => {
                const isCompleted = order.status === 'completed';
                return (
                  <div
                    key={order.id}
                    id={`retailer-order-card-${order.id}`}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 pb-3 border-b border-outline-variant/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-on-surface">
                            Order #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : order.status === 'received'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            }`}
                          >
                            Status: {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1 flex flex-wrap items-center gap-2">
                          <span>Customer: <strong className="text-on-surface">{order.consumerName}</strong> ({order.consumerPhone})</span>
                          <span>•</span>
                          <span className="font-mono">{order.orderDate}</span>
                        </div>
                      </div>

                      {/* Retailer "Completed Order" Action Button (User Requirement 15) */}
                      <div className="flex items-center gap-2">
                        {order.status === 'placed' && (
                          <button
                            type="button"
                            onClick={() => handleDispatchOrder(order.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            Mark Dispatched
                          </button>
                        )}

                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>Order Completed</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            id={`btn-retailer-completed-order-${order.id}`}
                            onClick={() => handleMarkOrderCompleted(order.id)}
                            className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Completed Order</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-surface-container border border-outline-variant flex items-center gap-2.5 text-xs"
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-on-surface truncate">{item.productName}</div>
                            <div className="text-[11px] font-mono text-on-surface-variant">
                              {item.quantityKg} {item.unit} × ₹{item.pricePerKg}
                            </div>
                          </div>
                          <div className="font-mono font-bold text-on-surface">
                            ₹{item.totalPrice}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Details */}
                    <div className="pt-2 border-t border-outline-variant/60 flex flex-wrap justify-between items-center text-xs">
                      <div className="text-on-surface-variant">
                        <span>Delivery Address: </span>
                        <strong className="text-on-surface">{order.consumerAddress}</strong>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-on-surface-variant font-mono">Total Order Value:</span>
                        <span className="font-price-display text-base font-black text-emerald-700 dark:text-emerald-400">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD PRODUCT TO STORE (Req 14)                     */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <div
          id="add-retail-product-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAddProductModal(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">add_shopping_cart</span>
                <h3 className="text-lg font-black text-on-surface">Add Product to Consumer Store</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Product Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProductName(val);
                      const matched = getCropImageByName(val);
                      if (matched) setNewProductImage(matched);
                    }}
                    placeholder="e.g. Fresh Tomatoes, Banganapalli Mango, Groundnut Oil"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold focus:border-secondary focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Image Active
                  </span>
                </div>
              </div>

              {/* Quick Select Preset Produce (Requirement 14: more vegetables, fruits, spices, organic oils) */}
              <div>
                <label className="block font-bold text-on-surface mb-1.5">
                  Popular Andhra Produce Presets (Click to Auto-Fill & Match Photo)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-surface-container-low rounded-xl border border-outline-variant/60">
                  {[
                    // Vegetables
                    { name: 'Madanapalle Red Tomatoes (టమాటాలు)', cat: 'vegetables' as const, unit: 'kg', price: 38 },
                    { name: 'Kurnool Red Onions (ఉల్లిపాయలు)', cat: 'vegetables' as const, unit: 'kg', price: 32 },
                    { name: 'Guntur Green Chillies (పచ్చిమిర్చి)', cat: 'vegetables' as const, unit: 'kg', price: 65 },
                    { name: 'Anantapur Potatoes (బంగాళాదుంపలు)', cat: 'vegetables' as const, unit: 'kg', price: 30 },
                    { name: 'Local Farm Brinjal / Eggplant (వంకాయలు)', cat: 'vegetables' as const, unit: 'kg', price: 40 },
                    { name: 'Fresh Okra / Bhendi (బెండకాయలు)', cat: 'vegetables' as const, unit: 'kg', price: 45 },
                    // Fruits
                    { name: 'Banganapalli Sweet Mangoes (బంగినపల్లి మామిడి)', cat: 'fruits' as const, unit: 'kg', price: 120 },
                    { name: 'Yelakki Sugandhi Bananas (అరటి పండ్లు)', cat: 'fruits' as const, unit: 'dozen', price: 60 },
                    { name: 'Red Lady Papaya (బొప్పాయి)', cat: 'fruits' as const, unit: 'kg', price: 35 },
                    { name: 'Sweet Lime / Mosambi (బత్తాయి)', cat: 'fruits' as const, unit: 'kg', price: 70 },
                    // Spices
                    { name: 'Guntur Teja Red Chilli (గుంటూరు ఎండుమిర్చి)', cat: 'spices' as const, unit: 'kg', price: 210 },
                    { name: 'Duggirala Pure Turmeric Powder (పసుపు)', cat: 'spices' as const, unit: 'kg', price: 190 },
                    { name: 'Whole Cumin Seeds / Jeera (జీలకర్ర)', cat: 'spices' as const, unit: 'kg', price: 340 },
                    { name: 'Black Pepper (మిరియాలు)', cat: 'spices' as const, unit: 'kg', price: 580 },
                    // Organic Oils
                    { name: 'Wood-Pressed Groundnut Oil (గానుగ వేరుశనగ నూనె)', cat: 'spices' as const, unit: 'liter', price: 240 },
                    { name: 'Cold-Pressed Pure Sesame Oil (నువ్వుల నూనె)', cat: 'spices' as const, unit: 'liter', price: 320 },
                    { name: 'Extra Virgin Coconut Oil (కొబ్బరి నూనె)', cat: 'spices' as const, unit: 'liter', price: 280 },
                    { name: 'Pure Mustard Oil (ఆవ నూనె)', cat: 'spices' as const, unit: 'liter', price: 210 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewProductName(preset.name);
                        setNewProductCategory(preset.cat);
                        setNewProductUnit(preset.unit);
                        setNewProductPrice(preset.price);
                        const autoImg = getCropImageByName(preset.name);
                        if (autoImg) setNewProductImage(autoImg);
                      }}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {preset.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Category *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e: any) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-secondary focus:outline-hidden"
                  >
                    <option value="vegetables">Vegetables (కూరగాయలు)</option>
                    <option value="fruits">Fruits (పండ్లు)</option>
                    <option value="spices">Spices & Organic Oils (మసాలాలు & నూనెలు)</option>
                    <option value="grains">Grains & Rice (ధాన్యాలు)</option>
                    <option value="pulses">Pulses (పప్పులు)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Sourced AP Market *</label>
                  <input
                    type="text"
                    required
                    value={newProductMarket}
                    onChange={(e) => setNewProductMarket(e.target.value)}
                    placeholder="e.g. Madanapalle Yard / Guntur Yard"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-secondary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Price (₹/Unit) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-mono font-bold focus:border-secondary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-mono font-bold focus:border-secondary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Unit *</label>
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-secondary focus:outline-hidden"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="dozen">dozen</option>
                    <option value="bag">bag</option>
                    <option value="bunch">bunch</option>
                    <option value="quintal">quintal</option>
                  </select>
                </div>
              </div>

              {/* Matched Image Preview */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Matched Product Photo (Auto-Linked)</label>
                <div className="flex gap-3 items-center p-2.5 bg-surface-container rounded-xl border border-outline-variant/70">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-outline-variant shadow-inner">
                    <img
                      src={newProductImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mb-1">
                      Verified Agricultural Image
                    </span>
                    <input
                      type="url"
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      placeholder="Or paste custom image URL"
                      className="w-full px-2.5 py-1 rounded-lg border border-outline-variant bg-surface text-[11px] font-mono focus:border-secondary focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Description / Grade</label>
                <textarea
                  rows={2}
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-secondary focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save & Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      {/* 1. Direct Call Trader Modal (Requirement 11 & 18) */}
      {callingLot && (
        <ContactTraderModal
          lot={callingLot}
          retailerIdentity={retailerIdentity}
          onClose={() => setCallingLot(null)}
        />
      )}

      {/* 2. Direct Message Trader Modal */}
      {messagingLot && (
        <MessageTraderModal
          lot={messagingLot}
          retailerIdentity={retailerIdentity}
          onClose={() => setMessagingLot(null)}
        />
      )}

      {/* 3. AP Rythu Bazaar Receipt & Invoice Modal */}
      {showReceiptModal && (
        <PurchaseSuccessModal
          bags={activeLot.bags}
          totalAmount={activeLot.buyingPriceTotal}
          retailerIdentity={retailerIdentity}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* 4. Terms & Conditions Modal (Requirement 21) */}
      {showTermsModal && (
        <TermsAndConditionsModal
          role="retailer"
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* 5. Quick Feedback Modal (Requirement 22) */}
      {showFeedbackModal && (
        <QuickFeedbackModal
          role="retailer"
          userName={retailerIdentity?.name}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* My Address Modal (Requirement: Add My Address in all dashboards as in consumer dashboard) */}
      {showAddressModal && (
        <MyAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          role="retailer"
          language={language}
          initialData={{
            fullName: retailerIdentity?.name || 'K. Venkata Rao (వెంకట రావు)',
            phone: retailerIdentity?.phoneNumber || '+91 99887 76655',
            streetAddress: retailerIdentity?.shopAddress || 'Door No. 4-12, Rythu Bazar Commercial Complex, Benz Circle Road',
            landmark: 'Near Benz Circle Flyover & Andhra Bank Main Branch',
            cityVillage: 'Vijayawada',
            mandal: 'Vijayawada Urban',
            district: retailerIdentity?.district || 'Krishna',
            pincode: '520010',
            latitude: '16.5062',
            longitude: '80.6480',
            notes: 'Retail store and customer pickup counter open 07:00 AM - 09:30 PM daily.',
          }}
          onSave={(data) => {
            if (retailerIdentity) {
              handleSaveRetailerIdentity({
                ...retailerIdentity,
                district: data.district,
                phoneNumber: data.phone || retailerIdentity.phoneNumber,
                name: data.fullName || retailerIdentity.name,
                shopAddress: `${data.streetAddress}, ${data.cityVillage}, ${data.district} - ${data.pincode}`,
              });
            }
          }}
        />
      )}
    </div>
  );
};

