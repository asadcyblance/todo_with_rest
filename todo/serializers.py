from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):

    created_by = serializers.StringRelatedField(
        read_only=True
    )

    class Meta:
        model = Todo
        fields = [
            'id',
            'title',
            'description',
            'status',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at'
        ]