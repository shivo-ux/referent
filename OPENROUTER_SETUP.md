# Настройка OpenRouter API

## Получение API ключа

1. Перейдите на [https://openrouter.ai](https://openrouter.ai)
2. Зарегистрируйтесь или войдите в аккаунт
3. Перейдите в раздел [Keys](https://openrouter.ai/keys)
4. Нажмите "Create Key" или "Create API Key"
5. Скопируйте созданный API ключ

## Настройка в проекте

### 1. Добавьте ключ в `.env.local`:

```
OPENROUTER_API_KEY=sk-or-v1-ваш_ключ_здесь
```

### 2. Использование в коде:

В API route (`app/api/parse/route.ts` или новом endpoint) используйте:

```typescript
const apiKey = process.env.OPENROUTER_API_KEY

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Referent',
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { role: "user", content: "Ваш запрос" }
    ]
  })
})
```

## Если сайт openrouter.ai не работает

Если возникают проблемы с сайтом:

1. **Попробуйте через API напрямую:**
   - Многие API позволяют создавать ключи через API, но для openrouter.ai нужна регистрация через сайт

2. **Используйте альтернативные сервисы:**
   - OpenAI API (прямо)
   - Anthropic Claude API
   - Google Gemini API

3. **Игнорируйте ошибки консоли:**
   - Ошибки preload и CSP на сайте openrouter.ai не влияют на функциональность
   - Просто закройте консоль разработчика и продолжайте работу

## Добавление переменной на Vercel

После получения ключа добавьте его в переменные окружения на Vercel:

1. Перейдите в Settings → Environment Variables
2. Добавьте:
   - Key: `OPENROUTER_API_KEY`
   - Value: `ваш_ключ`
   - Environment: Production, Preview, Development

