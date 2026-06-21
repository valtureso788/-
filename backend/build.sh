#!/usr/bin/env bash
# Build script для Render — фронтенд уже собран и закоммичен в dist/

set -o errexit

echo "=== [1/3] Python зависимости ==="
pip install -r requirements.txt

echo "=== [2/3] Django: миграции + статика ==="
python manage.py migrate --no-input
python manage.py collectstatic --no-input

echo "=== [3/3] Тестовые данные ==="
python manage.py seed_data

echo "✅ Сборка завершена!"
