# Деплой на бесплатный хостинг (Render)

Проект настроен для развёртывания через [Render Blueprint](https://render.com/docs/infrastructure-as-code) — один клик из GitHub.

**Что получится:**

| Компонент | Сервис | URL |
|-----------|--------|-----|
| Фронтенд (React) | Render Static Site | `https://eis-frontend.onrender.com` |
| Бэкенд (Django API) | Render Web Service | `https://eis-backend.onrender.com` |
| База данных | Render PostgreSQL (free) | внутреннее подключение |

Всё бесплатно в рамках [free tier Render](https://render.com/docs/free).

---

## Быстрый деплой (≈10 минут)

### 1. Запушьте код на GitHub

Если вы ещё не закоммитили изменения в `render.yaml`:

```bash
git add render.yaml backend frontend
git commit -m "Настройка бесплатного деплоя на Render"
git push origin master
```

### 2. Создайте аккаунт Render

1. Откройте [dashboard.render.com](https://dashboard.render.com/)
2. Войдите через **GitHub**

### 3. Запустите Blueprint

1. Нажмите **New +** → **Blueprint**
2. Подключите репозиторий: `valtureso788/-`
3. Render прочитает файл `render.yaml` и предложит создать 3 ресурса:
   - `eis-db` — PostgreSQL
   - `eis-backend` — Django API
   - `eis-frontend` — React SPA
4. Нажмите **Apply**

Деплой займёт 10–15 минут. Следите за логами в панели Render.

### 4. Откройте приложение

После успешного деплоя откройте URL сервиса **eis-frontend** (вкладка сервиса → ссылка вверху).

**Тестовые логины** (создаются командой `seed_data` при первом деплое):

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | Администратор |
| operator | operator123 | Оператор |
| executor1 | executor123 | Исполнитель |

---

## Важные ограничения бесплатного тарифа

1. **Засыпание** — бэкенд «засыпает» после 15 минут без запросов. Первый запрос после простоя может занять **30–60 секунд** (cold start).
2. **База данных** — бесплатная PostgreSQL на Render действует **30 дней**, затем нужно обновить тариф или перенести БД на [Neon](https://neon.tech) (постоянный free tier).
3. **Файлы** — загруженные вложения хранятся на диске сервера и **сбрасываются** при перезапуске/передеплое.

---

## Альтернатива: фронтенд на Vercel

Если фронтенд на Render не собирается, разверните его на [Vercel](https://vercel.com):

1. [vercel.com/new](https://vercel.com/new) → Import → `valtureso788/-`
2. **Root Directory:** `frontend`
3. **Environment Variable:** `VITE_API_URL` = `https://eis-backend.onrender.com`
4. Deploy

После деплоя добавьте URL фронтенда в `FRONTEND_URL` бэкенда на Render.

---

## Постоянная бесплатная БД (Neon)

1. Создайте проект на [neon.tech](https://neon.tech)
2. Скопируйте Connection string (PostgreSQL)
3. В Render → **eis-backend** → **Environment** → замените `DATABASE_URL`

---

## Обновление после изменений

```bash
git push origin master
```

Render передеплоит автоматически (если включён Auto-Deploy).
