'use client'

import { useState } from 'react'

type ActionType = 'summary' | 'theses' | 'telegram' | 'translate' | null

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  const handleParse = async () => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    setLoading(true)
    setActiveAction(null)
    setResult('')

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при парсинге статьи')
      }

      const data = await response.json()
      
      // Форматируем JSON для красивого отображения
      const jsonResult = JSON.stringify(data, null, 2)
      setResult(jsonResult)
    } catch (error) {
      setResult(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTranslate = async () => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    setLoading(true)
    setActiveAction('translate')
    setResult('')

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при переводе статьи')
      }

      const data = await response.json()
      
      // Выводим перевод
      let resultText = ''
      if (data.translation) {
        resultText = data.translation
      } else {
        resultText = 'Перевод не получен'
      }
      
      setResult(resultText)
    } catch (error) {
      setResult(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: ActionType, actionName: string) => {
    if (!url.trim()) {
      alert('Пожалуйста, введите URL статьи')
      return
    }

    setLoading(true)
    setActiveAction(action)
    setResult('')

    // Сначала парсим статью
    try {
      const parseResponse = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!parseResponse.ok) {
        throw new Error('Ошибка при парсинге статьи')
      }

      const parsedData = await parseResponse.json()
      
      // Здесь будет подключение к AI и выполнение действия на основе parsedData
      // Пока что показываем результат парсинга
      const jsonResult = JSON.stringify(parsedData, null, 2)
      setResult(`Результат парсинга для действия "${actionName}":\n\n${jsonResult}\n\nФункциональность AI будет добавлена позже.`)
    } catch (error) {
      setResult(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Referent
          </h1>
          <p className="text-gray-600 mb-8">
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
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Кнопки парсинга и перевода */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={handleParse}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
                loading && activeAction !== null && activeAction !== 'translate'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading && activeAction === null ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Парсинг статьи...
                </span>
              ) : (
                'Парсить статью'
              )}
            </button>

            <button
              onClick={handleTranslate}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => handleAction('summary', 'О чем статья?')}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
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
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
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
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
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
          </div>

          {/* Блок для отображения результата */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Результат
            </label>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 md:p-6 min-h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Генерация результата...</p>
                  </div>
                </div>
              ) : result ? (
                <div className={`whitespace-pre-wrap text-gray-800 leading-relaxed bg-white p-4 rounded border border-gray-300 overflow-auto max-h-[600px] ${
                  activeAction === 'translate' ? 'text-base' : 'font-mono text-sm'
                }`}>
                  {result}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <p>Результат будет отображен здесь после выбора действия</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
