export type ErrorType = 
  | 'article_not_found' // 404, статья не найдена
  | 'article_fetch_failed' // 500, 503, таймаут и другие ошибки загрузки
  | 'article_parse_failed' // Ошибка парсинга
  | 'ai_service_error' // Ошибка AI сервиса
  | 'image_generation_error' // Ошибка генерации изображения (410, 503)
  | 'api_key_missing' // Отсутствует API ключ
  | 'invalid_url' // Неверный URL
  | 'unknown_error' // Неизвестная ошибка

export interface ErrorInfo {
  type: ErrorType
  message: string
  friendlyMessage: string
}

/**
 * Преобразует ошибку API в дружественное сообщение
 */
export function handleApiError(error: any, response?: Response): ErrorInfo {
  // Ошибки загрузки статьи (404, 500, таймаут и т.п.)
  if (response) {
    if (response.status === 404) {
      return {
        type: 'article_not_found',
        message: 'Article not found',
        friendlyMessage: 'Не удалось загрузить статью по этой ссылке.',
      }
    }
    
    // Ошибка генерации изображения (410 - модель недоступна)
    if (response.status === 410) {
      // Проверяем, относится ли это к генерации изображений
      const errorMessage = error?.error || error?.message || ''
      if (errorMessage.includes('изображен') || errorMessage.includes('image') || errorMessage.includes('модель')) {
        return {
          type: 'image_generation_error',
          message: errorMessage || 'Image generation model unavailable',
          friendlyMessage: 'Модель генерации изображений временно недоступна. Попробуйте позже.',
        }
      }
      return {
        type: 'article_fetch_failed',
        message: 'Resource gone',
        friendlyMessage: 'Ресурс недоступен. Попробуйте позже.',
      }
    }
    
    // Ошибка генерации изображения (503 - модель загружается)
    if (response.status === 503) {
      const errorMessage = error?.error || error?.message || ''
      if (errorMessage.includes('изображен') || errorMessage.includes('image') || errorMessage.includes('loading')) {
        return {
          type: 'image_generation_error',
          message: errorMessage || 'Image generation service loading',
          friendlyMessage: 'Сервис генерации изображений загружается. Попробуйте через несколько секунд.',
        }
      }
      return {
        type: 'article_fetch_failed',
        message: 'Server error',
        friendlyMessage: 'Не удалось загрузить статью по этой ссылке.',
      }
    }
    
    if (response.status >= 500 || response.status === 504) {
      return {
        type: 'article_fetch_failed',
        message: 'Server error',
        friendlyMessage: 'Не удалось загрузить статью по этой ссылке.',
      }
    }
    
    if (response.status === 408 || response.status === 504) {
      return {
        type: 'article_fetch_failed',
        message: 'Timeout',
        friendlyMessage: 'Не удалось загрузить статью по этой ссылке.',
      }
    }
  }

  // Ошибки сети (таймаут, нет соединения и т.п.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'article_fetch_failed',
      message: error.message,
      friendlyMessage: 'Не удалось загрузить статью по этой ссылке.',
    }
  }

  // Ошибка парсинга
  if (error?.message?.includes('parse') || error?.error?.includes('parse')) {
    return {
      type: 'article_parse_failed',
      message: error.message || error.error,
      friendlyMessage: 'Не удалось обработать содержимое статьи. Проверьте, что ссылка ведет на статью.',
    }
  }

  // Ошибка AI сервиса
  if (error?.message?.includes('AI') || error?.error?.includes('AI') || error?.message?.includes('OpenRouter')) {
    return {
      type: 'ai_service_error',
      message: error.message || error.error,
      friendlyMessage: 'Ошибка при обработке статьи AI. Попробуйте позже.',
    }
  }

  // Отсутствует API ключ
  if (error?.message?.includes('API_KEY') || error?.error?.includes('API_KEY')) {
    return {
      type: 'api_key_missing',
      message: error.message || error.error,
      friendlyMessage: 'Ошибка конфигурации сервера. Обратитесь к администратору.',
    }
  }

  // Неверный URL
  if (error?.message?.includes('URL') || error?.error?.includes('URL')) {
    return {
      type: 'invalid_url',
      message: error.message || error.error,
      friendlyMessage: 'Неверный формат ссылки. Убедитесь, что ссылка начинается с http:// или https://',
    }
  }

  // Неизвестная ошибка
  return {
    type: 'unknown_error',
    message: error?.message || error?.error || 'Unknown error',
    friendlyMessage: 'Произошла ошибка. Попробуйте еще раз или проверьте ссылку.',
  }
}

