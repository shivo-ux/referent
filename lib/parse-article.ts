interface ParseResult {
  date: string | null
  title: string | null
  content: string | null
}

export async function parseArticle(url: string): Promise<ParseResult> {
  // Загружаем HTML страницы
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`)
  }

  const html = await response.text()
  
  // Динамический импорт cheerio для избежания проблем с SSR и Vercel
  const cheerioModule = await import('cheerio')
  const cheerio = (cheerioModule as any).default || cheerioModule
  
  if (!cheerio || typeof cheerio.load !== 'function') {
    throw new Error('Failed to load cheerio library')
  }
  const $ = cheerio.load(html)

  // Ищем заголовок статьи
  let title: string | null = null
  
  // Приоритетные селекторы для заголовка
  const titleSelectors = [
    'h1.entry-title',
    'h1.post-title',
    'h1.article-title',
    'article h1',
    '.post h1',
    '.content h1',
    '.entry-content h1',
    'main h1',
    'article header h1',
    'h1',
    'title'
  ]

  for (const selector of titleSelectors) {
    const found = $(selector).first()
    if (found.length > 0) {
      title = found.text().trim()
      // Если это meta title, берем его содержимое
      if (selector === 'title') {
        title = found.text().trim()
      }
      if (title) break
    }
  }

  // Ищем дату публикации
  let date: string | null = null
  
  const dateSelectors = [
    'time[datetime]',
    'time',
    '.published-date',
    '.post-date',
    '.article-date',
    '.entry-date',
    '.date',
    '[itemprop="datePublished"]',
    'meta[property="article:published_time"]',
    'meta[name="pubdate"]',
    'meta[name="publish-date"]'
  ]

  for (const selector of dateSelectors) {
    const found = $(selector).first()
    if (found.length > 0) {
      // Пробуем взять из атрибута datetime
      date = found.attr('datetime') || found.attr('content') || found.text().trim()
      if (date) break
    }
  }

  // Ищем основной контент статьи
  let content: string | null = null
  
  const contentSelectors = [
    'article',
    '.post',
    '.content',
    '.entry-content',
    '.article-content',
    '.post-content',
    '.main-content',
    '[role="article"]',
    'main article',
    '.entry',
    '.article-body'
  ]

  for (const selector of contentSelectors) {
    const found = $(selector).first()
    if (found.length > 0) {
      // Удаляем ненужные элементы (навигация, реклама, комментарии и т.д.)
      found.find('nav, .nav, .navigation, .menu, .sidebar, .ad, .advertisement, .ads, script, style, .comments, .comment-section, .social-share, .share-buttons').remove()
      
      // Получаем текстовое содержимое
      content = found.text().trim()
      
      // Если контент достаточно длинный (больше 200 символов), считаем его валидным
      if (content && content.length > 200) {
        break
      }
    }
  }

  // Если не нашли через селекторы, пробуем main
  if (!content) {
    const main = $('main').first()
    if (main.length > 0) {
      main.find('nav, .nav, header, footer, script, style').remove()
      content = main.text().trim()
    }
  }

  return {
    date: date || null,
    title: title || null,
    content: content || null,
  }
}

