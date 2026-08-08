# منصة صيانة وبيع الجوالات — API

Backend أساسي (NestJS + Prisma + PostgreSQL) يغطي: قاعدة البيانات الكاملة حسب المواصفات + نظام تسجيل الدخول والتسجيل للتاجر والإدارة.

## البنية
```
apps/api            → NestJS API (جاهز ويعمل)
apps/web-admin       → لوحة الإدارة (Next.js) — لم تُبنَ بعد
apps/web-merchant    → لوحة التاجر (Next.js) — لم تُبنَ بعد
apps/mobile-consumer → تطبيق المستهلك (Expo) — لم يُبنَ بعد
packages/shared      → أنواع مشتركة — placeholder فقط حالياً
```

## تشغيل الـ API محلياً
```bash
cd apps/api
npm run start:dev
```
يشتغل على `http://localhost:3000/api`. متصل فعلياً بقاعدة بيانات Neon (المسار في `apps/api/.env`، غير مرفوع لأي مكان).

## تشغيل لوحة الإدارة محلياً
شغّل الـ API أولاً (فوق)، ثم في نافذة طرفية ثانية:
```bash
cd apps/web-admin
npm run dev
```
يشتغل على `http://localhost:3001` (المنفذ 3000 محجوز للـ API). سجّل الدخول بحساب الأدمن المذكور أدناه.

## تشغيل لوحة التاجر محلياً
مع تشغيل الـ API، في نافذة طرفية ثالثة:
```bash
cd apps/web-merchant
npm run dev
```
يشتغل على `http://localhost:3002`. من الصفحة الرئيسية اختر "تسجيل جديد" لتجربة التسجيل الكامل، أو "تسجيل الدخول" بحساب تاجر موجود (مثال: `merchant1@example.com` / `Passw0rd!`، محل نشط بالفعل).

## أوامر مفيدة (من apps/api)
| الأمر | الوصف |
|---|---|
| `npm run prisma:studio` | متصفح مرئي لبيانات قاعدة البيانات |
| `npm run prisma:migrate` | إنشاء/تطبيق migration جديدة بعد تعديل `prisma/schema.prisma` |
| `npm run seed` | إنشاء حساب أدمن أولي (من قيم `.env`) |
| `npm run build` | بناء نسخة إنتاج |

## الحسابات التجريبية
- **أدمن**: `admin@platform.local` / `ChangeMe123!` (غيّرها في `.env` قبل أي استخدام حقيقي، هذه بيانات تطوير فقط)

## Endpoints الجاهزة الآن

**المصادقة والتسجيل**
| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| POST | `/api/auth/login` | دخول موحّد (تاجر أو أدمن) بالبريد وكلمة السر | عام |
| POST | `/api/auth/register-merchant` | تسجيل محل جديد (multipart: بيانات + شعار اختياري + ملف سجل تجاري وملف تصديق بنكي إجباريان) | عام |
| POST | `/api/consumer-auth/request-otp` | طلب رمز تحقق برقم الجوال (بدون بوابة SMS فعلية بعد — يُرجع `devOtp` في بيئة التطوير فقط) | عام |
| POST | `/api/consumer-auth/verify-otp` | تأكيد الرمز وإصدار JWT (ينشئ حساب مستهلك تلقائياً أول مرة) | عام |

**المحل — التاجر**
| Method | Path | الوصف |
|---|---|---|
| GET/PATCH | `/api/stores/me` | عرض/تعديل بيانات المحل (التعديل بعد الرفض يعيد الحالة لـ "قيد المراجعة") |
| GET/POST | `/api/stores/me/branches` | الفروع |
| PATCH/DELETE | `/api/stores/me/branches/:id` | تعديل/حذف فرع |
| GET/POST | `/api/stores/me/services` | الخدمات (device support / سعر شغل اليد / ربط قطعة غيار) |
| PATCH/DELETE | `/api/stores/me/services/:id` | تعديل/حذف خدمة |
| GET/POST | `/api/stores/me/products` | المنتجات (رفع صورة) |
| PATCH/DELETE | `/api/stores/me/products/:id` | تعديل/حذف منتج |
| PATCH | `/api/stores/me/products/:id/inventory` | تعديل الكمية فقط (`delta` أو `quantity`) |
| GET | `/api/stores/me/bookings` | حجوزات المحل |
| PATCH | `/api/stores/me/bookings/:id/status` | قبول/إنهاء/إلغاء حجز |
| GET | `/api/stores/me/orders` | طلبات الشراء على المحل |
| PATCH | `/api/stores/me/orders/:id/status` | تحديث حالة الطلب |
| GET | `/api/stores/me/chats` | محادثات المحل |

**الإدارة**
| Method | Path | الوصف |
|---|---|---|
| GET | `/api/admin/stores?status=` | قائمة طلبات/حسابات المحلات |
| PATCH | `/api/admin/stores/:id/approve` \| `/reject` | قبول/رفض (مع سبب) |
| GET | `/api/support-tickets?status=&relatedType=` | كل تذاكر الدعم |
| PATCH | `/api/support-tickets/:id/status` | تحديث حالة تذكرة |

**المستهلك (تصفح + تفاعل)**
| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| GET | `/api/catalog/stores?search=` | المحلات النشطة (مع `available` حسب الاشتراك) | عام |
| GET | `/api/catalog/stores/:id` | تفاصيل محل: فروع/خدمات/منتجات/تقييمات | عام |
| POST | `/api/stores/:storeId/reviews` | تقييم محل (1-5 + تعليق، تحديث تلقائي عند التكرار) | consumer |
| POST | `/api/bookings` | إنشاء حجز | consumer |
| GET | `/api/bookings/me` | حجوزاتي | consumer |
| POST | `/api/orders` | إنشاء طلب شراء (يخصم من المخزون) | consumer |
| GET | `/api/orders/me` | طلباتي | consumer |
| POST | `/api/orders/:id/confirm-payment` | محاكاة تأكيد الدفع (بوابة الدفع الفعلية لاحقاً) | consumer |
| POST | `/api/chats` | بدء/متابعة محادثة مع محل | consumer |
| GET | `/api/chats/me` | محادثاتي | consumer |
| GET/POST | `/api/chats/:id/messages` | عرض/إرسال رسائل (لطرفي المحادثة) | consumer, merchant_rep |
| POST | `/api/support-tickets` | فتح تذكرة دعم | consumer, merchant_rep |

جميعها مُختبرة فعلياً ضد قاعدة بيانات Neon الحقيقية: تسجيل → مراجعة إدارة → قبول/رفض → فروع/خدمات/منتجات/مخزون → تصفح عام → OTP → تقييم → حجز → طلب شراء (مع خصم مخزون) → دفع تجريبي → شات ثنائي الاتجاه → تذكرة دعم → 401/403 على الأدوار الخاطئة → حظر التفاعل (شات/حجز/شراء) على محل غير نشط.

## ملاحظة مهمة: تشغيل migrations في هذه البيئة
`prisma migrate dev` يفشل هنا لأن الطرفية غير تفاعلية (non-interactive). عند تعديل `schema.prisma`:
1. عدّل الـ schema.
2. أنشئ يدوياً مجلد `prisma/migrations/<timestamp>_<name>/migration.sql` يحتوي جمل SQL المطابقة للتغيير.
3. شغّل `npx prisma migrate deploy` (تطبّق فقط، بدون تفاعل) ثم `npx prisma generate`.

## ملاحظات تصميم مهمة
- **الملفات (السجل التجاري/تصديق الحساب/الشعار)**: تُخزَّن حالياً محلياً في `apps/api/uploads/` وتُقدَّم عبر `/uploads/...`. هذا مؤقت — المواصفات تحدد لاحقاً Cloudflare R2 أو AWS S3، والتبديل يقتصر على طبقة التخزين في `src/common/multer.config.ts` فقط.
- **حالات المحل**: التزمت بالقيم الأربع المذكورة في المواصفات فقط (`pending|active|rejected|suspended`) — القبول من الإدارة ينقل الحالة مباشرة لـ `active` دون حالة وسيطة "بانتظار الدفع" (النموذج الأولي HTML كانت فيه حالة إضافية، لكن المواصفات الرسمية حصرت الحالات في أربع فقط، وربط الدفع الفعلي مؤجل حسب خطة العمل).
- **كلمات المرور**: مشفّرة بـ `bcryptjs` (بديل JS خالص عن `bcrypt` لتفادي تعقيد البناء الأصلي على ويندوز — نفس مستوى الأمان).
- **الأدوار الثلاثة** (`admin`, `merchant_rep`, `consumer`) موجودة في قاعدة البيانات؛ مصادقة `consumer` (OTP عبر SMS) لم تُبنَ بعد — تأتي في مرحلة تطبيق المستهلك حسب خطة البدء.

## ملاحظات إضافية
- **الدردشة**: REST فقط حالياً (إنشاء/عرض/إرسال). طبقة Socket.io للبث الفوري لم تُضف بعد (مرحلة منفصلة في خطة المواصفات).
- **إشعارات FCM**: لم تُبنَ — تحتاج مشروع Firebase وبيانات اعتماد من المالك أولاً.
- **قاعدة "بيانات البطاقات"**: لا تُخزَّن أي بيانات دفع فعلية في هذا المشروع؛ الدفع بالكامل (اشتراك ومنتجات) عبارة عن endpoint محاكاة (`confirm-payment`) لحد ربط بوابة دفع سعودية معتمدة.

## تشغيل تطبيق المستهلك محلياً (Expo)
مع تشغيل الـ API، في نافذة طرفية رابعة:
```bash
cd apps/mobile-consumer
npm run web
```
يشتغل على `http://localhost:3003` (معاينة ويب عبر react-native-web — مفيدة للتطوير والاختبار السريع). للتشغيل الفعلي على جوال عبر تطبيق **Expo Go**:
```bash
npm start
```
ثم امسح رمز QR — لكن غيّر `EXPO_PUBLIC_API_ORIGIN` في `apps/mobile-consumer/.env` من `localhost` لعنوان IP جهازك على نفس الشبكة (مثال: `http://192.168.1.10:3000`)، لأن الجوال لا يفهم "localhost" الخاص بجهاز التطوير.

## الحالة الحالية
- ✅ الـ API: كل الوظائف الأساسية في المواصفات (مصادقة، فروع/خدمات/منتجات/مخزون، تصفح عام، تقييمات، حجوزات، طلبات، شات REST، تذاكر دعم).
- ✅ لوحة الإدارة (`apps/web-admin`): دخول + مراجعة طلبات التسجيل (قبول/رفض).
- ✅ لوحة التاجر (`apps/web-merchant`): دخول/تسجيل/انتظار/رفض وإعادة إرسال + لوحة كاملة (فروع/خدمات/منتجات/مخزون/رسائل/إحصائيات).
- ✅ تطبيق المستهلك (`apps/mobile-consumer`، React Native/Expo): تسجيل دخول OTP، تصفح المحلات (بحث)، ملف محل كامل (خدمات/منتجات/تقييمات)، **شات فوري** مع المحل، **حجز موعد** لخدمة، **سلة وشراء** مع محاكاة دفع، ومتابعة الحجوزات والطلبات.
- ✅ **الشات الفوري (Socket.io)**: `ChatGateway` في الـ API (namespace `/chat`، مصادقة JWT عبر handshake) — نفس منطق REST بالضبط مع بث فوري للرسائل. مُفعّل في تطبيق المستهلك ولوحة التاجر معاً، ومُختبر فعلياً بالاتجاهين بدون أي تحديث يدوي للصفحة.
- ✅ لوحة التاجر: تبويبا **الحجوزات** و**الطلبات** لإدارة الحالة (قبول/إلغاء/إنهاء) بدل الاكتفاء بأرقام في الإحصائيات.
- كل الشاشات مبنية بنفس الهوية البصرية (كحلي/تركواز) — الويب بنفس CSS حرفياً من النموذج الأولي، والموبايل بنفس الألوان والخطوط (Cairo + IBM Plex Sans Arabic) عبر StyleSheet. كلها مُختبرة فعلياً ضد الـ API الحقيقي.

## ملاحظة تقنية: React مكرر في Metro (monorepo)
إذا واجهت خطأ "Invalid hook call" عند تشغيل `apps/mobile-consumer`، السبب أن Metro يحلّ حزمة `react` من أكثر من مسار داخل الـ npm workspaces. الحل موجود مسبقاً في `apps/mobile-consumer/metro.config.js` (يثبّت مسار واحد لـ node_modules)، فقط تأكد من عدم حذفه.

## الخطوة التالية
المتبقي من خطة المواصفات: ربط بوابة دفع سعودية فعلية (حالياً محاكاة فورية كما هو موثّق)، وإشعارات FCM. عدا ذلك المنصة مكتملة الوظائف الأساسية عبر الواجهات الثلاث.
