from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def notification_to_dict(notification):
    return {
        'id': notification.id,
        'message': notification.message,
        'is_read': notification.is_read,
        'created_at': notification.created_at.strftime('%b %d, %Y %H:%M'),
    }


def get_unread_count(user):
    return Notification.objects.filter(user=user, is_read=False).count()


def _send_to_user(user_id, event, data):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type': 'notification_message',
            'event': event,
            'data': data,
        },
    )


def broadcast_new_notification(notification):
    _send_to_user(
        notification.user_id,
        'new_notification',
        {
            'notification': notification_to_dict(notification),
            'unread_count': get_unread_count(notification.user),
        },
    )


def broadcast_unread_count(user):
    _send_to_user(
        user.id,
        'unread_count',
        {'unread_count': get_unread_count(user)},
    )
