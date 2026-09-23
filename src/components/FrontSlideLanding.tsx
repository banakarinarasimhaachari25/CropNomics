import React, { useState, useEffect } from 'react';
import { CropNomicsLogo } from './CropNomicsLogo';
import { GOVERNMENT_ALERTS, TRANSLATIONS } from '../data/mockData';
import { db } from '../data/db';
import { FarmerProfile, GovernmentAlert, LanguageCode, UserRole, FarmerCardDetails } from '../types';
import { FarmerCardAuthModal } from './FarmerCardAuthModal';
import { LoginSignUpModal } from './LoginSignUpModal';

interface FrontSlideLandingProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onLoginSuccess: (role: UserRole, userDetails: { name: string; phone: string }) => void;
  farmerProfile: FarmerProfile;
  onUpdateFarmerProfile: (profile: FarmerProfile) => void;
}

export const FrontSlideLanding: React.FC<FrontSlideLandingProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
  farmerProfile,
  onUpdateFarmerProfile,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Selected Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Input states - just name and phone number as requested
  const [userName, setUserName] = useState<string>(() => {
    if (farmerProfile.fullName) return farmerProfile.fullName;
    if (language === 'te') return 'రామేష్ వర్మ (Ramesh Varma)';
    if (language === 'hi') return 'रमेश वर्मा (Ramesh Varma)';
    return 'Ramesh Varma';
  });
  const [userPhone, setUserPhone] = useState<string>(farmerProfile.mobile || '+91 98480 23456');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showKisanCardModal, setShowKisanCardModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (
    role: UserRole,
    userDetails: { name: string; phone: string; username?: string; isNewAccount: boolean }
  ) => {
    setShowAuthModal(false);

    if (role === 'farmer') {
      const updated = {
        ...farmerProfile,
        fullName: userDetails.name || farmerProfile.fullName,
        mobile: userDetails.phone || farmerProfile.mobile,
      };
      onUpdateFarmerProfile(updated);
      db.registerFarmer(updated);
    }

    onLoginSuccess(role, { name: userDetails.name, phone: userDetails.phone });
  };

  // Live Government Notifications & Bulletins Feed (Direct RSS-to-JSON with multi-tier failover)
  const RSS2JSON_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
    'https://news.google.com/rss/search?q=Andhra+Pradesh+agriculture+farming&hl=en-IN&gl=IN&ceid=IN:en'
  )}`;

  const [selectedAlert, setSelectedAlert] = useState<GovernmentAlert | null>(null);
  const [activeAlertCategory, setActiveAlertCategory] = useState<string>('ALL');
  const [newsAlerts, setNewsAlerts] = useState<GovernmentAlert[]>(GOVERNMENT_ALERTS);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const categorizeNews = (title: string): GovernmentAlert['category'] => {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes('subsidy') ||
      titleLower.includes('msp') ||
      titleLower.includes('scheme') ||
      titleLower.includes('bharosa') ||
      titleLower.includes('procurement') ||
      titleLower.includes('yojana') ||
      titleLower.includes('budget')
    ) {
      return 'SUBSIDY';
    } else if (
      titleLower.includes('rain') ||
      titleLower.includes('weather') ||
      titleLower.includes('cyclone') ||
      titleLower.includes('monsoon') ||
      titleLower.includes('flood') ||
      titleLower.includes('climate') ||
      titleLower.includes('drought')
    ) {
      return 'WEATHER';
    } else if (
      titleLower.includes('grant') ||
      titleLower.includes('loan') ||
      titleLower.includes('credit') ||
      titleLower.includes('fund') ||
      titleLower.includes('incentive') ||
      titleLower.includes('prize')
    ) {
      return 'GRANT';
    } else if (
      titleLower.includes('tariff') ||
      titleLower.includes('tax') ||
      titleLower.includes('duty') ||
      titleLower.includes('cess') ||
      titleLower.includes('export')
    ) {
      return 'TARIFF';
    }
    return 'MARKET';
  };

  const fetchLiveNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    let loadedAlerts: GovernmentAlert[] = [];

    // Attempt 1: Primary CORS-enabled RSS2JSON service for live AP agriculture news
    try {
      const response = await fetch(RSS2JSON_ENDPOINT, { cache: 'no-cache' });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
          loadedAlerts = data.items.slice(0, 8).map((item: any, idx: number) => {
            const rawTitle = item.title || 'AP Agriculture Live News';
            const rawLink = item.link || '#';
            const strippedText = stripHtml(item.description || item.content || '');
            const shortSnippet =
              strippedText.length > 175
                ? strippedText.substring(0, 172) + '...'
                : strippedText || rawTitle;
            const category = categorizeNews(rawTitle);

            let effectiveDate = 'Live Now';
            if (item.pubDate) {
              try {
                const pub = new Date(item.pubDate);
                if (!isNaN(pub.getTime())) {
                  effectiveDate = pub.toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              } catch {
                effectiveDate = 'Live Now';
              }
            }

            return {
              id: `live-alert-${idx}-${Date.now()}`,
              title: rawTitle,
              description: shortSnippet,
              sourceUrl: rawLink,
              category,
              summary: shortSnippet,
              fullDetails: strippedText || rawTitle,
              effectiveDate,
              read: false,
            };
          });
        }
      }
    } catch (err) {
      console.warn('Primary RSS2JSON service encounter issue, trying secondary proxy:', err);
    }

    // Attempt 2: If primary failed, try local /api/live-agri-rss Vite proxy
    if (loadedAlerts.length === 0) {
      try {
        const response = await fetch('/api/live-agri-rss');
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim()) {
            const parser = new window.DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            const items = Array.from(xmlDoc.querySelectorAll('item'));
            if (items.length > 0) {
              loadedAlerts = items.slice(0, 8).map((item, idx) => {
                const rawTitle = item.querySelector('title')?.textContent?.trim() || 'AP Agriculture Live News';
                const rawLink = item.querySelector('link')?.textContent?.trim() || '#';
                const rawDescription = item.querySelector('description')?.textContent?.trim() || '';
                const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
                const strippedText = stripHtml(rawDescription);
                const shortSnippet =
                  strippedText.length > 175
                    ? strippedText.substring(0, 172) + '...'
                    : strippedText || rawTitle;
                const category = categorizeNews(rawTitle);

                let effectiveDate = 'Live Now';
                if (pubDate) {
                  try {
                    const pub = new Date(pubDate);
                    if (!isNaN(pub.getTime())) {
                      effectiveDate = pub.toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                  } catch {
                    effectiveDate = 'Live Now';
                  }
                }

                return {
                  id: `live-alert-xml-${idx}-${Date.now()}`,
                  title: rawTitle,
                  description: shortSnippet,
                  sourceUrl: rawLink,
                  category,
                  summary: shortSnippet,
                  fullDetails: strippedText || rawTitle,
                  effectiveDate,
                  read: false,
                };
              });
            }
          }
        }
      } catch (err) {
        console.warn('Vite proxy RSS unavailable, falling back to verified AP bulletins:', err);
      }
    }

    // Safe Resilience: Fallback to verified official AP Government Bulletins
    if (loadedAlerts.length === 0) {
      loadedAlerts = GOVERNMENT_ALERTS;
    }

    setNewsAlerts(loadedAlerts);
    setNewsError(null);
    setLastRefreshedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsLoadingNews(false);
  };

  useEffect(() => {
    fetchLiveNews();

    // Refresh every 3 minutes
    const pollInterval = setInterval(fetchLiveNews, 3 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Handle Kisan Card Authentication Success (Requirement 8)
  const handleFarmerCardSuccess = (profile: FarmerProfile, card: FarmerCardDetails) => {
    const updated = {
      ...profile,
      fullName: profile.fullName || userName.trim(),
      mobile: profile.mobile || userPhone.trim(),
      farmerCard: card,
    };
    onUpdateFarmerProfile(updated);
    db.registerFarmer(updated);
    setShowKisanCardModal(false);
    onLoginSuccess('farmer', { name: updated.fullName, phone: updated.mobile });
  };

  // Handle Login Submit
  const handlePerformLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!userName.trim()) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి'
          : language === 'hi'
          ? 'कृपया अपना पूरा नाम दर्ज करें'
          : 'Please enter your name'
      );
      return;
    }

    if (!userPhone.trim() || userPhone.trim().length < 8) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి సరైన ఫోన్ నంబర్ నమోదు చేయండి'
          : language === 'hi'
          ? 'कृपया एक मान्य फ़ोन नंबर दर्ज करें'
          : 'Please enter a valid phone number'
      );
      return;
    }

    // User Requirement 8: When we press Enter the farmer dashboard we need to get kissan card login
    if (selectedRole === 'farmer') {
      setShowKisanCardModal(true);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Update local and database profile based on role
      if (selectedRole === 'farmer') {
        const updated = {
          ...farmerProfile,
          fullName: userName.trim(),
          mobile: userPhone.trim(),
        };
        onUpdateFarmerProfile(updated);
        db.registerFarmer(updated);
      } else if (selectedRole === 'trader') {
        db.registerTrader(
          {
            name: userName.trim(),
            phoneNumber: userPhone.trim(),
            tradingFirm: `${userName.trim()} Agro Trading Co.`,
            district: 'Guntur',
          },
          {
            cropId: 'Paddy (వరి)',
            district: 'Guntur',
            minQuantityTons: 20,
            maxPricePerTon: 50000,
            qualityGrade: 'Grade A',
          }
        );
      } else if (selectedRole === 'retailer') {
        db.registerRetailer({
          name: userName.trim(),
          phoneNumber: userPhone.trim(),
          shopName: `${userName.trim()} Fresh Mart`,
          district: 'Vijayawada',
        });
      } else if (selectedRole === 'consumer') {
        // Consumer login registered
      }

      setIsSubmitting(false);
      onLoginSuccess(selectedRole, { name: userName.trim(), phone: userPhone.trim() });
    }, 350);
  };

  // Role Configuration Cards
  const roleCards = [
    {
      id: 'farmer' as UserRole,
      title:
        language === 'te'
          ? 'రైతు (Farmer)'
          : language === 'hi'
          ? 'किसान (Farmer)'
          : 'Farmer',
      subtitle:
        language === 'te'
          ? 'అన్నదాత / పంట సాగుదారు'
          : language === 'hi'
          ? 'अन्नदाता / फसल उत्पादक'
          : 'Cultivator & Farm Producer',
      tagline:
        language === 'te'
          ? 'పంట నమోదు, తాజాదనం విశ్లేషణ & గిట్టుబాటు ధర'
          : language === 'hi'
          ? 'फसल प्रविष्टि, कटाई उपरांत ताजगी एवं पारदर्शी लाभकारी मूल्य'
          : 'Crop entry, harvest lifespan & direct fair pricing',
      icon: 'agriculture',
      color: 'from-emerald-700 to-green-900',
      activeBorder: 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/30',
      defaultName:
        language === 'te'
          ? 'రామేష్ వర్మ (Ramesh Varma)'
          : language === 'hi'
          ? 'रमेश वर्मा (Ramesh Varma)'
          : 'Ramesh Varma',
      defaultPhone: '+91 98480 23456',
    },
    {
      id: 'trader' as UserRole,
      title:
        language === 'te'
          ? 'ట్రేడర్ (Trader)'
          : language === 'hi'
          ? 'व्यापारी (Trader / Bulk Buyer)'
          : 'Trader / Bulk Buyer',
      subtitle:
        language === 'te'
          ? 'కమిషన్ రహిత టోకు కొనుగోలుదారు'
          : language === 'hi'
          ? 'बिचौलिया-मुक्त थोक खरीदार'
          : 'Commission-Free Bulk Buyer',
      tagline:
        language === 'te'
          ? 'రైతుల నుండి ప్రత్యక్ష సేకరణ & లాజిస్టిక్స్'
          : language === 'hi'
          ? 'किसानों से सीधी खरीद, परिवहन प्रबंधन एवं पारदर्शी मार्जिन'
          : 'Direct bulk farmer sourcing & transparent margins',
      icon: 'local_shipping',
      color: 'from-amber-700 to-orange-900',
      activeBorder: 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/30',
      defaultName:
        language === 'te'
          ? 'వెంకటేశ్వర రావు (Venkateswara Rao)'
          : language === 'hi'
          ? 'वेंकटेश्वर राव (Venkateswara Rao)'
          : 'Venkateswara Rao',
      defaultPhone: '+91 98482 77889',
    },
    {
      id: 'retailer' as UserRole,
      title:
        language === 'te'
          ? 'రిటైలర్ (Retailer)'
          : language === 'hi'
          ? 'खुदरा विक्रेता (Retailer / Store)'
          : 'Retailer / Store',
      subtitle:
        language === 'te'
          ? 'సూపర్ మార్కెట్ & కిరాణా వ్యాపారి'
          : language === 'hi'
          ? 'सुपरमार्केट, किराना एवं स्टोर'
          : 'Supermarket & Kirana Store',
      tagline:
        language === 'te'
          ? 'రెడీ బ్యాగుల కొనుగోలు & వినియోగదారునికి మార్కప్'
          : language === 'hi'
          ? 'मानकीकृत बोरियों की खरीद, उपभोक्ता मार्कअप एवं त्वरित डिलीवरी'
          : 'Pre-graded bags, consumer markup & instant orders',
      icon: 'storefront',
      color: 'from-teal-700 to-cyan-900',
      activeBorder: 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/30',
      defaultName:
        language === 'te'
          ? 'శ్రీనివాస్ కుమార్ (Srinivas Kumar)'
          : language === 'hi'
          ? 'श्रीनिवास कुमार (Srinivas Kumar)'
          : 'Srinivas Kumar',
      defaultPhone: '+91 98485 11223',
    },
    {
      id: 'consumer' as UserRole,
      title:
        language === 'te'
          ? 'వినియోగదారుడు (Consumer)'
          : language === 'hi'
          ? 'उपभोक्ता (Consumer / Household)'
          : 'Consumer / Household',
      subtitle:
        language === 'te'
          ? 'తాజా వ్యవసాయ ఉత్పత్తుల కొనుగోలుదారు'
          : language === 'hi'
          ? 'ताजा कृषि उपज एवं सीधी रसोई आपूर्ति'
          : 'Direct Fresh Farm & Grocery Buyer',
      tagline:
        language === 'te'
          ? 'రిటైలర్ల ద్వారా తాజా కూరగాయలు & పప్పుధాన్యాల ఆర్డర్'
          : language === 'hi'
          ? 'खुदरा विक्रेताओं से सत्यापित ताजा सब्जियों और खाद्यान्नों का सीधा ऑर्डर'
          : 'Order farm-fresh vegetables, pulses & grains delivered',
      icon: 'shopping_basket',
      color: 'from-blue-700 to-indigo-900',
      activeBorder: 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30',
      defaultName:
        language === 'te'
          ? 'లక్ష్మి దేవి (Lakshmi Devi)'
          : language === 'hi'
          ? 'लक्ष्मी देवी (Lakshmi Devi)'
          : 'Lakshmi Devi',
      defaultPhone: '+91 98489 44321',
    },
    {
      id: 'admin' as UserRole,
      title:
        language === 'te'
          ? 'అడ్మిన్ (Admin)'
          : language === 'hi'
          ? 'प्रशासक (Admin / Committee)'
          : 'Admin / Committee',
      subtitle:
        language === 'te'
          ? 'AP వ్యవసాయ కమిటీ & సమస్యల పరిష్కారం'
          : language === 'hi'
          ? 'कृषि विपणन समिति एवं शिकायत निवारण'
          : 'Agricultural Committee & Governance',
      tagline:
        language === 'te'
          ? 'మార్కెట్ పర్యవేక్షణ, SLA గడువులు & ఫిర్యాదులు'
          : language === 'hi'
          ? 'मंडी निगरानी, विवाद समाधान एवं एसएलए अनुपालन'
          : 'Market surveillance, SLA oversight & governance',
      icon: 'admin_panel_settings',
      color: 'from-slate-700 to-slate-900',
      activeBorder: 'border-slate-700 bg-slate-100 ring-2 ring-slate-400/40',
      defaultName:
        language === 'te'
          ? 'APAM Officer (మార్కెట్ ఆఫీసర్)'
          : language === 'hi'
          ? 'APAM अधिकारी (मार्केट ऑफिसर)'
          : 'APAM Officer (Market Officer)',
      defaultPhone: '+91 94401 88990',
    },
  ];

  // Helper for translating alert content to Hindi/Telugu
  const getLocalizedAlert = (alert: GovernmentAlert) => {
    if (language === 'hi') {
      const hiMap: Record<string, { title: string; description: string; summary: string; fullDetails: string; effectiveDate: string }> = {
        'alert-1': {
          title: 'आंध्र प्रदेश सरकार अपडेट: धान का न्यूनतम समर्थन मूल्य (MSP) ₹2,300/क्विंटल अधिसूचित',
          description: 'आंध्र प्रदेश नागरिक आपूर्ति विभाग द्वारा 2,000+ आरबीके (RBK) केंद्रों पर धान की सीधी खरीद शुरू की गई।',
          summary: 'आंध्र प्रदेश नागरिक आपूर्ति विभाग ने सभी जिलों के 2,000+ रायथू भरोसा केंद्रों (RBKs) पर सीधी खरीद शुरू कर दी है।',
          fullDetails: 'ग्रेड A धान का MSP ₹2,320/क्विंटल और सामान्य किस्म का ₹2,300/क्विंटल निर्धारित किया गया है। इलेक्ट्रॉनिक नमी प्रमाणन के 48 घंटों के भीतर प्रत्यक्ष बैंक हस्तांतरण (DBT) की गारंटी है।',
          effectiveDate: 'वर्तमान में सक्रिय',
        },
        'alert-2': {
          title: 'गुंटूर मिर्च यार्ड: प्रत्यक्ष इलेक्ट्रॉनिक व्यापार पर शून्य मंडी शुल्क',
          description: 'क्रॉपनॉमिक्स के माध्यम से सीधे किसान-व्यापारी अनुबंधों पर 1% मंडी उपकर पूरी तरह से माफ।',
          summary: 'CropNomics के माध्यम से पंजीकृत किसान-से-व्यापारी प्रत्यक्ष अनुबंधों पर पूर्ण मंडी शुल्क छूट उपलब्ध है।',
          fullDetails: 'आंध्र प्रदेश कृषि विपणन विभाग ने एकीकृत पोर्टल के माध्यम से सत्यापित डिजिटल लेनदेन के लिए 1% मंडी शुल्क पूरी तरह से माफ कर दिया है।',
          effectiveDate: 'खरीफ और रबी फसलों के लिए मान्य',
        },
        'alert-3': {
          title: 'सूक्ष्म सिंचाई अनुदान: ड्रिप एवं स्प्रिंकलर सेट पर 90% तक सब्सिडी',
          description: 'रायलसीमा और सूखा प्रवण क्षेत्रों के किसानों के लिए 90% सब्सिडी वाली आधुनिक ड्रिप सिंचाई इकाइयां।',
          summary: 'रायलसीमा और प्रकाशम जिलों के छोटे एवं सीमांत किसान 90% सब्सिडी वाली ड्रिप इकाइयों के लिए आवेदन कर सकते हैं।',
          fullDetails: 'अपने स्थानीय आरबीके (RBK) पर अपना 1बी अदंगल और आधार सत्यापन जमा करें या क्रॉपनॉमिक्स के माध्यम से 7 कार्य दिवसों में मंजूरी आदेश प्राप्त करें।',
          effectiveDate: 'आवेदन खुले हैं',
        },
        'alert-4': {
          title: 'मौसम अलर्ट: गोदावरी और कृष्णा डेल्टा में तटीय वर्षा की चेतावनी',
          description: 'मौसम विभाग द्वारा अगले 48 घंटों में भारी तटीय वर्षा की चेतावनी जारी की गई है।',
          summary: 'अगले 48 घंटों में मध्यम से भारी वर्षा का अनुमान है। खलिहानों में कटी हुई फसलों को सुरक्षित रखें।',
          fullDetails: 'किसानों और व्यापारियों को सलाह दी जाती है कि वे खुले में रखे अनाज को तिरपाल से ढकें या राज्य वेयरहाउसिंग साइलो में स्थानांतरित करें।',
          effectiveDate: 'अगले 48 घंटे',
        },
      };
      const hi = hiMap[alert.id];
      if (hi) {
        return {
          ...alert,
          title: hi.title,
          description: hi.description,
          summary: hi.summary,
          fullDetails: hi.fullDetails,
          effectiveDate: hi.effectiveDate,
        };
      }
    } else if (language === 'te') {
      const teMap: Record<string, { title: string; description: string; summary: string; fullDetails: string; effectiveDate: string }> = {
        'alert-1': {
          title: 'AP ప్రభుత్వ ప్రకటన: ధాన్యం కనీస మద్దతు ధర (MSP) ₹2,300/క్వింటాళ్ ఖరారు',
          description: 'అన్ని జిల్లాల్లోని 2,000+ రైతు భరోసా కేంద్రాల్లో (RBKs) పౌర సరఫరాల శాఖ ప్రత్యక్ష కొనుగోలు ప్రారంభించింది.',
          summary: 'అన్ని జిల్లాల్లోని 2,000+ రైతు భరోసా కేంద్రాల్లో పౌర సరఫరాల శాఖ ప్రత్యక్ష కొనుగోలు ప్రారంభించింది.',
          fullDetails: 'గ్రేడ్-ఎ ధాన్యానికి ₹2,320 మరియు సాధారణ రకానికి ₹2,300 కనీస మద్దతు ధర. తేమ పరీక్షల అనంతరం 48 గంటల్లో రైతు ఖాతాల్లోకి నేరుగా నగదు జమ.',
          effectiveDate: 'ప్రస్తుతం అమలులో ఉంది',
        },
        'alert-2': {
          title: 'గుంటూరు మిర్చి యార్డ్: డైరెక్ట్ ఎలక్ట్రానిక్ ట్రేడ్‌లపై జీరో మార్కెట్ ఫీజు',
          description: 'CropNomics ద్వారా నమోదైన ప్రత్యక్ష రైతు-వ్యాపారి ఒప్పందాలకు 1% మార్కెట్ ఫీజు పూర్తిగా మినహాయింపు.',
          summary: 'డిజిటల్ పోర్టల్ ద్వారా జరిగే ప్రత్యక్ష అమ్మకాలపై మార్కెట్ సెస్ పూర్తిగా మినహాయింపు.',
          fullDetails: 'ఆంధ్రప్రదేశ్ వ్యవసాయ మార్కెటింగ్ శాఖ ధృవీకరించిన డిజిటల్ లావాదేవీలపై 1% మార్కెట్ ఫీజును రద్దు చేసింది.',
          effectiveDate: 'ఖరీఫ్ & రబీ సీజన్లకు వర్తిస్తుంది',
        },
        'alert-3': {
          title: 'AP సూక్ష్మ సేద్యం గ్రాంట్: డ్రిప్ & స్ప్రింక్లర్ సెట్లపై 90% వరకు రాయితీ',
          description: 'రాయలసీమ & ప్రకాశం జిల్లాల చిన్న, సన్నకారు రైతులకు 90% సబ్సిడీతో డ్రిప్ యూనిట్లు మంజూరు.',
          summary: 'రాయలసీమ మరియు ప్రకాశం జిల్లాల చిన్న రైతులకు 90% సబ్సిడీ మైక్రో-ఇరిగేషన్ యూనిట్లు.',
          fullDetails: 'స్థానిక RBK లేదా CropNomics ద్వారా దరఖాస్తు చేసుకున్న 7 రోజుల్లో ప్రి-సాంక్షన్ ఆర్డర్లు పొందండి.',
          effectiveDate: 'దరఖాస్తులు స్వీకరించబడుతున్నాయి',
        },
        'alert-4': {
          title: 'IMD ఆంధ్ర వాతావరణ హెచ్చరిక: గోదావరి & కృష్ణా డెల్టాలో వర్ష సూచన',
          description: 'రాబోయే 48 గంటల్లో తీరప్రాంతాల్లో మోస్తరు నుండి భారీ వర్షాలు కురిసే అవకాశం ఉన్నట్లు వాతావరణ శాఖ హెచ్చరిక.',
          summary: 'తీరప్రాంత జిల్లాల్లో 48 గంటల పాటు వర్ష సూచన. ధాన్యం నిల్వలను సురక్షిత ప్రాంతాలకు తరలించండి.',
          fullDetails: 'కల్లాల్లో ఉన్న ధాన్యం, మిర్చి మరియు ఉద్యాన పంటలను తడవకుండా టార్పాలిన్లతో కప్పాలని రైతులకు సూచన.',
          effectiveDate: 'రాబోయే 48 గంటలు',
        },
      };
      const te = teMap[alert.id];
      if (te) {
        return {
          ...alert,
          title: te.title,
          description: te.description,
          summary: te.summary,
          fullDetails: te.fullDetails,
          effectiveDate: te.effectiveDate,
        };
      }
    }
    return alert;
  };

  const filteredAlerts = (
    activeAlertCategory === 'ALL'
      ? newsAlerts
      : newsAlerts.filter((a) => a.category === activeAlertCategory)
  ).map(getLocalizedAlert);

  const selectedRoleObj = roleCards.find((r) => r.id === selectedRole) || roleCards[0];

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#34d399] selection:text-[#064e3b]">
      {/* Top Floating Bar for Language Switcher */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0b5229]">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>
            {language === 'te'
              ? 'మధ్యవర్తులను తగ్గించే ప్రత్యక్ష వ్యవసాయ వేదిక'
              : language === 'hi'
              ? 'बिचौलियों को समाप्त करने वाला प्रत्यक्ष कृषि मंच'
              : 'Direct Farm-to-Buyer Trade • Reducing Intermediaries & Middlemen'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* AP Rythu Bharosa 24x7 Helpline Hotline */}
          <a
            href="tel:155251"
            id="btn-frontslide-helpline-top"
            title={language === 'te' ? '24x7 ఏపీ రైతు భరోసా ప్రభుత్వ హెల్ప్‌లైన్: 155251' : '24x7 AP Rythu Bharosa Govt Toll-Free Helpline: 155251'}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>{language === 'te' ? 'హెల్ప్‌లైన్: 155251' : 'Helpline: 155251'}</span>
          </a>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {language === 'te' ? 'భాష:' : language === 'hi' ? 'भाषा:' : 'Language:'}
            </span>
            <div className="flex bg-slate-200/80 rounded-xl p-0.5 border border-slate-300 shadow-2xs">
              <button
                onClick={() => onLanguageChange('te')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  language === 'te' ? 'bg-[#0b5229] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                తెలుగు
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  language === 'en' ? 'bg-[#0b5229] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  language === 'hi' ? 'bg-[#0b5229] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Section with Exact Logo */}
      <section className="w-full pt-6 pb-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 mb-6 transition-transform hover:scale-[1.01]">
            <CropNomicsLogo size="hero" showTagline={true} variant="light" />
          </div>

          <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-3xl leading-relaxed font-medium">
            {language === 'te'
              ? 'ఆంధ్రప్రదేశ్ రైతులు, ట్రేడర్లు మరియు రిటైలర్లను నేరుగా అనుసంధానించే అధునాతన డిజిటల్ వ్యవసాయ మార్కెట్. సున్నా కమిషన్, పంట తాజాదనం విశ్లేషణ & నిజ సమయ ధరలు.'
              : language === 'hi'
              ? 'आंध्र प्रदेश के किसानों, सीधे व्यापारियों और खुदरा विक्रेताओं को जोड़ने वाला आधुनिक कृषि मंच। शून्य बिचौलिया शुल्क, वास्तविक समय ताजगी विश्लेषण और पारदर्शी लाभकारी मूल्य।'
              : 'Connecting Andhra Pradesh Farmers, Direct Traders, and Local Retailers with real-time crop shelf-life tracking, transparent farmgate pricing, and zero middleman commissions.'}
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ACCESS PORTAL: 2 SIDE-BY-SIDE BLOCKS                     */}
      {/* Block 1: "Choose who you want to be"                    */}
      {/* Block 2: "Just Name and Phone Number"                   */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0b5229] via-[#0f6c36] to-[#08381b] text-white px-6 sm:px-8 py-5 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {language === 'hi' ? 'क्रॉपनॉमिक्स एक्सेस पोर्टल' : 'CropNomics Access Portal'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {language === 'te'
                  ? 'రైతు సేవా ప్రవేశ ద్వారం'
                  : language === 'hi'
                  ? 'प्रत्यक्ष कृषि प्रवेश द्वार'
                  : 'Direct Agricultural Access Gateway'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="tel:155251"
                id="btn-frontslide-helpline-header"
                title="Toll-Free AP Govt Helpline: 155251"
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">headset_mic</span>
                <span>{language === 'te' ? '24x7 హెల్ప్‌లైన్: 155251' : '24x7 Helpline: 155251'}</span>
              </a>

              <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-emerald-200 font-bold">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>
                  {language === 'hi'
                    ? '100% शून्य बिचौलिया शुल्क'
                    : language === 'te'
                    ? '100% సున్నా కమిషన్'
                    : '100% Zero Middleman Fee'}
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Block Grid */}
          <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* ---------------------------------------------------- */}
            {/* BLOCK 1 (Left): "Choose who you want to be"          */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-slate-200 pb-8 lg:pb-0">
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0b5229] uppercase tracking-wider mb-1">
                    <span className="w-6 h-6 rounded-full bg-[#0b5229] text-white text-xs flex items-center justify-center font-black">1</span>
                    <span>
                      {language === 'te'
                        ? 'మొదటి అడుగు'
                        : language === 'hi'
                        ? 'चरण 1: भूमिका का चयन'
                        : 'Step 1: Role Designation'}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {language === 'te'
                      ? 'మీరు ఎవరు కావాలనుకుంటున్నారో ఎంచుకోండి'
                      : language === 'hi'
                      ? 'आप किस रूप में जुड़ना चाहते हैं?'
                      : 'Choose who you want to be'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {language === 'te'
                      ? 'మీకు అనుకూలమైన పాత్రను ఎంచుకోండి — ప్రతి పాత్రకు తగిన సాధనాలు సిద్ధంగా ఉంటాయి.'
                      : language === 'hi'
                      ? 'अपनी कार्य भूमिका चुनें — हर भूमिका के लिए विशेष डैशबोर्ड और उपकरण तैयार हैं।'
                      : 'Select your operational role across the supply chain to unlock your custom dashboard.'}
                  </p>
                </div>

                {/* 4 Role Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {roleCards.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          setSelectedRole(r.id);
                          setUserName(r.defaultName);
                          setUserPhone(r.defaultPhone);
                          setErrorMessage(null);
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left ${
                          isSelected
                            ? r.activeBorder + ' shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center shadow-md`}
                          >
                            <span className="material-symbols-outlined text-[24px]">{r.icon}</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#0b5229] bg-[#0b5229] text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 text-base">{r.title}</h4>
                          <p className="text-[11px] font-bold text-emerald-800 mt-0.5">{r.subtitle}</p>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{r.tagline}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                          <span className={isSelected ? 'text-[#0b5229]' : 'text-slate-400'}>
                            {isSelected
                              ? language === 'hi'
                                ? '✓ चयनित भूमिका'
                                : language === 'te'
                                ? '✓ ఎంచుకున్న పాత్ర'
                                : '✓ Selected Role'
                              : language === 'hi'
                              ? 'चुनने के लिए क्लिक करें'
                              : language === 'te'
                              ? 'ఎంచుకోవడానికి క్లిక్ చేయండి'
                              : 'Click to Choose'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-[22px]">info</span>
                <span className="text-xs text-emerald-900 font-medium">
                  {language === 'te'
                    ? `ప్రస్తుతం ఎంచుకున్న పాత్ర: ${selectedRoleObj.title} — కుడివైపు వివరాలు నమోదు చేయండి.`
                    : language === 'hi'
                    ? `वर्तमान चयन: ${selectedRoleObj.title} — आगे बढ़ने के लिए दाईं ओर अपना नाम और फ़ोन नंबर दर्ज करें।`
                    : `Active Selection: ${selectedRoleObj.title} — Enter your name & phone in the next block.`}
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* BLOCK 2 (Right): Access Portal Gateway               */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c06a1c] uppercase tracking-wider mb-1">
                    <span className="w-6 h-6 rounded-full bg-[#c06a1c] text-white text-xs flex items-center justify-center font-black">2</span>
                    <span>
                      {language === 'te'
                        ? 'రెండవ అడుగు: ధృవీకరణ & ప్రవేశం'
                        : language === 'hi'
                        ? 'चरण 2: प्रमाणीकरण एवं प्रवेश'
                        : 'Step 2: Authentication & Gateway'}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {language === 'te'
                      ? 'డాష్‌బోర్డ్‌లోకి ప్రవేశించండి'
                      : language === 'hi'
                      ? 'डैशबोर्ड में प्रवेश करें'
                      : 'Enter the Dashboard'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {language === 'te'
                      ? 'మీ ప్రస్తుత ఖాతాతో లాగిన్ అవ్వండి లేదా కొత్త వినియోగదారుగా తక్షణమే సైన్ అప్ అవ్వండి.'
                      : language === 'hi'
                      ? 'अपने पंजीकृत खाते से लॉगिन करें या नए उपयोगकर्ता के रूप में तुरंत साइन अप करें।'
                      : 'Log in with your existing account or sign up as a new user to enter the verified dashboard.'}
                  </p>
                </div>

                {/* Gateway Role Card */}
                <div className="bg-slate-50 rounded-2xl border-2 border-slate-200/90 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${selectedRoleObj.color} text-white flex items-center justify-center shadow-md`}>
                        <span className="material-symbols-outlined text-[24px]">{selectedRoleObj.icon}</span>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          {language === 'te' ? 'ఎంచుకున్న పాత్ర:' : 'Selected Role:'}
                        </div>
                        <h4 className="text-base font-black text-slate-900">{selectedRoleObj.title}</h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                      AP-2026-ACTIVE
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedRoleObj.tagline}
                  </p>

                  {/* Mode Selector Preview Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      id="gateway-login-btn"
                      type="button"
                      onClick={() => handleOpenAuthModal('login')}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-[#0b5229] hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0b5229]">login</span>
                      <span>{language === 'te' ? 'లాగిన్ (Login)' : 'Existing Login'}</span>
                    </button>

                    <button
                      id="gateway-signup-btn"
                      type="button"
                      onClick={() => handleOpenAuthModal('signup')}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-[#0b5229] hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0b5229]">person_add</span>
                      <span>{language === 'te' ? 'సైన్ అప్ (Sign Up)' : 'New User Sign Up'}</span>
                    </button>
                  </div>

                  {/* Feature Highlights */}
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                      <span>{language === 'te' ? 'రోల్ ఆధారిత ఆటోఫిల్ సైన్ అప్' : 'Role auto-filled based on your selection'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified_user</span>
                      <span>{language === 'te' ? 'పాస్‌వర్డ్ రక్షణతో సురక్షిత లాగిన్' : 'Secure password protection & phone verification'}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Enter the Dashboard */}
                <div className="mt-5 space-y-3">
                  <button
                    id="enter-dashboard-btn"
                    type="button"
                    onClick={() => handleOpenAuthModal('login')}
                    className="w-full h-14 bg-gradient-to-r from-[#0b5229] via-[#0f6c36] to-[#08381b] hover:opacity-95 text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span>
                      {selectedRole === 'farmer'
                        ? (language === 'te'
                            ? 'రైతు డాష్‌బోర్డ్‌లోకి ప్రవేశించండి (Enter the Dashboard) →'
                            : 'Enter the Farmer Dashboard →')
                        : language === 'te'
                        ? `${selectedRoleObj.title} డాష్‌బోర్డ్‌లోకి ప్రవేశించండి (Enter the Dashboard) →`
                        : `Enter the ${selectedRole.toUpperCase()} Dashboard →`}
                    </span>
                    <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                  </button>

                  {/* KCC helper for farmer */}
                  {selectedRole === 'farmer' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowKisanCardModal(true)}
                        className="text-xs text-slate-500 hover:text-emerald-800 font-medium underline underline-offset-2 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">credit_card</span>
                        <span>{language === 'te' ? 'రైతు క్రెడిట్ కార్డ్ (KCC) ద్వారా ప్రత్యామ్నాయ ప్రవేశం' : 'Or enter via Kisan Credit Card (KCC)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 24x7 GOVERNMENT HELPLINE BANNER (FRONT SLIDE)            */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
        <div className="bg-gradient-to-r from-slate-900 via-[#0b5229] to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-3xl font-black">headset_mic</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {language === 'te' ? 'ప్రభుత్వ సహాయ కేంద్రం' : language === 'hi' ? 'सरकारी हेल्पलाइन' : 'AP Govt Toll-Free 24x7 Helpline'}
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">• 155251</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                {language === 'te'
                  ? 'AP రైతు భరోసా & వ్యవసాయ సహాయ హెల్ప్‌లైన్: 155251'
                  : language === 'hi'
                  ? 'रायथू भरोसा एवं कृषि सहायता हेल्पलाइन: 155251'
                  : 'AP Rythu Bharosa 24x7 Helpline: 155251'}
              </h3>
              <p className="text-xs text-emerald-100/90 max-w-xl mt-0.5">
                {language === 'te'
                  ? 'రైతులు, వ్యాపారులు మరియు ప్రజలకు పంట ధరలు, MSP మరియు మార్కెట్ యార్డ్ సమస్యల కోసం 24 గంటల ఉచిత టోల్-ఫ్రీ సేవ.'
                  : language === 'hi'
                  ? 'किसानों, व्यापारियों और उपभोक्ताओं के लिए 24 घंटे निःशुल्क सरकारी टेलीफोन सहायता।'
                  : 'Direct 24x7 toll-free telephone assistance for farmers, traders, and mandi functionaries for dispute intervention, pricing, and MSP guidance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href="tel:155251"
              id="btn-frontslide-call-helpline-card"
              className="w-full md:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              <span>{language === 'te' ? 'కాల్ చేయండి (155251)' : language === 'hi' ? 'कॉल करें (155251)' : 'Contact Helpline: 155251'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* GOVERNMENT NOTIFICATIONS SECTION                         */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[24px]">campaign</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {language === 'te'
                      ? 'ప్రభుత్వ ప్రకటనలు & వ్యవసాయ బులెటిన్లు'
                      : language === 'hi'
                      ? 'सरकारी सूचनाएं एवं कृषि बुलेटिन'
                      : 'Government Notifications & Bulletins'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {language === 'te'
                    ? 'ఆంధ్రప్రదేశ్ ప్రభుత్వం నుండి ప్రత్యక్ష వ్యవసాయ వార్తలు, MSP రేట్లు, రాయితీలు & పథకాలు'
                    : language === 'hi'
                    ? 'आंध्र प्रदेश सरकार द्वारा निर्धारित न्यूनतम समर्थन मूल्य (MSP), रायथू भरोसा सब्सिडी एवं मौसम परामर्श।'
                    : 'Real-time Andhra Pradesh Government MSP price mandates, Rythu Bharosa subsidies & agricultural advisories.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Live Loading Indicator Pill */}
              {isLoadingNews && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs animate-pulse">
                  <span className="material-symbols-outlined text-[16px] animate-spin text-[#0b5229]">sync</span>
                  <span>Loading live updates...</span>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: language === 'hi' ? 'सभी' : language === 'te' ? 'అన్నీ' : 'ALL' },
                  { id: 'SUBSIDY', label: language === 'hi' ? 'सब्सिडी' : 'SUBSIDY' },
                  { id: 'WEATHER', label: language === 'hi' ? 'मौसम' : 'WEATHER' },
                  { id: 'MARKET', label: language === 'hi' ? 'మండి भाव' : 'MARKET' },
                  { id: 'GRANT', label: language === 'hi' ? 'अनुदान' : 'GRANT' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveAlertCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAlertCategory === cat.id
                        ? 'bg-[#c06a1c] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
                {/* Manual Refresh Button */}
                <button
                  type="button"
                  id="btn-refresh-live-bulletins"
                  onClick={fetchLiveNews}
                  disabled={isLoadingNews}
                  title={language === 'te' ? 'తాజా వార్తలను రిఫ్రెష్ చేయండి' : 'Refresh live agricultural bulletins'}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] text-emerald-700 ${isLoadingNews ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span className="hidden md:inline">{language === 'te' ? 'రిఫ్రెష్' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid of Government Bulletins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingNews ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-300">
                <div className="w-8 h-8 border-3 border-[#0b5229] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Loading live updates...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'te'
                    ? 'ఆంధ్రప్రదేశ్ ప్రత్యక్ష వ్యవసాయ సమాచారం సేకరించబడుతోంది...'
                    : language === 'hi'
                    ? 'आंध्र प्रदेश के नवीनतम कृषि समाचार लोड हो रहे हैं...'
                    : 'Fetching real-time Andhra Pradesh farming bulletins & news updates...'}
                </p>
              </div>
            ) : newsError ? (
              <div
                id="gov-bulletins-error-state"
                className="col-span-full py-8 px-6 flex flex-col items-center justify-center text-center bg-rose-50 rounded-2xl border border-rose-200"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                </div>
                <h4 className="text-sm font-bold text-rose-900">
                  Unable to connect to live feed
                </h4>
                <p className="text-xs text-rose-700 mt-1 max-w-md">
                  {newsError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewsAlerts(GOVERNMENT_ALERTS);
                    setNewsError(null);
                  }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-[#0b5229] hover:bg-[#083c1e] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {language === 'te' ? 'అధికారిక బులెటిన్లు చూడండి' : 'View Official State Bulletins'}
                </button>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-sm font-semibold text-slate-700">
                  {language === 'te'
                    ? 'ఈ విభాగంలో ప్రస్తుతం లైవ్ బులిటెన్లు లేవు'
                    : language === 'hi'
                    ? 'इस श्रेणी में फिलहाल कोई लाइव बुलेटिन नहीं है'
                    : 'No live bulletins found in this category right now.'}
                </p>
                <button
                  onClick={() => setActiveAlertCategory('ALL')}
                  className="mt-2 text-xs font-bold text-[#0b5229] hover:underline cursor-pointer"
                >
                  {language === 'te' ? 'అన్ని బులిటెన్లను చూడండి' : language === 'hi' ? 'सभी बुलेटिन देखें' : 'View All Bulletins'}
                </button>
              </div>
            ) : (
              filteredAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  id={`gov-bulletin-card-${alert.id}`}
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    if (alert.sourceUrl) {
                      window.open(alert.sourceUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && alert.sourceUrl) {
                      e.preventDefault();
                      window.open(alert.sourceUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="bg-slate-50 hover:bg-emerald-50/50 p-5 rounded-2xl border border-slate-200 hover:border-[#0b5229] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          alert.category === 'SUBSIDY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : alert.category === 'WEATHER'
                            ? 'bg-blue-100 text-blue-800'
                            : alert.category === 'MARKET'
                            ? 'bg-amber-100 text-amber-800'
                            : alert.category === 'GRANT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {alert.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{alert.effectiveDate}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0b5229] transition-colors line-clamp-2">
                      {alert.title}
                    </h4>
                    {/* Short description rendered right below the news title */}
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {alert.description || alert.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-[#0b5229]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>
                        {language === 'te'
                          ? 'అధికారిక సర్క్యులర్ చూడండి'
                          : language === 'hi'
                          ? 'आधिकारिक स्रोत खोलें'
                          : 'Open Official Source'}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#0b5229]">
                      arrow_outward
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ABOUT OUR WEBSITE SECTION                                */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 w-full">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#063319] rounded-3xl text-white p-8 sm:p-12 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-5xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 mb-4 border border-white/15">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>
                {language === 'te'
                  ? 'మా వెబ్‌సైట్ గురించి'
                  : language === 'hi'
                  ? 'हमारे मंच के बारे में'
                  : 'About Our Website'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
              {language === 'te'
                ? 'వ్యవసాయ మార్కెట్‌లో పారదర్శకత & రైతులకు అత్యధిక రాబడి'
                : language === 'hi'
                ? 'प्रत्यक्ष कृषि व्यापार: बिचौलियों की समाप्ति एवं किसानों को अधिकतम लाभ'
                : 'Optimizing The Marginal Supply Chain with Direct Farmgate Trade'}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              {language === 'te'
                ? 'CropNomics అనేది ఆంధ్రప్రదేశ్‌లోని రైతులు, కమీషన్ రహిత వ్యాపారులు మరియు స్థానిక రిటైలర్లను ఒకే వేదికపైకి తెచ్చే అధునాతన సాంకేతిక వేదిక. పంట కోత సమయం నుండి వినియోగదారుడి చేరే వరకు ప్రతి దశలో తాజాదనం గడువు, శీతల రవాణా అవసరాలు మరియు సరసమైన లాభాల మార్జిన్లను లెక్కించే వ్యవస్థను అందిస్తుంది.'
                : language === 'hi'
                ? 'CropNomics आंध्र प्रदेश के किसानों, व्यापारियों और स्थानीय खुदरा विक्रेताओं को एक मंच पर लाने वाला डिजिटल कृषि समाधान है। हम शोषणकारी बिचौलियों की कटौती को समाप्त करते हैं, खेत से सीधी थोक खरीद की सुविधा प्रदान करते हैं, और वास्तविक समय में फसल की ताजगी अवधि की सटीक गणना करते हैं।'
                : 'CropNomics is a dedicated digital ecosystem engineered for Andhra Pradesh agriculture. We eliminate exploitative middlemen cuts, connect farmers directly to bulk commercial buyers and retailers, and provide real-time perishable crop shelf-life tracking across regional trade corridors.'}
            </p>

            {/* Core 3 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                </div>
                <h4 className="font-bold text-base text-white">
                  {language === 'te'
                    ? 'నేరుగా రైతు-ట్రేడర్ అనుసంధానం'
                    : language === 'hi'
                    ? 'प्रत्यक्ष किसान-व्यापारी संपर्क'
                    : 'Direct Farmgate Link'}
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {language === 'te'
                    ? 'మధ్యవర్తుల దోపిడీ లేకుండా ప్రత్యక్ష ఒప్పందాలు మరియు తక్షణ చెల్లింపుల ధృవీకరణ.'
                    : language === 'hi'
                    ? 'बिचौलियों के बिना सीधे खरीद अनुबंध, डिजिटल वजन रसीद और त्वरित पारदर्शी भुगतान।'
                    : 'Direct procurement contracts with verified farm gate quality tests and transparent weight ledger.'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[20px]">timer</span>
                </div>
                <h4 className="font-bold text-base text-white">
                  {language === 'te'
                    ? 'తాజాదనం & రవాణా విశ్లేషణ'
                    : language === 'hi'
                    ? 'कटाई उपरांत ताजगी इंजन'
                    : 'Harvest Lifespan Engine'}
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {language === 'te'
                    ? 'ఉష్ణోగ్రత, తేమ మరియు గమ్యస్థాన రవాణా గంటలను బట్టి తాజాదనం నష్టాన్ని నివారించే సూచనలు.'
                    : language === 'hi'
                    ? 'तापमान, नमी और गंतव्य तक परिवहन समय के आधार पर ताजगी नुकसान को रोकने के सटीक सुझाव।'
                    : 'Calculates ambient vs reefer shelf-life days and consumer transit windows to minimize spoilage.'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <h4 className="font-bold text-base text-white">
                  {language === 'te'
                    ? '4-పాత్రల డిజిటల్ వర్క్‌ఫ్లో'
                    : language === 'hi'
                    ? '4-भूमिका डिजिटल डैशबोर्ड'
                    : '4-Role Multi-Dashboard'}
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {language === 'te'
                    ? 'రైతులు, ట్రేడర్లు, రిటైలర్లు మరియు మార్కెట్ అడ్మిన్ కోసం ప్రత్యేక సాధనాలు & రక్షణ.'
                    : language === 'hi'
                    ? 'किसानों, व्यापारियों, खुदरा विक्रेताओं एवं मंडी प्रशासक हेतु समर्पित और सुरक्षित उपकरण।'
                    : 'Isolated operational dashboards tailored with liability boundaries and fast dispute resolution.'}
                </p>
              </div>
            </div>

            {/* Scroll back up CTA */}
            <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {language === 'te'
                  ? 'ఆంధ్రప్రదేశ్ వ్యవసాయ మార్కెటింగ్ మార్గదర్శకాలకు అనుగుణంగా రూపొందించబడింది.'
                  : language === 'hi'
                  ? 'आंध्र प्रदेश कृषि विपणन विभाग एवं रायथू सेवा मानकों के अनुरूप विकसित।'
                  : 'Engineered in compliance with AP Agricultural Marketing and Rythu Seva standards.'}
              </div>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 bg-[#c06a1c] hover:bg-[#a65714] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span>
                  {language === 'te'
                    ? 'పైకి వెళ్లి లాగిన్ అవ్వండి'
                    : language === 'hi'
                    ? 'ऊपर जाएं और भूमिका चुनें'
                    : 'Scroll Up to Choose Role'}
                </span>
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs px-3 py-1 bg-[#c06a1c] text-white rounded-full font-bold uppercase tracking-wider">
                {selectedAlert.category}
              </span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-3">
              {selectedAlert.title}
            </h2>

            <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-700 mb-4 leading-relaxed border border-slate-200">
              {selectedAlert.fullDetails}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 font-mono mb-6">
              <span>{language === 'hi' ? 'प्रभावी:' : 'Effective:'} {selectedAlert.effectiveDate}</span>
              <span>{language === 'hi' ? 'आधिकारिक एपी परिपत्र' : 'Official AP Circular'}</span>
            </div>

            <button
              onClick={() => setSelectedAlert(null)}
              className="w-full bg-[#0b5229] hover:bg-[#08381b] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              {language === 'te'
                ? 'ధృవీకరించండి & మూసివేయండి'
                : language === 'hi'
                ? 'स्वीकार करें एवं बंद करें'
                : 'Acknowledge & Close'}
            </button>
          </div>
        </div>
      )}

      {/* Kisan Card Auth Modal triggered when pressing Enter the Farmer Dashboard (Requirement 8) */}
      <FarmerCardAuthModal
        isOpen={showKisanCardModal}
        onClose={() => setShowKisanCardModal(false)}
        onSuccess={handleFarmerCardSuccess}
      />

      {/* Comprehensive Login / Sign Up Modal */}
      <LoginSignUpModal
        isOpen={showAuthModal}
        targetRole={selectedRole}
        language={language}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Clean Minimal Footer */}
      <footer className="w-full bg-slate-950 text-slate-400 py-8 px-4 sm:px-8 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-200">CropNomics</span>
            <span className="text-slate-600">|</span>
            <span>© 2026 CropNomics Agricultural Systems</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              {language === 'hi'
                ? 'सीधा कृषि व्यापार • बिचौलियों की समाप्ति'
                : language === 'te'
                ? 'మధ్యవర్తులను తగ్గించే ప్రత్యక్ష వ్యవసాయ వేదిక'
                : 'Direct Farm Trade • Reducing Intermediaries'}
            </span>
            <span>•</span>
            <span>{language === 'hi' ? 'रायथू सेवा प्रमाणित' : 'Rythu Seva Verified'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
