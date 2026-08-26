// إزالة خلفية صورة المنتج تلقائياً واستبدالها بخلفية بيضاء نظيفة — يعمل بالكامل
// داخل المتصفح (WASM/ONNX)، بدون أي مفتاح API أو خدمة خارجية مدفوعة.
export async function removeImageBackground(file: File): Promise<File> {
  const { removeBackground } = await import('@imgly/background-removal');
  // نتيجة المكتبة صورة PNG بخلفية شفافة — نحتاج نركّبها فوق خلفية بيضاء
  const transparentBlob = await removeBackground(file);
  const whiteBgBlob = await compositeOnWhite(transparentBlob);
  const name = file.name.replace(/\.[^.]+$/, '') + '.png';
  return new File([whiteBgBlob], name, { type: 'image/png' });
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
