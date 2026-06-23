"""
Email-уведомления ЕИС «Контроль поручений».

В разработке используется EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
(письма выводятся в консоль).
В продакшене укажите реальный SMTP через переменные окружения.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _send(subject: str, message: str, to: list[str]) -> None:
    """Внутренняя обёртка — не бросает исключение, только логирует ошибку."""
    if not to:
        return
    # Фильтруем пустые адреса
    to = [addr for addr in to if addr and '@' in addr]
    if not to:
        return
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@eis-appeals.ru'),
            recipient_list=to,
            fail_silently=False,
        )
        logger.info('Email sent to %s: %s', to, subject)
    except Exception as exc:
        logger.warning('Email send failed to %s: %s', to, exc)


# ──────────────────────────────────────────────────────────────────────────────
# Публичные функции
# ──────────────────────────────────────────────────────────────────────────────

def send_appeal_registered(appeal) -> None:
    """Уведомление гражданину: обращение принято и зарегистрировано."""
    if not appeal.citizen_email:
        return
    subject = f'Ваше обращение № {appeal.registration_number} зарегистрировано'
    message = (
        f'Уважаемый(-ая) {appeal.citizen_full_name},\n\n'
        f'Ваше обращение по теме «{appeal.subject}» успешно зарегистрировано.\n\n'
        f'Регистрационный номер: {appeal.registration_number}\n'
        f'Дата регистрации: {appeal.created_at.strftime("%d.%m.%Y %H:%M")}\n'
        f'Срок рассмотрения: до {appeal.deadline.strftime("%d.%m.%Y") if appeal.deadline else "не указан"}\n\n'
        f'Вы можете отслеживать статус обращения на нашем сайте.\n\n'
        f'С уважением,\nЕИС «Контроль поручений»'
    )
    _send(subject, message, [appeal.citizen_email])


def send_status_changed(appeal, old_status_display: str, new_status_display: str) -> None:
    """Уведомление гражданину и исполнителю при смене статуса обращения."""
    # Уведомление гражданину
    if appeal.citizen_email:
        subject = f'Статус вашего обращения № {appeal.registration_number} изменён'
        message = (
            f'Уважаемый(-ая) {appeal.citizen_full_name},\n\n'
            f'Статус вашего обращения № {appeal.registration_number} изменён:\n'
            f'  {old_status_display} → {new_status_display}\n\n'
            f'Тема обращения: {appeal.subject}\n\n'
            f'С уважением,\nЕИС «Контроль поручений»'
        )
        _send(subject, message, [appeal.citizen_email])

    # Уведомление исполнителю при назначении
    if (
        appeal.assigned_to
        and appeal.assigned_to.email
        and new_status_display in ('Назначено',)
    ):
        subject = f'Вам назначено обращение № {appeal.registration_number}'
        message = (
            f'Здравствуйте, {appeal.assigned_to.full_name or appeal.assigned_to.username}!\n\n'
            f'Вам назначено обращение:\n'
            f'  Номер: {appeal.registration_number}\n'
            f'  Тема: {appeal.subject}\n'
            f'  Категория: {appeal.get_category_display()}\n'
            f'  Срок исполнения: {appeal.deadline.strftime("%d.%m.%Y") if appeal.deadline else "не указан"}\n\n'
            f'Войдите в систему, чтобы принять заявку в работу.\n\n'
            f'С уважением,\nЕИС «Контроль поручений»'
        )
        _send(subject, message, [appeal.assigned_to.email])


def send_executor_assigned(appeal) -> None:
    """Уведомление исполнителю о назначении поручения."""
    if not (appeal.assigned_to and appeal.assigned_to.email):
        return
    subject = f'Новое поручение: обращение № {appeal.registration_number}'
    message = (
        f'Здравствуйте, {appeal.assigned_to.full_name or appeal.assigned_to.username}!\n\n'
        f'Вам назначено обращение гражданина:\n'
        f'  Номер: {appeal.registration_number}\n'
        f'  Гражданин: {appeal.citizen_full_name}\n'
        f'  Тема: {appeal.subject}\n'
        f'  Категория: {appeal.get_category_display()}\n'
        f'  Срок исполнения: {appeal.deadline.strftime("%d.%m.%Y") if appeal.deadline else "не указан"}\n\n'
        f'Пожалуйста, войдите в систему и примите заявку в работу.\n\n'
        f'С уважением,\nЕИС «Контроль поручений»'
    )
    _send(subject, message, [appeal.assigned_to.email])


def send_appeal_closed(appeal) -> None:
    """Уведомление гражданину о закрытии обращения с текстом ответа."""
    if not appeal.citizen_email:
        return
    subject = f'Ваше обращение № {appeal.registration_number} рассмотрено'
    resolution = appeal.resolution_text or 'Информация будет направлена отдельным письмом.'
    message = (
        f'Уважаемый(-ая) {appeal.citizen_full_name},\n\n'
        f'Ваше обращение № {appeal.registration_number} («{appeal.subject}») рассмотрено.\n\n'
        f'Ответ:\n{resolution}\n\n'
        f'С уважением,\nЕИС «Контроль поручений»'
    )
    _send(subject, message, [appeal.citizen_email])
