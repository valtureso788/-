from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('apps.appeals.urls')),
    path('api/', include('apps.users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all: все остальные маршруты отдают index.html (React SPA)
# Должен быть последним!
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
