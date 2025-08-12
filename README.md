# File Manager - Система управления файлами

Простой и удобный файловый менеджер с возможностью создания проектов, загрузки файлов и получения прямых ссылок.

## 🚀 Возможности

- ✅ **Авторизация** - Защищенный доступ с логином и паролем
- ✅ **Проекты** - Создание проектов для организации файлов
- ✅ **Drag & Drop загрузка** - Перетаскивание файлов для загрузки
- ✅ **Превью изображений** - Отображение миниатюр для изображений
- ✅ **Прямые ссылки** - Получение прямых ссылок на файлы (domain.com/api/files/file.jpg)
- ✅ **Grid/List view** - Два режима отображения файлов
- ✅ **Управление файлами** - Копирование ссылок, удаление файлов
- ✅ **Темная тема** - Поддержка темной темы

## 📋 Требования

- Node.js 18+
- PostgreSQL или другая база данных, поддерживаемая Prisma

## 🛠️ Установка

1. Клонируйте репозиторий:
```bash
git clone <your-repo-url>
cd file-manager
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения в `.env.local`:
```env
# Авторизация
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/file_manager?schema=public"

# Для Vercel Blob Storage (опционально)
BLOB_READ_WRITE_TOKEN=your-token-here
```

4. Настройте базу данных:
```bash
npx prisma generate
npx prisma db push
```

5. Запустите сервер разработки:
```bash
npm run dev
```

Откройте http://localhost:3000 в браузере.

## 🔐 Вход в систему

Используйте учетные данные из файла `.env.local`:
- **Логин:** admin
- **Пароль:** secure_password_123

## 📁 Структура проекта

```
file-manager/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Защищенные страницы
│   └── login/            # Страница входа
├── components/            # React компоненты
├── lib/                   # Утилиты и helpers
├── prisma/               # Схема базы данных
└── uploads/              # Локальное хранилище файлов
```

## 🚀 Деплой на Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com)

2. Установите Vercel CLI:
```bash
npm i -g vercel
```

3. Настройте переменные окружения в Vercel:
   - `DATABASE_URL` - URL вашей базы данных
   - `ADMIN_USERNAME` - Имя администратора
   - `ADMIN_PASSWORD` - Пароль администратора
   - `JWT_SECRET` - Секретный ключ для JWT

4. Деплой:
```bash
vercel --prod
```

## 📝 API Endpoints

### Файлы
- `POST /api/files/upload` - Загрузка файла
- `GET /api/files/[...path]` - Получение файла (прямая ссылка)
- `DELETE /api/files/[id]` - Удаление файла
- `PATCH /api/files/[id]` - Обновление файла

### Проекты
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создание проекта
- `GET /api/projects/[id]` - Получение проекта
- `PATCH /api/projects/[id]` - Обновление проекта
- `DELETE /api/projects/[id]` - Удаление проекта

### Авторизация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

## 💡 Использование

1. **Создание проекта:**
   - Нажмите "Создать проект" на главной странице
   - Введите название и описание
   - Выберите иконку и цвет

2. **Загрузка файлов:**
   - Откройте проект
   - Нажмите "Загрузить файлы" или перетащите файлы
   - Дождитесь загрузки

3. **Получение ссылки:**
   - Нажмите на иконку ссылки рядом с файлом
   - Ссылка скопирована в буфер обмена
   - Формат: `https://yourdomain.com/api/files/filename.ext`

## 🔧 Настройки

### Изменение лимита размера файла

В файле `/app/api/files/upload/route.ts`:
```typescript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
```

### Поддерживаемые типы файлов

В файле `/components/file-manager/file-upload-zone.tsx`:
```typescript
accept: {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  // Добавьте другие типы
}
```

## 📦 Технологии

- **Next.js 15** - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Prisma** - ORM для базы данных
- **JWT** - Авторизация
- **React Dropzone** - Drag & Drop загрузка

## 🤝 Лицензия

MIT