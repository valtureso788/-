# АИС «Обращения»
### Автоматизированная информационная система учёта обращений граждан

> Дипломный проект (практика) — Администрация района  
> Стек: **Django 6 + React 18 + Vite**

---

## 🚀 Быстрый старт

### Способ 1 — один клик (Windows)
Дважды кликнуть на `start.bat` в корне проекта.

### Способ 2 — вручную

#### Требования
- Python 3.10+
- Node.js 18+
- Git

#### 1. Клонировать репозиторий
```bash
git clone https://github.com/valtureso788/-
cd -
```

#### 2. Бэкенд (Django)
```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # загружает тестовые данные
python manage.py runserver
```
> Сервер на http://localhost:8000

#### 3. Фронтенд (React + Vite) — новый терминал
```powershell
cd frontend
npm install
npm run dev
```
> Приложение на http://localhost:5173

---

## 🔑 Учётные записи

| Логин | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin123` | Администратор |
| `operator` | `operator123` | Оператор (секретарь) |
| `executor1` | `executor123` | Исполнитель — ЖКХ |
| `executor2` | `executor123` | Исполнитель — Транспорт |
| `executor3` | `executor123` | Исполнитель — Соцзащита |

---

## 📋 Страницы

| URL | Роль | Описание |
|-----|------|----------|
| `/` | Все | Публичная форма подачи обращения |
| `/status` | Все | Проверка статуса по номеру |
| `/login` | Сотрудники | Вход в систему |
| `/dashboard` | Оператор, Админ | Дашборд со статистикой и графиками |
| `/appeals` | Оператор, Админ | Все обращения — таблица с фильтрами |
| `/my-appeals` | Исполнитель | Мои заявки, смена статуса |
| `localhost:8000/admin/` | Суперпользователь | Django Admin |

---

## 🛠️ Технологии

| Сторона | Технологии |
|---------|-----------|
| **Бэкенд** | Python 3.12, Django 6, DRF, SimpleJWT, python-docx |
| **Фронтенд** | React 18, Vite, React Router, Chart.js, Axios, Lucide |
| **БД** | SQLite (разработка) / PostgreSQL (продакшен) |

---

## 📁 Структура проекта

```
.
├── backend/
│   ├── apps/
│   │   ├── users/        # Модель пользователя, роли
│   │   └── appeals/      # Обращения, история, комментарии
│   ├── config/           # Настройки Django
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   └── src/
│       ├── pages/        # 6 страниц приложения
│       ├── components/   # AppealModal, StatusBadge, Timeline...
│       ├── context/      # AuthContext (JWT)
│       └── api/          # Axios с интерцепторами
├── start.bat             # Скрипт запуска Windows
└── README.md
```
