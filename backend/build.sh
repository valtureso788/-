#!/usr/bin/env bash
# Build script для Render

set -o errexit  # прерывать при любой ошибке

echo "=== [1/5] Python зависимости ==="
pip install -r requirements.txt

echo "=== [2/5] Проверяем Node.js (нужен >= 18 для Vite 8) ==="
# Render Python-сервис может иметь старый Node — грузим нужную версию через nvm
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    nvm install 20 --no-progress
    nvm use 20
    echo "nvm: Node $(node -v), npm $(npm -v)"
else
    echo "nvm не найден, используем системный Node: $(node -v 2>/dev/null || echo 'не установлен')"
fi

echo "=== [3/5] Собираем React фронтенд ==="
cd ../frontend
npm ci --prefer-offline 2>/dev/null || npm install
npm run build
cd ../backend

echo "=== [4/5] Django: миграции + статика ==="
python manage.py migrate --no-input
python manage.py collectstatic --no-input

echo "=== [5/5] Тестовые данные ==="
python manage.py seed_data

echo "✅ Сборка завершена!"
