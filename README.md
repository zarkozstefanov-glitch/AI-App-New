# AI Expense Tracker (BG)

Next.js (App Router) + TypeScript + Tailwind app for AI разпознаване на разходи от снимки на касови бележки/банкови екрани, с категоризация, аналитика и бюджетиране.

## Основни функции
- NextAuth (credentials) с хеширани пароли, профили с бюджет и предпочитания.
- Prisma + SQLite (готово за Postgres) модели за потребители, транзакции и артикули.
- Качване на изображения, AI извличане (OpenAI vision) със Zod валидация, увереност и липсващи полета.
- Аналитика (ден/седмица/месец) с Recharts: тренд, топ категории, търговци, проекции спрямо бюджета.
- Управление на данни: редакция, изтриване, повторно AI разпознаване, филтрирана история.

## Старт
1) Инсталирай зависимости:
```bash
npm install
```
2) Подготви среда (създай `.env.local` по примера):
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_cUUZG1mi7w5LVJH2NuUow2UA
DEV_ALLOWED_ORIGINS="http://192.168.0.100:3000"
```
3) Генерирай база и seed данни:
```bash
npm run prisma:generate
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npm run prisma:seed
```
Seed акаунт: `demo@demo.com` / `demo1234`.

4) Стартирай dev сървъра:
```bash
npm run dev
```
За достъп от телефон в същата мрежа добави LAN адреса в `DEV_ALLOWED_ORIGINS`
и използвай `npm run dev` (стартира с `-H 0.0.0.0`). Обнови `NEXTAUTH_URL`
до `http://<LAN-IP>:3000`, ако влизаш от друго устройство.

## Бележки за сигурност
- Вход/регистрация минават през NextAuth Credentials, паролите се хешират с bcrypt.
- Всеки ресурс е обвързан с userId чрез middleware и проверки на API нивото.

## Основни пътища
- `app/(auth)/auth/page.tsx` – вход/регистрация.
- `app/(protected)/upload/page.tsx` – добавяне на транзакции (AI + ръчно).
- `app/(protected)/page.tsx` – табло с аналитика и инсайти.
- `app/(protected)/transactions` – история + филтри и детайли/AI повторение.
- `app/(protected)/settings/page.tsx` – профил и бюджет.

## AI извличане
- Модел: `gpt-4o-mini` с визуални входове (OpenAI SDK).
- Валидация: Zod схема, ниска увереност → null + `missingFields`.

## Полезни команди
- `npm run lint` – ESLint.
- `npm run prisma:migrate` – миграции.
- `npm run prisma:seed` – демо данни.
- `npm run prisma:backfill` – backfill за суми в центове.

## Troubleshooting
Required env vars in `.env.local`:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`

If OpenAI requests fail:
- Ensure `OPENAI_API_KEY` is set without quotes and starts with `sk-`.
- Ensure `OPENAI_ASSISTANT_ID` is set to your assistant id.
- Restart `npm run dev` after changing `.env.local`.

If manual transaction creation fails with `P2011` on `aiExtractedJson`:
- Run `npx prisma db push` (or `npm run prisma:migrate`) to apply the nullable field change.

If amounts show as zero after migration:
- Run `npm run prisma:backfill` to populate `*_cents` fields from legacy amounts.
