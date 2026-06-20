import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import PublicForm from './pages/PublicForm'
import StatusCheck from './pages/StatusCheck'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AppealsList from './pages/AppealsList'
import MyAppeals from './pages/MyAppeals'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role) && !user.is_superuser) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <Routes>
      {/* Публичные */}
      <Route path="/" element={<PublicForm />} />
      <Route path="/status" element={<StatusCheck />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Защищённые */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['operator', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/appeals" element={
          <ProtectedRoute roles={['operator', 'admin']}>
            <AppealsList />
          </ProtectedRoute>
        } />
        <Route path="/my-appeals" element={
          <ProtectedRoute roles={['executor', 'operator', 'admin']}>
            <MyAppeals />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
