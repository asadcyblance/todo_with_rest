from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User

from notifications.models import Notification
from .models import Todo


@receiver(pre_save, sender=Todo)
def store_todo_previous_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            previous = Todo.objects.get(pk=instance.pk)
            instance._previous_status = previous.status
        except Todo.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


def _notify_superusers(message):
    for admin in User.objects.filter(is_superuser=True):
        Notification.objects.create(user=admin, message=message)


@receiver(post_save, sender=Todo)
def create_notification(sender, instance, created, **kwargs):
    actor = getattr(instance, '_actor_username', instance.created_by.username)

    actor_user = User.objects.filter(username=actor).first()
    is_superuser = actor_user and actor_user.is_superuser

    if created:
        if is_superuser:
            message = (
                f'Super Admin created task "{instance.title}" '
                f'for {instance.created_by.username}'
            )
        else:
            message = (
                f'{actor} created task "{instance.title}"'
            )

        _notify_superusers(message)
        return

    previous_status = getattr(instance, '_previous_status', None)

    if previous_status == 'pending' and instance.status == 'completed':
        if is_superuser:
            message = (
                f'Super Admin completed task "{instance.title}" '
                f'for {instance.created_by.username}'
            )
        else:
            message = (
                f'{actor} completed task "{instance.title}"'
            )

    elif previous_status != instance.status:
        if is_superuser:
            message = (
                f'Super Admin updated task "{instance.title}" '
                f'for {instance.created_by.username} '
                f'status to {instance.get_status_display()}'
            )
        else:
            message = (
                f'{actor} updated task "{instance.title}" '
                f'status to {instance.get_status_display()}'
            )

    else:
        if is_superuser:
            message = (
                f'Super Admin updated task "{instance.title}" '
                f'for {instance.created_by.username}'
            )
        else:
            message = (
                f'{actor} updated task "{instance.title}"'
            )

    _notify_superusers(message)


@receiver(post_delete, sender=Todo)
def notify_todo_deleted(sender, instance, **kwargs):
    actor = getattr(instance, '_actor_username', instance.created_by.username)

    actor_user = User.objects.filter(username=actor).first()
    is_superuser = actor_user and actor_user.is_superuser

    if is_superuser:
        message = (
            f'Super Admin deleted task "{instance.title}" '
            f'for {instance.created_by.username}'
        )
    else:
        message = (
            f'{actor} deleted task "{instance.title}"'
        )

    _notify_superusers(message)
