from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .models import Notification
from .utils import broadcast_unread_count


def _user_notifications(request):
    return Notification.objects.filter(user=request.user)


def _superuser_check(user):
    return user.is_superuser


@login_required
@user_passes_test(_superuser_check)
def notification_list(request):
    notifications = _user_notifications(request).order_by('-created_at')
    unread_count = notifications.filter(is_read=False).count()

    return render(
        request,
        'notifications/list.html',
        {
            'notifications': notifications,
            'unread_count': unread_count,
            'total_count': notifications.count(),
        },
    )


@login_required
@user_passes_test(_superuser_check)
@require_POST
def notification_mark_read(request, pk):
    notification = get_object_or_404(
        Notification,
        pk=pk,
        user=request.user,
    )
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    broadcast_unread_count(request.user)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        unread_count = _user_notifications(request).filter(is_read=False).count()
        return JsonResponse({
            'status': 'success',
            'unread_count': unread_count,
        })

    return redirect('notification_list')


@login_required
@user_passes_test(_superuser_check)
@require_POST
def notification_mark_all_read(request):
    _user_notifications(request).filter(is_read=False).update(is_read=True)
    broadcast_unread_count(request.user)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'unread_count': 0,
        })

    return redirect('notification_list')
