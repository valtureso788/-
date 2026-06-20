import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import StatusBadge from './StatusBadge'
import Timeline from './Timeline'

const STATUSES = [
  { value: 'new', label: 'Новое' },
  { value: 'assigned', label: 'Назначено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'on_site', label: 'Выезд на место' },
  { value: 'done', label: 'Исполнено' },
  { value: 'declined', label: 'Отказ' },
  { value: 'closed', label: 'Закрыто' },
]

const CATEGORIES = [
  { value: 'housing', label: 'ЖКХ' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'social', label: 'Соцзащита' },
  { value: 'education', label: 'Образование' },
  { value: 'ecology', label: 'Экология' },
  { value: 'other', label: 'Прочее' },
]

export default function AppealModal({ appeal, executors = [], onClose, onSaved, userRole }) {
  const [form, setForm] = useState({
    status: appeal.status,
    assigned_to: appeal.assigned_to || '',
    resolution_text: appeal.resolution_text || '',
    citizen_full_name: appeal.citizen_full_name,
    citizen_phone: appeal.citizen_phone,
    citizen_address: appeal.citizen_address,
    category: appeal.category,
    subject: appeal.subject,
  })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingDoc, setGeneratingDoc] = useState(false)
  const [tab, setTab] = useState('details') // details | history | comments

  const isEditable = userRole === 'operator' || userRole === 'admin'

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.assigned_to) delete payload.assigned_to
      await api.patch(`/appeals/${appeal.id}/`, payload)
      toast.success('Сохранено')
      onSaved()
      onClose()
    } catch (e) {
      toast.error('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const addComment = async () => {
    if (!comment.trim()) return
    try {
      await api.post(`/appeals/${appeal.id}/comments/`, { text: comment })
      toast.success('Комментарий добавлен')
      setComment('')
    } catch {
      toast.error('Ошибка')
    }
  }

  const generateDoc = async () => {
    if (!form.resolution_text.trim()) {
      toast.error('Заполните текст решения перед генерацией ответа')
      return
    }
    setGeneratingDoc(true)
    try {
      // Сначала сохраняем
      await api.patch(`/appeals/${appeal.id}/`, { resolution_text: form.resolution_text })
      // Потом скачиваем
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/appeals/${appeal.id}/generate-response/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Ошибка генерации')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response_${appeal.registration_number}.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Файл ответа скачан')
    } catch {
      toast.error('Ошибка генерации документа')
    } finally {
      setGeneratingDoc(false)
    }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              Обращение {appeal.registration_number}
              {appeal.is_overdue && <span className="overdue-tag">ПРОСРОЧЕНО</span>}
            </div>
            <div className="modal-subtitle">
              {appeal.citizen_full_name} · {fmtDate(appeal.created_at)}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0 }}>
          {['details', 'history', 'comments'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t === 'details' ? 'Детали' : t === 'history' ? 'История' : 'Комментарии'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'details' && (
            <div>
              {/* Статус и исполнитель */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Статус</label>
                  {isEditable ? (
                    <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  ) : (
                    <div style={{ marginTop: 8 }}><StatusBadge status={form.status} /></div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Исполнитель</label>
                  {isEditable ? (
                    <select className="form-select" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))}>
                      <option value="">— Не назначен —</option>
                      {executors.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.full_name}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      {appeal.assigned_to_detail?.full_name || '—'}
                    </div>
                  )}
                </div>
              </div>

              <div className="divider" />

              {/* Данные гражданина */}
              <div className="section-title">Данные гражданина</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ФИО</label>
                  <input className="form-input" value={form.citizen_full_name}
                    onChange={e => setForm(f => ({...f, citizen_full_name: e.target.value}))}
                    disabled={!isEditable} />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input className="form-input" value={form.citizen_phone}
                    onChange={e => setForm(f => ({...f, citizen_phone: e.target.value}))}
                    disabled={!isEditable} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Адрес</label>
                <input className="form-input" value={form.citizen_address}
                  onChange={e => setForm(f => ({...f, citizen_address: e.target.value}))}
                  disabled={!isEditable} />
              </div>

              <div className="divider" />

              {/* Суть обращения */}
              <div className="section-title">Суть обращения</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  {isEditable ? (
                    <select className="form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 14 }}>{appeal.category_display}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Срок исполнения</label>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {fmtDate(appeal.deadline)}
                    {appeal.is_overdue && <span className="overdue-tag">ПРОСРОЧЕНО</span>}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Тема</label>
                <input className="form-input" value={form.subject}
                  onChange={e => setForm(f => ({...f, subject: e.target.value}))}
                  disabled={!isEditable} />
              </div>
              <div className="form-group">
                <label className="form-label">Текст обращения</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }}
                  value={appeal.text} disabled />
              </div>

              <div className="divider" />

              {/* Ответ / решение */}
              <div className="section-title">Текст решения / ответа</div>
              <div className="form-group">
                <textarea className="form-textarea"
                  placeholder="Введите текст официального ответа гражданину..."
                  value={form.resolution_text}
                  onChange={e => setForm(f => ({...f, resolution_text: e.target.value}))}
                />
              </div>
              <button className="btn btn-secondary" onClick={generateDoc} disabled={generatingDoc}>
                {generatingDoc ? 'Генерация...' : '📄 Скачать ответ (.docx)'}
              </button>

              {/* Прикреплённые файлы */}
              {appeal.files?.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="section-title">Прикреплённые файлы ({appeal.files.length})</div>
                  <div className="file-list">
                    {appeal.files.map(f => (
                      <div key={f.id} className="file-item">
                        <span style={{ fontSize: 16 }}>📎</span>
                        <a href={f.file} target="_blank" rel="noreferrer" className="file-item-name" style={{ color: 'var(--primary)' }}>
                          {f.original_name}
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <HistoryTab appealId={appeal.id} />
          )}

          {tab === 'comments' && (
            <CommentsTab appealId={appeal.id} comment={comment} setComment={setComment} addComment={addComment} />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
          {isEditable && (
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryTab({ appealId }) {
  const [history, setHistory] = useState(null)
  useEffect(() => {
    api.get(`/appeals/${appealId}/history/`).then(r => setHistory(r.data))
  }, [appealId])

  if (!history) return <div className="loading"><div className="spinner" /></div>
  return <Timeline items={history} />
}

function CommentsTab({ appealId, comment, setComment, addComment }) {
  const [comments, setComments] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get(`/appeals/${appealId}/comments/`).then(r => {
      setComments(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [appealId])

  const handleAdd = async () => {
    await addComment()
    load()
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      {comments?.length === 0 && (
        <div className="empty-state" style={{ padding: '24px' }}>
          <div className="empty-text">Комментариев пока нет</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {comments?.map(c => (
          <div key={c.id} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 14px'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <strong style={{ color: 'var(--text)' }}>{c.author_name}</strong>
              {' · '}
              {new Date(c.created_at).toLocaleString('ru-RU')}
            </div>
            <div style={{ fontSize: 13 }}>{c.text}</div>
          </div>
        ))}
      </div>
      <div className="form-group">
        <textarea
          className="form-textarea"
          placeholder="Добавить внутренний комментарий (виден только сотрудникам)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ minHeight: 80 }}
        />
      </div>
      <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!comment.trim()}>
        Добавить комментарий
      </button>
    </div>
  )
}
