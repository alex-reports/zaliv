const config = {
    sourceId: "4",
    apiURL: 'https://t.formatinfo.top/v1/'
};

function onAllowSubscription() { // popup "Allow" button click handler
    if (isSafari) {
        const permissionData = window.safari.pushNotification.permission('web.top.formatinfo');
        checkRemotePermission(permissionData)
    } else {
        httpGetRequest('popup-trk/show?source_id=' + config.sourceId);
        navigator
            .serviceWorker
            .ready
            .then(reg => {
                reg.pushManager.getSubscription().then(function (sub) {
                    if (sub === null) {
                        reg.pushManager
                            .subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array('BEyr1eMGe16tOnxWmpI44GvcenyLmYkdec8zGpTMvcKf_a_F8p7OF-q9pGVkoQeCxzfA6UyzR1hOXP-9xPyWgxA')
                            })
                            .then(d => {
                                const subscription = d.toJSON();
                                httpGetRequest('popup-trk/click?source_id=' + config.sourceId);

                                // send subscription to server in 'meta' field
                                sendTokenToServer(subscription);
                            })
                            .catch(e => {
                                httpGetRequest('popup-trk/close?source_id=' + config.sourceId);
                                console.log(e);
                            }); // permission denied

                        console.log('Not subscribed to push service!');
                    } else {
                        console.log('Subscription object: ', sub);
                    }
                });
            })
    }
}

function checkRemotePermission(permissionData) {
    if (permissionData.permission === 'default') {
        console.log('default permission');
        window.safari.pushNotification.requestPermission(
            'https://wild.formatinfo.top/safari/' + config.sourceId,
            'web.top.formatinfo',
            {source: config.sourceId},
            checkRemotePermission
        );
    } else if (permissionData.permission === 'denied') {
        console.log('Denied');

    } else if (permissionData.permission === 'granted') {
        console.log('Granted');

    }
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        httpPostRequest('sub-info', {
            token: null,
            meta: currentToken,
            source_id: config.sourceId
        }, function () {
            setTokenSentToServer(currentToken);
        });

    }
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('token') === currentToken;
}

function setTokenSentToServer(currentToken) {
    window.localStorage.setItem(
        'token',
        currentToken ? currentToken : ''
    );
}

function httpGetRequest(endpoint, callback) {
    $.ajax({
        type: 'GET',
        url: config.apiURL + endpoint,
        success: callback
    });
}

function httpPostRequest(endpoint, data, callback) {
    $.ajax({
        type: 'POST',
        url: config.apiURL + endpoint,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: callback
    });
}

let isSafari = 'safari' in window && 'pushNotification' in window.safari;

function managePermission(permissionData) {
    if ((permissionData && permissionData.permission === 'denied') || Notification.permission === "granted" || Notification.permission === "denied") {
        console.log('Denied');
    } else {
        httpGetRequest('popup-trk/show?source_id=' + config.sourceId);
        onAllowSubscription();
    }
}

function subscribe() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/messaging-sw.js')
            .then(function (reg) {
                if (isSafari) {
                    var permissionData = window.safari.pushNotification.permission('web.top.formatinfo');
                    managePermission(permissionData);
                } else {
                    reg.pushManager.getSubscription().then(function (sub) {
                        if (sub === null) {
                            setTimeout(onAllowSubscription, 2000);
                        } else {
                            console.log('Subscription object: ', sub.toJSON());
                        }
                    });
                }
            });
    } else {
        console.error('Service worker is not supported in this browser');
    }
}
