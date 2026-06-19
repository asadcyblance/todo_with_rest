from .models import Notification


def notification_counts(request):
    if request.user.is_authenticated and request.user.is_superuser:
        unread = Notification.objects.filter(
            user=request.user,
            is_read=False,
        )
        return {
            'unread_notification_count': unread.count(),
        }

    return {'unread_notification_count': 0}
