const STATUS_CONFIG = {
  new:         { label: 'Новое',        cls: 'badge-new' },
  assigned:    { label: 'Назначено',    cls: 'badge-assigned' },
  in_progress: { label: 'В работе',    cls: 'badge-in_progress' },
  on_site:     { label: 'Выезд',       cls: 'badge-on_site' },
  done:        { label: 'Исполнено',   cls: 'badge-done' },
  declined:    { label: 'Отказ',       cls: 'badge-declined' },
  closed:      { label: 'Закрыто',     cls: 'badge-closed' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'badge-closed' }
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" />
      {cfg.label}
    </span>
  )
}
