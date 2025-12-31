'use client'

import { useState, useRef, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { handleApiError, type ErrorInfo } from '@/lib/error-handler'
import { AlertCircle, Copy, X } from 'lucide-react'

type ActionType = 'summary' | 'theses' | 'telegram' | 'translate' | 'illustrate' | null

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [processStatus, setProcessStatus] = useState<string | null>(null)
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleClear = () => {
    setUrl('')
    setResult('')
    setImageUrl(null)
    setImagePrompt(null)
    setError(null)
    setActiveAction(null)
    setProcessStatus(null)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Автоматическая прокрутка к результатам после успешной генерации
  useEffect(() => {
    if ((result || imageUrl) && !loading && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result, imageUrl, loading])

  const handleTranslate = async () => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    setLoading(true)
    setActiveAction('translate')
    setResult('')
    setError(null)
    setProcessStatus('Загружаю статью...')

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorInfo = handleApiError(errorData, response)
        setError(errorInfo)
        setProcessStatus(null)
        return
      }

      setProcessStatus('Перевожу статью...')
      
      const data = await response.json()
      
      // Выводим перевод
      let resultText = ''
      if (data.translation) {
        resultText = data.translation
      } else {
        const errorInfo = handleApiError({ error: 'Translation not received' })
        setError(errorInfo)
        setProcessStatus(null)
        return
      }
      
      setResult(resultText)
      setError(null)
      setProcessStatus(null)
    } catch (error) {
      const errorInfo = handleApiError(error)
      setError(errorInfo)
      setProcessStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: ActionType, actionName: string) => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    // Проверяем, что action является одним из поддерживаемых для AI обработки
    if (action !== 'summary' && action !== 'theses' && action !== 'telegram') {
      alert('Неподдерживаемое действие')
      return
    }

    setLoading(true)
    setActiveAction(action)
    setResult('')
    setImageUrl(null)
    setImagePrompt(null)
    setError(null)
    setProcessStatus('Загружаю статью...')

    try {
      // Вызываем универсальный API endpoint для AI обработки
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, action }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorInfo = handleApiError(errorData, response)
        setError(errorInfo)
        setProcessStatus(null)
        return
      }

      setProcessStatus('Обрабатываю с помощью AI...')
      
      const data = await response.json()
      
      // Выводим результат от AI
      if (data.result) {
        setResult(data.result)
        setError(null)
      } else {
        const errorInfo = handleApiError({ error: 'AI result not received' })
        setError(errorInfo)
        setProcessStatus(null)
        return
      }
      setProcessStatus(null)
    } catch (error) {
      const errorInfo = handleApiError(error)
      setError(errorInfo)
      setProcessStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleIllustrate = async () => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    setLoading(true)
    setActiveAction('illustrate')
    setResult('')
    setImageUrl(null)
    setImagePrompt(null)
    setError(null)
    setProcessStatus('Загружаю статью...')

    try {
      const response = await fetch('/api/illustrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorInfo = handleApiError(errorData, response)
        setError(errorInfo)
        setProcessStatus(null)
        return
      }

      setProcessStatus('Генерирую изображение...')
      
      const data = await response.json()
      
      if (data.image) {
        setImageUrl(data.image)
        setImagePrompt(data.prompt || null)
        setError(null)
      } else {
        const errorInfo = handleApiError({ error: 'Image not received' })
        setError(errorInfo)
        setProcessStatus(null)
        return
      }
      setProcessStatus(null)
    } catch (error) {
      const errorInfo = handleApiError(error)
      setError(errorInfo)
      setProcessStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Мой личный референт
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Анализ англоязычных статей с помощью AI
          </p>

          {/* Поле ввода URL */}
          <div className="mb-6">
            <label 
              htmlFor="article-url" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              URL англоязычной статьи
            </label>
            <div className="flex gap-2">
              <input
                id="article-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Введите URL статьи, например: https://example.com/article"
                className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
              />
              <button
                onClick={handleClear}
                disabled={loading}
                title="Очистить все поля и результаты"
                className="px-3 sm:px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 px-1">
              Укажите ссылку на англоязычную статью
            </p>
          </div>

          {/* Кнопка перевода */}
          <div className="mb-4">
            <button
              onClick={handleTranslate}
              disabled={loading}
              title="Перевести статью с английского на русский язык"
              className={`w-full px-4 sm:px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                loading && activeAction !== 'translate'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : activeAction === 'translate'
                  ? 'bg-purple-600 shadow-lg'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {loading && activeAction === 'translate' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Перевод статьи...
                </span>
              ) : (
                'Перевести статью'
              )}
            </button>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handleAction('summary', 'О чем статья?')}
              disabled={loading}
              title="Получить краткое резюме статьи (2-3 абзаца)"
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                loading && activeAction !== 'summary'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : activeAction === 'summary'
                  ? 'bg-indigo-600 shadow-lg'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {loading && activeAction === 'summary' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </span>
              ) : (
                'О чем статья?'
              )}
            </button>

            <button
              onClick={() => handleAction('theses', 'Тезисы')}
              disabled={loading}
              title="Выделить 5-7 основных тезисов статьи в виде списка"
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                loading && activeAction !== 'theses'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : activeAction === 'theses'
                  ? 'bg-indigo-600 shadow-lg'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {loading && activeAction === 'theses' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </span>
              ) : (
                'Тезисы'
              )}
            </button>

            <button
              onClick={() => handleAction('telegram', 'Пост для Telegram')}
              disabled={loading}
              title="Создать структурированный пост для Telegram с эмодзи (до 1000 символов)"
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                loading && activeAction !== 'telegram'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : activeAction === 'telegram'
                  ? 'bg-indigo-600 shadow-lg'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {loading && activeAction === 'telegram' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </span>
              ) : (
                'Пост для Telegram'
              )}
            </button>

            <button
              onClick={handleIllustrate}
              disabled={loading}
              title="Сгенерировать иллюстрацию к статье на основе ее содержания"
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                loading && activeAction !== 'illustrate'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : activeAction === 'illustrate'
                  ? 'bg-pink-600 shadow-lg'
                  : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              {loading && activeAction === 'illustrate' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Генерация...
                </span>
              ) : (
                'Иллюстрация'
              )}
            </button>
          </div>

          {/* Блок статуса процесса */}
          {processStatus && (
            <div className="mt-4 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-3 flex items-center">
                <svg className="animate-spin h-5 w-5 text-blue-600 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-800 text-xs sm:text-sm font-medium break-words">{processStatus}</span>
              </div>
            </div>
          )}

          {/* Блок ошибок */}
          {error && (
            <div className="mt-4 mb-4">
              <Alert variant="destructive" className="px-3 sm:px-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <AlertDescription className="text-sm sm:text-base break-words">
                  {error.friendlyMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Блок для отображения результата */}
          <div className="mt-6" ref={resultRef}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Результат
              </label>
              {result && !loading && activeAction !== 'illustrate' && (
                <button
                  onClick={handleCopy}
                  title="Копировать результат"
                  className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4 flex-shrink-0" />
                  <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              )}
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 min-h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center px-4">
                    <svg className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 text-sm sm:text-base">Генерация результата...</p>
                  </div>
                </div>
              ) : imageUrl ? (
                <div className="bg-white p-3 sm:p-4 rounded border border-gray-300">
                  <img 
                    src={imageUrl} 
                    alt="Сгенерированная иллюстрация" 
                    className="w-full h-auto rounded-lg mb-4 max-h-[600px] object-contain"
                  />
                  {imagePrompt && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Промпт для генерации:</p>
                      <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded break-words">{imagePrompt}</p>
                    </div>
                  )}
                </div>
              ) : result ? (
                <div className={`whitespace-pre-wrap text-gray-800 leading-relaxed bg-white p-3 sm:p-4 rounded border border-gray-300 overflow-auto max-h-[600px] break-words ${
                  activeAction === 'translate' || activeAction === 'summary' || activeAction === 'theses' || activeAction === 'telegram'
                    ? 'text-sm sm:text-base'
                    : 'font-mono text-xs sm:text-sm'
                }`}>
                  {result}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 px-4">
                  <p className="text-sm sm:text-base text-center">Результат будет отображен здесь после выбора действия</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
