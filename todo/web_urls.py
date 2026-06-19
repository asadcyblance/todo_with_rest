from django.urls import path

from . import web_views

urlpatterns = [
    path('', web_views.todo_list, name='todo_list'),
    path('create/', web_views.todo_create, name='todo_create'),
    path('ajax/create/', web_views.todo_ajax_create, name='todo_ajax_create'),
    path('ajax/detail/<int:pk>/', web_views.todo_ajax_detail, name='todo_ajax_detail'),
    path('ajax/update/<int:pk>/', web_views.todo_ajax_update, name='todo_ajax_update'),
    path('ajax/delete/<int:pk>/', web_views.todo_ajax_delete, name='todo_ajax_delete'),
    path('ajax/status/<int:pk>/', web_views.todo_ajax_status, name='todo_ajax_status'),
    path('<int:pk>/', web_views.todo_detail, name='todo_detail'),
]
