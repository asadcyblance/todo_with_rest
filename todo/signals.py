from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

from notifications.models import Notification
from .models import Todo


@receiver(post_save, sender=Todo)
def create_notification(sender, instance, created, **kwargs):

    if created:

        superusers = User.objects.filter(
            is_superuser=True
        )

        for admin in superusers:

            Notification.objects.create(
                user=admin,
                message=f'{instance.created_by.username} created task "{instance.title}"'
            )