# Referent

Минимальное приложение на Next.js для анализа англоязычных статей с помощью AI

Project.md - описание проекта

## Переменные окружения

Для работы приложения требуются следующие переменные окружения (добавьте их в `.env.local` для локальной разработки и в настройках Vercel для production):

- `OPENROUTER_API_KEY` - API ключ от OpenRouter (для AI обработки)
- `HUGGING_FACE_API_KEY` - API ключ от Hugging Face (для генерации изображений)

Подробные инструкции по настройке:
- `OPENROUTER_SETUP.md` - настройка OpenRouter
- `VERCEL_ENV_SETUP.md` - настройка переменных окружения на Vercel

## Установка

```bash
npm install
```

## Запуск

Разработка:
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

Сборка для production:
```bash
npm run build
```

Запуск собранного проекта:
```bash
npm start
```

