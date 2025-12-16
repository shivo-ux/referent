# Деплой на Vercel

## Вариант 1: Через веб-интерфейс (РЕКОМЕНДУЕТСЯ - самый быстрый способ) ⚡

1. Перейдите на [https://vercel.com](https://vercel.com)
2. Войдите через GitHub (используйте ваш аккаунт shivo-ux)
3. Нажмите **"Add New Project"** или **"Import Project"**
4. Выберите репозиторий `shivo-ux/referent` из списка
5. Vercel автоматически определит Next.js и настроит деплой
6. Нажмите **"Deploy"**

✅ После этого каждый push в репозиторий будет автоматически деплоиться.

**Ваш проект будет доступен по адресу:** `https://referent.vercel.app` (или похожему URL)

## Вариант 2: Через Vercel CLI с авторизацией

```powershell
# Авторизация (откроется браузер)
vercel login

# Деплой на production
vercel --prod
```

Или используйте готовый скрипт:
```powershell
.\deploy.ps1
```

## Вариант 3: Через Vercel CLI с токеном

1. Создайте токен на [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Выполните команды:
```powershell
$env:VERCEL_TOKEN = "ваш_токен_vercel"
vercel --prod
```

## Вариант 4: Через GitHub Actions (автоматический деплой)

После первого деплоя через веб-интерфейс, добавьте секреты в GitHub:
- `VERCEL_TOKEN` - токен из [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` и `VERCEL_PROJECT_ID` - можно найти в настройках проекта на Vercel

После этого каждый push будет автоматически деплоиться через GitHub Actions.

