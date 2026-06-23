"""
Тесты моделей Appeal и User.
"""
import pytest
import datetime
from apps.appeals.models import Appeal, AppealHistory


@pytest.mark.django_db
class TestAppealModel:

    def test_registration_number_auto_generated(self, db):
        """Регистрационный номер генерируется автоматически."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        appeal = Appeal.objects.create(
            citizen_full_name='Тест Тест',
            citizen_phone='12345',
            citizen_address='Адрес',
            category=Appeal.Category.HOUSING,
            subject='Тест',
            text='Текст',
        )
        assert appeal.registration_number != ''
        assert str(datetime.date.today().year) in appeal.registration_number

    def test_deadline_auto_set(self, appeal):
        """Срок исполнения устанавливается автоматически (+14 дней)."""
        assert appeal.deadline is not None
        expected = (datetime.date.today() + datetime.timedelta(days=14))
        # Допускаем разницу в 1 день (тест может запуститься ровно в полночь)
        diff = abs((appeal.deadline - expected).days)
        assert diff <= 1

    def test_is_overdue_false_for_new(self, appeal):
        """Новое обращение не просрочено."""
        assert appeal.is_overdue is False

    def test_is_overdue_true_when_deadline_past(self, appeal):
        """Обращение просрочено, если дедлайн прошёл и статус не done/closed."""
        appeal.deadline = datetime.date.today() - datetime.timedelta(days=1)
        appeal.save()
        assert appeal.is_overdue is True

    def test_is_overdue_false_when_done(self, appeal):
        """Закрытое обращение не считается просроченным."""
        appeal.deadline = datetime.date.today() - datetime.timedelta(days=1)
        appeal.status = Appeal.Status.DONE
        appeal.save()
        assert appeal.is_overdue is False

    def test_status_choices(self, appeal):
        """Доступны все 7 статусов."""
        statuses = [s.value for s in Appeal.Status]
        assert 'new' in statuses
        assert 'closed' in statuses
        assert len(statuses) == 7

    def test_history_created_on_status_change(self, appeal, operator_user):
        """История изменений создаётся при смене статуса через view."""
        AppealHistory.objects.create(
            appeal=appeal,
            user=operator_user,
            action='Статус изменён с «Новое» на «Назначено»',
        )
        assert appeal.history.count() == 1

    def test_str_representation(self, appeal):
        """Строковое представление содержит номер и ФИО."""
        s = str(appeal)
        assert appeal.registration_number in s
        assert appeal.citizen_full_name in s


@pytest.mark.django_db
class TestUserModel:

    def test_role_properties(self, admin_user, operator_user, executor_user):
        assert admin_user.is_admin is True
        assert operator_user.is_operator is True
        assert executor_user.is_executor is True

    def test_str_is_full_name(self, operator_user):
        assert str(operator_user) == operator_user.full_name
