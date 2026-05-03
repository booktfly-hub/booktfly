// Arabic translations for common airport/city codes and airline names.
// Falls back to the English value (returned by Duffel) when no AR mapping exists.

const CITY_AR: Record<string, string> = {
  // Saudi Arabia
  RUH: 'الرياض',
  JED: 'جدة',
  DMM: 'الدمام',
  MED: 'المدينة المنورة',
  AHB: 'أبها',
  TIF: 'الطائف',
  TUU: 'تبوك',
  ELQ: 'القصيم',
  HAS: 'حائل',
  YNB: 'ينبع',
  GIZ: 'جازان',
  BHH: 'بيشة',
  AJF: 'الجوف',
  AQI: 'القيصومة',
  EAM: 'نجران',
  EJH: 'الوجه',
  TUI: 'الطريف',
  WAE: 'الوديعة',

  // GCC
  DXB: 'دبي',
  AUH: 'أبوظبي',
  SHJ: 'الشارقة',
  DOH: 'الدوحة',
  KWI: 'الكويت',
  BAH: 'المنامة',
  MCT: 'مسقط',
  SLL: 'صلالة',

  // Egypt / Levant
  CAI: 'القاهرة',
  ALY: 'الإسكندرية',
  HRG: 'الغردقة',
  SSH: 'شرم الشيخ',
  LXR: 'الأقصر',
  AMM: 'عمّان',
  BEY: 'بيروت',
  DAM: 'دمشق',
  ALP: 'حلب',
  BGW: 'بغداد',
  EBL: 'أربيل',
  BSR: 'البصرة',

  // North Africa
  CMN: 'الدار البيضاء',
  RAK: 'مراكش',
  TUN: 'تونس',
  ALG: 'الجزائر',
  TIP: 'طرابلس',
  KRT: 'الخرطوم',

  // Turkey
  IST: 'إسطنبول',
  SAW: 'إسطنبول صبيحة',
  AYT: 'أنطاليا',
  ESB: 'أنقرة',
  ADB: 'إزمير',

  // Europe
  LHR: 'لندن هيثرو',
  LGW: 'لندن غاتويك',
  CDG: 'باريس',
  ORY: 'باريس أورلي',
  FRA: 'فرانكفورت',
  MUC: 'ميونخ',
  AMS: 'أمستردام',
  MAD: 'مدريد',
  BCN: 'برشلونة',
  FCO: 'روما',
  MXP: 'ميلانو',
  ATH: 'أثينا',
  VIE: 'فيينا',
  ZRH: 'زيورخ',
  GVA: 'جنيف',
  CPH: 'كوبنهاغن',
  ARN: 'ستوكهولم',
  OSL: 'أوسلو',
  HEL: 'هلسنكي',
  WAW: 'وارسو',
  PRG: 'براغ',
  BUD: 'بودابست',
  IST_TR: 'إسطنبول',

  // Asia
  KUL: 'كوالالمبور',
  SIN: 'سنغافورة',
  BKK: 'بانكوك',
  HKT: 'بوكيت',
  HKG: 'هونغ كونغ',
  ICN: 'سيول',
  NRT: 'طوكيو ناريتا',
  HND: 'طوكيو هانيدا',
  PEK: 'بكين',
  PVG: 'شنغهاي',
  DEL: 'نيودلهي',
  BOM: 'مومباي',
  KHI: 'كراتشي',
  ISB: 'إسلام آباد',
  LHE: 'لاهور',
  CMB: 'كولومبو',
  DAC: 'دكا',
  KTM: 'كاتماندو',

  // Americas
  JFK: 'نيويورك',
  EWR: 'نيوآرك',
  LGA: 'نيويورك لاغوارديا',
  LAX: 'لوس أنجلوس',
  ORD: 'شيكاغو',
  IAD: 'واشنطن',
  MIA: 'ميامي',
  YYZ: 'تورنتو',
  YUL: 'مونتريال',
  GRU: 'ساو باولو',
  EZE: 'بوينس آيرس',

  // Africa (sub-Saharan / popular)
  ADD: 'أديس أبابا',
  NBO: 'نيروبي',
  JNB: 'جوهانسبرغ',
  CPT: 'كيب تاون',
  LOS: 'لاغوس',
  ACC: 'أكرا',
}

const AIRLINE_AR: Record<string, string> = {
  SV: 'الخطوط الجوية العربية السعودية',
  XY: 'طيران ناس',
  F3: 'فلاي أديل',
  EK: 'طيران الإمارات',
  EY: 'الاتحاد للطيران',
  FZ: 'فلاي دبي',
  G9: 'العربية للطيران',
  WY: 'الطيران العماني',
  GF: 'طيران الخليج',
  KU: 'الخطوط الجوية الكويتية',
  J9: 'الجزيرة',
  QR: 'الخطوط الجوية القطرية',
  MS: 'مصر للطيران',
  ME: 'طيران الشرق الأوسط',
  RJ: 'الملكية الأردنية',
  IA: 'الخطوط الجوية العراقية',
  AT: 'الخطوط الملكية المغربية',
  TU: 'الخطوط التونسية',
  AH: 'الخطوط الجوية الجزائرية',
  TK: 'الخطوط الجوية التركية',
  PC: 'بيغاسوس',
  BA: 'الخطوط الجوية البريطانية',
  AF: 'الخطوط الجوية الفرنسية',
  LH: 'لوفتهانزا',
  KL: 'كي إل إم',
  IB: 'إيبيريا',
  LX: 'سويس',
  OS: 'النمساوية',
  AY: 'فينير',
  SK: 'الإسكندنافية SAS',
  EI: 'إير لينغوس',
  TP: 'البرتغالية',
  AZ: 'إيتا الإيطالية',
  A3: 'إيجيان',
  SU: 'الخطوط الجوية الروسية',
  PK: 'الخطوط الجوية الباكستانية',
  AI: 'الخطوط الجوية الهندية',
  EH: 'إثيوبيا',
  KQ: 'كينيا',
  SA: 'الجنوب أفريقية',
  SQ: 'سنغافورة',
  CX: 'كاثي باسيفيك',
  MH: 'الخطوط الجوية الماليزية',
  TG: 'تاي',
  ZZ: 'دافل إيرويز',
}

export function localizeCity(iataCode: string | null | undefined, fallback: string, locale: string): string {
  if (locale !== 'ar') return fallback
  if (!iataCode) return fallback
  return CITY_AR[iataCode.toUpperCase()] ?? fallback
}

export function localizeAirline(
  iataCode: string | null | undefined,
  fallback: string,
  locale: string
): string {
  if (locale !== 'ar') return fallback
  if (!iataCode) return fallback
  return AIRLINE_AR[iataCode.toUpperCase()] ?? fallback
}
