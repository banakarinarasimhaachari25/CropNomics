/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertsScreen } from './components/AlertsScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { BottomNav } from './components/BottomNav';
import { FrontSlideLanding } from './components/FrontSlideLanding';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import {
  ContactFarmerModal,
  MessageFarmerModal,
  PurchaseSuccessModal,
  SupportModal,
} from './components/Modals';
import { RetailerScreen } from './components/RetailerScreen';
import { TraderMarketScreen } from './components/TraderMarketScreen';
import { ConsumerStoreScreen } from './components/ConsumerStoreScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { LoginSignUpModal } from './components/LoginSignUpModal';
import { db } from './data/db';
import { AppScreen, FarmerListing, FarmerProfile, LanguageCode, UserRole } from './types';

export default function App() {
  // Screen & Navigation: Defaulting to 'welcome' front slide
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [role, setRole] = useState<UserRole>('farmer');
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState<boolean>(false);
  const [marketSubTab, setMarketSubTab] = useState<'trader' | 'retailer' | 'consumer'>('trader');
  const [language, setLanguage] = useState<LanguageCode>('te');

  // Farmer Profile State with initial AP defaults
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>(() => {
    const saved = localStorage.getItem('agrilink_profile_ap');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parse error
      }
    }
    return {
      fullName: 'రామేష్ వర్మ (Ramesh Varma)',
      mobile: '+91 98480 23456',
      location: 'Guntur, Andhra Pradesh',
      primaryCrop: 'paddy',
      basePricePerTon: 24500,
      harvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sowingDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cropDurationDays: 120,
      quantity: 25,
      unit: 'Ton (Metric)',
    };
  });

  // Save profile to local storage & central database on change
  useEffect(() => {
    localStorage.setItem('agrilink_profile_ap', JSON.stringify(farmerProfile));
    if (farmerProfile.fullName) {
      db.registerFarmer(farmerProfile);
    }
  }, [farmerProfile]);

  // Unread alerts count
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);

  // Modals state
  const [contactFarmerModal, setContactFarmerModal] = useState<FarmerListing | null>(null);
  const [messageFarmerModal, setMessageFarmerModal] = useState<FarmerListing | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState<{
    bags: number;
    totalAmount: number;
  } | null>(null);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'farmer') {
      setCurrentScreen('farmer');
    } else if (newRole === 'trader') {
      setCurrentScreen('trader');
    } else if (newRole === 'retailer') {
      setCurrentScreen('retailer');
    } else if (newRole === 'consumer') {
      setCurrentScreen('consumer');
    } else if (newRole === 'admin') {
      setCurrentScreen('admin');
    }
    const roleNames: Record<string, string> = {
      farmer: language === 'te' ? 'రైతు' : 'Farmer',
      trader: language === 'te' ? 'ట్రేడర్' : 'Trader',
      retailer: language === 'te' ? 'రిటైలర్' : 'Retailer',
      consumer: language === 'te' ? 'వినియోగదారుడు' : 'Consumer',
      admin: language === 'te' ? 'అడ్మిన్' : 'Admin',
    };
    showToast(`${roleNames[newRole]} మోడ్‌కి మార్చబడింది (${newRole.toUpperCase()})`);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-2.5 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border border-outline/30">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header with Ticker & Multi-Role Navigation (Hidden on Front Slide Landing) */}
      {currentScreen !== 'welcome' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          language={language}
          onLanguageChange={setLanguage}
          role={role}
          onRoleChange={handleRoleChange}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => {
            setCurrentScreen('alerts');
            setUnreadAlertsCount(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Screen 0: Front Slide Welcome & Login Gateway (Who we are, how to login, logo, govt alerts, about website) */}
        {currentScreen === 'welcome' && (
          <FrontSlideLanding
            language={language}
            onLanguageChange={setLanguage}
            farmerProfile={farmerProfile}
            onUpdateFarmerProfile={setFarmerProfile}
            onLoginSuccess={(chosenRole, userDetails) => {
              setRole(chosenRole);
              if (chosenRole === 'farmer') {
                setCurrentScreen('farmer');
              } else if (chosenRole === 'trader') {
                setCurrentScreen('trader');
              } else if (chosenRole === 'retailer') {
                setCurrentScreen('retailer');
              } else if (chosenRole === 'consumer') {
                setCurrentScreen('consumer');
              } else if (chosenRole === 'admin') {
                setCurrentScreen('admin');
              }
              const roleLabels: Record<string, string> = {
                farmer: language === 'te' ? 'రైతు' : 'Farmer',
                trader: language === 'te' ? 'ట్రేడర్' : 'Trader',
                retailer: language === 'te' ? 'రిటైలర్' : 'Retailer',
                consumer: language === 'te' ? 'వినియోగదారుడు' : 'Consumer',
                admin: language === 'te' ? 'అడ్మిన్' : 'Admin',
              };
              showToast(
                language === 'te'
                  ? `స్వాగతం ${userDetails.name}! ${roleLabels[chosenRole]} డాష్‌బోర్డ్‌కి లాగిన్ అయ్యారు.`
                  : `Welcome ${userDetails.name}! Logged in to ${roleLabels[chosenRole]} dashboard.`
              );
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Screen 1: Independent Farmer Dashboard */}
        {(currentScreen === 'home' || currentScreen === 'farmer') && (
          <HomeScreen
            profile={farmerProfile}
            onUpdateProfile={setFarmerProfile}
            onProceedToAnalysis={() => {
              setCurrentScreen('analysis');
              showToast(
                language === 'te'
                  ? 'రైతు ప్రొఫైల్ మరియు పంట వివరాలు విజయవంతంగా నమోదయ్యాయి!'
                  : 'Profile and crop details registered successfully!'
              );
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToDashboard={(screen) => {
              if (screen === 'admin' || screen === 'farmer' || screen === 'trader' || screen === 'retailer' || screen === 'consumer') {
                setRole(screen);
              }
              setCurrentScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            language={language}
          />
        )}

        {/* Screen 2: Independent Trader Dashboard */}
        {currentScreen === 'trader' && (
          <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <TraderMarketScreen
              language={language}
              onContactFarmer={(farmer) => setContactFarmerModal(farmer)}
              onSendMessage={(farmer) => setMessageFarmerModal(farmer)}
              onNavigateToDashboard={(screen) => {
                setCurrentScreen(screen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </main>
        )}

        {/* Screen 3: Independent Retailer Dashboard */}
        {currentScreen === 'retailer' && (
          <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <RetailerScreen
              language={language}
              onCallTrader={(name, phone) => {
                setContactFarmerModal({
                  id: 'trader-ap-1',
                  farmerName: name,
                  phone: phone,
                  cropName: 'Tomatoes (టమోటా)',
                  variety: 'Madanapalle Hybrid Grade A+',
                  grade: 'Grade A+',
                  tons: 2.5,
                  distanceMiles: 15,
                  location: 'Madanapalle Market Yard, AP',
                  estPriceTotal: 28000,
                  pricePerTon: 11200,
                  moistureContent: 'Fresh AP Harvest',
                  description: 'Direct wholesale distributor from Madanapalle Tomato Yard.',
                  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
                  verified: true,
                });
              }}
              onConfirmPurchase={(bags, total) => {
                setPurchaseSuccessData({ bags, totalAmount: total });
              }}
              onNavigateToDashboard={(screen) => {
                setCurrentScreen(screen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </main>
        )}

        {/* Screen 4: Independent Consumer Store */}
        {currentScreen === 'consumer' && (
          <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <ConsumerStoreScreen
              language={language}
              onNavigateToRetailer={() => {
                setCurrentScreen('retailer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToDashboard={(screen) => {
                setCurrentScreen(screen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </main>
        )}

        {/* Screen 5: Independent Admin Dashboard (Strict RBAC Protected) */}
        {(currentScreen === 'admin' || currentScreen === 'help') && (
          <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            {role !== 'admin' ? (
              <div id="admin-access-denied-view" className="p-8 max-w-xl mx-auto my-12 bg-red-50 dark:bg-red-950/60 border-2 border-red-500 rounded-3xl text-center shadow-xl space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-4xl">gpp_bad</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-300">
                  Access Denied: Insufficient Permissions
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'te'
                    ? 'ఈ విభాగం APMC అడ్మినిస్ట్రేటర్లు మరియు కమిటీ అధికారులకు మాత్రమే కేటాయించబడింది. మీ ప్రస్తుత ప్రొఫైల్ పాత్రతో ఈ డాష్‌బోర్డ్‌ను యాక్సెస్ చేయడానికి మీకు అనుమతి లేదు.'
                    : 'The Admin / Committee Dashboard is strictly protected for verified APAM Officers. Your current user profile does not possess the required administrator clearance.'}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    id="btn-return-home"
                    onClick={() => {
                      setCurrentScreen('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    {language === 'te' ? 'హోమ్ పేజీకి తిరిగి వెళ్లండి' : 'Back to Home'}
                  </button>
                  <button
                    type="button"
                    id="btn-admin-reauth"
                    onClick={() => {
                      setAdminAuthModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                  >
                    {language === 'te' ? 'అడ్మిన్ లాగిన్ చేయండి' : 'Admin Login (admin@cropnomics.gov)'}
                  </button>
                </div>
              </div>
            ) : (
              <AdminDashboardScreen
                language={language}
                onOpenSupportModal={() => setSupportModalOpen(true)}
                onNavigateToDashboard={(screen) => {
                  setCurrentScreen(screen);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        )}

        {/* Screen 6: Crop Analysis, Profit Journey, & OTP */}
        {currentScreen === 'analysis' && (
          <AnalysisScreen
            profile={farmerProfile}
            onBack={() => {
              setCurrentScreen('farmer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToMarket={() => {
              setCurrentScreen('farmer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            language={language}
            onListingCreated={() => {
              showToast('you have successfully registered your crop in ap crop market');
              setCurrentScreen('farmer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Screen 7: General Market View (allows quick tab hopping if accessed via /market) */}
        {currentScreen === 'market' && (
          <main className="flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
                <div>
                  <h1 className="font-headline-lg-mobile text-2xl font-black text-on-surface">
                    {marketSubTab === 'trader'
                      ? (language === 'te' ? 'ట్రేడర్ సోర్సింగ్ డాష్‌బోర్డ్' : 'Trader Sourcing Dashboard')
                      : marketSubTab === 'retailer'
                      ? (language === 'te' ? 'రిటైలర్ హోల్‌సేల్ లాట్లు' : 'Retailer Available Lots')
                      : (language === 'te' ? 'వినియోగదారుల స్టోర్' : 'Consumer Store')}
                  </h1>
                  <p className="text-xs text-on-surface-variant">
                    {marketSubTab === 'trader'
                      ? (language === 'te' ? 'ప్రత్యక్ష AP రైతుల జాబితా, తేమ శాతం విశ్లేషణ మరియు మార్జిన్ నియంత్రణ' : 'Direct AP farmer listings with moisture analysis & margin controls')
                      : marketSubTab === 'retailer'
                      ? (language === 'te' ? 'పారదర్శక సప్లై చైన్ మార్కప్‌తో హోల్‌సేల్ బ్యాచ్ కొనుగోలు' : 'Wholesale batch purchasing with transparent supply chain markup')
                      : (language === 'te' ? 'తాజా కూరగాయలు మరియు కిరాణా సామాగ్రి' : 'Direct farm fresh produce and groceries')}
                  </p>
                </div>
              </div>

              {/* View Switcher Pills */}
              <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/60">
                <button
                  id="tab-btn-trader"
                  onClick={() => setMarketSubTab('trader')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    marketSubTab === 'trader'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>{language === 'te' ? 'ట్రేడర్ సోర్సింగ్' : 'Trader Sourcing'}</span>
                </button>
                <button
                  id="tab-btn-retailer"
                  onClick={() => setMarketSubTab('retailer')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    marketSubTab === 'retailer'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>{language === 'te' ? 'రిటైలర్ లాట్లు' : 'Retailer Lots'}</span>
                </button>
                <button
                  id="tab-btn-consumer"
                  onClick={() => setMarketSubTab('consumer')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    marketSubTab === 'consumer'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">shopping_basket</span>
                  <span>{language === 'te' ? 'వినియోగదారుల స్టోర్' : 'Consumer Store'}</span>
                </button>
              </div>
            </div>

            {marketSubTab === 'trader' ? (
              <TraderMarketScreen
                language={language}
                onContactFarmer={(farmer) => setContactFarmerModal(farmer)}
                onSendMessage={(farmer) => setMessageFarmerModal(farmer)}
                onNavigateToDashboard={(screen) => setCurrentScreen(screen)}
              />
            ) : marketSubTab === 'retailer' ? (
              <RetailerScreen
                language={language}
                onCallTrader={(name, phone) => {
                  setContactFarmerModal({
                    id: 'trader-ap-1',
                    farmerName: name,
                    phone: phone,
                    cropName: 'Tomatoes (టమోటా)',
                    variety: 'Madanapalle Hybrid Grade A+',
                    grade: 'Grade A+',
                    tons: 2.5,
                    distanceMiles: 15,
                    location: 'Madanapalle Market Yard, AP',
                    estPriceTotal: 28000,
                    pricePerTon: 11200,
                    moistureContent: 'Fresh AP Harvest',
                    description: 'Direct wholesale distributor from Madanapalle Tomato Yard.',
                    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
                    verified: true,
                  });
                }}
                onConfirmPurchase={(bags, total) => {
                  setPurchaseSuccessData({ bags, totalAmount: total });
                }}
                onNavigateToDashboard={(screen) => setCurrentScreen(screen)}
              />
            ) : (
              <ConsumerStoreScreen
                language={language}
                onNavigateToRetailer={() => setMarketSubTab('retailer')}
                onNavigateToDashboard={(screen) => setCurrentScreen(screen)}
              />
            )}
          </main>
        )}

        {/* Screen 8: Alerts & Government Subsidies */}
        {currentScreen === 'alerts' && <AlertsScreen language={language} />}
      </div>

      {/* Interactive Modals */}
      <ContactFarmerModal
        farmer={contactFarmerModal}
        traderIdentity={(() => {
          try {
            return JSON.parse(localStorage.getItem('cropnomics_trader_identity') || 'null');
          } catch {
            return null;
          }
        })()}
        onClose={() => setContactFarmerModal(null)}
      />

      <MessageFarmerModal
        farmer={messageFarmerModal}
        onClose={() => setMessageFarmerModal(null)}
      />

      {supportModalOpen && (
        <SupportModal onClose={() => setSupportModalOpen(false)} />
      )}

      {purchaseSuccessData && (
        <PurchaseSuccessModal
          bags={purchaseSuccessData.bags}
          totalAmount={purchaseSuccessData.totalAmount}
          onClose={() => setPurchaseSuccessData(null)}
        />
      )}

      {/* Admin Re-Authentication Modal */}
      {adminAuthModalOpen && (
        <LoginSignUpModal
          isOpen={adminAuthModalOpen}
          targetRole="admin"
          language={language}
          onClose={() => setAdminAuthModalOpen(false)}
          onSuccess={(chosenRole, userDetails) => {
            setAdminAuthModalOpen(false);
            setRole(chosenRole);
            setCurrentScreen(chosenRole as AppScreen);
            showToast(
              language === 'te'
                ? `స్వాగతం ${userDetails.name}! అడ్మిన్ డాష్‌బోర్డ్‌కి లాగిన్ అయ్యారు.`
                : `Welcome ${userDetails.name}! Verified admin access granted.`
            );
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadAlertsCount={unreadAlertsCount}
        language={language}
      />
    </div>
  );
}
