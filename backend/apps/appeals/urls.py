from django.urls import path
from .views import (
    public_create_appeal, public_check_status,
    AppealListCreateView, AppealDetailView,
    appeal_comments, appeal_history,
    upload_files, generate_response, dashboard,
    export_appeals, citizen_portal,
    my_appeals, my_appeal_update_status, list_executors,
)

urlpatterns = [
    # ── Публичные (без авторизации) ──────────────────────────────────────────
    path('appeals/public/', public_create_appeal, name='public_create'),
    path('appeals/check-status/', public_check_status, name='check_status'),
    # Личный кабинет гражданина (публичный поиск по email / номеру)
    path('appeals/citizen/', citizen_portal, name='citizen_portal'),

    # ── Экспорт реестра ───────────────────────────────────────────────────────
    # GET /api/appeals/export/?format=excel|pdf
    path('appeals/export/', export_appeals, name='export_appeals'),

    # ── Реестр (оператор / администратор) ────────────────────────────────────
    path('appeals/', AppealListCreateView.as_view(), name='appeals_list'),
    path('appeals/<int:pk>/', AppealDetailView.as_view(), name='appeal_detail'),
    path('appeals/<int:pk>/comments/', appeal_comments, name='appeal_comments'),
    path('appeals/<int:pk>/history/', appeal_history, name='appeal_history'),
    path('appeals/<int:pk>/upload/', upload_files, name='upload_files'),
    path('appeals/<int:pk>/generate-response/', generate_response, name='generate_response'),

    # ── Личный кабинет исполнителя ────────────────────────────────────────────
    path('my-appeals/', my_appeals, name='my_appeals'),
    path('my-appeals/<int:pk>/update-status/', my_appeal_update_status, name='my_appeal_update_status'),

    # ── Справочники ───────────────────────────────────────────────────────────
    path('users/executors/', list_executors, name='list_executors'),

    # ── Дашборд ───────────────────────────────────────────────────────────────
    path('dashboard/', dashboard, name='dashboard'),
]
