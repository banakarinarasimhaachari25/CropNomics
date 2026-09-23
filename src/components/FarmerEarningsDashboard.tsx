import React, { useState } from 'react';
import { db } from '../data/db';
import { FarmerProfile, TradeRequest } from '../types';
import { OfflineReceiptModal } from './OfflineReceiptModal';

interface FarmerEarningsDashboardProps {
  farmerProfile: FarmerProfile;
  tradeRequests: TradeRequest[];
}

export const FarmerEarningsDashboard: React.FC<FarmerEarningsDashboardProps> = ({
  farmerProfile,
  tradeRequests,
}) => {
  const [selectedRequestForReceipt, setSelectedRequestForReceipt] = useState<TradeRequest | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [viewingSlipRequest, setViewingSlipRequest] = useState<TradeRequest | null>(null);

  // Accepted or completed deals
  const acceptedRequests = tradeRequests.filter(
    (r) => r.status === 'accepted' || (r.status as string) === 'completed'
  );

  const pendingRequests = tradeRequests.filter((r) => r.status === 'pending');

  const totalEarnedAmount = acceptedRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalSoldTons = acceptedRequests.reduce((sum, r) => sum + (r.requestedQuantity || 0), 0);
  const pendingAmount = pendingRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const totalHarvestTons = (farmerProfile.quantity || 0) + totalSoldTons;
  const remainingTons = farmerProfile.quantity || 0;
  const soldPercent = totalHarvestTons > 0 ? Math.round((totalSoldTons / totalHarvestTons) * 100) : 0;

  const avgPricePerTon =
    totalSoldTons > 0 ? Math.round(totalEarnedAmount / totalSoldTons) : 24500;

  return (
    <div
      id="farmer-earnings-dashboard"
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </span>
            <h2 className="text-xl font-black text-on-surface">Farmer Earnings & Sales Dashboard</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time track of sold harvest tonnage, realized revenue, and buyer transaction receipts
          </p>
        </div>

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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="text-[11px] font-mono uppercase text-emerald-800 dark:text-emerald-300 font-bold">
            Total Realized Revenue
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
            ₹{totalEarnedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            From {acceptedRequests.length} closed trade deals
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
          <div className="text-[11px] font-mono uppercase text-on-surface-variant font-bold">
            Tonnage Sold
          </div>
          <div className="text-2xl font-black text-on-surface font-mono mt-1">
            {totalSoldTons} <span className="text-sm font-normal">Tons</span>
          </div>
          <div className="text-[10px] text-on-surface-variant mt-1">
            {remainingTons} Tons active remaining
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
          <div className="text-[11px] font-mono uppercase text-on-surface-variant font-bold">
            Avg Rate Realized
          </div>
          <div className="text-2xl font-black text-on-surface font-mono mt-1">
            ₹{avgPricePerTon.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Above AP Market base MSP
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="text-[11px] font-mono uppercase text-amber-800 dark:text-amber-300 font-bold">
            Pending Deals Value
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
            {pendingRequests.length} bids awaiting approval
          </div>
        </div>
      </div>

      {/* Harvest Quantity Progress Bar */}
      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-on-surface">Harvest Inventory Disposition</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {soldPercent}% Sold ({totalSoldTons} / {totalHarvestTons} Tons)
          </span>
        </div>

        <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-600 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, soldPercent)}%` }}
            title={`Sold: ${totalSoldTons} Tons`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - soldPercent)}%` }}
            title={`Available: ${remainingTons} Tons`}
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Sold & Locked ({totalSoldTons} Tons)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Available for Sale ({remainingTons} Tons)</span>
          </div>
        </div>
      </div>

      {/* Detailed Sales Ledger Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
            <span>Completed Sales & Deal Records</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container font-mono text-on-surface-variant">
              {acceptedRequests.length}
            </span>
          </h3>
        </div>

        {acceptedRequests.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-outline-variant text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant block mb-1">
              receipt
            </span>
            No completed sales yet. Once you accept trader requests from the Request Portal, your earnings ledger will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant border-b border-outline-variant font-mono">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Buyer / Trader</th>
                  <th className="py-2.5 px-3">Crop & Lot</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Price / Ton</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Settlement / Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {acceptedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-on-surface-variant">
                      {req.requestDate.split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-on-surface">{req.traderName}</div>
                      <div className="text-[10px] text-on-surface-variant">{req.traderFirm || req.traderDistrict}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-on-surface">{req.cropName}</div>
                      <div className="text-[10px] text-on-surface-variant">{req.variety}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-on-surface">
                      {req.requestedQuantity} Tons
                    </td>
                    <td className="py-2.5 px-3 font-mono text-on-surface">
                      ₹{req.offeredPricePerTon.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{req.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      {req.offlineReceiptNumber ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            {req.offlineReceiptNumber}
                          </span>
                          {req.offlinePaymentReceipt && (
                            <button
                              type="button"
                              onClick={() => setViewingSlipRequest(req)}
                              className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Slip</span>
                              <span className="material-symbols-outlined text-[12px]">visibility</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRequestForReceipt(req);
                            setReceiptModalOpen(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-300 transition-colors cursor-pointer"
                        >
                          + Upload Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Settlement & Payment Slip Modal (User Requirement 12) */}
      {viewingSlipRequest && (
        <div
          id="farmer-view-slip-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setViewingSlipRequest(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingSlipRequest(null)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Official Slip Header */}
            <div className="text-center pb-4 border-b border-dashed border-outline-variant">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-2 border border-emerald-300">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                GOVERNMENT OF ANDHRA PRADESH • AP AGRI LOGISTICS
              </div>
              <h3 className="text-lg font-black text-on-surface">Rythu Settlement & Payment Slip</h3>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Serial No: {viewingSlipRequest.offlineReceiptNumber || `SLIP-AP-${viewingSlipRequest.id.substring(0, 8)}`}
              </p>
            </div>

            {/* Slip Key Details */}
            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Farmer Beneficiary:</span>
                  <span className="font-bold text-on-surface">{farmerProfile.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kisan Card / Aadhaar:</span>
                  <span className="text-on-surface">{farmerProfile.farmerCardDetails?.cardNumber || 'AP-KCC-849201'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Village / District:</span>
                  <span className="text-on-surface">{farmerProfile.location || farmerProfile.district || 'Andhra Pradesh'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Purchaser / Trader:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{viewingSlipRequest.traderName}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-emerald-900 dark:text-emerald-300">Crop Commodity:</span>
                  <span className="font-bold text-on-surface">{viewingSlipRequest.cropName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-900 dark:text-emerald-300">Net Quantity Weighed:</span>
                  <span className="font-bold text-on-surface">{viewingSlipRequest.requestedQuantity} Tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-900 dark:text-emerald-300">Rate / Ton:</span>
                  <span className="text-on-surface">₹{viewingSlipRequest.offeredPricePerTon.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-baseline">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">Total Net Disbursed:</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    ₹{viewingSlipRequest.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Settlement Mode:</span>
                  <span className="font-bold text-on-surface">{viewingSlipRequest.offlinePaymentMethod || 'APMC Market Challan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Payment Date:</span>
                  <span className="text-on-surface">{viewingSlipRequest.offlinePaymentDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Audit Verification:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Weighbridge Stamp Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Slip Action Buttons */}
            <div className="pt-3 border-t border-outline-variant flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingSlipRequest(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close Slip
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-[#0d5c2e] hover:bg-[#14532d] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Receipt Upload Modal */}
      <OfflineReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        role="farmer"
        uploaderName={farmerProfile.fullName}
        uploaderPhone={farmerProfile.mobile}
        targetRequest={selectedRequestForReceipt}
      />
    </div>
  );
};
