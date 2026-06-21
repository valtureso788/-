@echo off
echo ========================================
echo  ЕИС «Контроль поручений» — Запуск
echo ========================================
echo.

:: Запуск Django бэкенда
echo [1/2] Запускаю Django сервер (порт 8000)...
start "Django Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 8000"

:: Небольшая пауза
timeout /t 2 /nobreak >nul

:: Запуск Vite фронтенда
echo [2/2] Запускаю Vite фронтенд (порт 5173)...
start "Vite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Пауза перед открытием браузера
timeout /t 4 /nobreak >nul

:: Открываем браузер
echo Открываю браузер...
start http://localhost:5173

echo.
echo ========================================
echo  ЕИС «Контроль поручений» запущена!
echo  Фронтенд: http://localhost:5173
echo  Бэкенд API: http://localhost:8000/api/
echo  Django Admin: http://localhost:8000/admin/
echo ========================================
echo.
echo Для остановки закройте оба окна сервера.
pause
