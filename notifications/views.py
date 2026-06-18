from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .models import Notification
from .serializers import NotificationSerializer

from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=['Notifications']
)
class NotificationViewSet(viewsets.ModelViewSet):

    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        )