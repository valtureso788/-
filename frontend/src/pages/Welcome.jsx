import { Link } from 'react-router-dom'
import { Building2, FileText, User, LogIn, Search } from 'lucide-react'

export default function Welcome() {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-header-logo">
          <Building2 size={28} color="#fff" />
        </div>
        <div>
          <h1>Администрация района</h1>
          <p>ЕИС «Контроль поручений»</p>
        </div>
      </header>

      <main className="welcome-main">
        <div className="welcome-hero">
          <h2 className="welcome-title">Добро пожаловать</h2>
          <p className="welcome-subtitle">
            Единая информационная система для граждан и сотрудников администрации. 
            Подавайте обращения, отслеживайте их статус и контролируйте исполнение поручений.
          </p>
        </div>

        <div className="welcome-cards">
          {/* Карта 1: Подача обращений */}
          <div className="welcome-card card-hover-effect">
            <div className="welcome-card-icon-wrapper">
              <FileText size={32} />
            </div>
            <h3>Подать обращение</h3>
            <p>
              Официальная регистрация обращений граждан. Заполните форму, прикрепите необходимые 
              документы (до 5 файлов) и отправьте заявление на рассмотрение.
            </p>
            <div className="welcome-card-actions">
              <Link to="/new-appeal" className="btn btn-welcome-primary">
                ✍️ Написать обращение
              </Link>
            </div>
          </div>

          {/* Карта 2: Личный кабинет */}
          <div className="welcome-card card-hover-effect">
            <div className="welcome-card-icon-wrapper">
              <User size={32} />
            </div>
            <h3>Личный кабинет</h3>
            <p>
              Доступ к персональным разделам системы. Citizens могут отслеживать свои поданные заявления, 
              а сотрудники — вести работу по поручениям.
            </p>
            <div className="welcome-card-actions gap-sm">
              <Link to="/citizen" className="btn btn-welcome-secondary">
                👤 Кабинет гражданина
              </Link>
              <Link to="/login" className="btn btn-welcome-ghost">
                <LogIn size={16} /> Вход для сотрудников
              </Link>
            </div>
          </div>
        </div>

        <div className="welcome-footer-actions">
          <Link to="/status" className="welcome-quick-status-btn">
            <Search size={16} /> Быстрая проверка статуса по номеру обращения
          </Link>
        </div>
      </main>

      <footer className="welcome-footer">
        <p>© 2026 Администрация района. Все права защищены.</p>
      </footer>
    </div>
  )
}
