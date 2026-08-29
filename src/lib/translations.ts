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
  | 'terms'
  | 'welcome'
  | 'my_complaints'
  | 'report_issue'
  | 'public_feed'
  | 'active'
  | 'resolved'
  | 'total'
  | 'sign_out'
  | 'my_tasks'
  | 'assignment_queue'
  | 'verify_proof'
  | 'all_complaints'
  | 'admin'
  | 'complaints_filed'
  | 'no_complaints'
  | 'report_first_issue'
  | 'start_first_issue';

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
    welcome: 'Welcome',
    my_complaints: 'My Complaints',
    report_issue: 'Report Issue',
    public_feed: 'Public Feed',
    active: 'Active',
    resolved: 'Resolved',
    total: 'Total',
    sign_out: 'Sign out',
    my_tasks: 'My Tasks',
    assignment_queue: 'Assignment Queue',
    verify_proof: 'Verify Proof',
    all_complaints: 'All Complaints',
    admin: 'Admin',
    complaints_filed: 'complaints filed',
    no_complaints: 'No complaints yet',
    report_first_issue: 'Report your first issue',
    start_first_issue: 'Report your first civic issue to get started.',
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
    welcome: 'स्वागत है',
    my_complaints: 'मेरी शिकायतें',
    report_issue: 'समस्या दर्ज करें',
    public_feed: 'सार्वजनिक फीड',
    active: 'सक्रिय',
    resolved: 'समाधानित',
    total: 'कुल',
    sign_out: 'लॉग आउट',
    my_tasks: 'मेरे कार्य',
    assignment_queue: 'कार्य आवंटन',
    verify_proof: 'प्रमाण सत्यापन',
    all_complaints: 'सभी शिकायतें',
    admin: 'व्यवस्थापक',
    complaints_filed: 'शिकायतें दर्ज की गईं',
    no_complaints: 'अभी तक कोई शिकायत नहीं',
    report_first_issue: 'अपनी पहली शिकायत दर्ज करें',
    start_first_issue: 'शुरू करने के लिए अपनी पहली नागरिक समस्या दर्ज करें।',
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
    welcome: 'স্বাগতম',
    my_complaints: 'আমার অভিযোগসমূহ',
    report_issue: 'অভিযোগ দায়ের করুন',
    public_feed: 'পাবলিক ফিড',
    active: 'সক্রিয়',
    resolved: 'সমাধান হয়েছে',
    total: 'মোট',
    sign_out: 'সাইন আউট',
    my_tasks: 'আমার কাজ',
    assignment_queue: 'বরাদ্দ সারি',
    verify_proof: 'প্রমাণ যাচাই',
    all_complaints: 'সকল অভিযোগ',
    admin: 'প্রশাসক',
    complaints_filed: 'অভিযোগ জমা হয়েছে',
    no_complaints: 'এখনও কোনো অভিযোগ নেই',
    report_first_issue: 'আপনার প্রথম অভিযোগ দায়ের করুন',
    start_first_issue: 'শুরু করতে আপনার প্রথম নাগরিক সমস্যা দায়ের করুন।',
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
    welcome: 'स्वागत आहे',
    my_complaints: 'माझ्या तक्रारी',
    report_issue: 'तक्रार नोंदवा',
    public_feed: 'सार्वजनिक फीड',
    active: 'सक्रिय',
    resolved: 'निवारण झाले',
    total: 'एकूण',
    sign_out: 'बाहेर पडा',
    my_tasks: 'माझी कामे',
    assignment_queue: 'नियुक्ती रांग',
    verify_proof: 'पुरावा पडताळणी',
    all_complaints: 'सर्व तक्रारी',
    admin: 'प्रशासक',
    complaints_filed: 'नोंदवलेल्या तक्रारी',
    no_complaints: 'अद्याप कोणतीही तक्रार नाही',
    report_first_issue: 'पहिली तक्रार नोंदवा',
    start_first_issue: 'सुरू करण्यासाठी तुमची पहिली नागरी समस्या नोंदवा.',
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
    welcome: 'வரவேற்கிறோம்',
    my_complaints: 'என் புகார்கள்',
    report_issue: 'புகார் பதிவு செய்',
    public_feed: 'பொது ஊட்டம்',
    active: 'செயலில் உள்ளவை',
    resolved: 'தீர்க்கப்பட்டவை',
    total: 'மொத்தம்',
    sign_out: 'வெளியேறு',
    my_tasks: 'எனது பணிகள்',
    assignment_queue: 'பணி ஒதுக்கீட்டு வரிசை',
    verify_proof: 'சான்று சரிபார்த்தல்',
    all_complaints: 'அனைத்து புகார்கள்',
    admin: 'நிர்வாகி',
    complaints_filed: 'பதிவு செய்யப்பட்ட புகார்கள்',
    no_complaints: 'இதுவரை புகார்கள் இல்லை',
    report_first_issue: 'உங்கள் முதல் புகாரைப் பதிவு செய்யவும்',
    start_first_issue: 'தொடங்குவதற்கு உங்கள் முதல் புகாரைப் பதிவு செய்யவும்.',
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
    welcome: 'സ്വാഗതം',
    my_complaints: 'എന്റെ പരാതികൾ',
    report_issue: 'പരാതി നൽകുക',
    public_feed: 'പൊതു ഫീഡ്',
    active: 'സജീവം',
    resolved: 'പരിഹരിച്ചവ',
    total: 'ആകെ',
    sign_out: 'പുറത്തുകടക്കുക',
    my_tasks: 'എന്റെ ജോലികൾ',
    assignment_queue: 'നിയോഗ ക്യൂ',
    verify_proof: 'തെളിവ് പരിശോധന',
    all_complaints: 'എല്ലാ പരാതികളും',
    admin: 'അഡ്മിൻ',
    complaints_filed: 'പരാതികൾ സമർപ്പിച്ചു',
    no_complaints: 'ഇതുവരെ പരാതികളൊന്നുമില്ല',
    report_first_issue: 'ആദ്യ പരാതി സമർപ്പിക്കുക',
    start_first_issue: 'തുടങ്ങുന്നതിനായി ആദ്യ പൗര പരാതി സമർപ്പിക്കുക.',
  },
};

export function getTranslation(lang: SupportedLocale, key: TranslationKey): string {
  const localeDict = translations[lang] || translations.en;
  return localeDict[key] || translations.en[key] || '';
}
