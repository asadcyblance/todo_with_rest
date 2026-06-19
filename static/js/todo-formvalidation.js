function getTodoValidationOptions() {
    return {
        rules: {
            title: {
                required: true,
                minlength: 3
            },
            description: {
                required: true,
                minlength: 5
            },
            status: {
                required: true
            },
            assign_to: {
                required: true
            }
        },
        messages: {
            title: {
                required: "Title is required",
                minlength: "Minimum 3 characters required"
            },
            description: {
                required: "Description is required",
                minlength: "Minimum 5 characters required"
            },
            status: {
                required: "Status is required"
            },
            assign_to: {
                required: "Please select a user"
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

function initTodoFormValidation(selector) {
    var form = $(selector);

    if (form.length && !form.data("validator")) {
        form.validate(getTodoValidationOptions());
    }
}

$(document).ready(function() {
    initTodoFormValidation("#todoForm");
    initTodoFormValidation("#editTodoForm");
});
