from django import forms
from django.contrib.auth.models import User

from .models import Todo


def get_assignable_users():
    return User.objects.filter(
        is_active=True,
        is_superuser=False,
    ).order_by('username')


class TodoForm(forms.ModelForm):
    class Meta:
        model = Todo
        fields = ['title', 'description', 'status']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter title',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Enter description',
            }),
            'status': forms.Select(attrs={
                'class': 'form-select',
            }),
        }


class AdminTodoForm(TodoForm):
    assign_to = forms.ModelChoiceField(
        queryset=get_assignable_users(),
        label='Assign To',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['assign_to'].queryset = get_assignable_users()
        if self.instance and self.instance.pk:
            self.fields['assign_to'].initial = self.instance.created_by_id
