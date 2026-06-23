import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Введите логин и пароль')
      return
    }
    setLoading(true)
    try {
      const user = await login(username, password)
      toast.success(`Добро пожаловать, ${user.full_name || user.username}!`)
      if (user.role === 'executor') {
        navigate('/my-appeals')
      } else {
        navigate('/dashboard')
      }
    } catch {
      toast.error('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shield size={28} color="#fff" />
          </div>
          <h1>АИС «Обращения»</h1>
          <p>Система учёта обращений граждан</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              id="login-username"
              className="form-input"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }}
          >
            {loading ? 'Вход...' : 'Войти в систему'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Тестовые учётные записи:</div>
          {[
            ['admin', 'admin123', 'Администратор'],
            ['operator', 'operator123', 'Оператор'],
            ['executor1', 'executor123', 'Исполнитель'],
          ].map(([u, p, r]) => (
            <div key={u} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--text)' }}>{u}</strong> / {p}</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← На главную страницу
          </Link>
        </div>
      </div>
    </div>
  )
}
