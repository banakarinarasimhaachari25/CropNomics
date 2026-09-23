import React, { useState } from 'react';
import { db } from '../data/db';
import { OfflineReceiptRecord, TradeRequest, UserRole } from '../types';

interface OfflineReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  uploaderName: string;
  uploaderPhone: string;
  targetRequest?: TradeRequest | null;
  onReceiptUploaded?: (receipt: OfflineReceiptRecord) => void;
}

export const OfflineReceiptModal: React.FC<OfflineReceiptModalProps> = ({
  isOpen,
  onClose,
  role,
  uploaderName,
  uploaderPhone,
  targetRequest,
  onReceiptUploaded,
}) => {
  const [receiptNumber, setReceiptNumber] = useState(
    targetRequest?.offlineReceiptNumber || `APMC-${role.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [counterpartyName, setCounterpartyName] = useState(
    targetRequest ? (role === 'farmer' ? targetRequest.traderName : targetRequest.farmerName) : ''
  );
  const [cropName, setCropName] = useState(targetRequest?.cropName || 'Paddy / Rice (వరి BPT 5204)');
  const [quantity, setQuantity] = useState(
    targetRequest ? `${targetRequest.requestedQuantity} Tons` : '5 Tons'
  );
  const [amount, setAmount] = useState(targetRequest ? String(targetRequest.totalAmount) : '124000');
  const [paymentMethod, setPaymentMethod] = useState(
    targetRequest?.offlinePaymentMethod || 'APMC Market Challan'
  );
  const [paymentDate, setPaymentDate] = useState(
    targetRequest?.offlinePaymentDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(
    targetRequest?.offlinePaymentReceiptNote || 'Direct farm gate payment completed with weighbridge verification stamp.'
  );
  const [receiptImage, setReceiptImage] = useState<string>(
    targetRequest?.offlinePaymentReceipt ||
      'https://images.unsplash.com/photo-1554415707-9e490161b47e?auto=format&fit=crop&w=800&q=80'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const newRecord: OfflineReceiptRecord = {
      id: `receipt-ap-${Date.now()}`,
      requestId: targetRequest?.id,
      role: role as 'farmer' | 'trader' | 'retailer',
      uploaderName: uploaderName || (role === 'farmer' ? 'రైతు సోదరుడు (Farmer)' : 'Agro Trader'),
      uploaderPhone: uploaderPhone || '9848012345',
      counterpartyName: counterpartyName || 'Market Counterparty',
      cropName: cropName,
      amount: parseFloat(amount) || 0,
      quantityTonsOrBags: quantity,
      receiptNumber: receiptNumber.trim(),
      paymentMethod: paymentMethod,
      paymentDate: paymentDate,
      receiptImageUrl: receiptImage,
      notes: notes,
      uploadedAt: new Date().toISOString(),
      verified: true,
    };

    db.uploadOfflineReceipt(newRecord);

    if (onReceiptUploaded) {
      onReceiptUploaded(newRecord);
    }

    setIsUploading(false);
    setSuccessMessage('Receipt uploaded and registered in agricultural ledger successfully!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div
      id="offline-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-300">
            <span className="material-symbols-outlined text-[26px]">receipt_long</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-on-surface">Upload Offline Deal Receipt</h2>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded-full border border-amber-200">
                Direct Deal Proof
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Submit signed APMC Market challan, cash voucher, or bank deposit slip for audit & settlement
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="font-bold text-on-surface text-base">Receipt Registered</h3>
            <p className="text-xs text-on-surface-variant">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Receipt / Challan Number *
                </label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. APMC-GNT-8492"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 124000"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Counterparty Name ({role === 'farmer' ? 'Trader' : 'Farmer'}) *
                </label>
                <input
                  type="text"
                  required
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder={role === 'farmer' ? 'e.g. Srikanth Reddy (Trader)' : 'e.g. Ramesh Varma (Farmer)'}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Quantity (Tons or Bags) *
                </label>
                <input
                  type="text"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5 Tons"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="APMC Market Challan">APMC Market Challan</option>
                  <option value="Direct Farm Gate Cash">Direct Farm Gate Cash</option>
                  <option value="Bank Deposit / RTGS">Bank Deposit / RTGS</option>
                  <option value="UPI / QR Payment">UPI / QR Payment</option>
                  <option value="Weighbridge Slip & Cash">Weighbridge Slip & Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Crop & Lot Name
              </label>
              <input
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="Crop name"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Receipt Image File / Proof */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Receipt / Invoice Photo / Slip (File or Photo)
              </label>
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-3 text-center bg-surface hover:bg-surface-container transition-colors">
                <input
                  type="file"
                  id="receipt-file-input"
                  accept="image/*,.pdf"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-amber-600 text-[24px]">cloud_upload</span>
                  <span className="text-xs font-medium text-on-surface">
                    Click to select receipt image or drag file here
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Supports JPG, PNG, PDF</span>
                </label>

                {receiptImage && (
                  <div className="mt-2 flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <img
                      src={receiptImage}
                      alt="Receipt preview"
                      className="w-12 h-12 object-cover rounded border"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left text-xs">
                      <div className="font-bold text-on-surface">Receipt Document Attached</div>
                      <div className="text-[10px] text-emerald-600 font-mono">Verified Stamp Preview Ready</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Verification Remarks / Weighbridge Note
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Weighbridge certificate #894 stamped at Guntur market yard."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant font-mono text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-offline-receipt-btn"
                disabled={isUploading}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Upload & Confirm Receipt</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
