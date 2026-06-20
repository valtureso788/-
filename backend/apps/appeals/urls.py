from django.urls import path
from .views import (
    public_create_appeal, public_check_status,
    AppealListCreateView, AppealDetailView,
    appeal_comments, appeal_history,
    upload_files, generate_response, dashboard,
)

urlpatterns = [
    # Публичные (без авторизации)
    path('appeals/public/', public_create_appeal, name='public_create'),
    path('appeals/check-status/', public_check_status, name='check_status'),

    # Защищённые
    path('appeals/', AppealListCreateView.as_view(), name='appeals_list'),
    path('appeals/<int:pk>/', AppealDetailView.as_view(), name='appeal_detail'),
    path('appeals/<int:pk>/comments/', appeal_comments, name='appeal_comments'),
    path('appeals/<int:pk>/history/', appeal_history, name='appeal_history'),
    path('appeals/<int:pk>/upload/', upload_files, name='upload_files'),
    path('appeals/<int:pk>/generate-response/', generate_response, name='generate_response'),

    # Дашборд
    path('dashboard/', dashboard, name='dashboard'),
]
