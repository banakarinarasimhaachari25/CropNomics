import React, { useState } from 'react';
import { FarmerListing, TradeRequest } from '../types';
import { resolveRealAPPlace } from '../utils/apRealLocations';

interface TraderRouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: FarmerListing | null;
  farmerListing?: FarmerListing | null;
  request?: TradeRequest | null;
  traderLocation?: string;
}

export interface RoutePlaceOption {
  id: string;
  name: string;
  category: 'farmgate' | 'mandi' | 'hub' | 'coldstorage' | 'port';
  categoryLabel: string;
  icon: string;
  district: string;
  address: string;
  distanceKm: number;
  durationMin: number;
  fuelCost: number;
  tolls: number;
  corridor: string;
  waypoints: Array<{ title: string; time: string; detail: string }>;
}

export const TraderRouteMapModal: React.FC<TraderRouteMapModalProps> = ({
  isOpen,
  onClose,
  listing,
  farmerListing,
  request,
  traderLocation,
}) => {
  const [isOptimized, setIsOptimized] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('farmgate');
  const [placeFilter, setPlaceFilter] = useState<'all' | 'mandi' | 'farmgate' | 'coldstorage' | 'port'>('all');

  if (!isOpen) return null;

  const activeListing = listing || farmerListing;
  const farmerName = activeListing?.farmerName || request?.farmerName || 'రామేష్ వర్మ (Ramesh Varma)';
  const cropName = activeListing?.cropName || request?.cropName || 'Paddy / Rice (వరి BPT 5204)';
  const rawFarmLocation = activeListing?.location || request?.farmerLocation || request?.pickupAddress;
  const isEmergency = activeListing?.isEmergencyMode || request?.isEmergency;

  // Real, verified starting and ending destinations
  const startingDestination = resolveRealAPPlace(traderLocation, 'trader');
  const farmgateDestination = resolveRealAPPlace(rawFarmLocation, 'farmer');

  // Multi-Place Routing Directory across Andhra Pradesh
  const routePlaces: RoutePlaceOption[] = [
    {
      id: 'farmgate',
      name: `🌾 Farm Gate: ${farmerName}`,
      category: 'farmgate',
      categoryLabel: 'Farmgate Lot',
      icon: 'agriculture',
      district: activeListing?.location || 'Guntur',
      address: farmgateDestination,
      distanceKm: 32,
      durationMin: 44,
      fuelCost: 740,
      tolls: 1,
      corridor: 'Via NH-16 Green Agri-Logistics Expressway & Krishna Canal Service Road',
      waypoints: [
        { title: `Starting Depot: ${startingDestination}`, time: '00:00', detail: 'Truck AP-07-TJ-4821 dispatch with empty crates' },
        { title: 'NH-16 Agricultural Bypass (Chilakaluripet corridor)', time: isOptimized ? '00:15' : '00:25', detail: 'Express lane toll bypass with FASTag' },
        { title: 'AP Rythu Bharosa Weighbridge Seva Kendram', time: isOptimized ? '00:30' : '00:50', detail: 'Tare weight recorded: 4.2 Tons' },
        { title: `Farm Gate: ${farmgateDestination}`, time: isOptimized ? '00:44' : '01:12', detail: `Direct harvest loading of ${cropName}` },
      ],
    },
    {
      id: 'guntur_apmc',
      name: '🌶️ Guntur APMC Wholesale Mirchi Yard',
      category: 'mandi',
      categoryLabel: 'APMC Mandi',
      icon: 'storefront',
      district: 'Guntur',
      address: 'Guntur Agricultural Produce Market Committee (APMC) Yard, Lalapet Main Road, Guntur, AP 522004',
      distanceKm: 18,
      durationMin: 26,
      fuelCost: 420,
      tolls: 0,
      corridor: 'Via Guntur Inner Ring Road & Lalapet Commercial Gateway',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Fleet dispatch from regional trader terminal' },
        { title: 'Guntur Inner Ring Road Overbridge', time: '00:10', detail: 'Traffic bypass via agricultural heavy lane' },
        { title: 'Lalapet APMC Electronic Weighbridge', time: '00:18', detail: 'Gross truck weight recording' },
        { title: 'Guntur Wholesale Mirchi Yard Platform 4', time: '00:26', detail: 'Direct commercial auction bay unloading' },
      ],
    },
    {
      id: 'vijayawada_gollapudi',
      name: '🏢 Vijayawada Gollapudi Wholesale Mandi',
      category: 'mandi',
      categoryLabel: 'Wholesale Hub',
      icon: 'domain',
      district: 'Krishna',
      address: 'Vijayawada Wholesale Agricultural Market Yard, Gollapudi Bypass Road, Krishna District, AP 521225',
      distanceKm: 44,
      durationMin: 58,
      fuelCost: 980,
      tolls: 1,
      corridor: 'Via NH-16 Krishna River Barrage & Gollapudi Bypass',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Dispatch toward Krishna River expressway' },
        { title: 'Prakasam Barrage Express Bypass', time: '00:22', detail: 'FASTag river crossing corridor' },
        { title: 'Gollapudi Agri Toll Plaza & Quality Lab', time: '00:42', detail: 'Transit phytosanitary verification' },
        { title: 'Vijayawada Wholesale Market Commission Bay', time: '00:58', detail: 'Direct terminal intake & buyer verification' },
      ],
    },
    {
      id: 'tenali_yard',
      name: '🌾 Tenali Agricultural Market Yard',
      category: 'mandi',
      categoryLabel: 'APMC Mandi',
      icon: 'grass',
      district: 'Guntur',
      address: 'Tenali Market Yard, Station Road, Tenali, Guntur District, AP 522201',
      distanceKm: 28,
      durationMin: 38,
      fuelCost: 640,
      tolls: 1,
      corridor: 'Via SH-2 Guntur-Tenali Agri Freight Highway',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Vehicle departure toward Tenali canal belt' },
        { title: 'SH-2 Kollipara Canal Crossing', time: '00:16', detail: 'Smooth agricultural freight lane' },
        { title: 'Tenali Rythu Seva Electronic Scale', time: '00:28', detail: 'Moisture and grain density check' },
        { title: 'Tenali Market Yard Cereal Warehouse', time: '00:38', detail: 'Lot unloading at procurement bay' },
      ],
    },
    {
      id: 'duggirala_turmeric',
      name: '🟡 Duggirala Turmeric Commercial Yard',
      category: 'mandi',
      categoryLabel: 'Commodity Yard',
      icon: 'spa',
      district: 'Guntur',
      address: 'Duggirala Turmeric Agricultural Yard, Station Road, Duggirala, Guntur District, AP 522330',
      distanceKm: 36,
      durationMin: 48,
      fuelCost: 820,
      tolls: 1,
      corridor: 'Via Krishna Canal Bank Agro Road',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Dispatch for spice and cash crop transport' },
        { title: 'Pedavadlapudi Agri Freight Crossing', time: '00:20', detail: 'Direct rural highway connection' },
        { title: 'Duggirala Turmeric Quality Grading Center', time: '00:36', detail: 'Curcumin and grade assessment' },
        { title: 'Duggirala APMC Turmeric Depot', time: '00:48', detail: 'Arrival at dedicated spice auction floor' },
      ],
    },
    {
      id: 'ongole_apmc',
      name: '🏭 Ongole Commercial APMC Market Yard',
      category: 'mandi',
      categoryLabel: 'APMC Mandi',
      icon: 'warehouse',
      district: 'Prakasam',
      address: 'Ongole APMC Market Yard, Santhapet, Kurnool Road, Ongole, Prakasam District, AP 523001',
      distanceKm: 114,
      durationMin: 125,
      fuelCost: 2450,
      tolls: 2,
      corridor: 'Via NH-16 Coastal High-Speed Logistics Expressway',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Departure onto NH-16 Southern corridor' },
        { title: 'Chilakaluripet Expressway Toll Plaza', time: '00:35', detail: 'FASTag electronic toll lane pass' },
        { title: 'Medarmetla Express Corridor Junction', time: '01:10', detail: 'Mid-route weighbridge & driver rest bay' },
        { title: 'Ongole APMC Yard & Weighbridge', time: '02:05', detail: 'Unloading at wholesale commercial depot' },
      ],
    },
    {
      id: 'madanapalle_tomato',
      name: '🍅 Madanapalle Tomato Wholesale Hub',
      category: 'mandi',
      categoryLabel: 'Major Wholesale',
      icon: 'nutrition',
      district: 'Annamayya',
      address: 'Madanapalle Tomato Market Yard, Kadiri Road, Madanapalle, Annamayya District, AP 517325',
      distanceKm: 345,
      durationMin: 360,
      fuelCost: 7200,
      tolls: 4,
      corridor: 'Via NH-40 Rayalaseema Express Freight Corridor',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Heavy container vehicle departure' },
        { title: 'Nandyal Toll Plaza & Inspection Station', time: '02:15', detail: 'Perishable green corridor clearance' },
        { title: 'Kadiri Bypass Expressway Junction', time: '04:10', detail: 'Re-fueling and vehicle inspection checkpoint' },
        { title: 'Madanapalle Wholesale Tomato Yard', time: '06:00', detail: 'Asia largest tomato mandi auction gate' },
      ],
    },
    {
      id: 'kurnool_apmc',
      name: '🌾 Kurnool APMC Cereal & Cotton Yard',
      category: 'mandi',
      categoryLabel: 'APMC Mandi',
      icon: 'factory',
      district: 'Kurnool',
      address: 'Kurnool APMC Market Yard, Budhawarapet, Bellary Road, Kurnool, AP 518002',
      distanceKm: 278,
      durationMin: 310,
      fuelCost: 5800,
      tolls: 3,
      corridor: 'Via NH-44 North-South Freight Expressway',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Departure toward Western AP agricultural belt' },
        { title: 'Vinukonda Highway Corridor Bypass', time: '01:30', detail: 'Electronic weigh check on transit' },
        { title: 'Nandyal Electronic Tollway', time: '03:20', detail: 'Green freight lane toll clearance' },
        { title: 'Kurnool APMC Main Gate Commercial Bay', time: '05:10', detail: 'Arrival at central Rayalaseema grain exchange' },
      ],
    },
    {
      id: 'rajahmundry_delta',
      name: '🌾 Rajahmundry Godavari Delta Agro Hub',
      category: 'hub',
      categoryLabel: 'Delta Hub',
      icon: 'water_drop',
      district: 'East Godavari',
      address: 'Morampudi Junction, NH-16, Rajahmundry, East Godavari District, AP 533107',
      distanceKm: 168,
      durationMin: 195,
      fuelCost: 3650,
      tolls: 2,
      corridor: 'Via NH-16 Godavari Arch Bridge Agri Express Corridor',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'North-bound dispatch along NH-16' },
        { title: 'Gundugolanu Express Tollway', time: '01:10', detail: 'Fast toll corridor with agri lane' },
        { title: 'Godavari 4th Bridge Bypass', time: '02:30', detail: 'Scenic freight bridge crossing' },
        { title: 'Rajahmundry Delta Wholesale Terminal', time: '03:15', detail: 'Godavari agro produce trading bay' },
      ],
    },
    {
      id: 'visakhapatnam_port',
      name: '🚢 Visakhapatnam Port Agro-Export Terminal',
      category: 'port',
      categoryLabel: 'Maritime Port',
      icon: 'directions_boat',
      district: 'Visakhapatnam',
      address: 'Visakhapatnam Port Area, Near Convent Junction, Visakhapatnam, AP 530035',
      distanceKm: 364,
      durationMin: 390,
      fuelCost: 7850,
      tolls: 5,
      corridor: 'Via NH-16 Golden Quadrilateral Coastal Maritime Route',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Port-bound dispatch for export lot' },
        { title: 'Rajahmundry Bypass Highway', time: '02:40', detail: 'Commercial tollway checkpoint' },
        { title: 'Anakapalli Freight Industrial Junction', time: '05:00', detail: 'Port logistics clearance gate' },
        { title: 'Visakhapatnam Port Agro Container Terminal', time: '06:30', detail: 'Customs phytosanitary cargo staging bay' },
      ],
    },
    {
      id: 'guntur_cold_storage',
      name: '❄️ AP State Cold Chain Logistics Hub',
      category: 'coldstorage',
      categoryLabel: 'Cold Storage',
      icon: 'ac_unit',
      district: 'Guntur',
      address: 'APSWC Cold Chain Logistics Park, Nallapadu Road, Guntur, AP 522005',
      distanceKm: 14,
      durationMin: 22,
      fuelCost: 350,
      tolls: 0,
      corridor: 'Via Nallapadu Agro Link Corridor',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Dispatch for temperature-controlled preservation' },
        { title: 'Collectorate Circle Link', time: '00:08', detail: 'Urban bypass to logistics zone' },
        { title: 'Nallapadu Agro Logistics Avenue', time: '00:15', detail: 'Cold storage terminal entry' },
        { title: 'APSWC Temperature-Controlled Bay 2', time: '00:22', detail: 'Pre-cooling and blast freezing storage intake' },
      ],
    },
    {
      id: 'kadiri_groundnut',
      name: '🥜 Kadiri Groundnut Market Yard',
      category: 'mandi',
      categoryLabel: 'APMC Mandi',
      icon: 'eco',
      district: 'Sri Sathya Sai',
      address: 'Kadiri Agricultural Market Committee Yard, Bypass Road, Sri Sathya Sai District, AP 515591',
      distanceKm: 382,
      durationMin: 410,
      fuelCost: 8100,
      tolls: 4,
      corridor: 'Via NH-42 Rayalaseema Freight Route',
      waypoints: [
        { title: `Starting Point: ${startingDestination}`, time: '00:00', detail: 'Heavy vehicle dispatch toward Kadiri' },
        { title: 'Cuddapah Highway Bypass', time: '03:10', detail: 'Midpoint weigh verification' },
        { title: 'Mudigubba Electronic Weigh Station', time: '05:20', detail: 'Freight corridor verification' },
        { title: 'Kadiri Groundnut Auction Yard', time: '06:50', detail: 'Direct delivery at APMC auction sheds' },
      ],
    },
  ];

  const activePlace = routePlaces.find((p) => p.id === selectedPlaceId) || routePlaces[0];

  const filteredPlaces = routePlaces.filter((p) => {
    if (placeFilter === 'all') return true;
    return p.category === placeFilter;
  });

  // Calculate dynamic stats for current selection and optimization mode
  const currentDistance = isOptimized ? activePlace.distanceKm : Math.round(activePlace.distanceKm * 1.35);
  const currentDuration = isOptimized ? activePlace.durationMin : Math.round(activePlace.durationMin * 1.55);
  const currentFuel = isOptimized ? activePlace.fuelCost : Math.round(activePlace.fuelCost * 1.4);
  const currentTolls = activePlace.tolls;

  const currentDestination = activePlace.address;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    startingDestination
  )}&destination=${encodeURIComponent(currentDestination)}`;

  return (
    <div
      id="trader-route-map-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors z-10"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 flex items-center justify-center border border-blue-300 shrink-0">
              <span className="material-symbols-outlined text-[26px]">route</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-on-surface">Optimal Agri-Corridor & Route Map</h2>
                {isEmergency && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-300 animate-pulse">
                    EMERGENCY PERISHABLE
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">
                Official Andhra Pradesh agricultural corridors, mandis, farmgates & export ports
              </p>
            </div>
          </div>

          {/* Route Optimization Toggle */}
          <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-mono font-bold text-on-surface pl-2">Mode:</span>
            <button
              onClick={() => setIsOptimized(false)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                !isOptimized ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsOptimized(true)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isOptimized ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>Fast & Smooth</span>
            </button>
          </div>
        </div>

        {/* Real Origin & Selected Destination Card */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
              A
            </div>
            <div className="text-xs flex-1 min-w-0">
              <span className="font-bold text-blue-700 dark:text-blue-400 uppercase text-[10px] tracking-wider block">
                Starting Point (Real Depot / Hub):
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{startingDestination}</span>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-emerald-400 ml-3 h-3 my-0.5"></div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
              B
            </div>
            <div className="text-xs flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] tracking-wider block">
                  Active Route Destination ({activePlace.categoryLabel}):
                </span>
                <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                  {activePlace.district} District
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{activePlace.name}</span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px] block mt-0.5 break-words">{activePlace.address}</span>
            </div>
          </div>
        </div>

        {/* Feature: Add Different Places / Destinations Selection Section */}
        <div className="mb-4 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-400 text-[20px]">explore</span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Select Different Route Places (వివిధ మార్కెట్ ప్రదేశాలు)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {routePlaces.length} Verified AP Places Available
            </span>
          </div>

          {/* Place Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs mb-3">
            {[
              { id: 'all', label: 'All Places' },
              { id: 'mandi', label: 'APMC Mandis' },
              { id: 'farmgate', label: 'Farmgates' },
              { id: 'coldstorage', label: 'Cold Chains' },
              { id: 'port', label: 'Sea Ports' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlaceFilter(tab.id as any)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                  placeFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Horizontal Grid / Scroll of Different Places */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
            {filteredPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  id={`btn-route-place-${place.id}`}
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    setActiveStep(0);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/50 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-emerald-400 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700 dark:text-emerald-400 shrink-0">
                      {place.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                        <span>{place.district}</span>
                        <span>•</span>
                        <span>~{place.distanceKm} km</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 font-bold">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Visual Route Map (Minimap) */}
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-outline-variant bg-slate-900 shadow-inner mb-4">
          {/* Map Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#10b981 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* SVG Route Visualization */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 280">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Standard route path */}
            <path
              d="M 60,220 C 140,240 180,180 260,190 C 340,200 420,110 520,70"
              fill="none"
              stroke={isOptimized ? '#475569' : '#e2e8f0'}
              strokeWidth={isOptimized ? '2' : '4'}
              strokeDasharray={isOptimized ? '4 4' : 'none'}
            />

            {/* Optimized express green route path */}
            {isOptimized && (
              <path
                d="M 60,220 C 150,150 280,130 380,95 C 450,70 480,68 520,70"
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}

            {/* Waypoint 1: Trader Depot */}
            <g transform="translate(60, 220)">
              <circle r="16" fill="#0284c7" fillOpacity="0.2" className="animate-ping" />
              <circle r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              <text x="0" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                Trader Depot
              </text>
            </g>

            {/* Waypoint 2: Intermediate Weighbridge Junction */}
            <g transform={`translate(${isOptimized ? '250, 138' : '260, 190'})`}>
              <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="-12" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="medium">
                Weighbridge Hub
              </text>
            </g>

            {/* Waypoint 3: Selected Destination Place */}
            <g transform="translate(520, 70)">
              <circle r="18" fill="#eab308" fillOpacity="0.25" className="animate-ping" />
              <circle r="12" fill="#eab308" stroke="#ffffff" strokeWidth="2" />
              <text x="0" y="26" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">
                📍 {activePlace.name.split(' ')[0]} {activePlace.name.split(' ')[1] || 'Destination'}
              </text>
            </g>

            {/* Moving Truck Icon */}
            <g transform={`translate(${isOptimized ? '340, 105' : '320, 185'})`}>
              <rect x="-14" y="-10" width="28" height="20" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="11">🚛</text>
            </g>
          </svg>

          {/* Floating Live Telemetry Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs border border-slate-700 text-white rounded-xl p-2.5 text-xs font-mono shadow-md">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE DISPATCH: AP-07-TJ-4821</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Speed: <span className="text-white font-bold">58 km/h</span> • ETA:{' '}
              <span className="text-amber-300 font-bold">{currentDuration} mins</span>
            </div>
          </div>

          {/* Destination Info Chip on Map */}
          <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-xs border border-amber-500/40 text-white rounded-xl p-2.5 text-xs shadow-md max-w-xs">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{activePlace.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">{activePlace.district} District</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{activePlace.corridor}</div>
          </div>
        </div>

        {/* Route Metrics (Distance, Time, Fuel, Tolls) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-[10px] font-mono uppercase text-on-surface-variant">Total Distance</div>
            <div className="text-lg font-black text-on-surface font-mono mt-0.5">
              {currentDistance} <span className="text-xs font-normal">km</span>
            </div>
            {isOptimized && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                Fast corridor saved
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-[10px] font-mono uppercase text-on-surface-variant">Est. Transit Time</div>
            <div className="text-lg font-black text-on-surface font-mono mt-0.5">
              {currentDuration} <span className="text-xs font-normal">mins</span>
            </div>
            {isOptimized && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                Express toll bypass
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-[10px] font-mono uppercase text-on-surface-variant">Estimated Fuel Cost</div>
            <div className="text-lg font-black text-on-surface font-mono mt-0.5">
              ₹{currentFuel.toLocaleString('en-IN')}
            </div>
            {isOptimized && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                Eco-speed verified
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-[10px] font-mono uppercase text-on-surface-variant">Road Quality & Tolls</div>
            <div className="text-lg font-black text-on-surface font-mono mt-0.5">
              {currentTolls} Tolls {isOptimized ? '• Smooth NH' : '• Rural'}
            </div>
            <div className="text-[10px] text-on-surface-variant mt-0.5">
              Weighbridge verified
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Waypoints for Selected Place */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              Turn-by-Turn Waypoints to {activePlace.name}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">{activePlace.corridor}</span>
          </div>
          <div className="space-y-2">
            {activePlace.waypoints.map((wp, i) => (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  activeStep === i
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-outline-variant bg-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                      activeStep === i ? 'bg-emerald-600 text-white' : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">{wp.title}</div>
                    <div className="text-[11px] text-on-surface-variant">{wp.detail}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-on-surface-variant text-[11px]">{wp.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant font-mono text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
          <a
            id="btn-trader-open-google-maps"
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">directions</span>
            <span>Navigate to {activePlace.name.split(' ')[0]} {activePlace.name.split(' ')[1] || 'Place'} in Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};
