import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import AppealModal from '../components/AppealModal'
import { useAuth } from '../context/AuthContext'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const EXECUTOR_STATUSES = [
  { value: '', label: 'Все' },
  { value: 'assigned', label: 'Назначено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'on_site', label: 'Выезд' },
  { value: 'done', label: 'Исполнено' },
  { value: 'declined', label: 'Отказ' },
]

export default function MyAppeals() {
  const { user } = useAuth()
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [inlineEdit, setInlineEdit] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const { data } = await api.get(`/appeals/?${params}`)
      setAppeals(data.results || data)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  const openModal = async (a) => {
    setSelected(a)
    const { data } = await api.get(`/appeals/${a.id}/`)
    setDetailData(data)
  }

  const quickStatusChange = (appeal) => {
    setInlineEdit({ ...appeal, _resolution: appeal.resolution_text || '' })
  }

  const saveQuick = async () => {
    const { id, status, _resolution } = inlineEdit
    const needsText = ['done', 'declined'].includes(status)
    if (needsText && !_resolution.trim()) {
      toast.error('Введите текст решения')
      return
    }
    try {
      await api.patch(`/appeals/${id}/`, { status, resolution_text: _resolution })
      toast.success('Статус обновлён')
      setInlineEdit(null)
      load()
    } catch {
      toast.error('Ошибка сохранения')
    }
  }

  const generateDoc = async (appeal) => {
    if (!appeal.resolution_text) {
      toast.error('Сначала введите текст решения')
      return
    }
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/appeals/${appeal.id}/generate-response/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response_${appeal.registration_number}.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Файл скачан')
    } catch {
      toast.error('Ошибка генерации')
    }
  }

  const total = appeals.length
  const done = appeals.filter(a => a.status === 'done').length
  const overdue = appeals.filter(a => a.is_overdue).length

  return (
    <div>
      <div className="topbar">
        <h2>📁 Мои заявки</h2>
        <div className="topbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.full_name}</span>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Мини-статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Всего заявок', value: total, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Исполнено', value: done, color: '#10B981', bg: '#ECFDF5' },
            { label: 'Просрочено', value: overdue, color: '#EF4444', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, fontSize: 18, fontWeight: 800, flexShrink: 0,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Фильтр статусов */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {EXECUTOR_STATUSES.map(s => (
            <button
              key={s.value}
              className={`btn btn-sm ${filterStatus === s.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Таблица */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading" style={{ padding: '40px' }}><div className="spinner" /></div>
          ) : appeals.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={40} className="empty-icon" />
              <div className="empty-text">Нет заявок</div>
              <div className="empty-hint">По выбранному фильтру ничего не найдено</div>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Дата</th>
                    <th>Гражданин</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Срок</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map(a => (
                    <tr key={a.id} className={a.is_overdue ? 'overdue' : ''}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}>
                          {a.registration_number}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(a.created_at)}</td>
                      <td style={{ fontWeight: 500 }}>{a.citizen_full_name}</td>
                      <td style={{ fontSize: 12 }}>{a.category_display}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {fmtDate(a.deadline)}
                        {a.is_overdue && <span className="overdue-tag">!</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openModal(a)}>
                            Детали
                          </button>
                          <button className="btn btn-secondary btn-xs" onClick={() => quickStatusChange(a)}>
                            Статус
                          </button>
                          {a.resolution_text && (
                            <button className="btn btn-ghost btn-xs" onClick={() => generateDoc(a)} title="Скачать ответ">
                              📄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно деталей */}
      {selected && detailData && (
        <AppealModal
          appeal={detailData}
          executors={[]}
          onClose={() => { setSelected(null); setDetailData(null) }}
          onSaved={load}
          userRole={user?.role}
        />
      )}

      {/* Быстрое изменение статуса */}
      {inlineEdit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setInlineEdit(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <div className="modal-title">Изменить статус</div>
                <div className="modal-subtitle">{inlineEdit.registration_number} · {inlineEdit.citizen_full_name}</div>
              </div>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Новый статус</label>
                <select className="form-select"
                  value={inlineEdit.status}
                  onChange={e => setInlineEdit(s => ({ ...s, status: e.target.value }))}>
                  <option value="in_progress">В работе</option>
                  <option value="on_site">Выезд на место</option>
                  <option value="done">Исполнено</option>
                  <option value="declined">Отказ</option>
                </select>
              </div>
              {['done', 'declined'].includes(inlineEdit.status) && (
                <div className="form-group">
                  <label className="form-label">
                    Текст решения <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 100 }}
                    placeholder="Обязательно для статусов «Исполнено» и «Отказ»..."
                    value={inlineEdit._resolution}
                    onChange={e => setInlineEdit(s => ({ ...s, _resolution: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInlineEdit(null)}>Отмена</button>
              <button className="btn btn-primary" onClick={saveQuick}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
