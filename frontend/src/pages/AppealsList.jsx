import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, RefreshCw, FileDown, FileText } from 'lucide-react'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import AppealModal from '../components/AppealModal'
import { useAuth } from '../context/AuthContext'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новое' },
  { value: 'assigned', label: 'Назначено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'on_site', label: 'Выезд' },
  { value: 'done', label: 'Исполнено' },
  { value: 'declined', label: 'Отказ' },
  { value: 'closed', label: 'Закрыто' },
]

const CATEGORIES = [
  { value: '', label: 'Все категории' },
  { value: 'housing', label: 'ЖКХ' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'social', label: 'Соцзащита' },
  { value: 'education', label: 'Образование' },
  { value: 'ecology', label: 'Экология' },
  { value: 'other', label: 'Прочее' },
]

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

export default function AppealsList() {
  const { user } = useAuth()
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [executors, setExecutors] = useState([])
  const [selectedAppeal, setSelectedAppeal] = useState(null)
  const [detailData, setDetailData] = useState(null)

  const [filters, setFilters] = useState({
    status: '', category: '', assigned_to: '',
    date_from: '', date_to: '', search: '',
  })
  const [exporting, setExporting] = useState(false)

  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.category) params.set('category', filters.category)
      if (filters.assigned_to) params.set('assigned_to', filters.assigned_to)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.search) params.set('search', filters.search)
      params.set('page', page)

      const { data } = await api.get(`/appeals/?${params}`)
      setAppeals(data.results || data)
      setTotal(data.count || (data.results ? data.count : data.length))
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/users/executors/').then(r => setExecutors(r.data))
  }, [])

  const openModal = async (appeal) => {
    setSelectedAppeal(appeal)
    const { data } = await api.get(`/appeals/${appeal.id}/`)
    setDetailData(data)
  }

  const closeModal = () => { setSelectedAppeal(null); setDetailData(null) }

  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const handleExport = async (fmt) => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('format', fmt)
      if (filters.status) params.set('status', filters.status)
      if (filters.category) params.set('category', filters.category)
      if (filters.assigned_to) params.set('assigned_to', filters.assigned_to)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.search) params.set('search', filters.search)

      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/appeals/export/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const ext = fmt === 'excel' ? 'xlsx' : 'pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appeals_export_${new Date().toISOString().slice(0, 10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Ошибка при экспорте: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="topbar">
        <h2>📋 Все обращения</h2>
        <div className="topbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Всего: {total}</span>
          <button
            id="export-excel-btn"
            className="btn btn-excel btn-sm"
            onClick={() => handleExport('excel')}
            disabled={exporting}
            title="Экспорт в Excel"
          >
            <FileDown size={13} />
            {exporting ? 'Экспорт...' : 'Excel'}
          </button>
          <button
            id="export-pdf-btn"
            className="btn btn-pdf btn-sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            title="Экспорт в PDF"
          >
            <FileText size={13} /> PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* ─── Фильтры ─── */}
        <div className="filter-bar">
          <div className="filter-grid">
            {/* Поиск */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Поиск</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Номер заявки или ФИО гражданина..."
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Статус</label>
              <select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Категория</label>
              <select className="form-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Исполнитель</label>
              <select className="form-select" value={filters.assigned_to} onChange={e => setFilter('assigned_to', e.target.value)}>
                <option value="">Все</option>
                {executors.map(ex => <option key={ex.id} value={ex.id}>{ex.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Дата с</label>
              <input type="date" className="form-input" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Дата по</label>
              <input type="date" className="form-input" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ width: '100%' }}
                onClick={() => { setFilters({ status:'', category:'', assigned_to:'', date_from:'', date_to:'', search:'' }); setPage(1) }}>
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* ─── Таблица ─── */}
        <div className="table-wrapper">
          <div className="table-header">
            <span className="table-title">Список обращений</span>
            {filters.status || filters.category || filters.search ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <SlidersHorizontal size={12} style={{ display: 'inline', marginRight: 3 }} />
                Применены фильтры
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="loading" style={{ padding: '40px' }}><div className="spinner" /></div>
          ) : appeals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-text">Нет обращений</div>
              <div className="empty-hint">Попробуйте изменить параметры поиска</div>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Номер заявки</th>
                      <th>Дата</th>
                      <th>Гражданин</th>
                      <th>Категория</th>
                      <th>Статус</th>
                      <th>Исполнитель</th>
                      <th>Срок</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((a, idx) => (
                      <tr key={a.id} className={a.is_overdue ? 'overdue' : ''}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}>
                            {a.registration_number}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {fmtDate(a.created_at)}
                        </td>
                        <td style={{ fontWeight: 500 }}>{a.citizen_full_name}</td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {a.category_display}
                          </span>
                        </td>
                        <td><StatusBadge status={a.status} /></td>
                        <td style={{ fontSize: 13 }}>
                          {a.executor_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                          {fmtDate(a.deadline)}
                          {a.is_overdue && <span className="overdue-tag">!</span>}
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => openModal(a)}
                          >
                            Открыть
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                  <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    return start + i
                  }).map(p => (
                    <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                  <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {selectedAppeal && detailData && (
        <AppealModal
          appeal={detailData}
          executors={executors}
          onClose={closeModal}
          onSaved={load}
          userRole={user?.role}
        />
      )}
      {selectedAppeal && !detailData && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        </div>
      )}
    </div>
  )
}
