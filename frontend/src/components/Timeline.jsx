import { User, Clock } from 'lucide-react'

export default function Timeline({ items = [] }) {
  if (!items.length) {
    return (
      <div className="empty-state" style={{ padding: '24px' }}>
        <div className="empty-text">История изменений пуста</div>
      </div>
    )
  }

  return (
    <div className="timeline">
      {items.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className="timeline-dot">
            <Clock size={14} color="var(--status-new)" />
          </div>
          <div className="timeline-content">
            <div className="timeline-action">{item.action}</div>
            <div className="timeline-meta">
              {item.user_name && (
                <><User size={11} style={{ display: 'inline', marginRight: 3 }} />{item.user_name} · </>
              )}
              {new Date(item.timestamp).toLocaleString('ru-RU')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
