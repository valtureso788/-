from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Расширенная модель пользователя с ролями."""

    class Role(models.TextChoices):
        OPERATOR = 'operator', 'Оператор (секретарь)'
        EXECUTOR = 'executor', 'Исполнитель'
        ADMIN = 'admin', 'Администратор'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EXECUTOR,
        verbose_name='Роль',
    )
    full_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='ФИО',
    )
    department = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Отдел',
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Телефон',
    )

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.full_name or self.username

    @property
    def is_operator(self):
        return self.role == self.Role.OPERATOR

    @property
    def is_executor(self):
        return self.role == self.Role.EXECUTOR

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser
