from rest_framework import serializers
from .models import Appeal, AppealFile, AppealHistory, Comment
from apps.users.serializers import UserSerializer
import datetime


class AppealFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealFile
        fields = ('id', 'file', 'original_name', 'uploaded_at')


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'author_name', 'text', 'created_at')
        read_only_fields = ('author', 'created_at')


class AppealHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = AppealHistory
        fields = ('id', 'user', 'user_name', 'action', 'timestamp')


class AppealListSerializer(serializers.ModelSerializer):
    """Сжатый сериализатор для таблицы."""
    executor_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Appeal
        fields = (
            'id', 'registration_number', 'created_at', 'citizen_full_name',
            'category', 'category_display', 'status', 'status_display',
            'assigned_to', 'executor_name', 'deadline', 'is_overdue',
        )


class AppealDetailSerializer(serializers.ModelSerializer):
    """Полный сериализатор для детального просмотра/редактирования."""
    files = AppealFileSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    history = AppealHistorySerializer(many=True, read_only=True)
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Appeal
        fields = (
            'id', 'registration_number', 'created_at', 'updated_at',
            'citizen_full_name', 'citizen_phone', 'citizen_address', 'citizen_email',
            'category', 'category_display', 'subject', 'text',
            'status', 'status_display', 'assigned_to', 'assigned_to_detail',
            'resolution_text', 'deadline', 'is_overdue',
            'registered_by', 'files', 'comments', 'history',
        )
        read_only_fields = ('registration_number', 'created_at', 'updated_at', 'registered_by')


class PublicAppealCreateSerializer(serializers.ModelSerializer):
    """Публичная форма создания обращения (без авторизации)."""

    class Meta:
        model = Appeal
        fields = (
            'citizen_full_name', 'citizen_phone', 'citizen_address', 'citizen_email',
            'category', 'subject', 'text',
        )

    def create(self, validated_data):
        appeal = Appeal.objects.create(**validated_data)
        return appeal
