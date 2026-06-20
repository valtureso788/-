import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Building2 } from 'lucide-react'
import axios from 'axios'
import StatusBadge from '../components/StatusBadge'

export default function StatusCheck() {
  const [number, setNumber] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const check = async (e) => {
    e.preventDefault()
    if (!number.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await axios.get(`/api/appeals/check-status/?number=${encodeURIComponent(number.trim())}`)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Обращение не найдено')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-logo">
          <Building2 size={24} color="#fff" />
        </div>
        <div>
          <h1>Администрация района</h1>
          <p>Проверка статуса обращения</p>
        </div>
        <Link to="/" className="public-check-link">← Подать обращение</Link>
      </header>

      <div className="public-main">
        <div className="public-form-card" style={{ maxWidth: 500 }}>
          <h2 className="public-form-title">Статус обращения</h2>
          <p className="public-form-desc">
            Введите регистрационный номер вашего обращения в формате <strong>ГГГГ-XXXX</strong>
          </p>

          <form onSubmit={check}>
            <div className="form-group">
              <label className="form-label">Регистрационный номер</label>
              <input
                className="form-input"
                placeholder="2026-0042"
                value={number}
                onChange={e => setNumber(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              <Search size={16} />
              {loading ? 'Поиск...' : 'Проверить статус'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: 20, padding: '12px 16px',
              background: 'var(--status-declined-bg)',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius)', color: 'var(--status-declined)',
              fontSize: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div style={{
              marginTop: 20, padding: '20px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Номер обращения
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                    {result.registration_number}
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Дата регистрации</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {new Date(result.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Категория</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{result.category}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Тема</div>
                  <div style={{ fontSize: 14 }}>{result.subject}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
