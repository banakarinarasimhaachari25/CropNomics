import React, { useState } from 'react';
import { db } from '../data/db';
import { FarmerListing, TraderIdentity } from '../types';

interface SendTradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerListing: FarmerListing | null;
  traderIdentity?: TraderIdentity | null;
  onSuccess?: () => void;
}

export const SendTradeRequestModal: React.FC<SendTradeRequestModalProps> = ({
  isOpen,
  onClose,
  farmerListing,
  traderIdentity,
  onSuccess,
}) => {
  if (!isOpen || !farmerListing) return null;

  const [quantity, setQuantity] = useState<number>(farmerListing.tons || 5);
  const [offeredPrice, setOfferedPrice] = useState<number>(
    farmerListing.pricePerTon || Math.round((farmerListing.estPriceTotal || 50000) / (farmerListing.tons || 1))
  );
  const [traderName, setTraderName] = useState<string>(traderIdentity?.name || 'శ్రీనివాస ట్రేడర్స్ (Srinivasa Rao)');
  const [traderPhone, setTraderPhone] = useState<string>(traderIdentity?.phoneNumber || '+91 94401 56789');
  const [traderFirm, setTraderFirm] = useState<string>(traderIdentity?.companyName || 'APMC Guntur Commission Agent');
  const [notes, setNotes] = useState<string>('Ready for farm-gate truck pickup with digital weighing inspection.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const totalAmount = quantity * offeredPrice;
  const isEmergency = farmerListing.isEmergencyMode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newRequest = db.sendTradeRequest({
      listingId: farmerListing.id,
      farmerId: farmerListing.id,
      farmerName: farmerListing.farmerName,
      farmerPhone: farmerListing.phone || '+91 98480 23456',
      farmerLocation: farmerListing.location,
      cropId: (farmerListing.cropName || '').toLowerCase(),
      cropName: farmerListing.cropName,
      variety: farmerListing.variety,
      requestedQuantity: quantity,
      offeredPricePerTon: offeredPrice,
      totalAmount: totalAmount,
      traderId: traderPhone.replace(/\D/g, '') || 'trader-1',
      traderName: traderName,
      traderPhone: traderPhone,
      traderFirm: traderFirm,
      traderDistrict: 'Guntur',
      pickupAddress: farmerListing.location,
      notes: notes,
      isEmergency: Boolean(isEmergency),
      isPartition: Boolean(farmerListing.isPartition),
      partitionId: farmerListing.partitionId,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1600);
    }, 400);
  };

  return (
    <div
      id="send-trade-request-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-xl font-black text-on-surface">Trade Request Dispatched!</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Your procurement offer for {quantity} Tons of {farmerListing.cropName} was sent to {farmerListing.farmerName}.
              Once accepted, the quantity will be locked for your pickup.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300">
                <span className="material-symbols-outlined text-[24px]">send</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-on-surface">Send Procurement Request</h3>
                <p className="text-xs text-on-surface-variant">
                  Direct trade offer to {farmerListing.farmerName}
                </p>
              </div>
            </div>

            {/* Emergency Mode Callout if applicable (Feature 11) */}
            {isEmergency && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 text-xs text-red-800 dark:text-red-300 font-bold flex items-center gap-2 animate-pulse">
                <span className="material-symbols-outlined text-[18px] text-red-600">emergency</span>
                <span>EMERGENCY PERISHABLE COMMODITY: Priority farm-gate dispatch needed!</span>
              </div>
            )}

            {/* Crop Lot Summary Card */}
            <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-on-surface">
                <span>{farmerListing.cropName} ({farmerListing.variety})</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {farmerListing.tons} Tons Available
                </span>
              </div>
              <div className="text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span>{farmerListing.location}</span>
              </div>
              <div className="text-on-surface-variant font-mono">
                Farmer Rate: ₹{farmerListing.pricePerTon?.toLocaleString('en-IN') || '25,000'} / Ton
              </div>
            </div>

            {/* Trader Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Quantity Required (Tons) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={farmerListing.tons}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(farmerListing.tons, Math.max(1, parseFloat(e.target.value) || 1)))}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                />
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  Max available: {farmerListing.tons} Tons
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Offered Price (₹ / Ton) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(parseFloat(e.target.value) || 1000)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Computed Deal Valuation */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                  Total Deal Valuation
                </div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-xs text-emerald-800 dark:text-emerald-300 font-mono">
                {quantity} Tons × ₹{offeredPrice.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Trader Contact Info */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  Your Name / Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  Contact Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={traderPhone}
                  onChange={(e) => setTraderPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  Pickup & Inspection Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant font-mono text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending Offer...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Send Request to Farmer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
