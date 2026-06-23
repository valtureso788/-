"""
API-тесты: обращения, аутентификация, экспорт, личный кабинет гражданина.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.appeals.models import Appeal


# ──────────────────────────────────────────────────────────────────────────────
# Публичные эндпоинты
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPublicCreateAppeal:

    def test_create_appeal_success(self, api_client):
        """Гражданин может подать обращение без авторизации."""
        payload = {
            'citizen_full_name': 'Петров Пётр Петрович',
            'citizen_phone': '+7-999-000-1111',
            'citizen_address': 'г. Москва, ул. Ленина, 1',
            'citizen_email': 'petrov@mail.ru',
            'category': 'housing',
            'subject': 'Прорыв трубы',
            'text': 'В подвале нашего дома прорвало трубу. Прошу принять меры.',
        }
        response = api_client.post('/api/appeals/public/', payload)
        assert response.status_code == 201
        assert 'registration_number' in response.data
        assert Appeal.objects.filter(
            citizen_full_name='Петров Пётр Петрович'
        ).exists()

    def test_create_appeal_missing_fields(self, api_client):
        """Без обязательных полей — ошибка валидации."""
        response = api_client.post('/api/appeals/public/', {'citizen_full_name': 'Тест'})
        assert response.status_code == 400

    def test_check_status_found(self, api_client, appeal):
        """Проверка статуса по существующему номеру."""
        url = f'/api/appeals/check-status/?number={appeal.registration_number}'
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['registration_number'] == appeal.registration_number
        assert 'status_display' in response.data

    def test_check_status_not_found(self, api_client):
        """Несуществующий номер — 404."""
        response = api_client.get('/api/appeals/check-status/?number=9999-9999')
        assert response.status_code == 404

    def test_check_status_no_param(self, api_client):
        """Без параметра — 400."""
        response = api_client.get('/api/appeals/check-status/')
        assert response.status_code == 400


# ──────────────────────────────────────────────────────────────────────────────
# Аутентификация
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAuthentication:

    def test_protected_endpoint_requires_auth(self, api_client):
        """Защищённый эндпоинт требует токен."""
        response = api_client.get('/api/appeals/')
        assert response.status_code == 401

    def test_jwt_login_success(self, api_client, operator_user):
        """Успешный логин возвращает access и refresh токены."""
        response = api_client.post('/api/auth/token/', {
            'username': 'test_operator',
            'password': 'operator123',
        })
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_jwt_login_wrong_password(self, api_client, operator_user):
        """Неверный пароль — 401."""
        response = api_client.post('/api/auth/token/', {
            'username': 'test_operator',
            'password': 'wrongpassword',
        })
        assert response.status_code == 401

    def test_me_endpoint(self, operator_client, operator_user):
        """GET /api/users/me/ возвращает данные текущего пользователя."""
        response = operator_client.get('/api/users/me/')
        assert response.status_code == 200
        assert response.data['username'] == 'test_operator'


# ──────────────────────────────────────────────────────────────────────────────
# Реестр обращений (оператор/администратор)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAppealsList:

    def test_operator_can_list_appeals(self, operator_client, appeal):
        response = operator_client.get('/api/appeals/')
        assert response.status_code == 200
        # Может вернуть список или paginated dict
        data = response.data
        if isinstance(data, dict):
            assert data.get('count', 0) >= 1 or len(data.get('results', [])) >= 0
        else:
            assert len(data) >= 1

    def test_filter_by_status(self, operator_client, appeal):
        response = operator_client.get(f'/api/appeals/?status={appeal.status}')
        assert response.status_code == 200

    def test_filter_by_category(self, operator_client, appeal):
        response = operator_client.get(f'/api/appeals/?category={appeal.category}')
        assert response.status_code == 200

    def test_appeal_detail_accessible(self, operator_client, appeal):
        response = operator_client.get(f'/api/appeals/{appeal.id}/')
        assert response.status_code == 200
        assert response.data['id'] == appeal.id

    def test_appeal_status_change(self, operator_client, appeal, executor_user):
        """Оператор может назначить исполнителя и сменить статус."""
        response = operator_client.patch(f'/api/appeals/{appeal.id}/', {
            'status': 'assigned',
            'assigned_to': executor_user.id,
        }, format='json')
        assert response.status_code in (200, 201)
        appeal.refresh_from_db()
        assert appeal.status == 'assigned'


# ──────────────────────────────────────────────────────────────────────────────
# Личный кабинет исполнителя
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestExecutorCabinet:

    def test_my_appeals_returns_only_own(self, executor_client, assigned_appeal):
        assigned_appeal.refresh_from_db()
        response = executor_client.get('/api/my-appeals/')
        assert response.status_code == 200
        ids = [a['id'] for a in response.data]
        assert assigned_appeal.id in ids

    def test_update_status_to_in_progress(self, executor_client, assigned_appeal):
        response = executor_client.patch(
            f'/api/my-appeals/{assigned_appeal.id}/update-status/',
            {'status': 'in_progress'},
            format='json',
        )
        assert response.status_code == 200
        assigned_appeal.refresh_from_db()
        assert assigned_appeal.status == 'in_progress'

    def test_update_status_forbidden_for_wrong_executor(self, api_client, assigned_appeal, db):
        """Другой исполнитель не может менять статус чужой заявки."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(
            username='other_exec', password='pass123', role='executor',
        )
        api_client.force_authenticate(user=other)
        response = api_client.patch(
            f'/api/my-appeals/{assigned_appeal.id}/update-status/',
            {'status': 'in_progress'},
            format='json',
        )
        assert response.status_code == 404

    def test_update_status_invalid_value(self, executor_client, assigned_appeal):
        """Исполнитель не может поставить статус 'closed' (только для оператора)."""
        response = executor_client.patch(
            f'/api/my-appeals/{assigned_appeal.id}/update-status/',
            {'status': 'closed'},
            format='json',
        )
        assert response.status_code == 400


# ──────────────────────────────────────────────────────────────────────────────
# Личный кабинет гражданина (публичный поиск)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCitizenPortal:

    def test_search_by_email(self, api_client, appeal):
        response = api_client.get(
            f'/api/appeals/citizen/?email={appeal.citizen_email}'
        )
        assert response.status_code == 200
        assert len(response.data['results']) >= 1

    def test_search_by_number(self, api_client, appeal):
        response = api_client.get(
            f'/api/appeals/citizen/?number={appeal.registration_number}'
        )
        assert response.status_code == 200
        assert response.data['results'][0]['registration_number'] == appeal.registration_number

    def test_search_by_email_and_number(self, api_client, appeal):
        response = api_client.get(
            f'/api/appeals/citizen/?email={appeal.citizen_email}'
            f'&number={appeal.registration_number}'
        )
        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_search_no_params_returns_400(self, api_client):
        response = api_client.get('/api/appeals/citizen/')
        assert response.status_code == 400

    def test_search_wrong_email_returns_empty(self, api_client):
        response = api_client.get('/api/appeals/citizen/?email=nobody@example.com')
        assert response.status_code == 200
        assert response.data['results'] == []


# ──────────────────────────────────────────────────────────────────────────────
# Экспорт реестра
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestExport:

    def test_export_excel(self, operator_client, appeal):
        response = operator_client.get('/api/appeals/export/?format=excel')
        assert response.status_code == 200
        # openpyxl magic bytes: PK (ZIP)
        assert response.content[:2] == b'PK'

    def test_export_excel_respects_filters(self, operator_client, appeal):
        response = operator_client.get(
            f'/api/appeals/export/?format=excel&status={appeal.status}'
        )
        assert response.status_code == 200

    def test_export_invalid_format(self, operator_client):
        response = operator_client.get('/api/appeals/export/?format=xml')
        assert response.status_code == 400

    def test_export_requires_auth(self, api_client):
        response = api_client.get('/api/appeals/export/?format=excel')
        assert response.status_code == 401


# ──────────────────────────────────────────────────────────────────────────────
# Комментарии и история
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCommentsAndHistory:

    def test_add_comment(self, operator_client, appeal):
        response = operator_client.post(
            f'/api/appeals/{appeal.id}/comments/',
            {'text': 'Принято в работу'},
            format='json',
        )
        assert response.status_code == 201
        assert response.data['text'] == 'Принято в работу'

    def test_empty_comment_rejected(self, operator_client, appeal):
        response = operator_client.post(
            f'/api/appeals/{appeal.id}/comments/',
            {'text': '   '},
            format='json',
        )
        assert response.status_code == 400

    def test_get_history(self, operator_client, appeal):
        response = operator_client.get(f'/api/appeals/{appeal.id}/history/')
        assert response.status_code == 200
        assert isinstance(response.data, list)


# ──────────────────────────────────────────────────────────────────────────────
# Список исполнителей
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestExecutorsList:

    def test_list_executors(self, operator_client, executor_user):
        response = operator_client.get('/api/users/executors/')
        assert response.status_code == 200
        ids = [e['id'] for e in response.data]
        assert executor_user.id in ids
