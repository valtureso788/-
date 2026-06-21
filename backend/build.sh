#!/usr/bin/env bash
# Build script для Render

set -o errexit  # прерывать при ошибках

pip install -r requirements.txt
python manage.py migrate --no-input
python manage.py collectstatic --no-input
python manage.py seed_data
