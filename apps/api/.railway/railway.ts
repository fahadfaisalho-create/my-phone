import { defineRailway, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const myPhoneApi = service("my-phone-api", {
    replicas: { "sfo": 1 },
    build: "npm install && npx prisma generate && npx prisma migrate deploy && npm run build",
    start: "npx prisma migrate deploy && npm run start:prod",
    env: { ADMIN_SEED_EMAIL: preserve(), ADMIN_SEED_PASSWORD: preserve(), DATABASE_URL: preserve(), JWT_EXPIRES_IN: preserve(), JWT_SECRET: preserve(), R2_ACCESS_KEY_ID: preserve(), R2_ACCOUNT_ID: preserve(), R2_BUCKET_NAME: preserve(), R2_PUBLIC_URL: preserve(), R2_SECRET_ACCESS_KEY: preserve() },
  });

  return project("my-phone-api", {
    resources: [myPhoneApi],
  });
});
