import os
import datetime
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from docx import Document
from docx.shared import Pt
from .models import Appeal, AppealFile, AppealHistory, Comment
from .serializers import (
    AppealListSerializer, AppealDetailSerializer,
    PublicAppealCreateSerializer, CommentSerializer, AppealHistorySerializer,
)


class IsOperatorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['operator', 'admin'] or request.user.is_superuser
        )


class IsExecutorOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


# ──────────────────────────────────────────────────────────────────────────────
# Публичные эндпоинты (без авторизации)
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_create_appeal(request):
    """POST /api/appeals/public/ — гражданин подаёт обращение."""
    serializer = PublicAppealCreateSerializer(data=request.data)
    if serializer.is_valid():
        appeal = serializer.save()

        # Прикрепляем файлы (до 5)
        files = request.FILES.getlist('files')[:5]
        for f in files:
            AppealFile.objects.create(
                appeal=appeal,
                file=f,
                original_name=f.name,
            )

        # Лог создания
        AppealHistory.objects.create(
            appeal=appeal,
            action=f'Обращение зарегистрировано через публичную форму',
        )

        return Response({
            'registration_number': appeal.registration_number,
            'message': 'Ваше обращение зарегистрировано. Ответ будет направлен в течение 10 рабочих дней.',
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_check_status(request):
    """GET /api/appeals/check-status/?number=2026-0042."""
    number = request.query_params.get('number')
    if not number:
        return Response({'error': 'Укажите номер обращения'}, status=400)
    try:
        appeal = Appeal.objects.get(registration_number=number)
        return Response({
            'registration_number': appeal.registration_number,
            'status': appeal.status,
            'status_display': appeal.get_status_display(),
            'created_at': appeal.created_at,
            'subject': appeal.subject,
            'category': appeal.get_category_display(),
        })
    except Appeal.DoesNotExist:
        return Response({'error': 'Обращение не найдено'}, status=404)


# ──────────────────────────────────────────────────────────────────────────────
# Список и детальный просмотр обращений
# ──────────────────────────────────────────────────────────────────────────────

class AppealListCreateView(generics.ListCreateAPIView):
    """GET /api/appeals/ — список (оператор/админ); POST — создание (staff)."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['registration_number', 'citizen_full_name']
    ordering_fields = ['created_at', 'deadline', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppealDetailSerializer
        return AppealListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appeal.objects.select_related('assigned_to')

        # Исполнитель видит только свои заявки
        if user.role == 'executor' and not user.is_superuser:
            qs = qs.filter(assigned_to=user)

        # Фильтры
        status_filter = self.request.query_params.get('status')
        category_filter = self.request.query_params.get('category')
        executor_filter = self.request.query_params.get('assigned_to')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        overdue = self.request.query_params.get('overdue')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category_filter:
            qs = qs.filter(category=category_filter)
        if executor_filter:
            qs = qs.filter(assigned_to_id=executor_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if overdue == 'true':
            today = datetime.date.today()
            qs = qs.filter(
                deadline__lt=today
            ).exclude(status__in=['done', 'closed'])

        return qs


class AppealDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/appeals/{id}/."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppealDetailSerializer
    queryset = Appeal.objects.all()

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        old_executor = old.assigned_to_id

        appeal = serializer.save()
        user = self.request.user

        # Логируем изменение статуса
        if old_status != appeal.status:
            AppealHistory.objects.create(
                appeal=appeal,
                user=user,
                action=f'Статус изменён с «{old.get_status_display()}» на «{appeal.get_status_display()}»',
            )

        # Логируем смену исполнителя
        if old_executor != appeal.assigned_to_id:
            executor_name = appeal.assigned_to.full_name if appeal.assigned_to else 'не назначен'
            AppealHistory.objects.create(
                appeal=appeal,
                user=user,
                action=f'Исполнитель назначен: {executor_name}',
            )


# ──────────────────────────────────────────────────────────────────────────────
# Комментарии
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def appeal_comments(request, pk):
    try:
        appeal = Appeal.objects.get(pk=pk)
    except Appeal.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)

    if request.method == 'GET':
        comments = appeal.comments.select_related('author')
        return Response(CommentSerializer(comments, many=True).data)

    elif request.method == 'POST':
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Текст комментария не может быть пустым'}, status=400)
        comment = Comment.objects.create(appeal=appeal, author=request.user, text=text)
        # Лог
        AppealHistory.objects.create(
            appeal=appeal,
            user=request.user,
            action=f'Добавлен комментарий: «{text[:80]}{"..." if len(text) > 80 else ""}»',
        )
        return Response(CommentSerializer(comment).data, status=201)


# ──────────────────────────────────────────────────────────────────────────────
# История
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appeal_history(request, pk):
    try:
        appeal = Appeal.objects.get(pk=pk)
    except Appeal.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)
    history = appeal.history.select_related('user')
    return Response(AppealHistorySerializer(history, many=True).data)


# ──────────────────────────────────────────────────────────────────────────────
# Загрузка файлов
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_files(request, pk):
    try:
        appeal = Appeal.objects.get(pk=pk)
    except Appeal.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)

    existing_count = appeal.files.count()
    files = request.FILES.getlist('files')
    slots = 5 - existing_count
    if slots <= 0:
        return Response({'error': 'Максимум 5 файлов на обращение'}, status=400)

    created = []
    for f in files[:slots]:
        af = AppealFile.objects.create(appeal=appeal, file=f, original_name=f.name)
        created.append({'id': af.id, 'name': af.original_name})

    return Response({'uploaded': created}, status=201)


# ──────────────────────────────────────────────────────────────────────────────
# Генерация Word-ответа
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_response(request, pk):
    try:
        appeal = Appeal.objects.get(pk=pk)
    except Appeal.DoesNotExist:
        return Response({'error': 'Не найдено'}, status=404)

    if not appeal.resolution_text:
        return Response({'error': 'Сначала заполните текст решения'}, status=400)

    # Создаём документ
    doc = Document()

    # Стили
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(12)

    # Заголовок
    heading = doc.add_paragraph()
    heading_run = heading.add_run('Ответ на обращение гражданина')
    heading_run.bold = True
    heading_run.font.size = Pt(14)
    heading.alignment = 1  # CENTER

    doc.add_paragraph()

    # Обращение
    doc.add_paragraph(f'Уважаемый(-ая) {appeal.citizen_full_name}!')
    doc.add_paragraph()

    # Основной текст
    intro = doc.add_paragraph()
    intro.add_run(
        f'На Ваше обращение № {appeal.registration_number} '
        f'от {appeal.created_at.strftime("%d.%m.%Y")} сообщаем:'
    )
    doc.add_paragraph()

    # Текст решения
    doc.add_paragraph(appeal.resolution_text)
    doc.add_paragraph()

    # Подпись
    executor_name = appeal.assigned_to.full_name if appeal.assigned_to else '________________'
    doc.add_paragraph(f'С уважением,')
    doc.add_paragraph(executor_name)

    # Дата
    doc.add_paragraph()
    doc.add_paragraph(datetime.date.today().strftime('%d.%m.%Y'))

    # Сохраняем
    responses_dir = settings.RESPONSES_ROOT
    os.makedirs(responses_dir, exist_ok=True)
    filename = f"response_{appeal.registration_number}_{datetime.date.today()}.docx"
    filepath = os.path.join(responses_dir, filename)
    doc.save(filepath)

    # Лог
    AppealHistory.objects.create(
        appeal=appeal,
        user=request.user,
        action=f'Сгенерирован официальный ответ: {filename}',
    )

    # Отдаём файл
    from django.http import FileResponse
    return FileResponse(
        open(filepath, 'rb'),
        as_attachment=True,
        filename=filename,
        content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )


# ──────────────────────────────────────────────────────────────────────────────
# Дашборд
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard(request):
    today = datetime.date.today()
    month_start = today.replace(day=1)
    week_ago = today - datetime.timedelta(days=7)

    total = Appeal.objects.count()
    in_progress = Appeal.objects.filter(status__in=['assigned', 'in_progress', 'on_site']).count()
    overdue = Appeal.objects.filter(
        deadline__lt=today
    ).exclude(status__in=['done', 'closed']).count()
    done_month = Appeal.objects.filter(
        status='done',
        updated_at__date__gte=month_start
    ).count()

    # По категориям
    by_category = list(
        Appeal.objects.values('category').annotate(count=Count('id'))
    )
    category_labels = dict(Appeal.Category.choices)
    by_category_labeled = [
        {'category': item['category'], 'label': category_labels.get(item['category'], item['category']), 'count': item['count']}
        for item in by_category
    ]

    # Последние 5
    recent = Appeal.objects.select_related('assigned_to').order_by('-created_at')[:5]
    recent_data = AppealListSerializer(recent, many=True).data

    # Просроченные (для таблицы)
    overdue_list = Appeal.objects.filter(
        deadline__lt=today
    ).exclude(status__in=['done', 'closed']).select_related('assigned_to').order_by('deadline')[:10]
    overdue_data = AppealListSerializer(overdue_list, many=True).data

    # Рейтинг исполнителей за неделю
    from apps.users.models import User
    executor_rating = list(
        Appeal.objects.filter(
            status='done',
            updated_at__date__gte=week_ago,
            assigned_to__isnull=False,
        ).values('assigned_to__full_name', 'assigned_to__id').annotate(
            closed=Count('id')
        ).order_by('-closed')[:5]
    )

    return Response({
        'total': total,
        'in_progress': in_progress,
        'overdue': overdue,
        'done_month': done_month,
        'by_category': by_category_labeled,
        'recent': recent_data,
        'overdue_list': overdue_data,
        'executor_rating': executor_rating,
    })
