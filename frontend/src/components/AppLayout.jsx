import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ClipboardList, FolderOpen,
  LogOut, Building2
} from 'lucide-react'

const ROLE_LABELS = {
  admin: 'Администратор',
  operator: 'Оператор',
  executor: 'Исполнитель',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>АИС «Обращения»</h1>
          <p>Учёт обращений граждан</p>
          <span className="badge">Администрация района</span>
        </div>

        <nav className="sidebar-nav">
          {/* Доступно всем авторизованным */}
          {(user?.role === 'operator' || user?.role === 'admin' || user?.is_superuser) && (
            <>
              <div className="nav-section">Управление</div>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <LayoutDashboard className="nav-icon" size={18} />
                Дашборд
              </NavLink>
              <NavLink
                to="/appeals"
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <ClipboardList className="nav-icon" size={18} />
                Все обращения
              </NavLink>
            </>
          )}

          {(user?.role === 'executor' || user?.role === 'operator' || user?.role === 'admin' || user?.is_superuser) && (
            <>
              <div className="nav-section">Работа</div>
              <NavLink
                to="/my-appeals"
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <FolderOpen className="nav-icon" size={18} />
                Мои заявки
              </NavLink>
            </>
          )}

          <div className="nav-section">Ресурсы</div>
          <a
            href="/"
            target="_blank"
            className="nav-item"
          >
            <Building2 className="nav-icon" size={18} />
            Форма для граждан
          </a>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials(user?.full_name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name || user?.username}</div>
            <div className="user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Выйти">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
