function getPasswordValidationOptions() {
    return {
        rules: {
            new_password1: {
                required: true,
                minlength: 8
            },
            new_password2: {
                required: true,
                equalTo: "#id_new_password1"
            }
        },
        messages: {
            new_password1: {
                required: "Please enter a password",
                minlength: "Password must be at least 8 characters long"
            },
            new_password2: {
                required: "Please confirm your password",
                equalTo: "Passwords do not match"
            }
        },
        errorClass: "text-danger",
        validClass: "is-valid",
        highlight: function(element) {
            $(element).addClass("is-invalid");
        },
        unhighlight: function(element) {
            $(element).removeClass("is-invalid");
        },
        errorPlacement: function(error, element) {
            element.closest(".mb-3, .form-group")
                   .find("div.text-danger")
                   .empty()
                   .append(error);
        }
    };
}

function initPasswordFormValidation(selector) {
    var form = $(selector);

    if (form.length && !form.data("validator")) {
        form.validate(getPasswordValidationOptions());
    }
}

$(document).ready(function() {
    initPasswordFormValidation("#resetPasswordForm");
});
