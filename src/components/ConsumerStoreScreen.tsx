import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../data/db';
import { ANDHRA_PRADESH_DISTRICTS } from '../data/mockData';
import { ConsumerOrder, ConsumerOrderItem, LanguageCode, RetailerProduct, AppScreen } from '../types';
import { TermsAndConditionsModal, QuickFeedbackModal } from './Modals';

interface ConsumerStoreScreenProps {
  language: LanguageCode;
  consumerName?: string;
  consumerPhone?: string;
  onNavigateToRetailer?: () => void;
  onNavigateToDashboard?: (screen: AppScreen) => void;
}

export const ConsumerStoreScreen: React.FC<ConsumerStoreScreenProps> = ({
  language,
  consumerName = 'Anitha Reddy',
  consumerPhone = '+91 98489 55667',
  onNavigateToRetailer,
  onNavigateToDashboard,
}) => {
  // Navigation tabs: 'shop' (Browse crops & packed products) vs 'my_orders' (Bookings & Orders)
  const [activeTab, setActiveTab] = useState<'shop' | 'my_orders'>('shop');
  
  // Filters
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'crop' | 'packed' | 'spices' | 'grains'>('all');
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cart state
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  
  // Quick direct single-item booking modal state
  const [quickBookProduct, setQuickBookProduct] = useState<RetailerProduct | null>(null);
  const [quickBookQty, setQuickBookQty] = useState<number>(1);
  
  // Pickup Token Pass modal state (shown immediately after booking online)
  const [pickupPassOrder, setPickupPassOrder] = useState<ConsumerOrder | null>(null);
  
  // Receipt view modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<ConsumerOrder | null>(null);
  
  // Toast message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Consumer Address & Profile State (Requirement 17)
  const [consumerProfile, setConsumerProfile] = useState<{
    name: string;
    phone: string;
    doorNo: string;
    street: string;
    landmark: string;
    city: string;
    district: string;
    pincode: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('cropnomics_consumer_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: consumerName || 'Anitha Reddy',
      phone: consumerPhone || '+91 98489 55667',
      doorNo: 'Flat 302, Sri Sai Nilayam',
      street: 'MG Road, Arundelpet',
      landmark: 'Near Rythu Bazar Circle',
      city: 'Vijayawada',
      district: 'Krishna',
      pincode: '520010',
    };
  });

  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Booking / Checkout form fields
  const [buyerName, setBuyerName] = useState<string>(consumerProfile.name || consumerName);
  const [buyerPhone, setBuyerPhone] = useState<string>(consumerProfile.phone || consumerPhone);
  const [buyerAddress, setBuyerAddress] = useState<string>(
    `${consumerProfile.doorNo}, ${consumerProfile.street}, ${consumerProfile.city} - ${consumerProfile.pincode}`
  );
  const [buyerLandmark, setBuyerLandmark] = useState<string>(consumerProfile.landmark || 'Near Rythu Bazar');
  const [buyerPincode, setBuyerPincode] = useState<string>(consumerProfile.pincode || '520010');
  const [pickupSlot, setPickupSlot] = useState<string>('Today - Afternoon (12:00 PM - 4:00 PM)');
  const [paymentMode, setPaymentMode] = useState<'pay_at_shop' | 'upi'>('pay_at_shop');
  const [orderNotes, setOrderNotes] = useState<string>('');

  const handleSaveProfileAddress = (updated: typeof consumerProfile) => {
    setConsumerProfile(updated);
    setBuyerName(updated.name);
    setBuyerPhone(updated.phone);
    setBuyerAddress(`${updated.doorNo}, ${updated.street}, ${updated.city} - ${updated.pincode}`);
    setBuyerLandmark(updated.landmark);
    setBuyerPincode(updated.pincode);
    try {
      localStorage.setItem('cropnomics_consumer_profile', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setShowAddressModal(false);
    showToast('Delivery & pickup address updated successfully!');
  };

  // Orders tab filter
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'received'>('all');

  // Centralized DB State
  const [dbState, setDbState] = useState(db.getState());

  useEffect(() => {
    const unsub = db.subscribe((state) => {
      setDbState({ ...state });
    });
    return unsub;
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Products from retailers
  const retailerProducts: RetailerProduct[] = dbState.retailerProducts || [];
  const consumerOrders: ConsumerOrder[] = dbState.consumerOrders || [];

  // Distinct retailers list for filter dropdown
  const retailerShopList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; address?: string }>();
    retailerProducts.forEach((p) => {
      if (p.retailerShopName && !map.has(p.retailerShopName)) {
        map.set(p.retailerShopName, {
          id: p.retailerId || p.retailerShopName,
          name: p.retailerShopName,
          address: p.retailerAddress,
        });
      }
    });
    return Array.from(map.values());
  }, [retailerProducts]);

  // Helper to determine product type: 'crop' or 'packed'
  const isFreshCrop = (p: RetailerProduct) => {
    const cat = (p.category || '').toLowerCase();
    const name = (p.productName || p.name || '').toLowerCase();
    return (
      cat.includes('crop') ||
      cat.includes('vegetable') ||
      cat.includes('fruit') ||
      name.includes('tomato') ||
      name.includes('onion') ||
      (name.includes('chilli') && !name.includes('powder')) ||
      name.includes('corn')
    );
  };

  const isPackedProduce = (p: RetailerProduct) => {
    const cat = (p.category || '').toLowerCase();
    const name = (p.productName || p.name || '').toLowerCase();
    const pkg = (p.packaging || '').toLowerCase();
    return (
      cat.includes('packed') ||
      cat.includes('spices') ||
      cat.includes('grains') ||
      cat.includes('pulses') ||
      cat.includes('oil') ||
      pkg.includes('bag') ||
      pkg.includes('pouch') ||
      pkg.includes('bottle') ||
      pkg.includes('jar') ||
      name.includes('powder') ||
      name.includes('rice') ||
      name.includes('oil') ||
      name.includes('dal') ||
      name.includes('atta')
    );
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return retailerProducts.filter((product) => {
      // Type / Category filter
      let matchesFilter = true;
      if (selectedFilter === 'crop') {
        matchesFilter = isFreshCrop(product);
      } else if (selectedFilter === 'packed') {
        matchesFilter = isPackedProduce(product);
      } else if (selectedFilter === 'spices') {
        matchesFilter =
          (product.category || '').toLowerCase().includes('spice') ||
          (product.productName || '').toLowerCase().includes('chilli') ||
          (product.productName || '').toLowerCase().includes('turmeric');
      } else if (selectedFilter === 'grains') {
        matchesFilter =
          (product.category || '').toLowerCase().includes('grain') ||
          (product.category || '').toLowerCase().includes('pulse') ||
          (product.productName || '').toLowerCase().includes('rice') ||
          (product.productName || '').toLowerCase().includes('dal');
      }

      // Retailer Shop filter
      const matchesRetailer =
        selectedRetailerFilter === 'all' ||
        product.retailerShopName === selectedRetailerFilter;

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (product.productName || '').toLowerCase().includes(q) ||
        (product.retailerShopName || '').toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q) ||
        (product.packaging || '').toLowerCase().includes(q) ||
        (product.sourcedFromMarket || '').toLowerCase().includes(q);

      return matchesFilter && matchesRetailer && matchesSearch;
    });
  }, [retailerProducts, selectedFilter, selectedRetailerFilter, searchQuery]);

  // Cart operations
  const handleAddToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Cart totals
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = retailerProducts.find((p) => p.id === productId);
        const unitPrice: number = Number(product?.price || product?.pricePerKg || 0);
        const itemTotal: number = unitPrice * Number(quantity);
        return {
          product,
          quantity: Number(quantity),
          itemTotal,
        };
      })
      .filter((item) => item.product !== undefined);
  }, [cart, retailerProducts]);

  const totalCartAmount: number = cartItems.reduce((acc, curr) => acc + curr.itemTotal, 0);
  const totalCartCount: number = (Object.values(cart) as number[]).reduce<number>((a, b) => a + b, 0);

  // Handle Multi-item Booking from Cart
  const handlePlaceCartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert('Please provide your name and contact phone number.');
      return;
    }

    const orderItems: ConsumerOrderItem[] = cartItems.map((ci) => ({
      productId: ci.product!.id,
      productName: ci.product!.productName || ci.product!.name || 'Farm Item',
      packaging: ci.product!.packaging,
      quantityKg: ci.quantity,
      unit: ci.product!.unit || 'pack',
      pricePerKg: ci.product!.pricePerKg || ci.product!.price || 0,
      totalPrice: ci.itemTotal,
      imageUrl: ci.product!.imageUrl || ci.product!.image,
    }));

    // Primary retailer info from first product
    const firstProd = cartItems[0].product!;
    const retailerId = firstProd.retailerId || 'ret-gnt-01';
    const retailerShopName = firstProd.retailerShopName || 'AP Rythu Fresh Mart & Store';
    const retailerAddress = firstProd.retailerAddress || 'Shop 14, Main Road, Arundelpet, Guntur, AP';
    const retailerPhone = firstProd.retailerPhone || '+91 98480 55123';

    const fullConsumerAddress = `${buyerAddress.trim()}${buyerLandmark ? ', Landmark: ' + buyerLandmark.trim() : ''}${buyerPincode ? ' - ' + buyerPincode.trim() : ''}`;

    const newOrder = db.createConsumerOrder({
      consumerName: buyerName.trim(),
      consumerPhone: buyerPhone.trim(),
      consumerAddress: fullConsumerAddress,
      retailerId,
      retailerShopName,
      retailerAddress,
      retailerPhone,
      district: firstProd.district || 'Guntur',
      items: orderItems,
      totalAmount: totalCartAmount,
      paymentMethod:
        paymentMode === 'upi'
          ? 'Pre-paid via AP UPI'
          : 'Pay at Retailer Shop Counter (కౌంటర్ వద్ద నగదు/UPI)',
      specialInstructions: `Pickup Slot: ${pickupSlot}. ${orderNotes ? 'Notes: ' + orderNotes : ''}`,
    });

    // Clear cart and show pickup pass
    setCart({});
    setIsCartOpen(false);
    setPickupPassOrder(newOrder);
    showToast(`Booking #${newOrder.orderNumber} confirmed! Visit ${retailerShopName} to collect your goods.`);
  };

  // Handle Single-item Quick Booking
  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookProduct || quickBookQty <= 0) return;

    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert('Please provide your name and contact phone number.');
      return;
    }

    const itemPrice = quickBookProduct.price || quickBookProduct.pricePerKg || 0;
    const totalAmount = itemPrice * quickBookQty;

    const orderItems: ConsumerOrderItem[] = [
      {
        productId: quickBookProduct.id,
        productName: quickBookProduct.productName || quickBookProduct.name || 'Produce Item',
        packaging: quickBookProduct.packaging,
        quantityKg: quickBookQty,
        unit: quickBookProduct.unit || 'pack',
        pricePerKg: itemPrice,
        totalPrice: totalAmount,
        imageUrl: quickBookProduct.imageUrl || quickBookProduct.image,
      },
    ];

    const fullConsumerAddress = `${buyerAddress.trim()}${buyerLandmark ? ', Landmark: ' + buyerLandmark.trim() : ''}${buyerPincode ? ' - ' + buyerPincode.trim() : ''}`;

    const newOrder = db.createConsumerOrder({
      consumerName: buyerName.trim(),
      consumerPhone: buyerPhone.trim(),
      consumerAddress: fullConsumerAddress,
      retailerId: quickBookProduct.retailerId || 'ret-gnt-01',
      retailerShopName: quickBookProduct.retailerShopName || 'AP Rythu Fresh Mart',
      retailerAddress: quickBookProduct.retailerAddress || 'Arundelpet Main Road, Guntur, AP',
      retailerPhone: quickBookProduct.retailerPhone || '+91 98480 55123',
      district: quickBookProduct.district || 'Guntur',
      items: orderItems,
      totalAmount: totalAmount,
      paymentMethod:
        paymentMode === 'upi'
          ? 'Pre-paid via AP UPI'
          : 'Pay at Retailer Shop Counter (కౌంటర్ వద్ద నగదు/UPI)',
      specialInstructions: `Pickup Slot: ${pickupSlot}. ${orderNotes ? 'Notes: ' + orderNotes : ''}`,
    });

    setQuickBookProduct(null);
    setPickupPassOrder(newOrder);
    showToast(`Booking #${newOrder.orderNumber} confirmed! Go to ${quickBookProduct.retailerShopName} to get your items.`);
  };

  // Handle Consumer Pressing "Received" Button (User Requirement 3)
  const handleMarkReceived = (orderId: string) => {
    const success = db.updateConsumerOrderStatus(orderId, 'received');
    if (success) {
      const updatedOrder = db.getState().consumerOrders?.find((o) => o.id === orderId);
      if (updatedOrder) {
        setSelectedReceiptOrder(updatedOrder);
      }
      showToast(
        language === 'te'
          ? 'సరుకులు విజయవంతంగా అందుకున్నారు! మీ రసీదు ధృవీకరించబడింది.'
          : 'Goods successfully received! Receipt verified and recorded.',
        'success'
      );
    }
  };

  // Filter orders for "My Orders & Bookings" view
  const filteredOrders = useMemo(() => {
    return consumerOrders.filter((order) => {
      const isReceived = order.status === 'received' || order.status === 'completed';
      if (ordersFilter === 'pending') {
        return !isReceived;
      }
      if (ordersFilter === 'received') {
        return isReceived;
      }
      return true;
    });
  }, [consumerOrders, ordersFilter]);

  const pendingCount = consumerOrders.filter(
    (o) => o.status !== 'received' && o.status !== 'completed'
  ).length;

  return (
    <div id="consumer-store-dashboard" className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="consumer-toast-banner"
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-500'
              : 'bg-blue-900 text-blue-100 border-blue-500'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-300 text-[22px]">
              {toastMessage.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Top Banner & Navigation Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>AP RETAILER STOREFRONT & DIRECT FARM PRODUCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'te'
                ? 'వినియోగదారుల తాజా కూరగాయలు & ప్యాక్డ్ ఉత్పత్తుల దుకాణం'
                : 'Consumer Fresh Crops & Retailer Packed Store'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mt-1 leading-relaxed">
              {language === 'te'
                ? 'రిటైలర్ వద్ద ఉన్న తాజా పంటలు మరియు ప్యాక్ చేసిన ఉత్పత్తుల జాబితాను చూడండి. ఆన్‌లైన్‌లో బుక్ చేసుకుని, రిటైలర్ దుకాణానికి వెళ్లి పొందండి. సరుకులు అందుకున్న తర్వాత "Received" బటన్‌పై నొక్కండి.'
                : 'View crops and packed products from registered AP retailers. Book online, pick up directly at the retailer shop, and confirm receipt in your dashboard.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Shop vs My Orders with Clear Descriptive Labels */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/15 gap-2">
              <button
                type="button"
                id="btn-tab-consumer-shop"
                onClick={() => setActiveTab('shop')}
                title={language === 'te' ? 'ఉత్పత్తుల జాబితా (Store Catalog)' : 'Store Crops & Products'}
                aria-label="Store Crops & Products"
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                  activeTab === 'shop'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span>{language === 'te' ? 'స్టోర్ కేటలాగ్' : 'Store Catalog'}</span>
              </button>
              <button
                type="button"
                id="btn-tab-consumer-orders"
                onClick={() => setActiveTab('my_orders')}
                title={language === 'te' ? 'నా బుకింగ్స్ & ఆర్డర్లు' : `My Orders (${consumerOrders.length})`}
                aria-label="My Orders"
                className={`relative px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
                  activeTab === 'my_orders'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                <span>{language === 'te' ? 'నా ఆర్డర్లు' : 'My Orders'}</span>
                {pendingCount > 0 && (
                  <span className="w-5 h-5 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Address & Profile Trigger (Requirement 17) */}
            <button
              type="button"
              id="btn-consumer-profile-address"
              onClick={() => setShowAddressModal(true)}
              title="My Delivery & Pickup Address"
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-200 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
              <span className="hidden sm:inline">My Address</span>
            </button>

            {/* Cart Trigger with Label */}
            <button
              type="button"
              id="btn-open-cart"
              onClick={() => setIsCartOpen(true)}
              title={`Cart: ${totalCartCount} items (₹${totalCartAmount.toLocaleString('en-IN')})`}
              aria-label="Shopping Cart"
              className="relative px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              <span>{language === 'te' ? 'కార్ట్' : 'Cart'}</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-800 text-white text-[10px] font-bold rounded-full shadow-sm">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Terms & Rules (Requirement 21) */}
            <button
              type="button"
              id="btn-consumer-terms"
              onClick={() => setShowTermsModal(true)}
              title="Terms & Consumer Rights"
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">gavel</span>
              <span className="hidden md:inline">Terms</span>
            </button>

            {/* Quick Feedback (Requirement 22) */}
            <button
              type="button"
              id="btn-consumer-feedback"
              onClick={() => setShowFeedbackModal(true)}
              title="Consumer Feedback"
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">rate_review</span>
              <span className="hidden md:inline">Feedback</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: CROPS & PACKED PRODUCTS STOREFRONT (Req 2)       */}
      {/* ======================================================== */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* How It Works Explainer Banner for Online Booking & Shop Pickup */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">local_mall</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">
                  {language === 'te'
                    ? 'ఆన్‌లైన్ బుకింగ్ & రిటైలర్ దుకాణంలో పికప్ విధానం'
                    : 'Online Booking & In-Person Retailer Shop Pickup Workflow'}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {language === 'te'
                    ? '1. పంటలు/ప్యాక్ చేసిన ఉత్పత్తులను ఎంచుకోండి → 2. ఆన్‌లైన్ బుక్ చేసి పికప్ టోకెన్ పొందండి → 3. రిటైలర్ షాప్‌కు వెళ్లి సరుకులు తీసుకోండి → 4. డాష్‌బోర్డ్‌లో "Received" నొక్కండి.'
                    : '1. Select fresh crops or packed products → 2. Book online to get Pickup Token → 3. Visit Retailer Shop to collect goods → 4. Press "Received" in Consumer Dashboard.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-xl whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">store</span>
              <span>Direct Farm-to-Retail Transparency</span>
            </div>
          </div>

          {/* Controls Bar: Search, Category Pills & Retailer Filter */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fresh tomatoes, rice bags, turmeric, onions, chillies, or shop name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-2xl border border-outline-variant text-xs font-medium focus:border-emerald-600 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Retailer Shop Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-on-surface-variant whitespace-nowrap flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>Retailer Shop:</span>
                </label>
                <select
                  value={selectedRetailerFilter}
                  onChange={(e) => setSelectedRetailerFilter(e.target.value)}
                  className="px-3 py-2 bg-surface-container rounded-xl border border-outline-variant text-xs font-medium text-on-surface focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="all">All Retailer Shops (అన్ని దుకాణాలు)</option>
                  {retailerShopList.map((shop) => (
                    <option key={shop.id} value={shop.name}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category / Type Tabs (Crops vs Packed Products) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Items (అన్ని రకాలు)', icon: 'apps' },
                { id: 'crop', label: '🌾 Fresh Farm Crops (తాజా పంటలు)', icon: 'agriculture' },
                { id: 'packed', label: '📦 Packed Products (ప్యాక్ చేసిన ఉత్పత్తులు)', icon: 'inventory_2' },
                { id: 'spices', label: '🌶️ Spices & Essentials (మసాలాలు)', icon: 'soup_kitchen' },
                { id: 'grains', label: '🌾 Grains & Pulses (ధాన్యాలు & పప్పులు)', icon: 'grain' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  id={`btn-filter-${tab.id}`}
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedFilter === tab.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container border border-outline-variant/60 space-y-3">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                search_off
              </span>
              <h3 className="text-base font-bold text-on-surface">
                {language === 'te'
                  ? 'ఈ విభాగంలో ఉత్పత్తి ఇంకా అందుబాటులో లేదు'
                  : 'The product is not available yet in this section'}
              </h3>
              {searchQuery ? (
                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                    {language === 'te'
                      ? `"${searchQuery}" కోసం ఎటువంటి ఉత్పత్తులు కనుగొనబడలేదు. దయచేసి వేరే పేరుతో ప్రయత్నించండి.`
                      : `No products matching "${searchQuery}". Please check your spelling or try another keyword.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>{language === 'te' ? 'వెతుకులాటను క్లియర్ చేయండి' : 'Clear Search'}</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  {language === 'te'
                    ? 'ప్రస్తుతం ఈ కేటగిరీ లేదా ఫిల్టర్‌లో ఉత్పత్తులు అందుబాటులో లేవు.'
                    : 'Currently no products are listed under this category or shop filter.'}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const inCartQty = cart[product.id] || 0;
                const isCrop = isFreshCrop(product);
                const displayPrice = product.price || product.pricePerKg || 0;

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant hover:border-emerald-500 transition-all shadow-xs hover:shadow-md flex flex-col overflow-hidden group"
                  >
                    {/* Image Header with Badges */}
                    <div className="relative h-48 bg-surface-container overflow-hidden">
                      <img
                        src={product.imageUrl || product.image}
                        alt={product.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Crop vs Packed Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                            isCrop
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isCrop ? 'spa' : 'inventory_2'}
                          </span>
                          <span>{isCrop ? 'Fresh Farm Crop' : 'Packed Product'}</span>
                        </span>
                      </div>

                      {/* Packaging specification tag */}
                      {product.packaging && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                            {product.packaging}
                          </span>
                        </div>
                      )}

                      {/* Sourced Mandi origin */}
                      {product.sourcedFromMarket && (
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1 border border-emerald-500/30 truncate">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>{product.sourcedFromMarket}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-on-surface leading-snug line-clamp-2">
                            {product.productName || product.name}
                          </h3>
                        </div>

                        {/* Retailer Shop Information & Pickup Location */}
                        <div className="mt-2.5 p-2.5 rounded-xl bg-surface-container border border-outline-variant/60 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-on-surface">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">storefront</span>
                            <span className="truncate">{product.retailerShopName}</span>
                          </div>
                          {product.retailerAddress && (
                            <div className="text-[11px] text-on-surface-variant flex items-start gap-1">
                              <span className="material-symbols-outlined text-[13px] text-on-surface-variant mt-0.5 flex-shrink-0">place</span>
                              <span className="line-clamp-2">{product.retailerAddress}</span>
                            </div>
                          )}
                          {product.retailerPhone && (
                            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              <span>{product.retailerPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Store Pickup Guarantee Note */}
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                          <span>🏪 Store Pickup: Book online & collect at shop</span>
                        </div>

                        {product.description && (
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Price, Stock & Action Buttons */}
                      <div className="pt-2.5 border-t border-outline-variant/60 space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-[10px] text-on-surface-variant font-mono">RETAIL PRICE</div>
                            <div className="font-price-display text-lg font-black text-emerald-700 dark:text-emerald-400">
                              ₹{displayPrice}{' '}
                              <span className="text-xs font-sans text-on-surface-variant font-normal">
                                / {product.unit || 'pack'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-on-surface-variant text-right">
                            Available: {product.availableStockKg || product.stockQuantity || 50} {product.unit || 'pack'}
                          </div>
                        </div>

                        {/* Booking CTAs */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Quick 1-Click Book for Pickup */}
                          <button
                            type="button"
                            onClick={() => {
                              setQuickBookProduct(product);
                              setQuickBookQty(1);
                            }}
                            className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">event_available</span>
                            <span>Book Pickup</span>
                          </button>

                          {/* Cart Add / Stepper */}
                          {inCartQty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product.id)}
                              className="py-2 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all border border-outline-variant flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[15px]">add_shopping_cart</span>
                              <span>Add to Cart</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-surface-container rounded-xl p-1 border border-outline-variant">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(product.id, -1)}
                                className="w-6 h-6 rounded bg-surface flex items-center justify-center font-bold text-xs hover:bg-surface-container-high cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs px-1 text-on-surface">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(product.id, 1)}
                                className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
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
      {/* VIEW 2: CONSUMER MY BOOKINGS & ORDERS (Req 2 & 3)         */}
      {/* ======================================================== */}
      {activeTab === 'my_orders' && (
        <div className="space-y-6">
          {/* Step Back Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              id="btn-back-to-consumer-shop"
              type="button"
              onClick={() => {
                setActiveTab('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={language === 'te' ? 'వెనుకకు' : 'Back'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
            </button>
            <span className="text-xs text-on-surface-variant font-mono hidden sm:inline-block">
              {language === 'te' ? 'నా ఆర్డర్లు & రసీదులు' : 'My Orders & Tokens'}
            </span>
          </div>

          {/* Header & Filter Controls */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                <span>{language === 'te' ? 'నా ఆర్డర్లు & స్టోర్ పికప్ ట్రాకింగ్' : 'Consumer Bookings & Store Pickup Dashboard'}</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {language === 'te'
                  ? 'రిటైలర్ షాప్‌కు వెళ్లి మీ పికప్ కోడ్ చూపించి సరుకులు తీసుకోండి. సరుకులు అందుకున్న తర్వాత కింద ఉన్న "Received" బటన్‌పై నొక్కండి.'
                  : 'Visit the Retailer Shop with your Pickup Code to collect your items. Once collected, click "Received" below to confirm.'}
              </p>
            </div>

            {/* Filter Pills: All vs Pending vs Received */}
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant text-xs">
              <button
                type="button"
                onClick={() => setOrdersFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  ordersFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({consumerOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrdersFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  ordersFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Ready for Pickup ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setOrdersFilter('received')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  ordersFilter === 'received'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Received ({consumerOrders.length - pendingCount})
              </button>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container border border-outline-variant/60 space-y-3">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">shopping_bag</span>
              <h3 className="text-base font-bold text-on-surface">No Bookings Found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                You do not have any bookings in this filter. Explore the storefront to book fresh crops or packed products online.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Browse Crops & Packed Products
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const isReceived = order.status === 'received' || order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    id={`consumer-order-card-${order.id}`}
                    className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-4 hover:border-emerald-500/50 transition-all"
                  >
                    {/* Header: Order ID, Token & Status */}
                    <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-outline-variant/60">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-on-surface">
                            Order #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse'
                            }`}
                          >
                            {isReceived
                              ? '✅ Goods Received by Consumer'
                              : '🟡 Booked — Ready for Pickup at Retailer Shop'}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
                          <span>Booked by: <strong className="text-on-surface">{order.consumerName}</strong></span>
                          <span>•</span>
                          <span className="font-mono">
                            {order.orderDate || order.bookedAt ? new Date(order.orderDate || order.bookedAt).toLocaleDateString() : 'Today'}
                          </span>
                          <span>•</span>
                          <span className="text-on-surface-variant">{order.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Pickup Token Card */}
                      <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant">
                        <div>
                          <div className="text-[10px] uppercase font-mono font-bold text-on-surface-variant">
                            STORE PICKUP CODE
                          </div>
                          <div className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                            {order.pickupCode || `AP-PICKUP-${order.orderNumber.replace(/\D/g, '')}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const code = order.pickupCode || `AP-PICKUP-${order.orderNumber.replace(/\D/g, '')}`;
                            navigator.clipboard?.writeText(code);
                            showToast(`Copied Pickup Code: ${code}`, 'info');
                          }}
                          className="p-1.5 hover:bg-surface rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
                          title="Copy Pickup Code"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                      </div>
                    </div>

                    {/* Retailer Shop Pickup Address Card (Where Consumer Goes) */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-200">
                          <span className="material-symbols-outlined text-[18px] text-emerald-600">storefront</span>
                          <span>Go to Retailer Shop to Collect:</span>
                          <strong className="text-emerald-700 dark:text-emerald-300">{order.retailerShopName}</strong>
                        </div>
                        <div className="flex items-start gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px] mt-0.5 text-on-surface-variant">place</span>
                          <span>{order.retailerAddress || 'Arundelpet Main Commercial Yard, Guntur, AP'}</span>
                        </div>
                        {order.retailerPhone && (
                          <div className="flex items-center gap-1 text-on-surface-variant font-mono text-[11px]">
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            <span>Retailer Contact: <strong>{order.retailerPhone}</strong></span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.retailerPhone && (
                          <a
                            href={`tel:${order.retailerPhone.replace(/\s+/g, '')}`}
                            className="bg-[#0d5c2e] hover:bg-[#14532d] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Call Retailer Directly"
                          >
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            <span>Contact this number ({order.retailerPhone})</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container font-bold text-xs text-on-surface flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">receipt</span>
                          <span>Pass / Receipt</span>
                        </button>
                      </div>
                    </div>

                    {/* Booked Items Table (Crops & Packed Products) */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
                        Booked Crops & Packed Products ({order.items.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-surface-container border border-outline-variant flex items-center gap-2.5"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1 text-xs">
                              <div className="font-bold text-on-surface truncate">{item.productName}</div>
                              {item.packaging && (
                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                  {item.packaging}
                                </div>
                              )}
                              <div className="text-[11px] text-on-surface-variant font-mono">
                                {item.quantityKg} {item.unit || 'pack'} × ₹{item.pricePerKg}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-xs text-on-surface">
                              ₹{item.totalPrice}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Status Actions: THE "RECEIVED" BUTTON (Req 3) */}
                    <div className="pt-3 border-t border-outline-variant/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-on-surface-variant font-mono">Total Order Amount:</span>
                          <span className="font-price-display text-lg font-black text-emerald-700 dark:text-emerald-400">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {order.specialInstructions && (
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            {order.specialInstructions}
                          </div>
                        )}
                      </div>

                      {/* REQUIREMENT 3: "We need to add an option in consumer dashboard where he will press received after he received the goods" */}
                      <div>
                        {isReceived ? (
                          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                            <span>Goods Received (సరుకులు అందుకున్నాను)</span>
                            {order.receivedAt && (
                              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-normal">
                                • {new Date(order.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              id={`btn-consumer-received-${order.id}`}
                              onClick={() => handleMarkReceived(order.id)}
                              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-emerald-500/40"
                              title="Click here once you collect your goods from the retailer shop"
                            >
                              <span className="material-symbols-outlined text-[18px]">done_all</span>
                              <span>Received (సరుకులు అందుకున్నాను)</span>
                            </button>
                          </div>
                        )}
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
      {/* MODAL: QUICK 1-CLICK ITEM BOOKING FOR STORE PICKUP       */}
      {/* ======================================================== */}
      {quickBookProduct && (
        <div
          id="quick-book-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setQuickBookProduct(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">event_available</span>
                <div>
                  <h3 className="text-base font-black text-on-surface">Book Online for Retailer Shop Pickup</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Reserve item online and collect in-person at retailer shop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickBookProduct(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Product Summary */}
            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant flex items-center gap-3.5">
              <img
                src={quickBookProduct.imageUrl || quickBookProduct.image}
                alt={quickBookProduct.productName}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    isFreshCrop(quickBookProduct)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isFreshCrop(quickBookProduct) ? 'Fresh Farm Crop' : 'Packed Product'}
                </span>
                <h4 className="font-bold text-xs text-on-surface truncate mt-1">
                  {quickBookProduct.productName || quickBookProduct.name}
                </h4>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  ₹{quickBookProduct.price || quickBookProduct.pricePerKg} / {quickBookProduct.unit || 'pack'}
                </div>
              </div>
            </div>

            {/* Retailer Pickup Location Details */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">storefront</span>
                <span>Retailer Shop to Visit: <strong>{quickBookProduct.retailerShopName}</strong></span>
              </div>
              <div className="text-on-surface-variant text-[11px]">
                {quickBookProduct.retailerAddress || 'Arundelpet Main Commercial Market, Guntur, AP'}
              </div>
              <div className="text-on-surface-variant text-[11px] font-mono">
                Phone: {quickBookProduct.retailerPhone || '+91 98480 55123'}
              </div>
            </div>

            <form onSubmit={handleQuickBookSubmit} className="space-y-3.5 text-xs">
              {/* Quantity Selector */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Quantity to Book *</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-surface-container rounded-xl p-1 border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setQuickBookQty(Math.max(1, quickBookQty - 1))}
                      className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-bold text-sm hover:bg-surface-container-high cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={quickBookProduct.availableStockKg || 100}
                      value={quickBookQty}
                      onChange={(e) => setQuickBookQty(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-center font-mono font-bold text-xs bg-transparent focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickBookQty(quickBookQty + 1)}
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-on-surface">
                    Total: ₹{((quickBookProduct.price || quickBookProduct.pricePerKg || 0) * quickBookQty).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Consumer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Delivery & Pickup Address Details (Requirement 17) */}
              <div className="space-y-2 pt-1 border-t border-outline-variant/60">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-on-surface">
                    Delivery & Pickup Address
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit_location</span>
                    <span>Edit Profile Address</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="House / Flat No, Street, Area"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Landmark (e.g. Near Rythu Bazar)"
                    value={buyerLandmark}
                    onChange={(e) => setBuyerLandmark(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Pincode (e.g. 520010)"
                    value={buyerPincode}
                    onChange={(e) => setBuyerPincode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pickup Time Slot Selection */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Preferred Pickup Time Slot *</label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="Today - Morning (8:00 AM - 12:00 PM)">Today - Morning (8:00 AM - 12:00 PM)</option>
                  <option value="Today - Afternoon (12:00 PM - 4:00 PM)">Today - Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="Today - Evening (4:00 PM - 8:30 PM)">Today - Evening (4:00 PM - 8:30 PM)</option>
                  <option value="Tomorrow - Morning (8:00 AM - 12:00 PM)">Tomorrow - Morning (8:00 AM - 12:00 PM)</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-bold text-on-surface mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('pay_at_shop')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMode === 'pay_at_shop'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-surface border-outline-variant text-on-surface'
                    }`}
                  >
                    Pay at Retailer Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMode === 'upi'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-surface border-outline-variant text-on-surface'
                    }`}
                  >
                    Pay Online via UPI
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Confirm Online Booking (₹{((quickBookProduct.price || quickBookProduct.pricePerKg || 0) * quickBookQty).toLocaleString('en-IN')})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DIGITAL STORE PICKUP PASS (Shown upon booking)    */}
      {/* ======================================================== */}
      {pickupPassOrder && (
        <div
          id="pickup-pass-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPickupPassOrder(null)}
        >
          <div
            className="bg-surface-container-lowest border border-emerald-500 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-7 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h3 className="text-lg font-black text-on-surface">Online Booking Confirmed!</h3>
              <p className="text-xs text-on-surface-variant">
                Your store pickup pass is ready. Please visit the retailer shop to collect your items.
              </p>
            </div>

            {/* Token Badge */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 dark:text-emerald-300 font-bold">
                SHOW THIS CODE AT RETAILER SHOP
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                {pickupPassOrder.pickupCode}
              </div>
              <div className="text-[11px] text-on-surface-variant font-mono">
                Order #{pickupPassOrder.orderNumber}
              </div>
            </div>

            {/* Retailer Shop Details */}
            <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant space-y-2 text-xs">
              <div className="font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">storefront</span>
                <span>Go to Retailer Shop: <strong>{pickupPassOrder.retailerShopName}</strong></span>
              </div>
              <div className="text-on-surface-variant text-[11px] flex items-start gap-1">
                <span className="material-symbols-outlined text-[13px] mt-0.5 text-on-surface-variant">place</span>
                <span>{pickupPassOrder.retailerAddress}</span>
              </div>
              <div className="text-on-surface-variant text-[11px] font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">call</span>
                <span>Phone: {pickupPassOrder.retailerPhone}</span>
              </div>
            </div>

            {/* Instruction Checklist */}
            <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
              <div className="font-bold text-on-surface mb-1">What to do next:</div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">check</span>
                <span>1. Go to the retailer shop during opening hours.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">check</span>
                <span>2. Show this Pickup Token to collect your items.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">check</span>
                <span>3. In Consumer Dashboard, press <strong>&quot;Received&quot;</strong> to confirm.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPickupPassOrder(null);
                  setActiveTab('my_orders');
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Go to My Bookings in Dashboard
              </button>
              <button
                type="button"
                onClick={() => setPickupPassOrder(null)}
                className="px-4 py-3 bg-surface border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VERIFIED PICKUP RECEIPT (Viewable anytime)        */}
      {/* ======================================================== */}
      {selectedReceiptOrder && (
        <div
          id="receipt-view-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container cursor-pointer flex items-center justify-center mr-1"
                  title="Back"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <span className="material-symbols-outlined text-emerald-600 text-2xl">verified_user</span>
                <div>
                  <h3 className="text-base font-black text-on-surface">AP Rythu Store Digital Pickup Receipt</h3>
                  <p className="text-[11px] font-mono text-on-surface-variant">Order #{selectedReceiptOrder.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/80 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">RETAILER SHOP</div>
                  <div className="font-bold text-sm text-on-surface">{selectedReceiptOrder.retailerShopName}</div>
                  <div className="text-[11px] text-on-surface-variant">{selectedReceiptOrder.retailerAddress}</div>
                  <div className="text-[11px] font-mono text-on-surface-variant">{selectedReceiptOrder.retailerPhone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">CONSUMER</div>
                  <div className="font-bold text-on-surface">{selectedReceiptOrder.consumerName}</div>
                  <div className="text-[11px] font-mono text-on-surface-variant">{selectedReceiptOrder.consumerPhone}</div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="material-symbols-outlined text-[16px]">done_all</span>
                  <span>
                    {selectedReceiptOrder.status === 'received' || selectedReceiptOrder.status === 'completed'
                      ? 'Goods Received by Consumer'
                      : 'Booked - Ready for In-Store Pickup'}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  Token: {selectedReceiptOrder.pickupCode}
                </span>
              </div>

              {/* Items */}
              <div className="pt-2 border-t border-outline-variant space-y-1.5">
                <div className="font-mono text-[10px] font-bold text-on-surface-variant uppercase">
                  Itemized Produce List
                </div>
                {selectedReceiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <div>
                      <span className="font-bold text-on-surface">{item.productName}</span>
                      {item.packaging && (
                        <span className="text-[11px] text-on-surface-variant ml-1 font-mono">({item.packaging})</span>
                      )}
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {item.quantityKg} {item.unit || 'pack'} × ₹{item.pricePerKg}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-on-surface">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-2 flex justify-between items-baseline text-sm font-black border-t border-outline-variant">
                <span>Total Amount</span>
                <span className="font-price-display text-base text-emerald-700 dark:text-emerald-400">
                  ₹{selectedReceiptOrder.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {selectedReceiptOrder.receivedAt && (
                <div className="text-[10px] font-mono text-on-surface-variant text-center pt-2">
                  Receipt Authenticated on {new Date(selectedReceiptOrder.receivedAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-surface border border-outline-variant hover:bg-surface-container text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SLIDE-OUT CART MODAL / CHECKOUT FOR MULTIPLE ITEMS       */}
      {/* ======================================================== */}
      {isCartOpen && (
        <div
          id="consumer-cart-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container cursor-pointer flex items-center justify-center mr-1"
                    title={language === 'te' ? 'స్టోర్‌కు తిరిగి వెళ్లండి' : 'Back to Store'}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">shopping_cart</span>
                  <h3 className="text-lg font-black text-on-surface">Cart & Online Store Booking</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant text-xs space-y-2">
                    <span className="material-symbols-outlined text-4xl">remove_shopping_cart</span>
                    <p>Your cart is empty. Add crops or packed products from the storefront!</p>
                  </div>
                ) : (
                  cartItems.map(({ product, quantity, itemTotal }) => (
                    <div
                      key={product!.id}
                      className="p-3 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={product!.imageUrl || product!.image}
                          alt={product!.productName}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-on-surface truncate">
                            {product!.productName || product!.name}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            {product!.retailerShopName}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                            ₹{product!.price || product!.pricePerKg} / {product!.unit || 'pack'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-outline-variant">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(product!.id, -1)}
                            className="w-6 h-6 rounded bg-surface flex items-center justify-center font-bold text-xs hover:bg-surface-container-high cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold px-1.5">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(product!.id, 1)}
                            className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-mono font-bold text-xs w-14 text-right text-on-surface">
                          ₹{itemTotal}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Booking & Store Pickup Form */}
              {cartItems.length > 0 && (
                <form id="checkout-form" onSubmit={handlePlaceCartBooking} className="space-y-3 pt-2 border-t border-outline-variant">
                  <div className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                    Online Booking & Store Pickup Details
                  </div>

                  {/* Primary Shop to Visit */}
                  {cartItems[0]?.product && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                      <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">storefront</span>
                        <span>Retailer Shop: {cartItems[0].product.retailerShopName}</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {cartItems[0].product.retailerAddress || 'Arundelpet Main Road, Guntur, AP'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-medium focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Delivery & Pickup Address Details (Requirement 17) */}
                  <div className="space-y-2 pt-1 border-t border-outline-variant/60">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-on-surface">
                        Delivery & Pickup Address
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit_location</span>
                        <span>Edit Profile Address</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="House / Flat No, Street, Area"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Landmark (e.g. Near Rythu Bazar)"
                        value={buyerLandmark}
                        onChange={(e) => setBuyerLandmark(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="Pincode (e.g. 520010)"
                        value={buyerPincode}
                        onChange={(e) => setBuyerPincode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Preferred Store Pickup Time Slot *
                    </label>
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-medium focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="Today - Morning (8:00 AM - 12:00 PM)">Today - Morning (8:00 AM - 12:00 PM)</option>
                      <option value="Today - Afternoon (12:00 PM - 4:00 PM)">Today - Afternoon (12:00 PM - 4:00 PM)</option>
                      <option value="Today - Evening (4:00 PM - 8:30 PM)">Today - Evening (4:00 PM - 8:30 PM)</option>
                      <option value="Tomorrow - Morning (8:00 AM - 12:00 PM)">Tomorrow - Morning (8:00 AM - 12:00 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('pay_at_shop')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          paymentMode === 'pay_at_shop'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-surface border-outline-variant text-on-surface'
                        }`}
                      >
                        Pay at Retailer Shop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('upi')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          paymentMode === 'upi'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-surface border-outline-variant text-on-surface'
                        }`}
                      >
                        Pre-pay Online UPI
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Checkout Action */}
            {cartItems.length > 0 && (
              <div className="pt-4 border-t border-outline-variant space-y-3">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Items Count</span>
                    <span>{totalCartCount} items</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-on-surface pt-1 border-t border-outline-variant">
                    <span>Total Amount</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ₹{totalCartAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
                  <span>Confirm Online Booking (₹{totalCartAmount.toLocaleString('en-IN')})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONSUMER DELIVERY & PICKUP ADDRESS (Req 17)        */}
      {/* ======================================================== */}
      {showAddressModal && (
        <div
          id="consumer-address-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">home_pin</span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Delivery & Pickup Address
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saved address for your Andhra Pradesh farm-direct orders & store pickups
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const updated = {
                  name: (form.elements.namedItem('addr_name') as HTMLInputElement).value,
                  phone: (form.elements.namedItem('addr_phone') as HTMLInputElement).value,
                  doorNo: (form.elements.namedItem('addr_door') as HTMLInputElement).value,
                  street: (form.elements.namedItem('addr_street') as HTMLInputElement).value,
                  landmark: (form.elements.namedItem('addr_landmark') as HTMLInputElement).value,
                  city: (form.elements.namedItem('addr_city') as HTMLInputElement).value,
                  district: (form.elements.namedItem('addr_district') as HTMLSelectElement).value,
                  pincode: (form.elements.namedItem('addr_pincode') as HTMLInputElement).value,
                };
                handleSaveProfileAddress(updated);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="addr_name"
                    required
                    defaultValue={consumerProfile.name}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile (+91) *
                  </label>
                  <input
                    type="tel"
                    name="addr_phone"
                    required
                    defaultValue={consumerProfile.phone}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flat / House / Door No. *
                </label>
                <input
                  type="text"
                  name="addr_door"
                  required
                  defaultValue={consumerProfile.doorNo}
                  placeholder="e.g. Flat 302, Sri Sai Nilayam"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Street / Colony / Area *
                </label>
                <input
                  type="text"
                  name="addr_street"
                  required
                  defaultValue={consumerProfile.street}
                  placeholder="e.g. MG Road, Arundelpet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    name="addr_landmark"
                    required
                    defaultValue={consumerProfile.landmark}
                    placeholder="e.g. Near Rythu Bazar Circle"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="addr_pincode"
                    required
                    maxLength={6}
                    defaultValue={consumerProfile.pincode}
                    placeholder="e.g. 520010"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    name="addr_city"
                    required
                    defaultValue={consumerProfile.city}
                    placeholder="e.g. Vijayawada"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    AP District *
                  </label>
                  <select
                    name="addr_district"
                    defaultValue={consumerProfile.district || 'Krishna'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-emerald-600 focus:outline-hidden"
                  >
                    {ANDHRA_PRADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Save Delivery Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal (Requirement 21) */}
      {showTermsModal && (
        <TermsAndConditionsModal
          role="consumer"
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* Quick Feedback Modal (Requirement 22) */}
      {showFeedbackModal && (
        <QuickFeedbackModal
          role="consumer"
          userName={consumerName}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
};
