import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
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

    // Сначала парсим статью
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

    // Подготавливаем текст для перевода
    let textToTranslate = ''
    if (parsedData.title) {
      textToTranslate += `Title: ${parsedData.title}\n\n`
    }
    textToTranslate += parsedData.content

    // Ограничиваем размер текста (многие модели имеют ограничения)
    const maxLength = 8000 // Оставляем запас для токенов
    if (textToTranslate.length > maxLength) {
      textToTranslate = textToTranslate.substring(0, maxLength) + '...'
    }

    // Отправляем запрос на перевод через OpenRouter AI
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.nextUrl.origin,
        'X-Title': 'Referent - Article Translator',
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Ты профессиональный переводчик. Переведи следующий английский текст на русский язык, сохраняя структуру и форматирование."
          },
          {
            role: "user",
            content: `Переведи следующую статью на русский язык:\n\n${textToTranslate}`
          }
        ],
        temperature: 0.3,
      }),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      return NextResponse.json(
        { error: `Translation failed: ${openRouterResponse.statusText}` },
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

    const translation = aiResponse.choices[0].message.content

    return NextResponse.json({
      original: {
        title: parsedData.title,
        content: parsedData.content,
      },
      translation: translation,
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to translate article' },
      { status: 500 }
    )
  }
}

