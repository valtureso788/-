from django.db import models
from django.utils import timezone
from django.conf import settings
import datetime


def current_year():
    return datetime.date.today().year


def generate_registration_number():
    """Генерирует номер в формате ГГГГ-XXXX."""
    year = datetime.date.today().year
    last = Appeal.objects.filter(
        registration_number__startswith=str(year)
    ).count()
    return f"{year}-{str(last + 1).zfill(4)}"


def appeal_file_upload_path(instance, filename):
    return f"appeals/{instance.appeal.registration_number}/{filename}"


class Appeal(models.Model):
    """Обращение гражданина."""

    class Status(models.TextChoices):
        NEW = 'new', 'Новое'
        ASSIGNED = 'assigned', 'Назначено'
        IN_PROGRESS = 'in_progress', 'В работе'
        ON_SITE = 'on_site', 'Выезд'
        DONE = 'done', 'Исполнено'
        DECLINED = 'declined', 'Отказ'
        CLOSED = 'closed', 'Закрыто'

    class Category(models.TextChoices):
        HOUSING = 'housing', 'ЖКХ'
        TRANSPORT = 'transport', 'Транспорт'
        SOCIAL = 'social', 'Соцзащита'
        EDUCATION = 'education', 'Образование'
        ECOLOGY = 'ecology', 'Экология'
        OTHER = 'other', 'Прочее'

    registration_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Регистрационный номер',
    )
    # Данные гражданина
    citizen_full_name = models.CharField(max_length=200, verbose_name='ФИО гражданина')
    citizen_phone = models.CharField(max_length=20, verbose_name='Телефон')
    citizen_address = models.CharField(max_length=500, verbose_name='Адрес проживания')
    citizen_email = models.EmailField(blank=True, verbose_name='Email')

    # Суть обращения
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name='Категория',
    )
    subject = models.CharField(max_length=300, verbose_name='Тема обращения')
    text = models.TextField(verbose_name='Текст обращения')

    # Рабочие поля
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name='Статус',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_appeals',
        verbose_name='Исполнитель',
    )
    resolution_text = models.TextField(blank=True, verbose_name='Текст решения/ответа')
    deadline = models.DateField(null=True, blank=True, verbose_name='Срок исполнения')

    # Системные поля
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата регистрации')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='registered_appeals',
        verbose_name='Зарегистрировал',
    )

    class Meta:
        verbose_name = 'Обращение'
        verbose_name_plural = 'Обращения'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.registration_number} — {self.citizen_full_name}"

    def save(self, *args, **kwargs):
        if not self.registration_number:
            self.registration_number = generate_registration_number()
        if not self.deadline:
            # По умолчанию 10 рабочих дней ≈ 14 календарных
            self.deadline = (timezone.now() + datetime.timedelta(days=14)).date()
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        if self.deadline and self.status not in [self.Status.DONE, self.Status.CLOSED]:
            return datetime.date.today() > self.deadline
        return False


class AppealFile(models.Model):
    """Прикреплённый файл к обращению."""
    appeal = models.ForeignKey(
        Appeal,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Обращение',
    )
    file = models.FileField(
        upload_to=appeal_file_upload_path,
        verbose_name='Файл',
    )
    original_name = models.CharField(max_length=255, verbose_name='Исходное имя файла')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Файл обращения'
        verbose_name_plural = 'Файлы обращений'

    def __str__(self):
        return self.original_name


class AppealHistory(models.Model):
    """История изменений обращения."""
    appeal = models.ForeignKey(
        Appeal,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Обращение',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Пользователь',
    )
    action = models.CharField(max_length=500, verbose_name='Действие')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Время')

    class Meta:
        verbose_name = 'Запись истории'
        verbose_name_plural = 'История изменений'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} — {self.action}"


class Comment(models.Model):
    """Внутренний комментарий сотрудника."""
    appeal = models.ForeignKey(
        Appeal,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Обращение',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Автор',
    )
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author} — {self.created_at.strftime('%d.%m.%Y %H:%M')}"
