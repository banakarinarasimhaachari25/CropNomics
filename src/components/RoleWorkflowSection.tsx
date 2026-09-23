import React from 'react';
import { LanguageCode } from '../types';

interface RoleWorkflowSectionProps {
  language: LanguageCode;
}

export const RoleWorkflowSection: React.FC<RoleWorkflowSectionProps> = ({
  language,
}) => {
  return (
    <div
      id="admin-notice-board"
      className="my-6 bg-surface-container-lowest rounded-2xl border-2 border-outline-variant/60 shadow-md overflow-hidden"
    >
      {/* Notice Header */}
      <div className="bg-[#11233b] text-white px-5 py-3.5 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[#059669] text-2xl font-bold">
          campaign
        </span>
        <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase font-mono">
          {language === 'te' ? 'నోటీస్ (NOTICE)' : 'NOTICE'}
        </h2>
      </div>

      {/* Notice Content Body */}
      <div className="p-6 sm:p-8 space-y-6 text-on-surface bg-white">
        
        {/* ========================================================= */}
        {/* FARMER STAGE                                              */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-[#11233b] flex items-center gap-2">
            <span className="text-[#059669]">🌱</span>
            <span>Farmer Stage (Terms &amp; Conditions):</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm sm:text-base text-on-surface leading-relaxed marker:text-[#059669]">
            <li>
              Until the farmer hands over their crops to the trader, all extra expenses are solely their responsibility.
            </li>
            <li>
              Any additional costs incurred must be covered by the farmer.
            </li>
            <li>
              Overall crop safety remains entirely on the farmer.
            </li>
          </ul>
        </div>

        <div className="border-t border-outline-variant/30" />

        {/* ========================================================= */}
        {/* TRADER STAGE                                              */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-[#11233b] flex items-center gap-2">
            <span className="text-[#059669]">🚚</span>
            <span>Trader Stage:</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm sm:text-base text-on-surface leading-relaxed marker:text-[#059669]">
            <li>
              Once the trader receives the crop from the farmer and packaging is complete, the farmer has no further involvement.
            </li>
            <li>
              The trader must handle all transportation costs, remaining packaging, fuel expenses, taxes, and any other related expenditures.
            </li>
          </ul>
        </div>

        <div className="border-t border-outline-variant/30" />

        {/* ========================================================= */}
        {/* RETAILER STAGE                                            */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-[#11233b] flex items-center gap-2">
            <span className="text-[#059669]">🏪</span>
            <span>Retailer Stage:</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm sm:text-base text-on-surface leading-relaxed marker:text-[#059669]">
            <li>
              After acquiring goods from traders, the retailer takes full responsibility for distribution to small shops and consumer attraction efforts.
            </li>
            <li>
              Traders and farmers have no connection to or responsibility for these retail operations.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
