function updateSidebarNotificationBadge(count) {
    var link = $("#sidebarNotificationLink");
    var badge = $("#sidebarNotificationBadge");

    if (!link.length) {
        return;
    }

    if (count > 0) {
        if (badge.length) {
            badge.text(count);
        } else {
            link.append(
                '<span class="sidebar-badge bg-danger" id="sidebarNotificationBadge">' +
                count +
                '</span>'
            );
        }
    } else {
        badge.remove();
    }

    if ($("#unreadCountLabel").length) {
        $("#unreadCountLabel").text(count);
    }
}

function buildNotificationItem(notification, csrfToken) {
    var readBadge = notification.is_read
        ? '<span class="badge bg-secondary mb-2">Read</span>'
        : '<span class="badge bg-danger mb-2">New</span>';

    var markReadForm = notification.is_read
        ? ''
        : '<form method="post" action="/notifications/' + notification.id + '/read/" class="mark-read-form">' +
          '<input type="hidden" name="csrfmiddlewaretoken" value="' + csrfToken + '">' +
          '<button type="submit" class="btn btn-outline-primary btn-sm">Mark as Read</button>' +
          '</form>';

    return (
        '<div class="list-group-item ' + (notification.is_read ? '' : 'notification-unread') +
        '" id="notification-' + notification.id + '">' +
        '<div class="d-flex justify-content-between align-items-start gap-3">' +
        '<div>' + readBadge +
        '<p class="mb-1">' + $('<div>').text(notification.message).html() + '</p>' +
        '<small class="text-muted">' + notification.created_at + '</small>' +
        '</div>' + markReadForm + '</div></div>'
    );
}

function prependNotifications(notifications, csrfToken) {
    var list = $("#notificationList");

    if (!list.length || !notifications.length) {
        return;
    }

    $("#notificationEmptyState").remove();
    list.removeClass("d-none");

    if (!$("#markAllReadForm").length) {
        $(".notification-header-actions").html(
            '<form method="post" action="/notifications/mark-all-read/" id="markAllReadForm">' +
            '<input type="hidden" name="csrfmiddlewaretoken" value="' + csrfToken + '">' +
            '<button type="submit" class="btn btn-primary btn-sm">Mark All as Read</button>' +
            '</form>'
        );
    }

    notifications.forEach(function(notification) {
        if ($("#notification-" + notification.id).length) {
            return;
        }
        list.prepend(buildNotificationItem(notification, csrfToken));
    });

    var total = list.find(".list-group-item").length;
    $("#totalCountLabel").text(total);
}

function getWebSocketUrl(path) {
    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return protocol + "//" + window.location.host + path;
}

$(document).ready(function() {
    var wsEnabled = $("#notificationWsConfig").length;

    if (!wsEnabled) {
        return;
    }

    var config = $("#notificationWsConfig");
    var wsPath = config.data("ws-url");
    var csrfToken = config.data("csrf-token");
    var onNotificationsPage = config.data("on-page") === true || config.data("on-page") === "true";
    var reconnectDelay = 1000;
    var maxReconnectDelay = 30000;
    var socket = null;
    var reconnectTimer = null;

    function handleMessage(data) {
        if (data.event === "unread_count" && typeof data.unread_count === "number") {
            updateSidebarNotificationBadge(data.unread_count);
            return;
        }

        if (data.event === "new_notification" && data.notification) {
            updateSidebarNotificationBadge(data.unread_count);

            if (onNotificationsPage) {
                prependNotifications([data.notification], csrfToken);
            }
        }
    }

    function connectWebSocket() {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        socket = new WebSocket(getWebSocketUrl(wsPath));

        socket.onopen = function() {
            reconnectDelay = 1000;
        };

        socket.onmessage = function(event) {
            try {
                handleMessage(JSON.parse(event.data));
            } catch (error) {
                console.error("Invalid notification WebSocket payload", error);
            }
        };

        socket.onclose = function() {
            socket = null;
            reconnectTimer = setTimeout(function() {
                connectWebSocket();
            }, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
        };

        socket.onerror = function() {
            if (socket) {
                socket.close();
            }
        };
    }

    connectWebSocket();

    $(window).on("beforeunload", function() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }
        if (socket) {
            socket.close();
        }
    });
});
