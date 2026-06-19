function getLoginValidationOptions() {
    return {
        rules: {
            username: {
                required: true,
                email: true
            },
            password: {
                required: true
            }
        },
        messages: {
            username: {
                required: "Email is required",
                email: "Enter a valid email address"
            },
            password: {
                required: "Password is required"
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
                   .first()
                   .empty()
                   .append(error);
        }
    };
}

function initLoginFormValidation(selector) {
    var form = $(selector);

    if (form.length && !form.data("validator")) {
        form.validate(getLoginValidationOptions());
    }
}

$(document).ready(function() {
    initLoginFormValidation("#loginForm");
});
