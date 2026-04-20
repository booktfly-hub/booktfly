import { CONTRACT_VERSION, type ContractMeta } from './version'

export const SERVICE_PROVIDER_CONTRACT_META: ContractMeta = {
  role: 'service_provider',
  title_ar: 'عقد تقديم خدمات سياحية',
  title_en: 'Service Provider Agreement',
  version: CONTRACT_VERSION,
}

export const SERVICE_PROVIDER_CONTRACT_AR = `
عقد تقديم خدمات سياحية
الطرف الأول: شركة Booktfly للسياحة والسفر
الطرف الثاني: مزود الخدمة
المدة: 12 شهراً | القانون الحاكم: نظام المملكة العربية السعودية

ديباجة العقد
اتُّفق على إبرام هذا العقد بين Booktfly للسياحة والسفر ومزود الخدمة المُشار إليه بهدف تنظيم علاقة تقديم الخدمات السياحية وفق الشروط والأحكام التالية.

1. تعريف الخدمات
يُقدِّم مزود الخدمة خدمات متخصصة لـ Booktfly تشمل (وفق طبيعة مزود الخدمة): خدمات الإقامة الفندقية، نقل المسافرين، الجولات السياحية، خدمات الاستقبال والتوديع، التأمين السياحي، أو أي خدمات سفر متخصصة أخرى محددة في الملحق أ.

2. معايير الجودة والامتثال
يلتزم مزود الخدمة بـ: الحصول على جميع التراخيص والتصاريح القانونية اللازمة، الامتثال للمعايير الصحية والسلامة المعتمدة، تقديم خدماته بما يتوافق مع المواصفات المتفق عليها، والسماح لـ Booktfly بإجراء عمليات تفتيش الجودة.

3. هيكل الأسعار والدفع
تُحدد الأسعار في جداول الأسعار المرفقة (الملحق ب) وتُراجع ربع سنوياً. تُسدَّد مستحقات مزود الخدمة خلال 30 يوماً من استلام الفاتورة المؤيدة بمستندات الخدمة المكتملة. يُخصم 2% كضريبة استقطاع وفق الأنظمة السعودية.

4. حصص الطاقة الاستيعابية
يُحدِّد مزود الخدمة حصصاً مخصصة لـ Booktfly من طاقته الاستيعابية وفق ما تتفق عليه الأطراف شهرياً. يُخطر مزود الخدمة Booktfly بأي تغييرات في الطاقة الاستيعابية قبل 14 يوماً على الأقل من التاريخ المؤثر.

5. التزامات مزود الخدمة
يلتزم مزود الخدمة بـ: تقديم الخدمات بالجودة والتوقيت المتفق عليهما، إبلاغ Booktfly فوراً عند أي طارئ يؤثر على الخدمة، الحفاظ على سرية بيانات عملاء Booktfly، التعاون في حل الشكاوى خلال 48 ساعة من الإبلاغ.

6. التزامات Booktfly
تلتزم Booktfly بـ: تزويد مزود الخدمة بالحجوزات في الوقت المناسب، السداد في المواعيد المتفق عليها، إبلاغ مزود الخدمة بالتعديلات في الحجوزات فور علمها، وتوفير متطلبات العملاء بدقة.

7. المسؤولية والتأمين
يلتزم مزود الخدمة بالاحتفاظ بتغطية تأمينية كافية تشمل المسؤولية المدنية تجاه العملاء. في حال قصور الخدمة، يتحمل مزود الخدمة تكاليف التعويض المباشر للعملاء المتضررين. الحد الأقصى لمسؤولية Booktfly لا يتجاوز قيمة الخدمات المحجوزة.

8. حقوق الملكية الفكرية والبيانات
تبقى بيانات عملاء Booktfly ملكاً حصرياً لـ Booktfly ولا يحق لمزود الخدمة استخدامها لأغراض تسويقية أو بيعها أو مشاركتها مع أطراف ثالثة. تُحظر جميع أشكال التواصل المباشر مع عملاء Booktfly خارج نطاق تنفيذ الخدمة المتعاقد عليها.

9. مدة العقد والتجديد والإنهاء
يسري هذا العقد لمدة سنة كاملة قابلة للتجديد التلقائي ما لم يُخطر أيٌّ من الطرفين الآخرَ برغبته في عدم التجديد قبل 30 يوماً. يُنهى العقد فوراً في حال الإفلاس أو الإخلال الجوهري أو سحب الترخيص.

10. القانون الحاكم وتسوية النزاعات
يخضع هذا العقد لأنظمة المملكة العربية السعودية. تُحسم النزاعات بالتراضي أولاً خلال 30 يوماً، فإن تعذّر ذلك تُحال إلى لجان حل المنازعات المختصة في المملكة العربية السعودية.

يُعدّ هذا العقد ملزماً قانونياً وفق أنظمة المملكة العربية السعودية.
`.trim()

export const SERVICE_PROVIDER_CONTRACT_EN = `
Service Provider Agreement
First Party: Booktfly Tourism & Travel
Second Party: Service Provider
Duration: 12 Months | Governing Law: Saudi Arabian Law

Preamble
This agreement is established between Booktfly Tourism & Travel and the named Service Provider to regulate the tourism service provision relationship under the following terms.

1. Service Definition
The Service Provider provides specialized services to Booktfly including (per provider type): hotel accommodation, passenger transportation, tourist tours, meet and greet services, travel insurance, or other specialized travel services defined in Appendix A.

2. Quality Standards & Compliance
The Service Provider commits to: obtaining all required legal licenses and permits, complying with approved health and safety standards, delivering services per agreed specifications, and permitting Booktfly quality inspections.

3. Pricing & Payment Structure
Prices are defined in attached price schedules (Appendix B) and reviewed quarterly. Service Provider's dues are paid within 30 days of receiving invoices supported by completed service documents. 2% withholding tax is deducted per Saudi regulations.

4. Capacity Allocation
The Service Provider allocates dedicated capacity shares to Booktfly as monthly agreed between parties. The Service Provider notifies Booktfly of any capacity changes at least 14 days before the effective date.

5. Service Provider Obligations
The Service Provider commits to: delivering services at agreed quality and timing, immediately notifying Booktfly of emergencies affecting service, maintaining confidentiality of Booktfly's client data, and cooperating in complaint resolution within 48 hours of reporting.

6. Booktfly's Obligations
Booktfly commits to: providing bookings to the Service Provider in a timely manner, paying on agreed dates, notifying the Service Provider of booking changes immediately upon learning, and accurately conveying client requirements.

7. Liability & Insurance
The Service Provider must maintain adequate insurance coverage including civil liability toward clients. In case of service deficiency, the Service Provider bears direct compensation costs to affected clients. Booktfly's maximum liability does not exceed the value of booked services.

8. Intellectual Property & Data Rights
Booktfly's client data remains exclusively owned by Booktfly. The Service Provider may not use it for marketing, sell it, or share it with third parties. All direct communication with Booktfly's clients outside the contracted service scope is prohibited.

9. Duration, Renewal & Termination
This contract is valid for one full year with automatic renewal unless either party notifies the other of non-renewal intent 30 days prior. Immediate termination applies upon bankruptcy, material breach, or license revocation.

10. Governing Law & Dispute Resolution
This contract is governed by Saudi Arabian law. Disputes shall first be resolved amicably within 30 days, failing which they shall be referred to the competent Saudi dispute resolution committees.

This contract is legally binding under Saudi Arabian law.
`.trim()
