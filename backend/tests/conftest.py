"""
Фикстуры pytest для ЕИС «Контроль поручений».
"""
import pytest
from django.contrib.auth import get_user_model
from apps.appeals.models import Appeal

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='test_admin',
        password='admin123',
        role='admin',
        full_name='Администратор Тестовый',
        email='admin@test.ru',
    )


@pytest.fixture
def operator_user(db):
    return User.objects.create_user(
        username='test_operator',
        password='operator123',
        role='operator',
        full_name='Оператор Тестовый',
        email='operator@test.ru',
    )


@pytest.fixture
def executor_user(db):
    return User.objects.create_user(
        username='test_executor',
        password='executor123',
        role='executor',
        full_name='Исполнитель Тестовый',
        department='ЖКХ',
        email='executor@test.ru',
    )


@pytest.fixture
def appeal(db, operator_user):
    """Базовое тестовое обращение."""
    return Appeal.objects.create(
        citizen_full_name='Иванов Иван Иванович',
        citizen_phone='+7-900-000-0000',
        citizen_address='г. Москва, ул. Тестовая, д. 1',
        citizen_email='citizen@test.ru',
        category=Appeal.Category.HOUSING,
        subject='Тестовое обращение',
        text='Текст тестового обращения для автотестов.',
        registered_by=operator_user,
    )


@pytest.fixture
def assigned_appeal(appeal, executor_user):
    """Обращение с назначенным исполнителем."""
    appeal.status = Appeal.Status.ASSIGNED
    appeal.assigned_to = executor_user
    appeal.save()
    return appeal


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def operator_client(api_client, operator_user):
    api_client.force_authenticate(user=operator_user)
    return api_client


@pytest.fixture
def executor_client(api_client, executor_user):
    api_client.force_authenticate(user=executor_user)
    return api_client
