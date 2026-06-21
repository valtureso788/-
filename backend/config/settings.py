"""
Django settings для ЕИС «Контроль поручений».
"""
from pathlib import Path
from datetime import timedelta
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
# Корень репозитория (на уровень выше backend/)
REPO_DIR = BASE_DIR.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ais-appeals-secret-key-change-in-production-2026')

# Render автоматически выставляет RENDER=true
IS_RENDER = os.environ.get('RENDER', '') == 'true'

DEBUG = not IS_RENDER and (os.environ.get('DEBUG', 'True') == 'True')

# ALLOWED_HOSTS
RENDER_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '')
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
if IS_RENDER:
    ALLOWED_HOSTS += ['.onrender.com']
    if RENDER_HOSTNAME:
        ALLOWED_HOSTS.append(RENDER_HOSTNAME)
_extra_hosts = os.environ.get('ALLOWED_HOSTS', '')
if _extra_hosts:
    ALLOWED_HOSTS += [h.strip() for h in _extra_hosts.split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local
    'apps.users',
    'apps.appeals',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            # index.html из собранного React-приложения
            REPO_DIR / 'frontend' / 'dist',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# База данных — PostgreSQL на проде, SQLite локально
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise: раздаём статику Django + assets React-приложения (/assets/...)
# WHITENOISE_ROOT раздаёт файлы с корня сайта (без /static/ префикса)
# Это позволяет React-бандлу работать по путям /assets/index-xxx.js
WHITENOISE_ROOT = REPO_DIR / 'frontend' / 'dist'

# Django 4.2+ / 6.0: используем STORAGES вместо устаревшего STATICFILES_STORAGE
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

RESPONSES_ROOT = BASE_DIR / 'responses'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# CORS
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
if FRONTEND_URL:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)
if IS_RENDER:
    CORS_ALLOWED_ORIGIN_REGEXES = [r'^https://.*\.onrender\.com$']

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
if IS_RENDER:
    CSRF_TRUSTED_ORIGINS.append('https://*.onrender.com')
if FRONTEND_URL and FRONTEND_URL.startswith('http'):
    CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)
