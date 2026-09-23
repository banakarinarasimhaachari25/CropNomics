import React, { useState } from 'react';
import { INITIAL_REPORTED_ISSUES, INITIAL_REVIEWS, TRANSLATIONS } from '../data/mockData';
import { RoleWorkflowSection } from './RoleWorkflowSection';
import { LanguageCode, ReportedIssue, ReviewItem } from '../types';

interface HelpFeedbackScreenProps {
  language: LanguageCode;
  onOpenSupportModal: () => void;
}

export const HelpFeedbackScreen: React.FC<HelpFeedbackScreenProps> = ({
  language,
  onOpenSupportModal,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    // Add to reviews list
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: language === 'te' ? 'మీరు (ప్రస్తుత రైతు)' : 'You (AP Farmer)',
      role: 'Farmer',
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

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 pb-24 md:pb-12">
      {/* User Feedback Column (Left on Desktop, Top on Mobile) */}
      <section className="md:col-span-5 flex flex-col gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-surface-container-highest">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold mb-1">
            {t.provideFeedback}
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            {language === 'te'
              ? 'ఆంధ్రప్రదేశ్ వ్యవసాయ మార్కెట్ అనుభవాన్ని మెరుగుపరచడానికి మీ అభిప్రాయాన్ని తెలపండి.'
              : 'Help us improve the Andhra Pradesh agricultural market experience.'}
          </p>

          {feedbackSubmitted && (
            <div className="mb-5 p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>
                {language === 'te'
                  ? 'ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది మరియు అడ్మిన్‌కు పంపబడింది.'
                  : 'Thank you! Your feedback has been recorded and submitted to AP Market Admin.'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-5">
            {/* Rating Stars */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase font-medium">
                {t.overallExperience}
              </label>
              <div className="flex gap-2 text-secondary-container">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      id={`rating-star-${star}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    >
                      <span
                        className="material-symbols-outlined text-[36px]"
                        style={filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        star
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                id="feedback-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="peer w-full bg-surface-container border border-outline-variant rounded-lg px-4 pt-6 pb-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary appearance-none min-h-[56px] cursor-pointer"
              >
                <option value="market">AP MSP & Prices (ధరలు & మద్దతు ధర)</option>
                <option value="app">CropNomics Portal Performance (యాప్ పనితీరు)</option>
                <option value="support">Rythu Bharosa Helpline & Support (హెల్ప్‌లైన్)</option>
                <option value="logistics">Cold Storage & AP Transport (రవాణా)</option>
                <option value="other">Other / General Suggestions (ఇతర సూచనలు)</option>
              </select>
              <label
                htmlFor="feedback-category-select"
                className="absolute left-4 top-2 font-label-sm text-label-sm text-on-surface-variant uppercase font-medium pointer-events-none"
              >
                {t.feedbackCategory}
              </label>
              <span className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Text Area */}
            <div className="relative">
              <textarea
                id="feedback-details-textarea"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={language === 'te' ? 'మీ సూచన లేదా మార్కెట్ అనుభవాన్ని వివరించండి...' : 'Describe your suggestion, praise, or market issue...'}
                className="peer w-full bg-surface-container border border-outline-variant rounded-lg px-4 pt-7 pb-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary resize-none outline-none text-sm"
              />
              <label
                htmlFor="feedback-details-textarea"
                className="absolute left-4 top-2 font-label-sm text-label-sm text-on-surface-variant uppercase font-medium pointer-events-none"
              >
                {t.additionalDetails}
              </label>
            </div>

            <button
              id="btn-submit-user-feedback"
              type="submit"
              className="bg-primary text-on-primary font-bold py-3.5 px-6 rounded-full w-full hover:bg-primary-container transition-colors min-h-[48px] shadow-sm cursor-pointer active:scale-98"
            >
              {t.submitFeedback}
            </button>
          </form>
        </div>

        {/* Contact Support Trigger */}
        <div className="mt-auto">
          <button
            id="btn-open-contact-support"
            type="button"
            onClick={onOpenSupportModal}
            className="w-full border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-surface-container transition-colors min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
            <span>{t.contactSupport}</span>
          </button>
        </div>
      </section>

      {/* Admin Dashboard Column (Right on Desktop, Bottom on Mobile) */}
      <section className="md:col-span-7 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
            {t.adminOverview}
          </h2>
          <span className="text-xs font-mono bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface-variant font-bold">
            APAM Live Monitor
          </span>
        </div>

        {/* Quick Stats Bento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-surface-container-highest flex flex-col justify-center">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
              {t.avgRating}
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display-lg text-4xl font-black text-primary">{avgRating}</span>
              <span
                className="material-symbols-outlined text-secondary text-[32px] mb-1"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-1">From {reviews.length} AP verified reviews</span>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-surface-container-highest flex flex-col justify-center">
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
              {t.newIssues}
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display-lg text-4xl font-black text-error">
                {newIssuesCount}
              </span>
              <span className="text-error font-body-md text-sm font-semibold mb-1 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> +3
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-1">Resolution SLA: &lt; 4 Hours</span>
          </div>
        </div>

        {/* Role & Responsibility Workflow Prompt */}
        <RoleWorkflowSection language={language} />

        {/* Reported Issues List */}
        <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-surface-container-highest">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="font-body-lg text-body-lg font-bold text-primary">
              {t.reportedIssues}
            </h3>
            <div className="flex gap-1 text-xs">
              {(['All', 'New', 'In Progress', 'Fixed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setIssuesFilter(status)}
                  className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                    issuesFilter === status
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {filteredIssues.map((issue) => (
              <li
                key={issue.id}
                onClick={() => handleToggleIssueStatus(issue.id)}
                title="Click to toggle status (New -> In Progress -> Fixed)"
                className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-outline-variant/60 hover:border-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full flex items-center justify-center ${
                      issue.status === 'New'
                        ? 'bg-error-container text-on-error-container'
                        : issue.status === 'In Progress'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{issue.icon}</span>
                  </div>
                  <div>
                    <p className="font-body-md text-sm font-semibold text-on-surface">
                      {issue.title}
                    </p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                      {issue.category} • {issue.timeAgo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md font-label-sm text-[11px] font-bold ${
                      issue.status === 'New'
                        ? 'bg-error text-on-error'
                        : issue.status === 'In Progress'
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    {issue.status}
                  </span>
                  <span className="material-symbols-outlined text-outline text-[16px]">sync</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Reviews */}
        <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-surface-container-highest">
          <h3 className="font-body-lg text-body-lg font-bold text-primary mb-4">
            {t.recentReviews}
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 border border-outline-variant/40 rounded-xl bg-surface flex flex-col gap-2 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-1 text-secondary">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-[16px]"
                        style={s <= rev.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-label-sm text-[11px] font-bold ${
                      rev.role === 'Farmer'
                        ? 'bg-tertiary-container text-on-tertiary-container'
                        : rev.role === 'Trader'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {rev.role}
                  </span>
                </div>
                <p className="font-body-md text-sm text-on-surface italic">"{rev.comment}"</p>
                <div className="flex justify-between items-center text-xs text-on-surface-variant font-mono mt-1">
                  <span>{rev.date}</span>
                  <span className="font-bold">- {rev.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
