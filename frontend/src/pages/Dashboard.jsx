import { useState, useEffect } from 'react'
import {
  FileText, Loader, AlertCircle, CheckCircle2, TrendingUp,
  Users, Calendar, RefreshCw
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await api.get('/dashboard/')
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="loading" style={{ minHeight: 400 }}>
      <div className="spinner" />
    </div>
  )

  const CATEGORY_COLORS = {
    housing: '#3B82F6',
    transport: '#8B5CF6',
    social: '#F59E0B',
    education: '#10B981',
    ecology: '#06B6D4',
    other: '#6B7280',
  }

  const chartData = {
    labels: data.by_category.map(c => c.label),
    datasets: [{
      label: 'Обращений',
      data: data.by_category.map(c => c.count),
      backgroundColor: data.by_category.map(c => CATEGORY_COLORS[c.category] || '#3B82F6'),
      borderRadius: 6,
      borderSkipped: false,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} обращений` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: '#F1F5F9' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  const RANK_CLS = ['gold', 'silver', 'bronze']

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <h2>📊 Дашборд</h2>
        <div className="topbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Обновить
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* ─── Счётчики ─── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText size={22} />
            </div>
            <div>
              <div className="stat-value">{data.total}</div>
              <div className="stat-label">Всего обращений</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">
              <Loader size={22} />
            </div>
            <div>
              <div className="stat-value">{data.in_progress}</div>
              <div className="stat-label">В работе</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="stat-value" style={{ color: data.overdue > 0 ? 'var(--status-declined)' : undefined }}>
                {data.overdue}
              </div>
              <div className="stat-label">Просрочено</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-value" style={{ color: 'var(--status-done)' }}>
                {data.done_month}
              </div>
              <div className="stat-label">Исполнено за месяц</div>
            </div>
          </div>
        </div>

        {/* ─── Графики ─── */}
        <div className="dashboard-grid">
          {/* График по категориям */}
          <div className="chart-card">
            <div className="chart-title">📂 Распределение по категориям</div>
            <div style={{ height: 220 }}>
              {data.by_category.length > 0
                ? <Bar data={chartData} options={chartOptions} />
                : <div className="empty-state"><div className="empty-text">Нет данных</div></div>
              }
            </div>
          </div>

          {/* Рейтинг исполнителей */}
          <div className="chart-card">
            <div className="chart-title">
              <TrendingUp size={14} style={{ display: 'inline', marginRight: 6 }} />
              Рейтинг исполнителей (за 7 дней)
            </div>
            {data.executor_rating.length > 0 ? (
              <div>
                {data.executor_rating.map((e, i) => (
                  <div key={e.assigned_to__id} className="rating-item">
                    <div className={`rating-rank ${RANK_CLS[i] || 'other'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="rating-name">{e.assigned_to__full_name}</div>
                    <div className="rating-count">{e.closed} закр.</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <div className="empty-text">Нет закрытых за 7 дней</div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Последние заявки ─── */}
        <div className="table-wrapper" style={{ marginBottom: 16 }}>
          <div className="table-header">
            <span className="table-title">🕐 Последние 5 обращений</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Дата</th>
                  <th>Гражданин</th>
                  <th>Категория</th>
                  <th>Статус</th>
                  <th>Исполнитель</th>
                  <th>Срок</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map(a => (
                  <tr key={a.id} className={a.is_overdue ? 'overdue' : ''}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}>
                        {a.registration_number}
                      </span>
                    </td>
                    <td>{fmtDate(a.created_at)}</td>
                    <td>{a.citizen_full_name}</td>
                    <td>{a.category_display}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{a.executor_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {fmtDate(a.deadline)}
                      {a.is_overdue && <span className="overdue-tag">!</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Просроченные ─── */}
        {data.overdue_list.length > 0 && (
          <div className="table-wrapper">
            <div className="table-header">
              <span className="table-title" style={{ color: 'var(--status-declined)' }}>
                ⚠️ Просроченные заявки
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Гражданин</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Исполнитель</th>
                    <th>Срок</th>
                    <th>Просрочка</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdue_list.map(a => {
                    const daysDiff = a.deadline
                      ? Math.floor((new Date() - new Date(a.deadline)) / (1000 * 60 * 60 * 24))
                      : 0
                    return (
                      <tr key={a.id} className="overdue">
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--status-declined)', fontFamily: 'monospace', fontSize: 13 }}>
                            {a.registration_number}
                          </span>
                        </td>
                        <td>{a.citizen_full_name}</td>
                        <td>{a.category_display}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>{a.executor_name || '—'}</td>
                        <td style={{ color: 'var(--status-declined)', fontWeight: 600 }}>{fmtDate(a.deadline)}</td>
                        <td>
                          <span style={{
                            background: 'var(--status-declined-bg)',
                            color: 'var(--status-declined)',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            +{daysDiff} дн.
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
