from django.contrib.auth.models import User
from django.test import TestCase

from todo.models import Todo


class TodoModelTest(TestCase):
    def test_create_todo(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        todo = Todo.objects.create(
            title="Learn CI/CD",
            description="Set up GitHub Actions",
            created_by=user,
        )
        self.assertEqual(todo.title, "Learn CI/CD")
        self.assertEqual(todo.status, "pending")
