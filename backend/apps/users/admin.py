from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'full_name', 'role', 'department', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'full_name', 'email')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Роль и отдел', {'fields': ('role', 'full_name', 'department', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Роль и отдел', {'fields': ('role', 'full_name', 'department', 'phone')}),
    )
