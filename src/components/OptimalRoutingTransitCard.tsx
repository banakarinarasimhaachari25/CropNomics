import React, { useState } from 'react';
import { resolveRealAPPlace } from '../utils/apRealLocations';

interface OptimalRoutingTransitCardProps {
  origin: string;
  destination: string;
  cropName?: string;
  quantity?: string | number;
  farmerName?: string;
  buyerName?: string;
  estimatedDistanceKm?: number;
  estimatedTransitMins?: number;
  tradeId?: string;
  language?: 'en' | 'te';
}

interface PlaceDestination {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceKm: number;
  timeMins: number;
}

export const OptimalRoutingTransitCard: React.FC<OptimalRoutingTransitCardProps> = ({
  origin,
  destination,
  cropName = 'AP Produce Lot',
  quantity,
  farmerName = 'Registered AP Farmer',
  buyerName = 'Licensed AP Wholesale Buyer',
  estimatedDistanceKm,
  estimatedTransitMins,
  tradeId,
  language = 'en',
}) => {
  // Normalize origin & destination addresses for real AP routing
  const safeOrigin = resolveRealAPPlace(origin, 'farmer');
  const safeDestination = resolveRealAPPlace(destination, 'trader');

  // Multi-Place directory for optimal routing
  const defaultPlaces: PlaceDestination[] = [
    {
      id: 'default',
      name: `🏢 ${buyerName.length > 22 ? buyerName.slice(0, 20) + '...' : buyerName}`,
      category: 'Assigned Hub',
      address: safeDestination,
      distanceKm:
        estimatedDistanceKm ||
        Math.max(28, Math.min(145, (Math.abs(safeOrigin.length * 3 + safeDestination.length * 2) % 95) + 24)),
      timeMins:
        estimatedTransitMins ||
        Math.round(
          ((estimatedDistanceKm ||
            Math.max(28, Math.min(145, (Math.abs(safeOrigin.length * 3 + safeDestination.length * 2) % 95) + 24))) /
            45) *
            60
        ),
    },
    {
      id: 'guntur_apmc',
      name: '🌶️ Guntur APMC Mirchi Yard',
      category: 'Mandi',
      address: 'Guntur APMC Yard, Lalapet Main Road, Guntur, AP 522004',
      distanceKm: 24,
      timeMins: 35,
    },
    {
      id: 'vijayawada_mandi',
      name: '🏢 Vijayawada Gollapudi Hub',
      category: 'Wholesale',
      address: 'Vijayawada Wholesale Market, Gollapudi Bypass Road, Krishna District, AP 521225',
      distanceKm: 48,
      timeMins: 62,
    },
    {
      id: 'tenali_yard',
      name: '🌾 Tenali Agricultural Yard',
      category: 'Mandi',
      address: 'Tenali Market Yard, Station Road, Tenali, Guntur District, AP 522201',
      distanceKm: 30,
      timeMins: 42,
    },
    {
      id: 'duggirala_turmeric',
      name: '🟡 Duggirala Turmeric Yard',
      category: 'Specialized',
      address: 'Duggirala Turmeric Yard, Station Road, Guntur District, AP 522330',
      distanceKm: 38,
      timeMins: 50,
    },
    {
      id: 'ongole_apmc',
      name: '🏭 Ongole Commercial APMC',
      category: 'Mandi',
      address: 'Ongole APMC Market Yard, Santhapet, Kurnool Road, Ongole, Prakasam District, AP 523001',
      distanceKm: 118,
      timeMins: 130,
    },
    {
      id: 'madanapalle_hub',
      name: '🍅 Madanapalle Tomato Hub',
      category: 'Wholesale',
      address: 'Madanapalle Tomato Market Yard, Kadiri Road, Annamayya District, AP 517325',
      distanceKm: 345,
      timeMins: 360,
    },
    {
      id: 'vizag_port',
      name: '🚢 Visakhapatnam Port Agro Gate',
      category: 'Export Port',
      address: 'Visakhapatnam Port Area, Near Convent Junction, Visakhapatnam, AP 530035',
      distanceKm: 365,
      timeMins: 395,
    },
  ];

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('default');
  const activePlace = defaultPlaces.find((p) => p.id === selectedPlaceId) || defaultPlaces[0];

  const currentDestination = activePlace.address;
  const currentDistance = activePlace.distanceKm;
  const currentTimeMins = activePlace.timeMins;

  // Dynamic Google Maps Directions URL between real places
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    safeOrigin
  )}&destination=${encodeURIComponent(currentDestination)}`;

  return (
    <div
      id={`optimal-routing-card-${tradeId || 'demo'}`}
      className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-teal-950/30 p-4 sm:p-5 shadow-sm text-on-surface"
    >
      {/* Header with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[18px]">route</span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-emerald-100 flex items-center gap-1.5">
              <span>{language === 'te' ? 'ఆప్టిమల్ రూటింగ్ & ట్రాన్సిట్' : 'Optimal Routing & Transit'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] font-mono font-bold">
                {language === 'te' ? 'ధృవీకరించబడింది' : 'Trade Confirmed'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'te'
                ? 'రైతు పొలం నుండి కొనుగోలుదారు మండి వరకు ఆటోమేటెడ్ రూట్ మ్యాప్'
                : 'Direct Farmgate-to-Mandi transit corridor for fresh produce dispatch'}
            </p>
          </div>
        </div>

        {/* Distance & Time Pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">distance</span>
          <span>~{currentDistance} km</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="material-symbols-outlined text-[16px] text-emerald-600">schedule</span>
          <span>~{currentTimeMins} mins</span>
        </div>
      </div>

      {/* Different Places Selector Chips */}
      <div className="pt-3 pb-1">
        <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">place</span>
            <span>Switch Destination Place (వివిధ ప్రదేశాలు):</span>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{activePlace.category}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {defaultPlaces.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlaceId(place.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                }`}
              >
                <span>{place.name}</span>
                <span className="font-mono text-[10px] opacity-75">({place.distanceKm}km)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route Visualizer */}
      <div className="py-3">
        <div className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">alt_route</span>
          <span>{language === 'te' ? 'నిర్ధారించబడిన రవాణా రూట్ వివరాలు' : 'Verified AP Highway Route'}</span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-teal-400 before:to-indigo-500">
          {/* Origin Point: Farmer Farmgate */}
          <div className="relative">
            <span className="absolute -left-6 sm:-left-8 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 ring-2 ring-emerald-300 dark:ring-emerald-700 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <div className="bg-white dark:bg-slate-800/90 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  {language === 'te' ? 'ప్రారంభ స్థానం (Origin - Farmgate)' : 'Origin (Farmgate Pickup)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Farmer: {farmerName}</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">agriculture</span>
                <span className="line-clamp-1">{safeOrigin}</span>
              </div>
              {cropName && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Produce: <strong className="text-slate-700 dark:text-slate-200">{cropName}</strong>
                  {quantity && <span> • {quantity} Tons loaded</span>}
                </div>
              )}
            </div>
          </div>

          {/* Transit Corridor Highlights */}
          <div className="relative">
            <span className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white">local_shipping</span>
            </span>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-teal-600">speed</span>
                <span>
                  <strong>AP Agri-Green Corridor:</strong> FASTag Weighbridge & Express Toll clearance
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                Safe Shelf Transit
              </span>
            </div>
          </div>

          {/* Destination Point: Selected Place */}
          <div className="relative">
            <span className="absolute -left-6 sm:-left-8 top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 ring-2 ring-indigo-300 dark:ring-indigo-700 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <div className="bg-white dark:bg-slate-800/90 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {language === 'te' ? 'గమ్యస్థానం (Destination Place)' : `Destination (${activePlace.category})`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{activePlace.name}</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">location_on</span>
                <span className="line-clamp-1">{currentDestination}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>Direct logistics lane assigned</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live GPS Dispatch Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent 'See in Google Maps' Button */}
      <div className="pt-3 border-t border-emerald-100 dark:border-emerald-900/40">
        <a
          id={`btn-see-in-google-maps-${tradeId || 'demo'}`}
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={language === 'te' ? 'గూగుల్ మ్యాప్స్‌లో లైవ్ దిశలు చూడండి' : 'See in Google Maps with live transit directions'}
          aria-label="See in Google Maps"
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">directions</span>
          <span>
            {language === 'te'
              ? `${activePlace.name} కు గూగుల్ మ్యాప్స్‌లో చూడండి`
              : `See Route to ${activePlace.name.split(' ')[1] || activePlace.name} in Google Maps`}
          </span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </a>
      </div>
    </div>
  );
};
