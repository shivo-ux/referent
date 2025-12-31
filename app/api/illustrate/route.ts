import { NextRequest, NextResponse } from 'next/server'
import { parseArticle } from '@/lib/parse-article'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    // Валидация входных данных
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY

    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      )
    }

    if (!huggingFaceApiKey) {
      return NextResponse.json(
        { error: 'HUGGING_FACE_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Парсим статью напрямую
    let parsedData
    try {
      parsedData = await parseArticle(url)
    } catch (parseError) {
      console.error('Parse error:', parseError)
      const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse article'
      // Если ошибка связана с загрузкой URL, возвращаем соответствующий статус
      if (errorMessage.includes('Failed to fetch URL')) {
        return NextResponse.json(
          { error: errorMessage },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    if (!parsedData || !parsedData.content) {
      return NextResponse.json(
        { error: 'Article content not found' },
        { status: 400 }
      )
    }

    // Подготавливаем текст для создания промпта
    let articleContent = ''
    if (parsedData.title) {
      articleContent += `Заголовок: ${parsedData.title}\n\n`
    }
    articleContent += parsedData.content

    // Ограничиваем размер текста для экономии токенов
    const maxLength = 4000
    if (articleContent.length > maxLength) {
      articleContent = articleContent.substring(0, maxLength) + '...'
    }

    // Шаг 1: Генерируем промпт для изображения через OpenRouter
    const promptGenerationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.nextUrl.origin,
        'X-Title': 'Referent - Image Prompt Generator',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по созданию промптов для генерации изображений. Создай краткий, но детальный промпт на английском языке для генерации иллюстрации к статье. Промпт должен быть описательным, включать стиль (реалистичный, цифровой арт, фотография и т.д.), основные элементы и атмосферу. Промпт должен быть не более 200 символов.',
          },
          {
            role: 'user',
            content: `Создай промпт для генерации изображения к этой статье. Промпт должен быть на английском языке, кратким (до 200 символов) и описательным:\n\n${articleContent}`,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!promptGenerationResponse.ok) {
      const errorText = await promptGenerationResponse.text()
      console.error('OpenRouter API error:', errorText)
      return NextResponse.json(
        { error: `Failed to generate image prompt: ${promptGenerationResponse.statusText}` },
        { status: promptGenerationResponse.status }
      )
    }

    const promptData = await promptGenerationResponse.json()

    if (!promptData.choices || !promptData.choices[0] || !promptData.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from prompt generation service' },
        { status: 500 }
      )
    }

    const imagePrompt = promptData.choices[0].message.content.trim()

    // Шаг 2: Генерируем изображение через Hugging Face Inference API
    // Используем стабильную модель runwayml/stable-diffusion-v1-5
    const huggingFaceResponse = await fetch(
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${huggingFaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imagePrompt,
        }),
      }
    )

    if (!huggingFaceResponse.ok) {
      const errorText = await huggingFaceResponse.text()
      console.error('Hugging Face API error:', errorText)
      console.error('Status:', huggingFaceResponse.status)
      
      // Если модель еще загружается (503), возвращаем ошибку с рекомендацией подождать
      if (huggingFaceResponse.status === 503) {
        return NextResponse.json(
          { error: 'Image generation service is currently loading. Please try again in a few moments.' },
          { status: 503 }
        )
      }
      
      // Если модель недоступна (410), возвращаем понятное сообщение
      if (huggingFaceResponse.status === 410) {
        return NextResponse.json(
          { error: 'Image generation model is no longer available. Please try again later or contact support.' },
          { status: 410 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to generate image: ${huggingFaceResponse.statusText}. Details: ${errorText.substring(0, 200)}` },
        { status: huggingFaceResponse.status }
      )
    }

    // Получаем изображение как ArrayBuffer
    const imageBuffer = await huggingFaceResponse.arrayBuffer()
    
    // Конвертируем в base64
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:image/png;base64,${base64Image}`

    return NextResponse.json({
      image: imageDataUrl,
      prompt: imagePrompt,
      original: {
        title: parsedData.title,
        content: parsedData.content,
      },
    })
  } catch (error) {
    console.error('Image generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

