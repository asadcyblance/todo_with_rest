from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from .forms import AdminTodoForm, TodoForm, get_assignable_users
from .models import Todo


def _accessible_todos(request):
    if request.user.is_superuser:
        return Todo.objects.select_related('created_by').all()
    return Todo.objects.filter(created_by=request.user)


def _get_accessible_todo(request, pk):
    if request.user.is_superuser:
        return get_object_or_404(
            Todo.objects.select_related('created_by'),
            pk=pk,
        )
    return get_object_or_404(Todo, pk=pk, created_by=request.user)


def _get_form(request, instance=None):
    if request.user.is_superuser:
        return AdminTodoForm(request.POST or None, instance=instance)
    return TodoForm(request.POST or None, instance=instance)


def _save_todo(todo, request):
    todo._actor_username = request.user.username
    todo.save()


@login_required
def todo_list(request):
    context = {
        'todos': _accessible_todos(request),
        'is_superuser': request.user.is_superuser,
    }

    if request.user.is_superuser:
        context['users'] = get_assignable_users()

    return render(request, 'todo/list.html', context)


@login_required
def todo_create(request):
    if request.user.is_superuser:
        form = AdminTodoForm()
    else:
        form = TodoForm()

    return render(
        request,
        'todo/create.html',
        {
            'form': form,
            'is_superuser': request.user.is_superuser,
        },
    )


@login_required
def todo_detail(request, pk):
    todo = _get_accessible_todo(request, pk)
    return render(
        request,
        'todo/detail.html',
        {
            'todo': todo,
            'is_superuser': request.user.is_superuser,
        },
    )


@login_required
def todo_ajax_create(request):
    if request.method == 'POST':
        form = _get_form(request)

        if form.is_valid():
            todo = form.save(commit=False)

            if request.user.is_superuser:
                todo.created_by = form.cleaned_data['assign_to']
            else:
                todo.created_by = request.user

            _save_todo(todo, request)

            return JsonResponse({
                'status': 'success',
                'id': todo.id,
            })

        return JsonResponse({
            'status': 'error',
            'errors': form.errors,
        })

    return JsonResponse({'status': 'invalid'})


@login_required
def todo_ajax_update(request, pk):
    if request.method == 'POST':
        todo = _get_accessible_todo(request, pk)
        form = _get_form(request, instance=todo)

        if form.is_valid():
            todo = form.save(commit=False)

            if request.user.is_superuser:
                todo.created_by = form.cleaned_data['assign_to']

            _save_todo(todo, request)

            return JsonResponse({'status': 'success'})

        return JsonResponse({
            'status': 'error',
            'errors': form.errors,
        })

    return JsonResponse({'status': 'invalid'})


@login_required
def todo_ajax_delete(request, pk):
    if request.method == 'POST':
        todo = _get_accessible_todo(request, pk)
        todo.delete()
        return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'error'})


@login_required
def todo_ajax_detail(request, pk):
    todo = _get_accessible_todo(request, pk)

    payload = {
        'status': 'success',
        'id': todo.id,
        'title': todo.title,
        'description': todo.description,
        'todo_status': todo.status,
    }

    if request.user.is_superuser:
        payload['assign_to'] = todo.created_by_id

    return JsonResponse(payload)


@login_required
def todo_ajax_status(request, pk):
    if request.method == 'POST':
        todo = _get_accessible_todo(request, pk)
        status_value = request.POST.get('status')

        if status_value not in ['pending', 'completed']:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid status value',
            })

        todo.status = status_value
        _save_todo(todo, request)

        return JsonResponse({
            'status': 'success',
            'todo_status': todo.status,
        })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method',
    })
