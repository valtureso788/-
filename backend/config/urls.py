from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, FileResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def spa_view(request):
    """Отдаёт React SPA index.html для всех не-API маршрутов."""
    from pathlib import Path
    index_path = Path(settings.BASE_DIR) / 'frontend_dist' / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'), content_type='text/html; charset=utf-8')
    return HttpResponse(
        '<h1 style="font-family:sans-serif">ЕИС Контроль поручений</h1>'
        '<p>Бэкенд работает ✅ | <a href="/api/">API</a> | <a href="/admin/">Админка</a></p>',
        content_type='text/html; charset=utf-8',
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('apps.appeals.urls')),
    path('api/', include('apps.users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all: всё остальное → React SPA (должен быть последним!)
urlpatterns += [
    re_path(r'^.*$', spa_view),
]
