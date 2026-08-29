export type SupportedLocale = 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'ml';

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'ml', label: 'മലയാളം' },
];

export type TranslationKey =
  | 'portal_title'
  | 'portal_subtitle'
  | 'secure_login'
  | 'login_subtitle'
  | 'tab_google'
  | 'tab_otp'
  | 'btn_google'
  | 'help_text'
  | 'footer_text'
  | 'privacy'
  | 'terms';

export const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en: {
    portal_title: 'Nagrik Seva',
    portal_subtitle: 'Official Access Portal',
    secure_login: 'Secure Login',
    login_subtitle: 'Log in to your Nagrik Seva account.',
    tab_google: 'Google Login',
    tab_otp: 'SMS OTP',
    btn_google: 'Continue with Google',
    help_text: 'Need help logging in?',
    footer_text: '© 2024 Nagrik Seva. Institutional Trust Division.',
    privacy: 'Privacy',
    terms: 'Terms',
  },
  hi: {
    portal_title: 'नागरिक सेवा',
    portal_subtitle: 'आधिकारिक पहुंच पोर्टल',
    secure_login: 'सुरक्षित लॉगिन',
    login_subtitle: 'अपने नागरिक सेवा खाते में लॉग इन करें।',
    tab_google: 'गूगल लॉगिन',
    tab_otp: 'एसएमएस ओटीपी',
    btn_google: 'गूगल के साथ जारी रखें',
    help_text: 'लॉगिन करने में सहायता चाहिए?',
    footer_text: '© 2024 नागरिक सेवा। संस्थागत विश्वास प्रभाग।',
    privacy: 'गोपनीयता',
    terms: 'नियम',
  },
  bn: {
    portal_title: 'নাগরিক সেবা',
    portal_subtitle: 'অফিসিয়াল এক্সেস পোর্টাল',
    secure_login: 'সুরক্ষিত লগইন',
    login_subtitle: 'আপনার নাগরিক সেবা একাউন্টে লগইন করুন।',
    tab_google: 'গুগল লগইন',
    tab_otp: 'এসএমএস ওটিপি',
    btn_google: 'গুগল দিয়ে এগিয়ে যান',
    help_text: 'লগইন করতে সাহায্য প্রয়োজন?',
    footer_text: '© 2024 নাগরিক সেবা। প্রাতিষ্ঠানিক ট্রাস্ট বিভাগ।',
    privacy: 'গোপনীয়তা',
    terms: 'শর্তাবলী',
  },
  mr: {
    portal_title: 'नागरिक सेवा',
    portal_subtitle: 'अधिकृत प्रवेश पोर्टल',
    secure_login: 'सुरक्षित लॉगिन',
    login_subtitle: 'आपल्या नागरिक सेवा खात्यात लॉगिन करा.',
    tab_google: 'गुगल लॉगिन',
    tab_otp: 'एसएमएस ओटीपी',
    btn_google: 'गुगलसह पुढे जा',
    help_text: 'लॉगिन करण्यास मदत हवी आहे?',
    footer_text: '© 2024 नागरिक सेवा. संस्थात्मक विश्वास विभाग.',
    privacy: 'गोपनीयता',
    terms: 'अटी',
  },
  ta: {
    portal_title: 'நாக்ரிக் சேவா',
    portal_subtitle: 'அதிகாரப்பூர்வ அணுகல் தளம்',
    secure_login: 'பாதுகாப்பான உள்நுழைவு',
    login_subtitle: 'உங்கள் நாக்ரிக் சேவா கணக்கில் உள்நுழையவும்.',
    tab_google: 'கூகிள் உள்நுழைவு',
    tab_otp: 'எஸ்எம்எஸ் ஓடிபி',
    btn_google: 'கூகிள் மூலம் தொடரவும்',
    help_text: 'உள்நுழைய உதவி தேவையா?',
    footer_text: '© 2024 நாக்ரிக் சேவா. நிறுவன நம்பிக்கை பிரிவு.',
    privacy: 'தனியுரிமை',
    terms: 'விதிமுறைகள்',
  },
  ml: {
    portal_title: 'നാഗരിക് സേവ',
    portal_subtitle: 'ഔദ്യോഗിക പ്രവേശന പോർട്ടൽ',
    secure_login: 'സുരക്ഷിത ലോഗിൻ',
    login_subtitle: 'നിങ്ങളുടെ നാഗരിക് സേവ അക്കൗണ്ടിലേക്ക് ലോഗിൻ ചെയ്യുക.',
    tab_google: 'ഗൂഗിൾ ലോഗിൻ',
    tab_otp: 'എസ്എംഎസ് ഒടിപി',
    btn_google: 'ഗൂഗിൾ ഉപയോഗിച്ച് തുടരുക',
    help_text: 'ലോഗിൻ ചെയ്യാൻ സഹായം ആവശ്യമുണ്ടോ?',
    footer_text: '© 2024 നാഗരിക് സേവ. ഇൻസ്റ്റിറ്റ്യൂഷണൽ ട്രസ്റ്റ് ഡിവിഷൻ.',
    privacy: 'സ്വകാര്യത',
    terms: 'നിബന്ധനകൾ',
  },
};

export function getTranslation(lang: SupportedLocale, key: TranslationKey): string {
  const localeDict = translations[lang] || translations.en;
  return localeDict[key] || translations.en[key] || '';
}
