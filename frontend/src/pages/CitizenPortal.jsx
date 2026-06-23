import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, FileText, Clock, CheckCircle, AlertCircle, XCircle, User, Building2 } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const STATUS_DESCRIPTIONS = {
  new: 'Ваше обращение зарегистрировано и ожидает назначения исполнителя.',
  assigned: 'Обращение передано исполнителю.',
  in_progress: 'Исполнитель ведёт работу по вашему обращению.',
  on_site: 'Исполнитель выехал на место.',
  done: 'Работа по обращению выполнена. Ожидайте официального ответа.',
  declined: 'В рассмотрении обращения отказано.',
  closed: 'Обращение закрыто. Ответ направлен заявителю.',
}

export default function CitizenPortal() {
  const [mode, setMode] = useState('email') // 'email' | 'number'
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setResults(null)
    setSearched(false)

    if (mode === 'email' && !email.trim()) {
      setError('Введите email')
      return
    }
    if (mode === 'number' && !number.trim()) {
      setError('Введите номер обращения')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (mode === 'email') params.set('email', email.trim())
      else params.set('number', number.trim())

      const response = await fetch(`/api/appeals/citizen/?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка запроса')
        return
      }
      setResults(data.results || [])
      setSearched(true)
    } catch {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="citizen-portal">
      <header className="public-header" style={{ background: '#1e3a6a', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
          <div className="public-header-logo">
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: '16px', margin: 0, fontWeight: 700 }}>Администрация района</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: '3px 0 0' }}>Личный кабинет гражданина</p>
          </div>
        </Link>
        <Link to="/" className="public-check-link">← На главную</Link>
      </header>

      {/* Шапка */}
      <div className="citizen-hero">
        <div className="citizen-hero-content">
          <div className="citizen-logo">
            <FileText size={36} />
          </div>
          <h1 className="citizen-title">Личный кабинет гражданина</h1>
          <p className="citizen-subtitle">
            Найдите ваши обращения по email или регистрационному номеру
          </p>
        </div>
      </div>

      {/* Форма поиска */}
      <div className="citizen-search-section">
        <div className="citizen-search-card">
          {/* Переключатель режима */}
          <div className="citizen-tabs">
            <button
              className={`citizen-tab${mode === 'email' ? ' active' : ''}`}
              onClick={() => { setMode('email'); setResults(null); setError(''); setSearched(false) }}
              id="tab-email"
            >
              <User size={16} /> По email
            </button>
            <button
              className={`citizen-tab${mode === 'number' ? ' active' : ''}`}
              onClick={() => { setMode('number'); setResults(null); setError(''); setSearched(false) }}
              id="tab-number"
            >
              <Search size={16} /> По номеру
            </button>
          </div>

          <form onSubmit={handleSearch} className="citizen-form">
            {mode === 'email' ? (
              <div className="form-group">
                <label className="form-label">Email, указанный при подаче обращения</label>
                <input
                  id="citizen-email-input"
                  type="email"
                  className="form-input citizen-input"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Регистрационный номер обращения</label>
                <input
                  id="citizen-number-input"
                  type="text"
                  className="form-input citizen-input"
                  placeholder="2026-0001"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  pattern="\d{4}-\d{1,6}"
                  title="Формат: ГГГГ-XXXX"
                />
              </div>
            )}

            {error && (
              <div className="citizen-error">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              id="citizen-search-btn"
              type="submit"
              className="btn btn-primary citizen-search-btn"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner spinner-sm" /> Поиск...</>
              ) : (
                <><Search size={16} /> Найти обращения</>
              )}
            </button>
          </form>

          {/* Подсказка */}
          <p className="citizen-hint">
            <Clock size={13} />
            Срок рассмотрения обращения — 10 рабочих дней с момента регистрации
          </p>
        </div>
      </div>

      {/* Результаты */}
      {searched && (
        <div className="citizen-results">
          {results.length === 0 ? (
            <div className="citizen-empty">
              <XCircle size={48} className="citizen-empty-icon" />
              <h3>Обращения не найдены</h3>
              <p>
                {mode === 'email'
                  ? 'По указанному email обращения не найдены. Проверьте правильность адреса.'
                  : 'Обращение с указанным номером не найдено.'}
              </p>
            </div>
          ) : (
            <>
              <div className="citizen-results-header">
                <CheckCircle size={20} className="citizen-results-icon" />
                <span>Найдено обращений: <strong>{results.length}</strong></span>
              </div>

              <div className="citizen-cards">
                {results.map((appeal) => (
                  <div key={appeal.registration_number} className="citizen-card">
                    {/* Шапка карточки */}
                    <div className="citizen-card-header">
                      <div className="citizen-card-number">
                        <span className="citizen-reg-label">Рег. номер</span>
                        <span className="citizen-reg-number">{appeal.registration_number}</span>
                      </div>
                      <StatusBadge status={appeal.status} />
                    </div>

                    {/* Тема */}
                    <div className="citizen-card-subject">{appeal.subject}</div>

                    {/* Статус-прогресс */}
                    <div className="citizen-progress-bar">
                      {['new', 'assigned', 'in_progress', 'done', 'closed'].map((s, i) => {
                        const statuses = ['new', 'assigned', 'in_progress', 'done', 'closed']
                        const currentIdx = statuses.indexOf(appeal.status)
                        const isActive = i <= currentIdx
                        const isCurrent = s === appeal.status
                        return (
                          <div
                            key={s}
                            className={`progress-step ${isActive ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                          />
                        )
                      })}
                    </div>

                    {/* Описание статуса */}
                    <p className="citizen-status-desc">
                      {STATUS_DESCRIPTIONS[appeal.status] || appeal.status_display}
                    </p>

                    {/* Мета-данные */}
                    <div className="citizen-card-meta">
                      <div className="citizen-meta-item">
                        <span className="citizen-meta-label">Категория</span>
                        <span className="citizen-meta-value">{appeal.category}</span>
                      </div>
                      <div className="citizen-meta-item">
                        <span className="citizen-meta-label">Подано</span>
                        <span className="citizen-meta-value">{fmtDate(appeal.created_at)}</span>
                      </div>
                      <div className="citizen-meta-item">
                        <span className="citizen-meta-label">Срок</span>
                        <span className={`citizen-meta-value ${appeal.is_overdue ? 'text-danger' : ''}`}>
                          {fmtDate(appeal.deadline)}
                          {appeal.is_overdue && ' ⚠ Просрочено'}
                        </span>
                      </div>
                      <div className="citizen-meta-item">
                        <span className="citizen-meta-label">Обновлено</span>
                        <span className="citizen-meta-value">{fmtDate(appeal.updated_at)}</span>
                      </div>
                    </div>

                    {/* Текст ответа — если есть */}
                    {appeal.resolution_text && (
                      <div className="citizen-resolution">
                        <div className="citizen-resolution-label">
                          <CheckCircle size={14} /> Ответ
                        </div>
                        <p className="citizen-resolution-text">{appeal.resolution_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Инструкция внизу */}
      {!searched && (
        <div className="citizen-info">
          <div className="citizen-info-grid">
            <div className="citizen-info-card">
              <FileText size={24} className="citizen-info-icon" />
              <h4>Подача обращения</h4>
              <p>Обратитесь через публичную форму на главной странице без регистрации</p>
            </div>
            <div className="citizen-info-card">
              <Clock size={24} className="citizen-info-icon" />
              <h4>Срок рассмотрения</h4>
              <p>Обращения рассматриваются в течение 10 рабочих дней</p>
            </div>
            <div className="citizen-info-card">
              <CheckCircle size={24} className="citizen-info-icon" />
              <h4>Отслеживание</h4>
              <p>Проверяйте статус здесь или на странице «Проверить статус»</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
