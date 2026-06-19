from django.contrib.auth.views import LoginView, LogoutView, PasswordResetView

from .forms import CustomLoginForm, CustomPasswordResetForm


class CustomLoginView(LoginView):
    template_name = 'registration/login.html'
    authentication_form = CustomLoginForm
    redirect_authenticated_user = True


class CustomLogoutView(LogoutView):
    next_page = 'login'


class CustomPasswordResetView(PasswordResetView):
    template_name = 'accounts/password_reset.html'
    email_template_name = 'registration/password_reset_email.html'
    subject_template_name = 'registration/password_reset_subject.txt'
    form_class = CustomPasswordResetForm
