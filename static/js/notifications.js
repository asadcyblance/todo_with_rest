function updateSidebarBadge(count) {
    updateSidebarNotificationBadge(count);
}

$(document).on("submit", ".mark-read-form", function(e) {
    e.preventDefault();

    var form = $(this);
    var item = form.closest(".list-group-item");

    $.ajax({
        url: form.attr("action"),
        type: "POST",
        data: form.serialize(),
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        },
        success: function(response) {
            if (response.status === "success") {
                item.removeClass("notification-unread");
                item.find(".badge.bg-danger")
                    .removeClass("bg-danger")
                    .addClass("bg-secondary")
                    .text("Read");
                form.remove();
                updateSidebarBadge(response.unread_count);

                if (response.unread_count === 0) {
                    $("#markAllReadForm").remove();
                }
            }
        }
    });
});

$(document).on("submit", "#markAllReadForm", function(e) {
    e.preventDefault();

    var form = $(this);

    $.ajax({
        url: form.attr("action"),
        type: "POST",
        data: form.serialize(),
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        },
        success: function(response) {
            if (response.status === "success") {
                $("#notificationList .list-group-item").each(function() {
                    $(this).removeClass("notification-unread");
                    $(this).find(".badge.bg-danger")
                        .removeClass("bg-danger")
                        .addClass("bg-secondary")
                        .text("Read");
                    $(this).find(".mark-read-form").remove();
                });
                form.remove();
                updateSidebarBadge(0);
            }
        }
    });
});