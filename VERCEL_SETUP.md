# НАСТРОЙКА VERCEL POSTGRES

## ВАЖНО! SQLite НЕ РАБОТАЕТ на Vercel!
Нужно использовать PostgreSQL базу данных.

## Шаг 1: Создай Vercel Postgres Database

1. Зайди в Vercel Dashboard: https://vercel.com/dashboard
2. Открой твой проект "file-manager-hosting"
3. Перейди в раздел "Storage"
4. Нажми "Create Database"
5. Выбери "Postgres"
6. Дай имя базе данных (например: "file-manager-db")
7. Выбери регион (лучше ближайший к тебе)
8. Нажми "Create"

## Шаг 2: Скопируй DATABASE_URL

1. После создания базы, перейди во вкладку ".env.local"
2. Скопируй значение POSTGRES_URL (это и есть твой DATABASE_URL)
3. Оно выглядит примерно так:
   ```
   postgresql://default:xxxxx@ep-xxx.xxx.postgres.vercel-storage.com/verceldb?sslmode=require
   ```

## Шаг 3: Добавь переменные окружения в Vercel

1. В Vercel Dashboard открой Settings → Environment Variables
2. Добавь следующие переменные:

   - `DATABASE_URL` = [скопированный POSTGRES_URL из шага 2]
   - `ADMIN_USERNAME` = admin
   - `ADMIN_PASSWORD` = secure_password_123
   - `JWT_SECRET` = [сгенерируй длинную случайную строку]
   - `BLOB_READ_WRITE_TOKEN` = [токен из Vercel Blob Storage если есть]

## Шаг 4: Передеплой проект

1. Перейди в Deployments
2. Нажми на три точки у последнего деплоя
3. Выбери "Redeploy"
4. НЕ МЕНЯЙ переменные окружения (Use existing)
5. Нажми "Redeploy"

## Альтернатива: Используй Supabase (БЕСПЛАТНО)

Если не хочешь использовать Vercel Postgres:

1. Зарегистрируйся на https://supabase.com
2. Создай новый проект
3. Получи DATABASE_URL из Settings → Database
4. Используй этот URL в Vercel Environment Variables

## После настройки

Логин должен работать с:
- Username: admin
- Password: secure_password_123