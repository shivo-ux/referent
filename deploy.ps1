# Скрипт для деплоя на Vercel

Write-Host "=== Деплой проекта на Vercel ===" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Устанавливаю Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Проверка авторизации
Write-Host "Проверяю авторизацию в Vercel..." -ForegroundColor Yellow
$authCheck = vercel whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Требуется авторизация в Vercel." -ForegroundColor Yellow
    Write-Host "Откроется браузер для авторизации через GitHub..." -ForegroundColor Cyan
    Write-Host ""
    vercel login
}

# Деплой проекта
Write-Host ""
Write-Host "Запускаю деплой на Vercel..." -ForegroundColor Green
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Деплой успешно завершен!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Ошибка при деплое" -ForegroundColor Red
    Write-Host "Попробуйте выполнить команду вручную: vercel --prod" -ForegroundColor Yellow
}

