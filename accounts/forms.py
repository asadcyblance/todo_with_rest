from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import AuthenticationForm, PasswordResetForm


class CustomLoginForm(AuthenticationForm):
    error_messages = {
        'invalid_login': (
            'Please enter a correct email and password. '
            'Note that both fields may be case-sensitive.'
        ),
        'inactive': 'This account is inactive.',
    }
    username = forms.EmailField(
        label='Email',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter email',
            'autofocus': True,
        })
    )
    password = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter password',
        })
    )

    def clean(self):
        email = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if email and password:
            try:
                user = User.objects.get(email__iexact=email)
                self.cleaned_data['username'] = user.get_username()
            except User.DoesNotExist:
                pass

        return super().clean()


class CustomPasswordResetForm(PasswordResetForm):
    email = forms.EmailField(
        label='Email address',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email',
            'autofocus': True,
        }),
    )

    def clean_email(self):
        email = self.cleaned_data['email']

        if not any(self.get_users(email)):
            raise forms.ValidationError(
                'No email found in our system.'
            )

        return email
