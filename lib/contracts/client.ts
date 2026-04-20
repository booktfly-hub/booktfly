import { CONTRACT_VERSION, type ContractMeta } from './version'

export const CLIENT_CONTRACT_META: ContractMeta = {
  role: 'client',
  title_ar: 'عقد خدمات سياحية',
  title_en: 'Tourism Services Agreement',
  version: CONTRACT_VERSION,
}

export const CLIENT_CONTRACT_AR = `
عقد خدمات سياحية
الطرف الأول: شركة Booktfly للسياحة والسفر
الطرف الثاني: العميل
المدة: 12 شهراً | القانون الحاكم: نظام المملكة العربية السعودية

ديباجة العقد
اتُّفق وتعاقد بين Booktfly للسياحة والسفر (الطرف الأول) والعميل المذكور أعلاه (الطرف الثاني) على الشروط والأحكام التالية المنظِّمة لتقديم خدمات السفر والسياحة.

1. موضوع العقد
تتعهد Booktfly بتقديم خدمات السفر والسياحة المتكاملة للعميل، وتشمل: حجز تذاكر الطيران، الفنادق، الرحلات السياحية، النقل الأرضي، التأمين السياحي، وأي خدمات مساندة أخرى تُتفق عليها كتابياً.

2. الالتزامات المالية
يلتزم العميل بسداد كامل قيمة الخدمات المتفق عليها وفق جدول الدفعات المحدد. تُقبل المدفوعات عبر القنوات الرسمية المعتمدة لدى Booktfly فقط. يُسقط التأخر عن السداد الحق في الحجوزات المؤكدة دون إشعار مسبق.

3. سياسة الإلغاء والاسترداد
• إلغاء قبل 30 يوماً: استرداد 90% من القيمة الإجمالية.
• إلغاء 15-29 يوماً: استرداد 50%.
• إلغاء أقل من 15 يوماً: لا يُسترد أي مبلغ.
• تخضع مبالغ شركات الطيران والفنادق لسياساتها الخاصة المستقلة.

4. مسؤوليات Booktfly
تلتزم Booktfly بتوفير الخدمات المتفق عليها بالجودة والمواصفات المحددة، والإخطار الفوري للعميل عند أي تغيير جوهري، وتقديم الدعم اللوجستي طوال رحلة العميل.

5. مسؤوليات العميل
يتحمل العميل المسؤولية الكاملة عن: صحة المعلومات المقدمة، استيفاء متطلبات التأشيرة والوثائق الرسمية، الامتثال لأنظمة الجهات المضيفة، وأي تكاليف ناتجة عن إهماله أو تقصيره.

6. حدود المسؤولية
لا تتحمل Booktfly المسؤولية عن الأضرار الناتجة عن: قوة قاهرة، إضرابات، قرارات حكومية، أعطال فنية خارجة عن إرادتها، أو أي ظروف استثنائية. يُحدد الحد الأقصى للتعويض بقيمة الخدمات المدفوعة فعلياً.

7. السرية وحماية البيانات
تلتزم Booktfly بحماية البيانات الشخصية للعميل وفق نظام حماية البيانات الشخصية السعودي ولوائحه التنفيذية. لا تُشارك بيانات العميل مع أطراف ثالثة إلا بموافقته الصريحة أو بموجب إلزام قانوني.

8. القانون الحاكم وتسوية النزاعات
يخضع هذا العقد لأنظمة المملكة العربية السعودية. تُحسم النزاعات بالتراضي أولاً خلال 30 يوماً، فإن تعذّر ذلك تُحال إلى لجان حل المنازعات المختصة في المملكة العربية السعودية.

9. أحكام ختامية
يُعدّ هذا العقد الاتفاق الكامل بين الطرفين ويلغي أي اتفاقيات سابقة شفهية أو كتابية. لا تسري أي تعديلات إلا إذا وقّع عليها الطرفان كتابياً.

يُعدّ هذا العقد ملزماً قانونياً وفق أنظمة المملكة العربية السعودية.
`.trim()

export const CLIENT_CONTRACT_EN = `
Tourism Services Agreement
First Party: Booktfly Tourism & Travel
Second Party: Client
Duration: 12 Months | Governing Law: Saudi Arabian Law

Preamble
This agreement is entered into between Booktfly Tourism & Travel (First Party) and the above-named Client (Second Party) under the following terms governing travel and tourism services.

1. Scope of Services
Booktfly agrees to provide comprehensive travel and tourism services including: flight bookings, hotel reservations, tour packages, ground transportation, travel insurance, and any additional services agreed in writing.

2. Financial Obligations
The Client undertakes to pay the full agreed amount per the established payment schedule. Payments are accepted only through Booktfly's official channels. Delays in payment may result in cancellation of confirmed bookings without prior notice.

3. Cancellation & Refund Policy
• Cancellation 30+ days prior: 90% refund.
• 15-29 days: 50% refund.
• Under 15 days: No refund.
• Airline/hotel cancellation fees follow their own independent policies.

4. Booktfly's Responsibilities
Booktfly commits to delivering agreed services at the specified quality, promptly notifying the Client of any material changes, and providing logistical support throughout the Client's journey.

5. Client's Responsibilities
The Client bears full responsibility for: accuracy of provided information, visa requirements and official documents, compliance with host country regulations, and any costs arising from negligence or default.

6. Liability Limitations
Booktfly is not liable for damages caused by: force majeure, strikes, governmental decisions, technical failures beyond its control, or exceptional circumstances. Maximum compensation is limited to the value of services actually paid.

7. Confidentiality & Data Protection
Booktfly is committed to protecting Client's personal data per the Saudi Personal Data Protection Law. Client data is not shared with third parties except with explicit consent or legal obligation.

8. Governing Law & Dispute Resolution
This contract is governed by Saudi Arabian law. Disputes shall first be resolved amicably within 30 days, failing which they shall be referred to the competent Saudi dispute resolution committees.

9. Final Provisions
This contract constitutes the entire agreement between the parties, superseding any prior oral or written agreements. No amendments are valid unless signed in writing by both parties.

This contract is legally binding under Saudi Arabian law.
`.trim()
