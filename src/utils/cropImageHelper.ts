/**
 * Intelligent image mapper for agricultural crops, fruits, vegetables, pulses, and farm products.
 * Provides high quality, reliable image URLs based on user inputs in English or Telugu.
 */

const CROP_IMAGE_KEYWORD_MAP: { keywords: string[]; url: string }[] = [
  {
    keywords: ['mango', 'మామిడి', 'banganapalli', 'totapuri', 'alphonso'],
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['banana', 'అరటి', 'karpura', 'yelakki', 'plantain'],
    url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['papaya', 'బొప్పాయి', 'red lady'],
    url: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['paddy', 'rice', 'వరి', 'సోనా', 'మసూరి', 'bpt', 'dhan'],
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['chilli', 'mirchi', 'మిర్చి', 'కారం', 'teja', 'pepper'],
    url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cotton', 'పత్తి', 'kapas'],
    url: 'https://images.unsplash.com/photo-1762112464284-db2e871a9f4f?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['maize', 'corn', 'మొక్కజొన్న', 'sweet corn', 'makka'],
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['tomato', 'టమోటా', 'టమాట', 'tamatar'],
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['groundnut', 'ground nut', 'peanut', 'peanuts', 'వేరుశనగ', 'పల్లీ', 'kadiri', 'groundnuts'],
    url: 'https://images.unsplash.com/photo-1756694414422-30c2c8da75d2?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['turmeric', 'పసుపు', 'haldi', 'curcumin', 'duggirala'],
    url: 'https://images.unsplash.com/photo-1741513599050-487ccfb86275?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sugarcane', 'sugar cane', 'చెరకు', 'ganna', 'cane', 'sugar'],
    url: 'https://images.unsplash.com/photo-1775619427924-16ff07cf2f2e?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['brinjal', 'eggplant', 'వంకాయ', 'baingan'],
    url: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['okra', 'bhendi', 'lady finger', 'బెండకాయ', 'bhindi'],
    url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cabbage', 'క్యాబేజీ', 'patta gobhi'],
    url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cauliflower', 'కాలీఫ్లవర్', 'gobi'],
    url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cashew', 'జీడిపప్పు', 'kaju'],
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['coffee', 'కాఫీ'],
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sunflower', 'పొద్దుతిరుగుడు', 'surajmukhi'],
    url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['onion', 'ఉల్లి', 'ఉల్లిపాయ', 'pyaz'],
    url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['potato', 'ఆలూ', 'బంగాళాదుంప', 'aloo'],
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['garlic', 'వెల్లుల్లి', 'lahsun'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['ginger', 'అల్లం', 'adrak'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['millet', 'ragi', 'రాగి', 'సజ్జలు', 'జొన్నలు', 'కొర్రలు', 'jowar', 'bajra'],
    url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pulses', 'dal', 'కందులు', 'మినుములు', 'పెసలు', 'toor', 'urad', 'moong', 'gram'],
    url: 'https://images.unsplash.com/photo-1763368403529-0b8d9108cf9c?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sweet lime', 'బత్తాయి', 'mosambi', 'citrus', 'lemon', 'నిమ్మ'],
    url: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['guava', 'జామ', 'amrud'],
    url: 'https://images.unsplash.com/photo-1536511135402-0c918a2862c2?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pomegranate', 'దానిమ్మ', 'anar'],
    url: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['watermelon', 'పుచ్చకాయ', 'tarbooz'],
    url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['coconut', 'కొబ్బరి', 'nariyal'],
    url: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['oil', 'నూనె', 'groundnut oil', 'peanut oil', 'గానుగ నూనె', 'wood pressed groundnut oil'],
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sesame oil', 'gingelly oil', 'నువ్వుల నూనె', 'til oil'],
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['coconut oil', 'గానుగ కొబ్బరి నూనె', 'virgin coconut oil', 'కొబ్బరినూనె'],
    url: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['castor oil', 'ఆముదం', 'arandi'],
    url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['mustard oil', 'ఆవ నూనె', 'sarson ka tel'],
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['spinach', 'పాలకూర', 'palak', 'greens', 'ఆకుకూరలు'],
    url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['carrot', 'క్యారెట్', 'gajar'],
    url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cucumber', 'దోసకాయ', 'కీరదోస', 'keera', 'kheera'],
    url: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['bitter gourd', 'కాకరకాయ', 'karela'],
    url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['bottle gourd', 'సొరకాయ', 'ఆనపకాయ', 'lauki'],
    url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['ridge gourd', 'బీరకాయ', 'turai'],
    url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['beetroot', 'బీట్‌రూట్', 'chukandar'],
    url: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['coriander', 'కొత్తిమీర', 'dhaniya', 'cilantro'],
    url: 'https://images.unsplash.com/photo-1588879460618-924b6f7a6275?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['mint', 'పుదీనా', 'pudina'],
    url: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['black pepper', 'మిరియాలు', 'kali mirch', 'pepper'],
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cardamom', 'యాలకులు', 'elaichi'],
    url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['clove', 'లవంగాలు', 'laung'],
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cinnamon', 'దాల్చినచెక్క', 'dalchini'],
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cumin', 'జీలకర్ర', 'jeera'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['mustard seeds', 'ఆవాలు', 'sarson', 'rai'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['fenugreek', 'మెంతులు', 'methi'],
    url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['apple', 'యాపిల్', 'seb', 'shimla apple'],
    url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['orange', 'నారింజ', 'కమలా', 'santra'],
    url: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['grapes', 'ద్రాక్ష', 'angoor', 'kishmish'],
    url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sapota', 'సపోటా', 'chikoo', 'chiku'],
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['custard apple', 'సీతాఫలం', 'sitaphal', 'sharifa'],
    url: 'https://images.unsplash.com/photo-1536511135402-0c918a2862c2?auto=format&fit=crop&w=800&q=80',
  },
];

const DEFAULT_CROP_IMAGE = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80';

/**
 * Returns an appropriate image URL based on crop name or query.
 */
export function getCropImageByName(name: string): string {
  if (!name || typeof name !== 'string') return DEFAULT_CROP_IMAGE;
  const lower = name.toLowerCase().trim();
  for (const entry of CROP_IMAGE_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return entry.url;
      }
    }
  }
  return DEFAULT_CROP_IMAGE;
}
