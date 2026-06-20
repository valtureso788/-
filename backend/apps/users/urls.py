from django.urls import path
from .views import ExecutorListView, MeView, CustomTokenObtainPairView

urlpatterns = [
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='custom_token'),
    path('users/executors/', ExecutorListView.as_view(), name='executor_list'),
    path('users/me/', MeView.as_view(), name='me'),
]
