from django.contrib import admin
from .models import Appeal, AppealFile, AppealHistory, Comment


class AppealFileInline(admin.TabularInline):
    model = AppealFile
    extra = 0


class AppealHistoryInline(admin.TabularInline):
    model = AppealHistory
    extra = 0
    readonly_fields = ('user', 'action', 'timestamp')
    can_delete = False


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ('author', 'created_at')


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'citizen_full_name', 'category', 'status', 'assigned_to', 'deadline', 'created_at')
    list_filter = ('status', 'category', 'assigned_to')
    search_fields = ('registration_number', 'citizen_full_name', 'citizen_phone')
    readonly_fields = ('registration_number', 'created_at', 'updated_at')
    inlines = [AppealFileInline, CommentInline, AppealHistoryInline]
    date_hierarchy = 'created_at'


@admin.register(AppealHistory)
class AppealHistoryAdmin(admin.ModelAdmin):
    list_display = ('appeal', 'user', 'action', 'timestamp')
    readonly_fields = ('appeal', 'user', 'action', 'timestamp')
