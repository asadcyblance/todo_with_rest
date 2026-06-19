from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification
from .utils import broadcast_new_notification


@receiver(post_save, sender=Notification)
def notify_via_websocket(sender, instance, created, **kwargs):
    if created:
        broadcast_new_notification(instance)
