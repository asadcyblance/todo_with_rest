from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from todo.models import Todo


@login_required
def dashboard(request):
    if request.user.is_superuser:
        user_todos = Todo.objects.select_related('created_by').all()
    else:
        user_todos = Todo.objects.filter(created_by=request.user)

    context = {
        'todo_count': user_todos.count(),
        'pending_count': user_todos.filter(status='pending').count(),
        'completed_count': user_todos.filter(status='completed').count(),
        'latest_todos': user_todos.order_by('-created_at')[:5],
        'is_superuser': request.user.is_superuser,
    }

    return render(request, 'dashboard/dashboard.html', context)
