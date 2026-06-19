var todoDetailUrlTemplate = window.todoConfig.urls.detail;
var todoUpdateUrlTemplate = window.todoConfig.urls.update;
var todoDeleteUrlTemplate = window.todoConfig.urls.delete;
var todoStatusUrlTemplate = window.todoConfig.urls.status;
var todoListUrl = window.todoConfig.urls.list;
var csrfToken = window.todoConfig.csrfToken;
var isSuperUser = window.todoConfig.isSuperUser;

var currentOffset = 0;
var hasMoreTodos = true;
var isLoadingTodos = false;
var searchDebounceTimer = null;

function buildTodoUrl(template, todoId) {
    return template.replace('/0/', '/' + todoId + '/');
}

function getFilterParams() {
    return {
        search: $("#searchFilter").val().trim(),
        status: $("#statusFilter").val(),
        start_date: $("#startDateFilter").val(),
        end_date: $("#endDateFilter").val()
    };
}

function showTableLoader() {
    var colspan = isSuperUser ? 7 : 6;
    $("#todosTableBody").html(
        '<tr class="todo-loading-row"><td colspan="' + colspan + '" class="text-center py-4">' +
        '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>' +
        '<span class="ms-2 text-muted">Loading todos...</span></td></tr>'
    );
}

function setLoadingState(isLoading, showInTable) {
    isLoadingTodos = isLoading;
    if (showInTable) {
        showTableLoader();
    }
    $("#todoListLoader").toggleClass("d-none", !isLoading || showInTable);
}

function setEndMessage(show) {
    $("#todoListEnd").toggleClass("d-none", !show);
}

function loadTodos(reset) {
    if (isLoadingTodos) {
        return;
    }

    if (reset) {
        currentOffset = 0;
        hasMoreTodos = true;
        setEndMessage(false);
    }

    if (!hasMoreTodos) {
        return;
    }

    setLoadingState(true, reset);

    var params = getFilterParams();
    params.offset = currentOffset;

    $.get(todoListUrl, params)
        .done(function(response) {
            if (response.status !== "success") {
                return;
            }

            if (reset) {
                $("#todosTableBody").html(response.html);
            } else {
                $("#todosTableBody .todo-empty-row").remove();
                $("#todosTableBody").append(response.html);
            }

            currentOffset = response.offset;
            hasMoreTodos = response.has_more;

            if (!hasMoreTodos && $("#todosTableBody tr").length > 0) {
                setEndMessage(true);
            } else {
                setEndMessage(false);
            }
        })
        .fail(function() {
            if ($("#todosTableBody tr").length === 0) {
                var colspan = isSuperUser ? 7 : 6;
                $("#todosTableBody").html(
                    '<tr class="todo-empty-row"><td colspan="' + colspan +
                    '" class="text-center text-muted py-4">Could not load todos.</td></tr>'
                );
            }
        })
        .always(function() {
            setLoadingState(false);
            loadMoreIfPageNotFilled();
        });
}

function resetAndLoadTodos() {
    loadTodos(true);
}

function isNearPageBottom(threshold) {
    threshold = threshold || 100;
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
}

function loadMoreIfPageNotFilled() {
    if (hasMoreTodos && !isLoadingTodos && !isNearPageBottom(0) &&
        document.documentElement.scrollHeight <= window.innerHeight + 50) {
        loadTodos(false);
    }
}

var todoModal = new bootstrap.Modal(document.getElementById("editTodoModal"));

function clearEditTodoErrors() {
    $("#editTodoErrors").addClass("d-none").html("");
    $("#editTodoForm div.text-danger").html("");
    $("#editTodoForm .is-invalid").removeClass("is-invalid");
}

$("#todosTable").on("click", ".edit-btn", function() {
    var todo_id = $(this).data("id");
    clearEditTodoErrors();

    var editValidator = $("#editTodoForm").data("validator");
    if (editValidator) {
        editValidator.resetForm();
    }

    $.get(buildTodoUrl(todoDetailUrlTemplate, todo_id), function(response) {
        if (response.status === "success") {
            $("#editTodoId").val(response.id);
            $("#editTodoTitle").val(response.title);
            $("#editTodoDescription").val(response.description);
            $("#editTodoStatus").val(response.todo_status);

            if (isSuperUser) {
                $("#editTodoAssignTo").val(response.assign_to);
            }

            todoModal.show();
        }
    }).fail(function() {
        alert("Could not load todo details.");
    });
});

$("#editTodoForm").on("submit", function(e) {
    e.preventDefault();

    if (!$(this).valid()) {
        return false;
    }

    clearEditTodoErrors();

    var todo_id = $("#editTodoId").val();

    $.ajax({
        url: buildTodoUrl(todoUpdateUrlTemplate, todo_id),
        type: "POST",
        data: $(this).serialize(),
        success: function(response) {
            if (response.status === "success") {
                window.location.href = window.todoConfig.listUrl + "?success=updated";
            } else {
                $.each(response.errors || {}, function(field, messages) {
                    if (field === "__all__") {
                        $("#editTodoErrors").removeClass("d-none").html(messages.join("<br>"));
                        return;
                    }
                    var input = $("#editTodoForm [name='" + field + "']");
                    input.closest(".mb-3").find("div.text-danger").html(messages.join("<br>"));
                });
            }
        }
    });
});

$("#todosTable").on("click", ".delete-btn", function() {
    var todo_id = $(this).data("id");
    var row = $(this).closest("tr");

    Swal.fire({
        title: "Are you sure?",
        text: "You want to delete this todo?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Delete"
    }).then(function(result) {
        if (result.isConfirmed) {
            $.ajax({
                url: buildTodoUrl(todoDeleteUrlTemplate, todo_id),
                type: "POST",
                data: {
                    csrfmiddlewaretoken: csrfToken
                },
                success: function(response) {
                    if (response.status === "success") {
                        row.remove();

                        if ($("#todosTableBody tr").length === 0) {
                            resetAndLoadTodos();
                        }

                        $("#successMessage").removeClass("d-none");
                        $("#successMessage .message-text").text("Todo deleted successfully.");
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: "Unable to delete todo.",
                            icon: "error"
                        });
                    }
                },
                error: function() {
                    Swal.fire({
                        title: "Error!",
                        text: "Something went wrong.",
                        icon: "error"
                    });
                }
            });
        }
    });
});

$("#todosTable").on("change", ".status-select", function() {
    var select = $(this);
    var todo_id = select.data("id");
    var selected_status = select.val();
    var previous_status = selected_status === "pending" ? "completed" : "pending";

    $.ajax({
        url: buildTodoUrl(todoStatusUrlTemplate, todo_id),
        type: "POST",
        data: {
            status: selected_status,
            csrfmiddlewaretoken: csrfToken
        },
        success: function(response) {
            if (response.status === "success") {
                $("#successMessage").removeClass("d-none");
                $("#successMessage .message-text").text("Todo status updated successfully.");
            } else {
                select.val(previous_status);
                alert(response.message || "Could not update status.");
            }
        },
        error: function() {
            select.val(previous_status);
            alert("Could not update status.");
        }
    });
});

$("#searchFilter").on("input", function() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(resetAndLoadTodos, 350);
});

$("#statusFilter, #startDateFilter, #endDateFilter").on("change", resetAndLoadTodos);

$("#clearFiltersBtn").on("click", function() {
    $("#searchFilter").val("");
    $("#statusFilter").val("");
    $("#startDateFilter").val("");
    $("#endDateFilter").val("");
    resetAndLoadTodos();
});

$(window).on("scroll", function() {
    if (!hasMoreTodos || isLoadingTodos) {
        return;
    }

    if (isNearPageBottom(100)) {
        loadTodos(false);
    }
});

resetAndLoadTodos();
