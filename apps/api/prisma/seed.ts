// إنشاء حساب أدمن أولي — يُشغَّل يدوياً عبر: npm run seed --workspace=apps/api
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL و ADMIN_SEED_PASSWORD مطلوبان في ملف .env');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`حساب الأدمن موجود مسبقاً: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      role: 'admin',
      name: 'مدير المنصة',
      email,
      passwordHash,
    },
  });
  console.log(`تم إنشاء حساب الأدمن: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
