import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Upload, X, Building2 } from 'lucide-react'
import axios from 'axios'

const CATEGORIES = [
  { value: 'housing', label: 'ЖКХ' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'social', label: 'Соцзащита' },
  { value: 'education', label: 'Образование' },
  { value: 'ecology', label: 'Экология' },
  { value: 'other', label: 'Прочее' },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export default function PublicForm() {
  const [form, setForm] = useState({
    citizen_full_name: '',
    citizen_phone: '',
    citizen_address: '',
    citizen_email: '',
    category: '',
    subject: '',
    text: '',
  })
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragover, setDragover] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.citizen_full_name.trim()) e.citizen_full_name = 'Обязательное поле'
    if (!form.citizen_phone.trim()) e.citizen_phone = 'Обязательное поле'
    if (!form.citizen_address.trim()) e.citizen_address = 'Обязательное поле'
    if (!form.category) e.category = 'Выберите категорию'
    if (!form.subject.trim()) e.subject = 'Обязательное поле'
    if (!form.text.trim()) e.text = 'Обязательное поле'
    if (form.citizen_email && !/\S+@\S+\.\S+/.test(form.citizen_email)) e.citizen_email = 'Некорректный email'
    return e
  }

  const handleFile = (newFiles) => {
    const filtered = Array.from(newFiles).filter(f => ALLOWED_TYPES.includes(f.type))
    setFiles(prev => [...prev, ...filtered].slice(0, 5))
  }

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      files.forEach(f => fd.append('files', f))
      const { data } = await axios.post('/api/appeals/public/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
    } catch (err) {
      const serverErrors = err.response?.data || {}
      setErrors(serverErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: e => { setForm(f => ({...f, [key]: e.target.value})); setErrors(er => ({...er, [key]: ''})) },
    className: `form-input${errors[key] ? ' error' : ''}`,
  })

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-logo">
          <Building2 size={24} color="#fff" />
        </div>
        <div>
          <h1>Администрация района</h1>
          <p>АИС «Обращения» — Приём обращений граждан</p>
        </div>
        <Link to="/status" className="public-check-link">
          🔍 Проверить статус
        </Link>
      </header>

      <div className="public-main">
        <div className="public-form-card">
          {!result ? (
            <>
              <h2 className="public-form-title">Подача обращения</h2>
              <p className="public-form-desc">
                Заполните форму ниже. Ответ будет направлен в течение <strong>10 рабочих дней</strong>
                с момента регистрации. Поля, отмеченные <span style={{ color: 'var(--status-declined)' }}>*</span>, обязательны.
              </p>

              <form onSubmit={submit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      ФИО <span className="required">*</span>
                    </label>
                    <input {...field('citizen_full_name')} placeholder="Иванов Иван Иванович" />
                    {errors.citizen_full_name && <div className="form-error">{errors.citizen_full_name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Телефон <span className="required">*</span>
                    </label>
                    <input {...field('citizen_phone')} placeholder="+7 (900) 000-00-00" type="tel" />
                    {errors.citizen_phone && <div className="form-error">{errors.citizen_phone}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Адрес проживания <span className="required">*</span>
                    </label>
                    <input {...field('citizen_address')} placeholder="ул. Ленина, д. 1, кв. 1" />
                    {errors.citizen_address && <div className="form-error">{errors.citizen_address}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (для уведомлений)</label>
                    <input {...field('citizen_email')} placeholder="example@mail.ru" type="email" />
                    {errors.citizen_email && <div className="form-error">{errors.citizen_email}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Категория вопроса <span className="required">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={e => { setForm(f => ({...f, category: e.target.value})); setErrors(er => ({...er, category: ''})) }}
                      className={`form-select${errors.category ? ' error' : ''}`}
                    >
                      <option value="">— Выберите категорию —</option>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {errors.category && <div className="form-error">{errors.category}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Тема обращения <span className="required">*</span>
                    </label>
                    <input {...field('subject')} placeholder="Кратко опишите тему" />
                    {errors.subject && <div className="form-error">{errors.subject}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Текст обращения <span className="required">*</span>
                  </label>
                  <textarea
                    className={`form-textarea${errors.text ? ' error' : ''}`}
                    style={{ minHeight: 120 }}
                    placeholder="Подробно опишите суть вашего обращения..."
                    value={form.text}
                    onChange={e => { setForm(f => ({...f, text: e.target.value})); setErrors(er => ({...er, text: ''})) }}
                  />
                  {errors.text && <div className="form-error">{errors.text}</div>}
                </div>

                {/* Загрузка файлов */}
                <div className="form-group">
                  <label className="form-label">
                    Прикрепить файлы (до 5 файлов: JPG, PNG, PDF)
                  </label>
                  <div
                    className={`file-drop${dragover ? ' dragover' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragover(true) }}
                    onDragLeave={() => setDragover(false)}
                    onDrop={e => { e.preventDefault(); setDragover(false); handleFile(e.dataTransfer.files) }}
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <div className="file-drop-icon"><Upload size={28} /></div>
                    <div className="file-drop-text">Перетащите файлы или нажмите для выбора</div>
                    <div className="file-drop-hint">JPG, PNG, PDF · максимум 5 файлов</div>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files)}
                    />
                  </div>
                  {files.length > 0 && (
                    <div className="file-list">
                      {files.map((f, i) => (
                        <div key={i} className="file-item">
                          <span>📎</span>
                          <span className="file-item-name">{f.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {(f.size / 1024).toFixed(0)} КБ
                          </span>
                          <button type="button" className="file-remove" onClick={() => removeFile(i)}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}
                >
                  {submitting ? 'Отправка...' : '📨 Отправить обращение'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-card">
              <div className="success-icon">
                <CheckCircle size={36} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                Обращение зарегистрировано!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                Ваш регистрационный номер:
              </p>
              <div className="success-number">{result.registration_number}</div>
              <p className="success-message">{result.message}</p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setResult(null)}
                >
                  Подать ещё одно обращение
                </button>
                <Link to="/status" className="btn btn-secondary">
                  Проверить статус
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
