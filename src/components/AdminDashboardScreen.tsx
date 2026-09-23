import React, { useState, useEffect } from 'react';
import { INITIAL_REPORTED_ISSUES, INITIAL_REVIEWS, TRANSLATIONS } from '../data/mockData';
import { RoleWorkflowSection } from './RoleWorkflowSection';
import { AppScreen, LanguageCode, ReportedIssue, ReviewItem } from '../types';
import { db } from '../data/db';
import { TermsAndConditionsModal, QuickFeedbackModal } from './Modals';
import { MyAddressModal } from './MyAddressModal';

interface AdminDashboardScreenProps {
  language: LanguageCode;
  onNavigateToDashboard?: (screen: AppScreen) => void;
  onOpenSupportModal?: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  language,
  onNavigateToDashboard,
  onOpenSupportModal,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Central Database subscription
  const [dbState, setDbState] = useState(db.getState());
  useEffect(() => {
    return db.subscribe(() => {
      setDbState({ ...db.getState() });
    });
  }, []);

  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('market');
  const [details, setDetails] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Admin and Reviews State
  const [issues, setIssues] = useState<ReportedIssue[]>(INITIAL_REPORTED_ISSUES);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [issuesFilter, setIssuesFilter] = useState<'All' | 'New' | 'In Progress' | 'Fixed'>('All');
  const [selectedIssue, setSelectedIssue] = useState<ReportedIssue | null>(null);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: language === 'te' ? 'మీరు (ధృవీకరించబడిన వినియోగదారు)' : 'You (Verified AP User)',
      role: 'Admin / Inspector',
      rating: rating,
      comment: details,
      date: language === 'te' ? 'ఇప్పుడే' : 'Just now',
    };

    setReviews([newRev, ...reviews]);
    setFeedbackSubmitted(true);
    setDetails('');
    setTimeout(() => {
      setFeedbackSubmitted(false);
    }, 4000);
  };

  const handleToggleIssueStatus = (issueId: string) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const nextStatus: 'New' | 'In Progress' | 'Fixed' =
            item.status === 'New' ? 'In Progress' : item.status === 'In Progress' ? 'Fixed' : 'New';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const filteredIssues =
    issuesFilter === 'All' ? issues : issues.filter((i) => i.status === issuesFilter);

  const avgRating = (
    reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const newIssuesCount = issues.filter((i) => i.status === 'New').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const fixedCount = issues.filter((i) => i.status === 'Fixed').length;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 md:pb-12">
      {/* ========================================================= */}
      {/* DEDICATED ADMIN DASHBOARD HERO HEADER                     */}
      {/* ========================================================= */}
      <div className="mb-8 bg-gradient-to-br from-[#1b1e2e] via-[#161a29] to-[#0f172a] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Step Back Button */}
        <div className="relative z-10 mb-4">
          <button
            type="button"
            id="btn-admin-back-to-main"
            onClick={() => onNavigateToDashboard?.('welcome')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title={language === 'te' ? 'వెనుకకు' : 'Back'}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>
                {language === 'te'
                  ? 'ఆంధ్రప్రదేశ్ వ్యవసాయ మార్కెటింగ్ శాఖ'
                  : 'AP Agricultural Marketing Oversight'}
              </span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-400 text-3xl sm:text-4xl">
                admin_panel_settings
              </span>
              <span>
                {language === 'te'
                  ? 'అడ్మిన్ డాష్‌బోర్డ్ (Admin Dashboard)'
                  : 'Admin & Oversight Dashboard'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              {language === 'te'
                ? 'మార్కెట్ విచారణలు, ఫిర్యాదుల పరిష్కారం, వ్యాపార వివాదాల తీర్పు మరియు 4-పాత్రల సరఫరా బాధ్యతల పర్యవేక్షణ.'
                : 'Central APAM monitoring: resolution SLA tracking, dispute mediation, live market audit ledger, and role liability boundaries.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* My Address Trigger (as in consumer dashboard) */}
            <button
              id="btn-admin-profile-address"
              type="button"
              onClick={() => setShowAddressModal(true)}
              title={language === 'te' ? 'నా కార్యాలయ చిరునామా' : 'Headquarters & Secretariat Address'}
              className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
              <span>{language === 'te' ? 'నా చిరునామా' : 'My Address'}</span>
            </button>

            <button
              id="btn-admin-terms"
              type="button"
              onClick={() => setShowTermsModal(true)}
              title="Terms & APMC Rules"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-400">gavel</span>
              <span>Terms & Rules</span>
            </button>

            <button
              id="btn-admin-feedback"
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              title="Submit Feedback"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-400">rate_review</span>
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Live Admin SLA Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Resolution SLA
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1">
              <span>&lt; 4.0</span>
              <span className="text-xs text-slate-300 font-normal">Hours</span>
            </div>
            <span className="text-[10px] text-slate-400">Target: 100% compliance</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Average Satisfaction
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1 flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-xs text-amber-400">★</span>
            </div>
            <span className="text-[10px] text-slate-400">From {reviews.length} AP reviews</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Open Issues
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
              {newIssuesCount}
            </div>
            <span className="text-[10px] text-slate-400">{inProgressCount} currently in progress</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Resolved Disputes
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
              {fixedCount}
            </div>
            <span className="text-[10px] text-slate-400">Settled without legal escalation</span>
          </div>
        </div>
      </div>

      {/* 4-Role Responsibility & Liability Workflows */}
      <div className="mb-10">
        <RoleWorkflowSection language={language} />
      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Reported Issues & Dispute Arbitration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-2xl">report_problem</span>
                  <span>
                    {language === 'te'
                      ? 'మార్కెట్ సమస్యలు & వివాదాల పరిష్కారం'
                      : 'Market Issues & Dispute Arbitration'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'te'
                    ? 'స్టేటస్ మార్చడానికి బటన్‌ను క్లిక్ చేయండి (New → In Progress → Fixed)'
                    : 'Click any status badge to toggle state (New → In Progress → Fixed)'}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['All', 'New', 'In Progress', 'Fixed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setIssuesFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      issuesFilter === filter
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues List or Selected Issue Detail View */}
            {selectedIssue ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Universal Back Button */}
                <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                  <button
                    id="btn-admin-back-to-issues-list"
                    type="button"
                    onClick={() => setSelectedIssue(null)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
                    title={language === 'te' ? 'సమస్యల జాబితాకు తిరిగి వెళ్లండి' : 'Back to All Issues'}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span>{language === 'te' ? 'సమస్యల జాబితాకు తిరిగి వెళ్లండి' : 'Back to All Issues'}</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Audit Case #{selectedIssue.id}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {selectedIssue.id}
                      </span>
                      <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        {selectedIssue.category}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        selectedIssue.status === 'New'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : selectedIssue.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {selectedIssue.status}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {selectedIssue.description || selectedIssue.title}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Reported By</span>
                      <span className="font-bold text-slate-900">
                        {selectedIssue.reporter} {selectedIssue.reporterTelugu ? `(${selectedIssue.reporterTelugu})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Timestamp</span>
                      <span className="font-mono text-slate-700">{selectedIssue.timestamp || selectedIssue.timeAgo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Statutory SLA</span>
                      <span className="font-semibold text-emerald-700">&lt; 4 Hours Dispute Resolution</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleIssueStatus(selectedIssue.id);
                        setSelectedIssue((prev) =>
                          prev
                            ? {
                                ...prev,
                                status:
                                  prev.status === 'New'
                                    ? 'In Progress'
                                    : prev.status === 'In Progress'
                                    ? 'Fixed'
                                    : 'New',
                              }
                            : null
                        );
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {language === 'te' ? 'స్టేటస్ మార్చండి (Cycle Status)' : 'Update Status'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIssue(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {language === 'te' ? 'జాబితాకు తిరిగి వెళ్లండి' : 'Return to List'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer"
                    title="Click to view detailed dispute arbitration"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {issue.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors">
                        {issue.description || issue.title}
                      </p>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          Reported by: <span className="font-bold text-slate-900">{issue.reporter}</span>
                          {language === 'te' && issue.reporterTelugu && (
                            <span className="text-slate-500 ml-1 font-normal">({issue.reporterTelugu})</span>
                          )}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">{issue.timestamp || issue.timeAgo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleIssueStatus(issue.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          issue.status === 'New'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                            : issue.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                        }`}
                        title="Click to cycle status"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {issue.status === 'Fixed'
                            ? 'check_circle'
                            : issue.status === 'In Progress'
                            ? 'pending'
                            : 'error'}
                        </span>
                        <span>{issue.status}</span>
                      </button>
                      <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Trade Reviews */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">rate_review</span>
              <span>
                {language === 'te' ? 'రైతు & ట్రేడర్ ప్రత్యక్ష సమీక్షలు' : 'Verified Trade Reviews'}
              </span>
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{rev.author}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        {rev.role}
                      </span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 italic">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{rev.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Submit Feedback & Support Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 mb-1">
              {language === 'te' ? 'అభిప్రాయం లేదా వివాదం నమోదు' : 'Submit Feedback / Incident'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'te'
                ? 'ఏదైనా సమస్య ఉంటే నేరుగా అడ్మిన్ లాగ్‌లోకి నమోదు చేయండి.'
                : 'Directly record an incident or user feedback into the APAM audit log.'}
            </p>

            {feedbackSubmitted && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>
                  {language === 'te'
                    ? 'ధన్యవాదాలు! మీ నివేదిక విజయవంతంగా నమోదైంది.'
                    : 'Report registered successfully into APAM ledger.'}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'te' ? 'అనుభవ రేటింగ్' : 'Experience Rating'}
                </label>
                <div className="flex gap-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <span
                          className="material-symbols-outlined text-[32px]"
                          style={filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          star
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'te' ? 'వర్గం' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="market">AP MSP & Price Discrepancy</option>
                  <option value="app">CropNomics Platform Issue</option>
                  <option value="support">Rythu Bharosa Support / Escalation</option>
                  <option value="logistics">Cold Storage & Transit Delay</option>
                  <option value="other">General / Administrative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'te' ? 'వివరాలు' : 'Details / Incident Log'}
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    language === 'te'
                      ? 'వివరాలను ఇక్కడ టైప్ చేయండి...'
                      : 'Describe the dispute, pricing variation or quality concern...'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                {language === 'te' ? 'నివేదిక సమర్పించండి' : 'Submit Audit Record'}
              </button>
            </form>
          </div>

          {/* Admin Live Support Terminal */}
          {onOpenSupportModal && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">terminal</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Live Admin Support Terminal</h4>
                  <p className="text-[11px] text-slate-400">AP Agricultural Marketing System Console</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Open real-time diagnostic logs, grievance resolution queries, and officer communications.
              </p>

              <button
                type="button"
                onClick={onOpenSupportModal}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Open Live Support Terminal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CENTRAL CONSUMER & RETAILER ORDERS AUDIT LEDGER          */}
      {/* ========================================================= */}
      <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
              <span className="material-symbols-outlined text-[14px]">fact_check</span>
              <span>Live Central Database Synchronization</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">local_mall</span>
              <span>Consumer Orders & Retailer Bookings Audit Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive view of transactions across Andhra Pradesh with direct buyer and retailer telephone dialers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Orders: {dbState.consumerOrders?.length || 0}
          </span>
        </div>

        {(!dbState.consumerOrders || dbState.consumerOrders.length === 0) ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No consumer orders currently in the central database ledger.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbState.consumerOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {order.id}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-2">
                      {order.itemTitle}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Qty: <span className="font-bold text-slate-800">{order.quantityKg} kg</span> • Total: <span className="font-black text-emerald-700 font-mono">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      order.status === 'Received' || order.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : order.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-bold">Buyer</span>
                      <span className="font-bold text-slate-800">{order.consumerName}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{order.consumerAddress}</p>
                    </div>
                    {order.consumerPhone && (
                      <a
                        href={`tel:${order.consumerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>Contact this number ({order.consumerPhone})</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-bold">Retailer Shop</span>
                      <span className="font-bold text-slate-800">{order.retailerShopName}</span>
                    </div>
                    {order.retailerPhone && (
                      <a
                        href={`tel:${order.retailerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>Contact this number ({order.retailerPhone})</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* CENTRAL USER FEEDBACK AUDIT LOG                           */}
      {/* ========================================================= */}
      {dbState.quickFeedbacks && dbState.quickFeedbacks.length > 0 && (
        <section className="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-2xl">reviews</span>
                <span>Central Cross-Screen User Feedback Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time submissions from Farmers, Traders, Retailers, and Consumers with direct contact action.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Entries: {dbState.quickFeedbacks.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbState.quickFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900">{fb.userName}</span>
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800">
                      {fb.role}
                    </span>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(fb.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[14px]">star</span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                  {fb.category}
                </div>

                <p className="text-slate-700 italic">"{fb.comment}"</p>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(fb.timestamp).toLocaleDateString()}
                  </span>
                  {fb.userPhone && (
                    <a
                      href={`tel:${fb.userPhone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">call</span>
                      <span>Contact this number ({fb.userPhone})</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <TermsAndConditionsModal
          role="admin"
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* Quick Feedback Modal */}
      {showFeedbackModal && (
        <QuickFeedbackModal
          role="admin"
          userName="APAM Administrator"
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* My Address Modal (Requirement: Add My Address in all dashboards as in consumer dashboard) */}
      {showAddressModal && (
        <MyAddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          role="admin"
          language={language}
          initialData={{
            fullName: 'Dr. C. Harikrishna, IAS (హరికృష్ణ)',
            phone: '+91 866 242 9001',
            streetAddress: 'Department of Agricultural Marketing, AP State Secretariat, Block No. 4, Ground Floor',
            landmark: 'Near Velagapudi Assembly Complex & AP High Court Corridor',
            cityVillage: 'Amaravati / Velagapudi',
            mandal: 'Thullur Mandalam',
            district: 'Guntur',
            pincode: '522238',
            latitude: '16.5131',
            longitude: '80.5165',
            notes: 'State Marketing Directorate, AP Agricultural Produce Market Committee (APMC) State Registry.',
          }}
          onSave={() => {
            // Persisted automatically to localStorage by MyAddressModal
          }}
        />
      )}
    </main>
  );
};
