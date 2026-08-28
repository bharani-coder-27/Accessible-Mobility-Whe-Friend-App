export type Language = "en" | "ta" | "hi";

const translations = {
  en: {
    welcome: "Welcome back",
    email: "Email address",
    password: "Password",
    login: "Sign in",
    createAccount: "Create an account",
    noAccount: "New here? Create an account",
    findStops: "Find nearby bus stops",
    from: "From address",
    to: "To address",
    currentLocation: "Use current location",
    searchTitle: "Plan an accessible journey",
    searchSubtitle: "Find wheelchair-friendly buses around you.",
    profile: "User profile",
    logout: "Sign out",
  },
  ta: {
    welcome: "மீண்டும் வரவேற்கிறோம்",
    email: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    login: "உள்நுழைக",
    createAccount: "கணக்கை உருவாக்கு",
    noAccount: "புதியவரா? கணக்கை உருவாக்குங்கள்",
    findStops: "அருகிலுள்ள பேருந்து நிறுத்தங்களை தேடு",
    from: "தொடக்க முகவரி",
    to: "செல்ல வேண்டிய முகவரி",
    currentLocation: "தற்போதைய இருப்பிடத்தை பயன்படுத்து",
    searchTitle: "அணுகக்கூடிய பயணத்தை திட்டமிடுங்கள்",
    searchSubtitle: "உங்களுக்கு அருகிலுள்ள சக்கர நாற்காலி வசதியுள்ள பேருந்துகளைக் கண்டறியுங்கள்.",
    profile: "பயனர் சுயவிவரம்",
    logout: "வெளியேறு",
  },
  hi: {
    welcome: "वापसी पर स्वागत है",
    email: "ईमेल पता",
    password: "पासवर्ड",
    login: "साइन इन",
    createAccount: "खाता बनाएं",
    noAccount: "नए हैं? खाता बनाएं",
    findStops: "नजदीकी बस स्टॉप खोजें",
    from: "प्रस्थान पता",
    to: "गंतव्य पता",
    currentLocation: "वर्तमान स्थान उपयोग करें",
    searchTitle: "सुगम यात्रा की योजना बनाएं",
    searchSubtitle: "अपने आसपास व्हीलचेयर-अनुकूल बसें खोजें।",
    profile: "उपयोगकर्ता प्रोफ़ाइल",
    logout: "साइन आउट",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export const translate = (language: Language, key: TranslationKey) =>
  translations[language][key];