#!/usr/bin/env bash
# Build script для Render — собирает фронтенд и настраивает Django

set -o errexit  # прерывать при любой ошибке

echo "=== Устанавливаем Python зависимости ==="
pip install -r requirements.txt

echo "=== Собираем React фронтенд ==="
cd ../frontend
npm install
npm run build
cd ../backend

echo "=== Применяем миграции Django ==="
python manage.py migrate --no-input

echo "=== Собираем статику Django ==="
python manage.py collectstatic --no-input

echo "=== Загружаем тестовые данные ==="
python manage.py seed_data

echo "=== Готово! ==="
