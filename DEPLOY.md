# Инструкция по деплою на Vercel

## Шаги для деплоя:

1. **Репозиторий создан**: https://github.com/djfsldjfkfofjfjm/file-manager-hosting

2. **Подключение к Vercel:**
   - Зайдите на https://vercel.com
   - Нажмите "Add New" -> "Project"
   - Импортируйте репозиторий `file-manager-hosting`

3. **Настройка переменных окружения в Vercel:**
   Добавьте следующие переменные в настройках проекта:
   
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure_password_123
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=postgresql://...  # Получите от Vercel Postgres
   BLOB_READ_WRITE_TOKEN=...       # Получите от Vercel Blob Storage
   ```

4. **Настройка Vercel Postgres:**
   - В панели Vercel перейдите в Storage
   - Создайте новую PostgreSQL базу данных
   - Скопируйте DATABASE_URL в переменные окружения

5. **Настройка Vercel Blob Storage:**
   - В панели Vercel перейдите в Storage
   - Создайте новое Blob хранилище
   - Скопируйте BLOB_READ_WRITE_TOKEN в переменные окружения

6. **После настройки запустите в базе данных:**
   ```bash
   npx prisma db push
   ```

## Статус проекта:
✅ Код адаптирован для Vercel
✅ Vercel Blob Storage интегрирован
✅ Все тесты проходят (25 тестов)
✅ Сборка успешна
✅ Репозиторий создан и код запушен

## Функционал:
- Авторизация с фиксированным логином/паролем
- Массовая загрузка файлов (jpg, png, pdf и др.)
- Прямые ссылки на файлы с расширениями
- Организация файлов по проектам и папкам
- Превью изображений
- Удаление и управление файлами