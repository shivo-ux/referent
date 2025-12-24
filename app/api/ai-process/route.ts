import { NextRequest, NextResponse } from 'next/server'

type ActionType = 'summary' | 'theses' | 'telegram'

interface PromptConfig {
  systemPrompt: string
  userPromptTemplate: string
  temperature: number
}

const PROMPT_CONFIGS: Record<ActionType, PromptConfig> = {
  summary: {
    systemPrompt: 'Ты опытный аналитик. Создай краткое резюме статьи на русском языке.',
    userPromptTemplate: 'Опиши кратко (2-3 абзаца), о чем эта статья:\n\n{content}',
    temperature: 0.5,
  },
  theses: {
    systemPrompt: 'Ты эксперт по анализу текстов. Выдели ключевые тезисы статьи.',
    userPromptTemplate: 'Выдели 5-7 основных тезисов этой статьи в виде маркированного списка на русском языке:\n\n{content}',
    temperature: 0.4,
  },
  telegram: {
    systemPrompt: 'Ты создатель контента для социальных сетей. Создай пост для Telegram на основе статьи.',
    userPromptTemplate: 'Создай пост для Telegram на основе этой статьи. Пост должен быть: интересным, информативным, с эмодзи, структурированным (заголовок, краткое содержание, призыв к действию), не более 1000 символов:\n\n{content}',
    temperature: 0.6,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { url, action } = await request.json()

    // Валидация входных данных
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    if (!action || !['summary', 'theses', 'telegram'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be one of: summary, theses, telegram' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Парсим статью
    const parseResponse = await fetch(`${request.nextUrl.origin}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!parseResponse.ok) {
      const error = await parseResponse.json()
      return NextResponse.json(
        { error: error.error || 'Failed to parse article' },
        { status: parseResponse.status }
      )
    }

    const parsedData = await parseResponse.json()

    if (!parsedData.content) {
      return NextResponse.json(
        { error: 'Article content not found' },
        { status: 400 }
      )
    }

    // Подготавливаем текст для обработки
    let articleContent = ''
    if (parsedData.title) {
      articleContent += `Заголовок: ${parsedData.title}\n\n`
    }
    articleContent += parsedData.content

    // Ограничиваем размер текста для экономии токенов
    const maxLength = 8000
    if (articleContent.length > maxLength) {
      articleContent = articleContent.substring(0, maxLength) + '...'
    }

    // Получаем конфигурацию промпта для текущего действия
    const promptConfig = PROMPT_CONFIGS[action as ActionType]
    const userPrompt = promptConfig.userPromptTemplate.replace('{content}', articleContent)

    // Отправляем запрос в OpenRouter AI
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.nextUrl.origin,
        'X-Title': 'Referent - AI Article Processor',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: promptConfig.systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: promptConfig.temperature,
      }),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      return NextResponse.json(
        { error: `AI processing failed: ${openRouterResponse.statusText}` },
        { status: openRouterResponse.status }
      )
    }

    const aiResponse = await openRouterResponse.json()

    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      )
    }

    const result = aiResponse.choices[0].message.content

    return NextResponse.json({
      result: result,
      action: action,
      original: {
        title: parsedData.title,
        content: parsedData.content,
      },
    })
  } catch (error) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process article with AI' },
      { status: 500 }
    )
  }
}

