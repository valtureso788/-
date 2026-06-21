"""
Management command для наполнения базы тестовыми данными.
Запуск: python manage.py seed_data
"""
import random
import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.users.models import User
from apps.appeals.models import Appeal, AppealHistory, Comment


CITIZENS = [
    ('Иванов Пётр Сергеевич', '89001234567', 'ул. Ленина, д. 5, кв. 12', 'ivanov@mail.ru'),
    ('Сидорова Мария Ивановна', '89009876543', 'пр. Мира, д. 23, кв. 4', ''),
    ('Петров Алексей Николаевич', '89161112233', 'ул. Советская, д. 7', 'petrov@yandex.ru'),
    ('Козлова Ольга Дмитриевна', '89175556677', 'ул. Гагарина, д. 15, кв. 8', ''),
    ('Смирнов Дмитрий Вячеславович', '89263334455', 'ул. Пушкина, д. 3', 'smirnov@mail.ru'),
    ('Новикова Анна Александровна', '89057778899', 'пр. Победы, д. 44, кв. 2', ''),
    ('Кузнецов Игорь Петрович', '89654443322', 'ул. Садовая, д. 11', 'kuznecov@gmail.com'),
    ('Попов Владимир Андреевич', '89213337766', 'ул. Цветочная, д. 8, кв. 19', ''),
    ('Лебедева Наталья Сергеевна', '89312228855', 'ул. Лесная, д. 2', 'lebedeva@mail.ru'),
    ('Соколов Константин Михайлович', '89876665544', 'пр. Красный, д. 67, кв. 5', ''),
    ('Морозова Елена Викторовна', '89501115544', 'ул. Речная, д. 9', ''),
    ('Волков Андрей Олегович', '89122226677', 'ул. Полевая, д. 3, кв. 7', 'volkov@yandex.ru'),
    ('Алексеева Виктория Романовна', '89634445566', 'ул. Строителей, д. 21', ''),
    ('Зайцев Роман Дмитриевич', '89775558899', 'ул. Молодёжная, д. 4, кв. 3', ''),
    ('Степанова Людмила Николаевна', '89886664433', 'пр. Октябрьский, д. 12', ''),
]

SUBJECTS_BY_CATEGORY = {
    'housing': [
        'Прорыв трубы в подвале',
        'Отсутствует горячая вода',
        'Сломан лифт в подъезде',
        'Проблемы с отоплением',
        'Протечка кровли',
    ],
    'transport': [
        'Ямы на дороге',
        'Нет автобусного маршрута',
        'Сломан светофор',
        'Отсутствуют дорожные знаки',
        'Не убирают снег с дороги',
    ],
    'social': [
        'Вопрос по льготам',
        'Не выплачивают пенсию',
        'Проблемы с получением субсидии',
        'Очередь в социальную службу',
        'Нужна помощь одинокому пожилому',
    ],
    'education': [
        'Очередь в детский сад',
        'Проблемы в школе №5',
        'Запись в кружки',
        'Ремонт школьного спортзала',
        'Питание в столовой',
    ],
    'ecology': [
        'Несанкционированная свалка',
        'Загрязнение реки',
        'Незаконная вырубка деревьев',
        'Шум от завода ночью',
        'Плохой воздух в районе',
    ],
    'other': [
        'Общий вопрос',
        'Просьба о встрече',
        'Нарушение прав гражданина',
        'Жалоба на чиновника',
    ],
}

RESOLUTIONS = [
    'По результатам проверки выявлены нарушения, которые устранены в установленные сроки.',
    'Работы по ремонту запланированы на следующий квартал в рамках муниципальной программы.',
    'Информация принята к сведению. Направлено уведомление в профильный отдел.',
    'После обследования установлено, что работы выполнены в полном объёме.',
    'Заявка передана подрядной организации. Срок выполнения — 5 рабочих дней.',
]


class Command(BaseCommand):
    help = 'Наполняет базу тестовыми данными'

    def handle(self, *args, **options):
        import sys
        import io
        if hasattr(self.stdout, '_out'):
            self.stdout._out = io.TextIOWrapper(
                self.stdout._out.buffer if hasattr(self.stdout._out, 'buffer') else sys.stdout.buffer,
                encoding='utf-8',
                errors='replace'
            )
        self.stdout.write('Creating users...')

        # Суперпользователь / Администратор
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                full_name='Администратов Иван Иванович',
                role='admin',
                department='Администрация',
            )
            self.stdout.write(self.style.SUCCESS('  Создан: admin / admin123'))

        # Оператор
        if not User.objects.filter(username='operator').exists():
            User.objects.create_user(
                username='operator',
                password='operator123',
                full_name='Секретарева Ольга Петровна',
                role='operator',
                department='Приёмная',
            )
            self.stdout.write(self.style.SUCCESS('  Создан: operator / operator123'))

        # Исполнители
        executors_data = [
            ('executor1', 'executor123', 'Петров Алексей Александрович', 'Отдел ЖКХ'),
            ('executor2', 'executor123', 'Смирнов Дмитрий Васильевич', 'Транспортный отдел'),
            ('executor3', 'executor123', 'Козлова Анна Сергеевна', 'Отдел соцзащиты'),
        ]
        executors = []
        for username, password, full_name, dept in executors_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'password': 'temp',
                    'full_name': full_name,
                    'role': 'executor',
                    'department': dept,
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  Создан: {username} / {password}'))
            executors.append(user)

        # Обращения (только при первом запуске)
        if Appeal.objects.exists():
            self.stdout.write('Тестовые обращения уже есть — пропускаем.')
            self._print_accounts()
            return

        self.stdout.write('Создаём тестовые обращения...')

        statuses = ['new', 'assigned', 'in_progress', 'on_site', 'done', 'closed', 'declined']
        categories = list(SUBJECTS_BY_CATEGORY.keys())

        for i, (citizen, phone, address, email) in enumerate(CITIZENS):
            category = random.choice(categories)
            subject = random.choice(SUBJECTS_BY_CATEGORY[category])
            appeal_status = random.choice(statuses)
            days_ago = random.randint(1, 60)
            created = timezone.now() - datetime.timedelta(days=days_ago)
            deadline_days = random.randint(-5, 20)
            deadline = datetime.date.today() + datetime.timedelta(days=deadline_days)

            executor = random.choice(executors) if appeal_status != 'new' else None
            resolution = random.choice(RESOLUTIONS) if appeal_status in ['done', 'declined'] else ''

            appeal = Appeal(
                citizen_full_name=citizen,
                citizen_phone=phone,
                citizen_address=address,
                citizen_email=email,
                category=category,
                subject=subject,
                text=f'Прошу рассмотреть мою заявку по вопросу: {subject.lower()}. '
                     f'Проблема существует уже {random.randint(1, 30)} дней. '
                     'Прошу принять необходимые меры.',
                status=appeal_status,
                assigned_to=executor,
                resolution_text=resolution,
                deadline=deadline,
            )
            appeal.save()
            appeal.created_at = created
            Appeal.objects.filter(pk=appeal.pk).update(created_at=created)

            # Добавляем историю
            AppealHistory.objects.create(
                appeal=appeal,
                action='Обращение зарегистрировано',
            )
            if executor:
                AppealHistory.objects.create(
                    appeal=appeal,
                    user=executor,
                    action=f'Назначен исполнитель: {executor.full_name}',
                )
            if appeal_status in ['done', 'declined']:
                AppealHistory.objects.create(
                    appeal=appeal,
                    user=executor,
                    action=f'Статус изменён на «{appeal.get_status_display()}»',
                )

        self.stdout.write(self.style.SUCCESS(f'Создано {len(CITIZENS)} обращений'))
        self.stdout.write(self.style.SUCCESS('✅ Тестовые данные загружены!'))
        self._print_accounts()

    def _print_accounts(self):
        self.stdout.write('')
        self.stdout.write('Учётные записи:')
        self.stdout.write('  admin     / admin123    — Администратор')
        self.stdout.write('  operator  / operator123 — Оператор')
        self.stdout.write('  executor1 / executor123 — Исполнитель (ЖКХ)')
        self.stdout.write('  executor2 / executor123 — Исполнитель (Транспорт)')
        self.stdout.write('  executor3 / executor123 — Исполнитель (Соцзащита)')
