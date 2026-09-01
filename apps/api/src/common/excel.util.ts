import ExcelJS from 'exceljs';

// يبني ملف إكسل بسيط (ورقة واحدة، صف عناوين + صفوف بيانات) ويرجعه كـ Buffer
// جاهز للتنزيل مباشرة — يُستخدم لتصدير الحسابات الفرعية وسجلات الحضور
export async function buildExcelBuffer(
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, string | number | null>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] });
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
