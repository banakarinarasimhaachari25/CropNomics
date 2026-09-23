export type UserRole = 'farmer' | 'trader' | 'retailer' | 'consumer' | 'admin';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ka' | 'ma' | 'ta' | 'es' | 'fr' | 'sw';

export type AppScreen =
  | 'welcome'
  | 'farmer'
  | 'trader'
  | 'retailer'
  | 'consumer'
  | 'admin'
  | 'home'
  | 'market'
  | 'help'
  | 'analysis'
  | 'alerts';

export interface CropOption {
  id: string;
  name: string;
  tagline?: string;
  teluguName?: string;
  description?: string;
  icon?: string;
  image: string;
  basePricePerTon: number;
  typicalYield?: string;
  defaultUnit?: string;
  transportCostRate: number;
  cropDurationDays?: number;
  freshnessAmbientDays: number;
  freshnessColdStorageDays: number;
  transitToConsumerDays: number;
  perishabilityLevel: 'High' | 'Medium' | 'Low' | 'Non-Perishable';
  idealTemp: string;
  idealHumidity: string;
  freshnessNotes?: string;
  isCustom?: boolean;
  mspPerTon?: number;
}

export interface FarmerCardDetails {
  cardNumber: string; // e.g., 'AP-KCC-849201'
  aadhaarLast4: string;
  landSurveyNumber: string;
  acreage: number;
  district: string;
  username: string;
  generatedPassword?: string;
  issueDate?: string;
}

export interface FarmerPartition {
  id: string;
  lotNumber: number;
  tons: number;
  pricePerTon: number;
  status: 'available' | 'locked' | 'sold';
  soldToTrader?: string;
  acceptedRequestId?: string;
}

export interface TradeRequest {
  id: string;
  listingId: string;
  cropId?: string;
  cropName: string;
  variety?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerLocation: string;
  traderId: string;
  traderName: string;
  traderPhone: string;
  traderFirm?: string;
  traderDistrict?: string;
  requestedQuantity: number;
  offeredPricePerTon: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requestDate: string;
  notes?: string;
  isEmergency?: boolean;
  isPartition?: boolean;
  partitionId?: string;
  pickupAddress?: string;
  // Offline payment fields (Feature 15)
  isOfflinePayment?: boolean;
  offlinePaymentStatus?: 'unpaid' | 'receipt_uploaded' | 'verified';
  offlinePaymentReceipt?: string;
  offlinePaymentReceiptNote?: string;
  offlinePaymentDate?: string;
  offlinePaymentAmount?: number;
  offlineReceiptNumber?: string;
  offlinePaymentMethod?: 'Cash' | 'APMC Market Challan' | 'Bank Deposit' | 'Direct RTGS';
}

export interface OfflineReceiptRecord {
  id: string;
  requestId: string;
  role: UserRole;
  uploaderName: string;
  uploaderPhone: string;
  counterpartyName: string;
  cropName: string;
  amount: number;
  quantityTonsOrBags: string;
  receiptNumber: string;
  paymentMethod: string;
  paymentDate: string;
  receiptImageUrl: string;
  notes?: string;
  uploadedAt: string;
  verified: boolean;
}

export interface SeasonalAdvisoryInfo {
  cropId: string;
  cropName: string;
  currentSeason: string;
  harvestWindow: string;
  optimalSellingPriceMin: number;
  optimalSellingPriceMax: number;
  recommendedAction: string;
  marketTrend: 'Bullish (Rising)' | 'Stable' | 'Volatile' | 'Bearish';
  nextSowingSeason: string;
  farmerFreeDays: number;
  freeTimeStartDate: string;
  freeTimeEndDate: string;
  freeTimeAdvice: string;
  moistureDecayFactor: string;
}

export interface FarmerProfile {
  fullName: string;
  farmerName?: string;
  mobile: string;
  location: string;
  district?: string;
  primaryCrop: string;
  basePricePerTon?: number;
  sowingDate?: string;
  harvestDate?: string;
  cropDurationDays?: number;
  storageCondition?: 'ambient' | 'cold_storage' | 'aerated_shed';
  quantity: number;
  unit?: string;
  notes?: string;
  registeredAt?: string;
  freshnessAmbientDays?: number;
  freshnessColdStorageDays?: number;
  transitToConsumerDays?: number;
  perishabilityLevel?: 'High' | 'Moderate' | 'Low' | 'Non-Perishable';
  farmerCard?: FarmerCardDetails;
  isEmergencyMode?: boolean;
  isConfirmedForSale?: boolean;
  confirmedAt?: string;
  partitions?: FarmerPartition[];
  verified?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface FarmerListing {
  id: string;
  farmerName: string;
  cropName: string;
  variety: string;
  grade: string;
  tons: number;
  originalTons?: number;
  distanceMiles: number;
  location: string;
  estPriceTotal: number;
  pricePerTon: number;
  moistureContent: string;
  description: string;
  image: string;
  verified: boolean;
  phone: string;
  isEmergencyMode?: boolean;
  isLocked?: boolean;
  partitions?: FarmerPartition[];
  status?: 'active' | 'partially_sold' | 'locked_sold';
  confirmedForSale?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface RetailerLot {
  id: string;
  bags: number;
  tons: number;
  cropName: string;
  variety: string;
  buyingPriceTotal: number;
  pricePerBag: number;
  traderName: string;
  traderRating: number;
  traderPhone: string;
  image: string;
  location?: string;
  district?: string;
  grade?: string;
  minOrderBags?: number;
  coldChainAvailable?: boolean;
  transitHours?: number;
  firmName?: string;
  verified?: boolean;
  notes?: string;
  licenseNumber?: string;
  dealsCount?: number;
  stockCapacityBags?: number;
  paymentTerms?: string;
  coordinates?: { lat: number; lng: number };
}

export interface UserAccount {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  username?: string;
  role: UserRole;
  password?: string;
  createdAt: string;
  badge?: string;
}

export interface ReportedIssue {
  id: string;
  title: string;
  description?: string;
  reporter: string;
  reporterTelugu?: string;
  timestamp: string;
  category: 'Market' | 'App' | 'Transport' | 'Payment';
  timeAgo: string;
  status: 'New' | 'Fixed' | 'In Progress';
  icon: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  role: 'Farmer' | 'Trader' | 'Retailer' | 'Admin' | 'Consumer' | string;
  rating: number;
  comment: string;
  date: string;
}

export interface GovernmentAlert {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  category: 'SUBSIDY' | 'TARIFF' | 'GRANT' | 'WEATHER' | 'MARKET';
  summary: string;
  fullDetails: string;
  effectiveDate: string;
  read: boolean;
}

export interface TraderIdentity {
  name: string;
  phoneNumber: string;
  tradingFirm?: string;
  district?: string;
  addressMode?: 'manual' | 'live_gps';
  manualAddress?: string;
  liveCoordinates?: { latitude: number; longitude: number; accuracy?: number };
  location?: string;
  savedAt?: string;
}

export interface RetailerIdentity {
  name: string;
  phoneNumber: string;
  shopName?: string;
  district?: string;
  address?: string;
  manualAddress?: string;
  landmark?: string;
  pincode?: string;
  addressMode?: 'manual' | 'live_gps';
  liveCoordinates?: { latitude: number; longitude: number; accuracy?: number };
  location?: string;
  savedAt?: string;
}

export interface RetailerBooking {
  id: string;
  orderNumber?: string;
  lotId: string;
  cropName: string;
  variety?: string;
  bags: number;
  tons: number;
  totalAmount: number;
  pricePerBag: number;
  retailerName: string;
  retailerPhone: string;
  retailerShopName?: string;
  retailerAddress?: string;
  traderName: string;
  traderPhone: string;
  traderFirm?: string;
  traderLocation?: string;
  district?: string;
  paymentTerms?: string;
  paymentMode?: string;
  paymentStatus?: 'pending' | 'escrow_locked' | 'paid' | 'settled';
  status: 'booked' | 'confirmed' | 'dispatched' | 'completed' | 'Delivered' | 'In Transit';
  bookedAt: string;
  createdAt?: string;
  estimatedDeliveryDate?: string;
}

export interface AdminNotice {
  id: string;
  title: string;
  titleTelugu?: string;
  category: 'policy' | 'mandi' | 'subsidy' | 'procurement' | 'weather_alert';
  summary: string;
  summaryTelugu?: string;
  authority: string;
  issuedDate: string;
  pinned: boolean;
  actionUrl?: string;
}

export interface PaymentUpdate {
  id: string;
  sourceRole: 'farmer' | 'trader' | 'retailer' | 'consumer' | 'government';
  targetRole: 'farmer' | 'trader' | 'retailer' | 'consumer';
  fromName: string;
  toName: string;
  amount: number;
  purpose: string;
  method: 'UPI' | 'AP_ESCROW' | 'DBT' | 'CASH_AT_COUNTER' | 'RTGS' | string;
  utrNumber: string;
  timestamp: string;
  status: 'Completed' | 'In Escrow' | 'Processing';
  referenceId?: string;
  description?: string;
  date?: string;
  paymentMethod?: string;
}

export interface RetailerProduct {
  id: string;
  retailerId?: string;
  retailerShopName: string;
  retailerPhone?: string;
  retailerAddress?: string;
  district?: string;
  name?: string;
  productName: string;
  category: 'Fresh Crop' | 'Packed Produce' | 'Spices & Essentials' | 'Organic Pack' | string;
  packaging?: string; // e.g., '1 kg Poly Pack', '5 kg Bag', '25 kg Sack', '500g Jar'
  price?: number; // in ₹
  pricePerKg: number; // in ₹ per kg
  unit: string; // 'kg', 'pack', 'bag', 'bottle'
  stockQuantity?: number;
  availableStockKg: number;
  image?: string;
  imageUrl: string;
  freshnessGrade?: string;
  isAvailable?: boolean;
  description?: string;
  sourcedFromMarket?: string;
  coordinates?: { lat: number; lng: number };
}

export interface ConsumerOrderItem {
  productId: string;
  productName: string;
  packaging?: string;
  quantity?: number;
  quantityKg: number;
  unit?: string;
  unitPrice?: number;
  pricePerKg: number;
  total?: number;
  totalPrice: number;
  image?: string;
  imageUrl?: string;
}

export interface ConsumerOrder {
  id: string;
  orderNumber: string;
  consumerName: string;
  consumerPhone: string;
  consumerAddress?: string;
  retailerId?: string;
  retailerShopName: string;
  retailerPhone?: string;
  retailerAddress?: string;
  district?: string;
  items: ConsumerOrderItem[];
  totalAmount: number;
  status: 'booked' | 'ready_for_pickup' | 'received' | 'completed' | 'placed' | 'dispatched';
  bookedAt: string;
  orderDate?: string;
  pickupCode: string;
  notes?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  receivedAt?: string;
  completedAt?: string;
}

export interface ConsumerIdentity {
  name: string;
  phoneNumber: string;
  district?: string;
  manualAddress?: string;
  deliveryAddress?: string;
}

