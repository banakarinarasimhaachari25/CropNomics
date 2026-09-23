import React, { useState } from 'react';
import { db } from '../data/db';
import { CROPS_DATA } from '../data/mockData';
import { TradeRequest, UserRole } from '../types';
import { OfflineReceiptModal } from './OfflineReceiptModal';
import { TraderRouteMapModal } from './TraderRouteMapModal';
import { OptimalRoutingTransitCard } from './OptimalRoutingTransitCard';

const getCropImage = (cropName: string, cropId?: string) => {
  if (cropId) {
    const found = CROPS_DATA.find((c) => c.id === cropId);
    if (found?.image) return found.image;
  }
  const clean = (cropName || '').toLowerCase();
  const matched = CROPS_DATA.find((c) =>
    clean.includes(c.id.toLowerCase()) ||
    clean.includes(c.name.toLowerCase()) ||
    (c.teluguName && clean.includes(c.teluguName.toLowerCase()))
  );
  return matched?.image || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
};

interface TradeRequestsPortalProps {
  role: UserRole;
  userPhoneOrId?: string;
  userName?: string;
  onNavigateToMarket?: () => void;
  onRequestAccepted?: () => void;
  language?: string;
}

export const TradeRequestsPortal: React.FC<TradeRequestsPortalProps> = ({
  role,
  userPhoneOrId = '9848012345',
  userName = '',
  onNavigateToMarket,
  onRequestAccepted,
  language = 'en',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('all');
  const [selectedRequestForReceipt, setSelectedRequestForReceipt] = useState<TradeRequest | null>(null);
  const [selectedRequestForRoute, setSelectedRequestForRoute] = useState<TradeRequest | null>(null);
  const [viewingDocumentRequest, setViewingDocumentRequest] = useState<TradeRequest | null>(null);
  const [callingTraderRequest, setCallingTraderRequest] = useState<TradeRequest | null>(null);
  const [traderCallToast, setTraderCallToast] = useState<{ message: string; phone: string; name: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [expandedRouteReqId, setExpandedRouteReqId] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Fetch requests from centralized db
  const allRequests = role === 'farmer'
    ? db.getTradeRequestsForFarmer(userPhoneOrId)
    : db.getTradeRequestsForTrader(userPhoneOrId);

  // Fallback to all if specific phone has no requests
  const displayRequests = allRequests.length > 0 ? allRequests : db.getTradeRequests();

  const filteredRequests = displayRequests.filter((req) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'accepted') return req.status === 'accepted' || (req.status as string) === 'completed';
    return req.status === activeFilter;
  });

  const pendingCount = displayRequests.filter((r) => r.status === 'pending').length;
  const acceptedCount = displayRequests.filter((r) => r.status === 'accepted' || (r.status as string) === 'completed').length;
  const rejectedCount = displayRequests.filter((r) => r.status === 'rejected').length;
  const cancelledCount = displayRequests.filter((r) => r.status === 'cancelled').length;

  const handleAccept = (requestId: string) => {
    const ok = db.acceptTradeRequest(requestId);
    if (ok) {
      setFeedbackMessage('Request accepted! Crop quantity has been updated and locked from other traders.');
      setTimeout(() => setFeedbackMessage(''), 4000);
    }
  };

  const handleReject = (requestId: string) => {
    const ok = db.rejectTradeRequest(requestId);
    if (ok) {
      setFeedbackMessage('Request marked as rejected.');
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleCancel = (requestId: string) => {
    const ok = db.cancelTradeRequest(requestId);
    if (ok) {
      setFeedbackMessage('Request cancelled. The crop lot and quantity have been re-displayed on the marketplace.');
      setTimeout(() => setFeedbackMessage(''), 4000);
    }
  };

  return (
    <div id="trade-requests-portal" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300">
              <span className="material-symbols-outlined text-[28px]">swap_horiz</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-on-surface">
                  {role === 'farmer' ? 'Farmer Trade Requests Portal' : 'Trader Procurement Requests Portal'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-300">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {role === 'farmer'
                  ? 'Review incoming procurement bids from wholesale traders. Accepting locks crop quantity; cancelling restores it.'
                  : 'Track your procurement orders sent to farmers. When farmers accept, their stock is locked for your dispatch.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRequestForReceipt(null);
                setReceiptModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Upload Offline Receipt</span>
            </button>

            {role === 'trader' && onNavigateToMarket && (
              <button
                onClick={onNavigateToMarket}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Browse More Lots</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Trader Call Notification Banner */}
        {traderCallToast && (
          <div
            id="toast-trader-phone"
            className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">call</span>
              </div>
              <div>
                <p className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                  {language === 'te'
                    ? 'ఇది సదరు గౌరవనీయ వ్యాపారి యొక్క ఫోన్ నంబర్:'
                    : 'This is the phone number of the respected trader:'}
                  <span className="ml-2 font-mono font-black text-base text-emerald-700 dark:text-emerald-300">
                    {traderCallToast.phone ? (traderCallToast.phone.startsWith('+') ? traderCallToast.phone : `+91 ${traderCallToast.phone}`) : '+91 98480 12345'}
                  </span>
                </p>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-200 mt-0.5">
                  {language === 'te' ? 'వ్యాపారి పేరు:' : 'Trader:'} <strong>{traderCallToast.name}</strong> •{' '}
                  {language === 'te'
                    ? 'మీరు ఇప్పుడు నేరుగా ఫోన్ చేసి పంట కొనుగోలుపై చర్చించవచ్చు.'
                    : 'APMC registered merchant. You can call directly to confirm dispatch and delivery.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setTraderCallToast(null)}
                className="w-8 h-8 rounded-xl bg-emerald-200/70 dark:bg-emerald-900/60 hover:bg-emerald-300 text-emerald-900 dark:text-emerald-100 flex items-center justify-center cursor-pointer transition-colors"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Filter Tabs (Feature 6) */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-outline-variant">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>All Requests</span>
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
              {displayRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Pending</span>
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('accepted')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'accepted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Completed / Accepted</span>
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] flex items-center justify-center font-bold">
              {acceptedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Rejected</span>
            <span className="w-5 h-5 rounded-full bg-red-200 text-red-900 text-[10px] flex items-center justify-center font-bold">
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'cancelled'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Cancelled (Restored)</span>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-900 text-[10px] flex items-center justify-center font-bold">
              {cancelledCount}
            </span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-2xl p-10 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2 block">
            inbox
          </span>
          <h3 className="font-bold text-on-surface text-base">No Requests Found</h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
            {activeFilter === 'all'
              ? 'No trade requests have been recorded yet. Browse the market and send procurement bids to farmers.'
              : `There are currently no requests with "${activeFilter}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => {
            const isAccepted = req.status === 'accepted' || (req.status as string) === 'completed';
            const isPending = req.status === 'pending';
            const isRejected = req.status === 'rejected';
            const isCancelled = req.status === 'cancelled';

            return (
              <div
                key={req.id}
                className={`bg-surface-container-lowest border rounded-2xl p-5 shadow-xs transition-all ${
                  req.isEmergency
                    ? 'border-red-400 bg-red-50/20 dark:bg-red-950/20'
                    : isAccepted
                    ? 'border-emerald-300 dark:border-emerald-800'
                    : 'border-outline-variant'
                }`}
              >
                {/* Emergency Mode Highlight Banner (Feature 11) */}
                {req.isEmergency && (
                  <div className="mb-3 px-3 py-1.5 bg-red-100 dark:bg-red-950/60 border border-red-300 rounded-xl text-xs text-red-800 dark:text-red-300 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-red-600 animate-pulse">
                      emergency
                    </span>
                    <span>EMERGENCY PERISHABLE COMMODITY: Immediate farm gate dispatch requested!</span>
                  </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left info: Crop Image, Title & Counterparties */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-outline-variant shrink-0 bg-surface-container shadow-xs">
                      <img
                        src={getCropImage(req.cropName, req.cropId)}
                        alt={req.cropName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-on-surface">
                          {req.cropName}
                        </span>
                        {req.variety && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-mono">
                            {req.variety}
                          </span>
                        )}
                        {req.isPartition && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] font-mono font-bold">
                            Partition Trade Lot
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant pt-1">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">Farmer:</span>{' '}
                          <strong className="text-on-surface">{req.farmerName}</strong>{' '}
                          <span className="text-slate-500 font-mono">({req.farmerPhone})</span>
                        </div>
                        <div>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">Trader / Buyer:</span>{' '}
                        <strong className="text-on-surface">{req.traderName}</strong>{' '}
                        <span className="text-slate-500 font-mono">({req.traderFirm || req.traderDistrict})</span>
                      </div>
                      {req.pickupAddress && (
                        <div className="sm:col-span-2 text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>Pickup: {req.pickupAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                  {/* Right: Status Pill & Financial Amount */}
                  <div className="text-right space-y-1">
                    <div>
                      {isPending && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold rounded-full border border-amber-300">
                          ⏳ Pending Approval
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold rounded-full border border-emerald-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          <span>Locked & Accepted</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-mono font-bold rounded-full border border-red-300">
                          ✕ Rejected
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded-full">
                          Restored / Cancelled
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-xs text-on-surface-variant">
                      Req: <span className="font-bold text-on-surface text-sm">{req.requestedQuantity} Tons</span> @ ₹{req.offeredPricePerTon.toLocaleString('en-IN')}/T
                    </div>
                    <div className="font-mono text-base font-black text-emerald-700 dark:text-emerald-400">
                      Total: ₹{req.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Offline Receipt Status Badge (Feature 15) */}
                {req.offlineReceiptNumber && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-[18px]">verified</span>
                      <div>
                        <span className="font-bold text-on-surface">Offline Deal Receipt: </span>
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-300">{req.offlineReceiptNumber}</span>{' '}
                        <span className="text-on-surface-variant font-mono">({req.offlinePaymentMethod} • ₹{req.offlinePaymentAmount?.toLocaleString('en-IN')})</span>
                      </div>
                    </div>
                    {req.offlinePaymentReceipt && (
                      <button
                        type="button"
                        onClick={() => setViewingDocumentRequest(req)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Document</span>
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="mt-4 pt-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Route Map & Transit Toggle Button */}
                    <button
                      type="button"
                      id={`btn-toggle-route-${req.id}`}
                      onClick={() => {
                        setExpandedRouteReqId(expandedRouteReqId === req.id ? null : req.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        expandedRouteReqId === req.id
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border-blue-200'
                      }`}
                      title="Toggle optimal farm gate transit routing"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {expandedRouteReqId === req.id ? 'expand_less' : 'route'}
                      </span>
                      <span>{expandedRouteReqId === req.id ? 'Hide Transit Route' : 'Optimal Routing & Transit'}</span>
                    </button>

                    {/* Turn-by-Turn Navigation Modal Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestForRoute(req);
                        setRouteModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-medium border border-outline-variant transition-colors flex items-center gap-1 cursor-pointer"
                      title="Open full interactive turn-by-turn map modal"
                    >
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      <span className="hidden sm:inline">Turn-by-Turn Modal</span>
                    </button>

                    {/* Upload Receipt Button (Feature 15) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestForReceipt(req);
                        setReceiptModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt</span>
                      <span>{req.offlineReceiptNumber ? 'Update Receipt' : 'Upload Receipt'}</span>
                    </button>

                    {/* Contact Phone / Direct SMS */}
                    {role === 'farmer' ? (
                      <button
                        type="button"
                        id={`btn-call-trader-${req.id}`}
                        onClick={() => {
                          setCallingTraderRequest(req);
                          setTraderCallToast({
                            message: 'This is the phone number of the respected trader',
                            phone: req.traderPhone,
                            name: req.traderName,
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-mono font-medium border border-outline-variant transition-colors flex items-center gap-1 cursor-pointer hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
                        title="Call Trader"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>Call Trader</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const cleanDigits = (req.farmerPhone || '').replace(/[^0-9]/g, '');
                          const waNumber = cleanDigits.startsWith('91') ? cleanDigits : `91${cleanDigits.slice(-10)}`;
                          const text = encodeURIComponent(`నమస్కారం ${req.farmerName} గారు! Regarding Trade Order ${req.id} for ${req.cropName} (${req.requestedQuantity} Tons) - APMC Trader Dispatch.`);
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(`నమస్కారం ${req.farmerName} గారు! Regarding Trade Order ${req.id} for ${req.cropName} (${req.requestedQuantity} Tons) - APMC Trader Dispatch.`);
                          }
                          window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Contact Farmer via WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>WhatsApp Farmer</span>
                      </button>
                    )}
                  </div>

                  {/* Decision Actions */}
                  <div className="flex items-center gap-2">
                    {role === 'farmer' && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>Accept & Lock Quantity</span>
                        </button>
                      </>
                    )}

                    {/* Cancellation Action (Feature 12: cancels request and re-displays crop in listings) */}
                    {(isPending || isAccepted) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(req.id)}
                        className="px-3 py-1.5 rounded-xl border border-outline-variant text-slate-600 dark:text-slate-400 hover:bg-surface-container text-xs font-medium transition-colors cursor-pointer"
                        title="Cancelling will re-display the crop quantity in the marketplace"
                      >
                        Cancel Request (Re-display Crop)
                      </button>
                    )}
                  </div>
                </div>

                {/* Optimal Routing & Transit Corridor Card */}
                {expandedRouteReqId === req.id && (
                  <OptimalRoutingTransitCard
                    origin={req.pickupAddress || req.farmerLocation || 'Guntur Agricultural Market Yard, AP'}
                    destination={req.traderDistrict ? `${req.traderDistrict} Wholesale Mandi Hub, AP` : 'Vijayawada APMC Hub, AP'}
                    cropName={req.cropName}
                    quantity={`${req.requestedQuantity} Qtl`}
                    farmerName={req.farmerName}
                    buyerName={req.traderName}
                    tradeId={req.id}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Receipt Modal (Feature 15) */}
      <OfflineReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        role={role}
        uploaderName={userName}
        uploaderPhone={userPhoneOrId}
        targetRequest={selectedRequestForReceipt}
      />

      {/* Trader Route Map Modal (Features 3, 9) */}
      <TraderRouteMapModal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        request={selectedRequestForRoute}
      />

      {/* Interactive Offline Deal Document & Receipt Modal (User Requirement 10) */}
      {viewingDocumentRequest && (
        <div
          id="view-offline-document-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setViewingDocumentRequest(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingDocumentRequest(null)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-300">
                <span className="material-symbols-outlined text-[26px]">receipt_long</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-on-surface">Verified Deal Document & Receipt</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded-full border border-emerald-200">
                    Audit Verified
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  Receipt No: {viewingDocumentRequest.offlineReceiptNumber || 'AP-DEAL-REC-7491'}
                </p>
              </div>
            </div>

            {/* Document Content */}
            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Farmer:</span>
                  <span className="font-bold text-on-surface">{viewingDocumentRequest.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Trader:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{viewingDocumentRequest.traderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Crop:</span>
                  <span className="text-on-surface">{viewingDocumentRequest.cropName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Quantity:</span>
                  <span className="font-bold text-on-surface">{viewingDocumentRequest.requestedQuantity} Tons</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-amber-900 dark:text-amber-300">Payment Mode:</span>
                  <span className="font-bold text-on-surface">{viewingDocumentRequest.offlinePaymentMethod || 'APMC Market Challan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-900 dark:text-amber-300">Payment Date:</span>
                  <span className="text-on-surface">{viewingDocumentRequest.offlinePaymentDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between items-baseline">
                  <span className="font-bold text-amber-900 dark:text-amber-200">Total Settled:</span>
                  <span className="text-xl font-black text-amber-800 dark:text-amber-300">
                    ₹{(viewingDocumentRequest.offlinePaymentAmount || viewingDocumentRequest.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {viewingDocumentRequest.offlinePaymentReceiptNote && (
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant text-[11px] font-sans">
                  <div className="font-bold text-on-surface mb-0.5">Audit Note:</div>
                  <div className="text-on-surface-variant">{viewingDocumentRequest.offlinePaymentReceiptNote}</div>
                </div>
              )}

              {/* Verified Stamp */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified_user</span>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  AP Govt Agricultural Market Audit Stamp Affixed
                </span>
              </div>

              {/* Scanned Document Image */}
              {viewingDocumentRequest.offlinePaymentReceipt && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Scanned Voucher / Challan Document
                  </div>
                  <div className="rounded-xl overflow-hidden border border-outline-variant bg-slate-900 max-h-56 flex items-center justify-center">
                    <img
                      src={viewingDocumentRequest.offlinePaymentReceipt}
                      alt="Offline Deal Document"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-outline-variant flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingDocumentRequest(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close Document
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Respected Trader Phone Number Modal */}
      {callingTraderRequest && (
        <div
          id="modal-respected-trader-phone"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4"
        >
          <div className="bg-surface-container-lowest border-2 border-emerald-600/40 p-6 sm:p-7 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-3xl font-black">call</span>
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                {language === 'te' ? 'వ్యాపారి సంప్రదింపు వివరాలు' : 'Verified Trader Phone'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-on-surface">
                {language === 'te'
                  ? 'ఇది సదరు గౌరవనీయ వ్యాపారి యొక్క ఫోన్ నంబర్'
                  : 'This is the phone number of the respected trader'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {language === 'te' ? 'గౌరవనీయ వ్యాపారి:' : 'Respected Trader:'}{' '}
                <strong className="text-on-surface">{callingTraderRequest.traderName}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-mono space-y-1 shadow-inner">
              <div className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                {language === 'te' ? 'వ్యాపారి ఫోన్ నంబర్' : 'Trader Mobile Number'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                {callingTraderRequest.traderPhone
                  ? (callingTraderRequest.traderPhone.startsWith('+')
                    ? callingTraderRequest.traderPhone
                    : `+91 ${callingTraderRequest.traderPhone}`)
                  : '+91 98480 12345'}
              </div>
              {callingTraderRequest.traderLocation && (
                <div className="text-xs text-on-surface-variant pt-1 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>{callingTraderRequest.traderLocation}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl text-left font-mono space-y-1 border border-outline-variant/60">
              <div><strong>Trade Order:</strong> #{callingTraderRequest.id}</div>
              <div><strong>Crop Lot:</strong> {callingTraderRequest.cropName} ({callingTraderRequest.requestedQuantity} Tons)</div>
              <div><strong>Offered Bid:</strong> ₹{callingTraderRequest.offeredPricePerTon?.toLocaleString('en-IN')}/Ton (Total ₹{callingTraderRequest.totalAmount?.toLocaleString('en-IN')})</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(callingTraderRequest.traderPhone);
                    setCopiedPhone(true);
                    setTimeout(() => setCopiedPhone(false), 2500);
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copiedPhone ? 'check' : 'content_copy'}
                </span>
                <span>{copiedPhone ? (language === 'te' ? 'కాపీ చేయబడింది!' : 'Copied!') : (language === 'te' ? 'నంబర్ కాపీ చేయండి' : 'Copy Phone Number')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCallingTraderRequest(null)}
                className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold text-xs border border-outline-variant flex items-center justify-center transition-colors cursor-pointer"
              >
                {language === 'te' ? 'మూసివేయి' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
