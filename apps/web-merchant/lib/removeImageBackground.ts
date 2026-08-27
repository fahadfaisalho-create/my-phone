// إزالة خلفية صورة المنتج تلقائياً واستبدالها بخلفية بيضاء نظيفة — يعمل بالكامل
// داخل المتصفح (WASM/ONNX)، بدون أي مفتاح API أو خدمة خارجية مدفوعة.
//
// معطّلة مؤقتاً: مكتبة @imgly/background-removal (v1.7) موثّق رسمياً إنها
// تدعم فقط Next.js 15، ولوحة التاجر لسه على Next.js 14 — أي استيراد لها
// (حتى الديناميكي) يكسر بناء الإنتاج (next build) كلياً بسبب ملفات
// onnxruntime-web الداخلية (.mjs) اللي تستخدم import.meta/import/export
// بشكل ما يتوافق مع Terser وقت التصغير.
//
// لإعادة التفعيل بعد ترقية Next.js 15: رجّع `const { removeBackground } =
// await import('@imgly/background-removal');` مكان السطر أدناه، واحذف هذا
// التعليق. الدالة compositeOnWhite ما تحتاج أي تعديل.
export async function removeImageBackground(file: File): Promise<File> {
  throw new Error('AI_BACKGROUND_REMOVAL_DISABLED');
  // eslint-disable-next-line no-unreachable
  const transparentBlob = await removeBackgroundDisabled(file);
  const whiteBgBlob = await compositeOnWhite(transparentBlob);
  const name = file.name.replace(/\.[^.]+$/, '') + '.png';
  return new File([whiteBgBlob], name, { type: 'image/png' });
}

// يمنع محلّل webpack الثابت من الوصول لأي مرجع فعلي لـ @imgly/background-removal
// (حتى داخل كود لن يُنفَّذ) — مجرد وجود السلسلة النصية باسم الحزمة داخل
// import() يكفي ليحاول webpack بناء حزمتها. الدالة أدناه مجرد بديل مؤقت.
async function removeBackgroundDisabled(file: File): Promise<Blob> {
  return file;
}

function compositeOnWhite(transparentBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(transparentBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('تعذّر إنشاء الرسم لمعالجة الصورة'));
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('تعذّر تحويل الصورة'))),
        'image/png',
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذّر تحميل الصورة المعالَجة'));
    };
    img.src = url;
  });
}
