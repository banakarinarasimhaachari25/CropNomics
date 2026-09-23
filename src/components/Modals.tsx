import React, { useState } from 'react';
import { FarmerListing, RetailerIdentity, RetailerLot, TraderIdentity } from '../types';

interface ContactFarmerModalProps {
  farmer: FarmerListing | null;
  traderIdentity?: TraderIdentity | null;
  onClose: () => void;
}

export const ContactFarmerModal: React.FC<ContactFarmerModalProps> = ({ farmer, traderIdentity, onClose }) => {
  const [messageText, setMessageText] = useState(
    `నమస్కారం ${farmer?.farmerName || 'రైతు'} గారు! I am ${traderIdentity?.name || 'an AP Licensed Trader'}. I am interested in procuring your ${farmer?.tons || 10} Tons lot of ${farmer?.variety || farmer?.cropName || 'crop'} located at ${farmer?.location || 'your farm'}. Please let me know your confirmation.`
  );
  const [copiedText, setCopiedText] = useState(false);
  const [whatsAppDispatched, setWhatsAppDispatched] = useState(false);

  if (!farmer) return null;

  const rawDigits = farmer.phone.replace(/[^0-9]/g, '');
  const cleanPhone = rawDigits.length === 10 ? `+91${rawDigits}` : rawDigits.startsWith('91') ? `+${rawDigits}` : `+91${rawDigits.slice(-10)}`;
  const waNumber = rawDigits.startsWith('91') ? rawDigits : `91${rawDigits.slice(-10)}`;
  const encodedBody = encodeURIComponent(messageText);

  const handleSendWhatsApp = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(messageText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      }
    } catch (e) {
      console.warn('Clipboard write fallback', e);
    }
    setWhatsAppDispatched(true);
    window.open(`https://wa.me/${waNumber}?text=${encodedBody}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#0d5c2e]/40 text-left animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#0d5c2e]/10 text-[#0d5c2e] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">sms</span>
            </div>
            <div>
              <h3 className="font-black text-lg text-[#0d5c2e] dark:text-emerald-400 leading-tight">
                {farmer.farmerName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {farmer.location} • Grade: {farmer.grade}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Sender identity banner */}
        {traderIdentity?.name && (
          <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#0d5c2e]/20 p-2.5 rounded-xl text-xs mb-3 font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0d5c2e] dark:text-emerald-400 block">Messaging as Licensed Trader:</span>
              <span className="font-bold text-slate-900 dark:text-white">{traderIdentity.name} ({cleanPhone})</span>
            </div>
            <span className="material-symbols-outlined text-[#0d5c2e] text-[18px]">verified</span>
          </div>
        )}

        {/* Farmer Mobile Number Display */}
        <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl mb-3 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400 font-bold">Farmer Mobile:</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{cleanPhone}</span>
        </div>

        {/* Message composer */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center justify-between">
            <span>Message to Farmer (రైతుకు సందేశం)</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">WhatsApp Direct</span>
          </label>
          <textarea
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition-all resize-none shadow-inner"
            placeholder="Type message to the farmer..."
          />
        </div>

        {copiedText && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-mono mb-3 flex items-center gap-1.5 animate-in fade-in">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Message text copied to clipboard & WhatsApp opened!</span>
          </div>
        )}

        {whatsAppDispatched && !copiedText && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-mono mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>WhatsApp Conversation Initiated</span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">Active</span>
          </div>
        )}

        {/* Single Merged Option: Direct WhatsApp Contact */}
        <div className="space-y-2.5">
          <button
            type="button"
            id="btn-contact-farmer-whatsapp-merged"
            onClick={handleSendWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
            title="Contact Farmer via WhatsApp"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>WhatsApp ద్వారా సంప్రదించండి (Contact via WhatsApp)</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Direct farmer chat • Automatically includes crop variety, quantity, and your trader credentials
          </p>
        </div>
      </div>
    </div>
  );
};

interface MessageFarmerModalProps {
  farmer: FarmerListing | null;
  traderIdentity?: TraderIdentity | null;
  onClose: () => void;
}

export const MessageFarmerModal: React.FC<MessageFarmerModalProps> = ({ farmer, traderIdentity, onClose }) => {
  const initialGreeting = traderIdentity?.name
    ? `నమస్కారం! I am ${traderIdentity.name} (${traderIdentity.tradingFirm || 'AP Trader'}, Ph: ${traderIdentity.phoneNumber}). I am interested in sourcing your ${farmer?.tons} Tons of ${farmer?.variety}.`
    : `నమస్కారం! I have interest in sourcing ${farmer?.tons} Quintals/Tons of ${farmer?.variety} ready at ${farmer?.location}.`;

  const [messages, setMessages] = useState([
    { sender: 'farmer', text: `నమస్కారం! I have ${farmer?.tons} Tons of ${farmer?.variety} (Grade ${farmer?.grade}) ready for loading at ${farmer?.location}.` },
    { sender: 'me', text: initialGreeting },
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!farmer) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { sender: 'me', text: inputVal };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'farmer',
          text: `ధన్యవాదాలు ${traderIdentity?.name ? traderIdentity.name + ' గారు' : ''}! We can arrange AP Market weigh-bridge inspection tomorrow at 9:00 AM at ${farmer.location}. Rate is ₹${farmer.pricePerTon || farmer.estPriceTotal}/Ton.`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#0d5c2e]/40 flex flex-col h-[520px] animate-in zoom-in-95">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0d5c2e]/10 flex items-center justify-center text-[#0d5c2e] font-bold">
              {(farmer.farmerName || 'F').charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{farmer.farmerName || 'AP Farmer'}</div>
              <div className="text-[11px] text-slate-500 font-mono">Online • Verified AP Farmer ({farmer.location})</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Active Trader Identity Banner */}
        {traderIdentity?.name && (
          <div className="bg-[#f0fdf4] border-b border-[#0d5c2e]/20 px-3 py-1.5 text-[11px] text-[#0d5c2e] font-mono flex items-center justify-between">
            <span>Replying as: <strong>{traderIdentity.name}</strong></span>
            <span>+91 {traderIdentity.phoneNumber}</span>
          </div>
        )}

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                  m.sender === 'me'
                    ? 'bg-[#0d5c2e] text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="pt-3 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your price offer / సందేశం పంపండి..."
            className="flex-1 bg-slate-100 rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0d5c2e]"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#0d5c2e] text-white flex items-center justify-center hover:bg-[#14532d] transition-colors cursor-pointer flex-shrink-0 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 animate-in zoom-in-95 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0d5c2e]/10 text-[#0d5c2e] mx-auto flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-3xl">headset_mic</span>
        </div>

        <h3 className="text-xl font-black text-[#0d5c2e] mb-1">
          CropNomics 24/7 AP Rythu Helpline
        </h3>
        <p className="text-xs text-slate-600 mb-5">
          Toll-free agricultural support for Andhra Pradesh logistics, MSP payments & price dispute resolution.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl mb-4 text-left space-y-2 text-xs sm:text-sm font-mono border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">AP Rythu Toll Free:</span>
            <span className="font-bold text-[#0d5c2e]">155251 / 1800-425-0302</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">WhatsApp Support Desk:</span>
            <span className="font-bold text-[#c06a1c]">+91 863-234-9000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Average Response Time:</span>
            <span className="font-bold text-[#0d5c2e]">&lt; 3 Minutes</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#0d5c2e] text-white font-bold py-3 rounded-full hover:bg-[#14532d] transition-colors cursor-pointer"
        >
          Close Helpline
        </button>
      </div>
    </div>
  );
};

interface ContactTraderModalProps {
  lot: RetailerLot | null;
  retailerIdentity?: RetailerIdentity | null;
  onClose: () => void;
}

export const ContactTraderModal: React.FC<ContactTraderModalProps> = ({ lot, retailerIdentity, onClose }) => {
  const [called, setCalled] = useState(false);

  if (!lot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-[#11233b]/40 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-[#11233b]/10 text-[#11233b] mx-auto flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-3xl">call</span>
        </div>

        <h3 className="font-black text-xl text-[#11233b] mb-1">
          {lot.traderName}
        </h3>
        <p className="text-xs text-slate-600 mb-3 font-mono">
          {lot.location || lot.district || 'AP Trade Hub'} • Rating: {lot.traderRating} ★
        </p>

        {/* Display caller info if retailer identity is saved */}
        {retailerIdentity?.name && (
          <div className="bg-[#f1f5f9] border border-[#11233b]/20 p-2.5 rounded-xl text-left text-xs mb-4 font-mono text-slate-700">
            <div className="text-[10px] uppercase font-bold text-[#11233b]">Calling as Registered Retailer:</div>
            <div className="font-bold text-slate-900">{retailerIdentity.name} {retailerIdentity.shopName ? `(${retailerIdentity.shopName})` : ''}</div>
            <div className="text-slate-500 text-[11px]">+91 {retailerIdentity.phoneNumber}</div>
          </div>
        )}

        <div className="bg-slate-100 p-3.5 rounded-xl mb-4 font-mono text-lg font-bold text-slate-900">
          {lot.traderPhone ? (lot.traderPhone.startsWith('+') ? lot.traderPhone : `+91 ${lot.traderPhone}`) : '+91 98480 12345'}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-5 text-[11px] text-emerald-800 text-left font-mono">
          <div><strong>Crop Lot:</strong> {lot.cropName}</div>
          <div><strong>Requested Batch:</strong> {lot.bags} Bags / Crates (~{lot.tons} Tons)</div>
          <div><strong>Wholesale Quote:</strong> ₹{lot.buyingPriceTotal.toLocaleString('en-IN')} (₹{lot.pricePerBag}/bag)</div>
        </div>

        {called ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold mb-4 animate-in fade-in text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">check_circle</span>
              <span>Dialer Opened Successfully</span>
            </div>
            <p className="text-[11px] font-normal text-emerald-700">Connecting direct call with AP Registered Trader. You can also redial at {lot.traderPhone}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <a
              href={`tel:${(lot.traderPhone || '').replace(/[^0-9+]/g, '')}`}
              onClick={() => setCalled(true)}
              className="w-full bg-[#0d5c2e] hover:bg-[#14532d] text-white font-black py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm"
              id="btn-initiate-contact-trader"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              <span>Contact this number ({lot.traderPhone})</span>
            </a>
            <p className="text-[11px] text-slate-500 font-medium">Click above to open phone dialer directly</p>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 py-1 cursor-pointer font-bold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface MessageTraderModalProps {
  lot: RetailerLot | null;
  retailerIdentity?: RetailerIdentity | null;
  onClose: () => void;
}

export const MessageTraderModal: React.FC<MessageTraderModalProps> = ({ lot, retailerIdentity, onClose }) => {
  const initialGreeting = retailerIdentity?.name
    ? `నమస్కారం! I am ${retailerIdentity.name} (${retailerIdentity.shopName || 'Retail Merchant'}, ${retailerIdentity.district || 'AP'}). I want to procure ${lot?.bags} Bags of ${lot?.cropName} (${lot?.variety}) at ₹${lot?.pricePerBag}/bag wholesale.`
    : `నమస్కారం! I am inquiring about procuring ${lot?.bags} Bags of ${lot?.cropName} from your ready lot at ${lot?.location || 'AP Hub'}.`;

  const [messages, setMessages] = useState([
    { sender: 'trader', text: `నమస్కారం! We have certified fresh stock of ${lot?.cropName} (${lot?.grade || 'Grade A+'}) ready at ${lot?.location || 'our AP depot'}. Delivery can be scheduled within ${lot?.transitHours || 6} hours.` },
    { sender: 'me', text: initialGreeting },
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!lot) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { sender: 'me', text: inputVal };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'trader',
          text: `ధన్యవాదాలు ${retailerIdentity?.name ? retailerIdentity.name + ' గారు' : ''}! We can lock the wholesale rate of ₹${lot.pricePerBag}/bag for ${lot.bags} bags. Reefer truck dispatch ready with AP Rythu gate pass. Please confirm purchase token on CropNomics.`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#11233b]/40 flex flex-col h-[530px] animate-in zoom-in-95">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#11233b]/10 flex items-center justify-center text-[#11233b] font-bold">
              {(lot.traderName || 'T').charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{lot.traderName || 'AP Trader'}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {lot.district || 'AP'} • {lot.grade || 'Verified Trader'} • {lot.traderRating} ★
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Active Retailer Identity Banner */}
        {retailerIdentity?.name && (
          <div className="bg-[#f1f5f9] border-b border-[#11233b]/20 px-3 py-1.5 text-[11px] text-[#11233b] font-mono flex items-center justify-between">
            <span>Inquiring as: <strong>{retailerIdentity.name}</strong> {retailerIdentity.shopName ? `(${retailerIdentity.shopName})` : ''}</span>
            <span>+91 {retailerIdentity.phoneNumber}</span>
          </div>
        )}

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                  m.sender === 'me'
                    ? 'bg-[#11233b] text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="pt-3 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type quantity requirement or offer / సందేశం రాయండి..."
            className="flex-1 bg-slate-100 rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#11233b]"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#11233b] text-white flex items-center justify-center hover:bg-[#1e3a5f] transition-colors cursor-pointer flex-shrink-0 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

interface PurchaseSuccessModalProps {
  bags: number;
  totalAmount: number;
  retailerIdentity?: RetailerIdentity | null;
  onClose: () => void;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  bags,
  totalAmount,
  retailerIdentity,
  onClose,
}) => {
  const tokenNumber = `AP-RYTHU-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#0d5c2e]/40 animate-in zoom-in-95 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0d5c2e] text-white mx-auto flex items-center justify-center mb-3 shadow-md">
          <span className="material-symbols-outlined text-3xl font-bold">check</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-[#0d5c2e] mb-1">
          Purchase Confirmed! / ఆర్డర్ ఖరారైంది!
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Order for <strong className="text-slate-900">{bags} Bags/Crates</strong> reserved with Andhra Pradesh Registered Trader.
        </p>

        {/* Stamped Retailer Identity Block */}
        <div className="bg-[#f0fdf4] border border-[#0d5c2e]/30 rounded-xl p-3.5 mb-4 text-left font-mono text-xs">
          <div className="text-[10px] uppercase font-bold text-[#0d5c2e] mb-1">
            Registered Consignee (Retailer):
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {retailerIdentity?.name || 'Authorized AP Retail Merchant'}
          </div>
          <div className="text-slate-600 flex justify-between mt-0.5">
            <span>Phone: +91 {retailerIdentity?.phoneNumber || '94401 23456'}</span>
            <span>{retailerIdentity?.shopName || 'Retail Store'}</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 text-left space-y-2 text-xs sm:text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-slate-600">Total Purchase Amount:</span>
            <span className="font-bold text-[#0d5c2e] text-base">₹{totalAmount.toLocaleString('en-IN')}.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Dispatch Token:</span>
            <span className="font-bold text-[#c06a1c]">{tokenNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Delivery ETA:</span>
            <span className="font-bold text-slate-800">Tomorrow, 11:30 AM (AP Agri Hub)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 border-2 border-[#0d5c2e] text-[#0d5c2e] font-bold py-3 rounded-full hover:bg-[#0d5c2e]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Token Slip</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#0d5c2e] text-white font-bold py-3 rounded-full hover:bg-[#14532d] transition-colors shadow-md cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface TraderBidSlipModalProps {
  traderIdentity: TraderIdentity | null;
  farmer: FarmerListing | null;
  cropName: string;
  targetPrice: number;
  onClose: () => void;
  onUploadReceipt?: () => void;
}

export const TraderBidSlipModal: React.FC<TraderBidSlipModalProps> = ({
  traderIdentity,
  farmer,
  cropName,
  targetPrice,
  onClose,
  onUploadReceipt,
}) => {
  const contractId = `APAM-CN-BID-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-[#0d5c2e]/40 animate-in zoom-in-95 text-left">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#0d5c2e]/30 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0d5c2e]">
              CropNomics Direct Trade Gateway
            </span>
            <h3 className="text-lg font-black text-[#0d5c2e] uppercase">
              AP Trader Procurement Bid Slip
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-[#c06a1c] text-white px-2.5 py-1 rounded">
            {contractId}
          </span>
        </div>

        {/* Parties grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-mono">
          <div className="bg-[#f0fdf4] p-3 rounded-xl border border-[#0d5c2e]/30">
            <span className="text-[10px] text-[#0d5c2e] font-bold uppercase block mb-1">
              Registered Trader (Buyer):
            </span>
            <div className="font-bold text-slate-900">{traderIdentity?.name || 'M. Srikanth Reddy'}</div>
            <div className="text-slate-600">Ph: +91 {traderIdentity?.phoneNumber || '98480 12345'}</div>
            <div className="text-slate-600">{traderIdentity?.tradingFirm || 'Agro Trading Firm'}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
              Farmer Producer (Seller):
            </span>
            <div className="font-bold text-slate-900">{farmer?.farmerName || 'AP Registered Farmer'}</div>
            <div className="text-slate-600">Ph: {farmer?.phone || '+91 94400 11223'}</div>
            <div className="text-slate-600">{farmer?.location || 'Guntur Market'}</div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs font-mono mb-5">
          <div className="flex justify-between">
            <span className="text-slate-600">Commodity / Crop:</span>
            <span className="font-bold text-slate-900">{cropName} ({farmer?.variety || 'Grade A'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Quantity Stamped:</span>
            <span className="font-bold text-slate-900">{farmer?.tons || 20} Tons</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Offer Bid Value:</span>
            <span className="font-bold text-[#0d5c2e] text-sm">₹{targetPrice.toLocaleString('en-IN')}.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Transit &amp; Tax Burden:</span>
            <span className="font-bold text-[#c06a1c]">100% Trader Responsibility (Post-Handover)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {onUploadReceipt && (
            <button
              id="btn-trader-bid-upload-receipt"
              type="button"
              onClick={() => {
                onClose();
                onUploadReceipt();
              }}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm hover:scale-102"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Upload Paid Receipt</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 border-2 border-[#0d5c2e] text-[#0d5c2e] font-bold py-3 rounded-xl hover:bg-[#0d5c2e]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Bid Contract</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#0d5c2e] text-white font-bold py-3 rounded-xl hover:bg-[#14532d] transition-colors shadow-md cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// UNIVERSAL TERMS & CONDITIONS MODAL (Requirement 21)
// =========================================================================
interface TermsAndConditionsModalProps {
  onClose: () => void;
  role?: 'farmer' | 'trader' | 'retailer' | 'consumer' | 'admin';
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ onClose, role = 'farmer' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-300 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#11233b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-2xl">verified_user</span>
            <div>
              <h3 className="font-black text-base sm:text-lg">Terms, Conditions & Legal Framework</h3>
              <p className="text-[11px] text-emerald-200">AP Agricultural Produce Market Committee (APMC) & CropNomics Guidelines</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-medium">
            <strong>Key Guarantee:</strong> All trade contracts negotiated on CropNomics are governed by the Andhra Pradesh Agricultural Produce and Livestock Markets Act, with mandatory MSP safeguarding for registered producers.
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">gavel</span>
              1. Minimum Support Price (MSP) Guarantee
            </h4>
            <p className="text-slate-600">
              Traders bidding on farmgate lots agree not to bid below the official MSP promulgated by the Department of Agriculture, Government of Andhra Pradesh. Any sub-MSP offline contract reported by a producer will be subjected to prompt APMC audit.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">account_balance</span>
              2. Digital Escrow & Payment Settlement
            </h4>
            <p className="text-slate-600">
              Pre-paid bookings and wholesale purchases are held in an authorized AP Escrow Account. Funds are released within 2 hours of verified physical handover, weighment slip sign-off, or QR scan verification at the destination mandi yard or retailer shop.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">local_shipping</span>
              3. Transport, Reefer Logistics & Perishability Downtime
            </h4>
            <p className="text-slate-600">
              Transport liability transfers to the buyer upon formal weighment stamping at the farmgate or mandi gate. Refrigerated cold-chain vehicles ordered through CropNomics are tracked in real-time, with temperature excursion penalties applying if internal temperature fluctuates beyond tolerance limits.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[18px]">support_agent</span>
              4. Dispute Redressal & Toll-Free Helpline
            </h4>
            <p className="text-slate-600">
              In case of weighment dispute, quality grading divergence, or payment delay, either party can summon immediate APMC arbitration via the 24x7 AP Rythu Bharosa Toll-Free Desk at <strong>1800-425-0012</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-mono">Applicable across All Dashboards • v2.4 AP Certified</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0d5c2e] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            I Acknowledge & Understand
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// UNIVERSAL QUICK FEEDBACK MODAL (Requirement 22)
// =========================================================================
interface QuickFeedbackModalProps {
  onClose: () => void;
  role: 'farmer' | 'trader' | 'retailer' | 'consumer' | 'admin';
  userName?: string;
}

export const QuickFeedbackModal: React.FC<QuickFeedbackModalProps> = ({ onClose, role, userName = '' }) => {
  const [name, setName] = useState(userName || '');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Market Pricing / MSP');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      // Import db lazily to avoid circular issues
      const { db } = require('../data/db');
      db.addUserFeedback({
        role,
        name: name.trim() || `AP ${role.toUpperCase()} Member`,
        rating,
        category,
        comment: comment.trim(),
      });
    } catch {
      // fallback
    }

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-300 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-[#11233b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-2xl">rate_review</span>
            <div>
              <h3 className="font-black text-base">Submit Feedback & Grievance</h3>
              <p className="text-[11px] text-emerald-200">AP Agricultural Market Direct Feedback</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h4 className="font-bold text-slate-900 text-base">Feedback Submitted Successfully!</h4>
            <p className="text-xs text-slate-600">Your review and suggestions have been dispatched to the AP Market Administrator.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Name / Organization</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Reddy (Farmer / Trader)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-xl cursor-pointer transition-transform hover:scale-125 ${
                        star <= rating ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 outline-none bg-white text-xs"
                >
                  <option value="Market Pricing / MSP">Market Pricing / MSP</option>
                  <option value="Escrow & Payment">Escrow & Payment</option>
                  <option value="Cold Storage & Transit">Cold Storage & Transit</option>
                  <option value="Retail Booking">Retail Booking</option>
                  <option value="App Usability">App Usability</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Comments / Suggestions *</label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your feedback, request, or issue clearly..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
