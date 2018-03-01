const url = require('url');
const moment = require('moment');
const api = require('../../api');

const makeActive = (items, currentUrl) => {
	currentUrl += "/";		
    return items.map(item => {
        const regex = new RegExp("^" + item.link, "i");

        if (currentUrl.replace(regex, '') === '') {
            item.class = 'active';
            item.childActive = true;
        } else if(currentUrl.match(regex)) {
            if(item.children) {
                item.class = 'child-active';
            } else {
                item.class = 'active';
            }
            item.childActive = true;
        }

        if(item.children && item.childActive) {
            item.children = makeActive(item.children, currentUrl);
            
            if(item.children.filter(child => {return child.class == 'active';}).length == 0){
                item.class += ' active';
            }
        }

        return item;
    });
};

module.exports = (req, res, next) => {
    res.locals.themeTitle = process.env.SC_NAV_TITLE || 'Schul-Cloud';
    // standard views
    res.locals.sidebarItems = [{
        name: 'Übersicht',
        icon: 'th-large',
        link: '/dashboard/',
    }];

    // teacher views
    res.locals.sidebarItems.push();

    // helpdesk views
    res.locals.sidebarItems.push();

    // admin views
    res.locals.sidebarItems.push();

    makeActive(res.locals.sidebarItems, url.parse(req.url).pathname);

    let notificationsPromise = [];
    if (process.env.NOTIFICATION_SERVICE_ENABLED) {
        notificationsPromise = api(req).get('/notification', {
            qs: {
                $limit: 10,
                $sort: "-createdAt"
            }
        }).catch(_ => []);
        }
    let notificationCount = 0;

    Promise.all([
            notificationsPromise
        ]).then(([notifications]) => {
            res.locals.notifications = (notifications.data || []).map(notification => {
                const notificationId = notification._id;
                const callbacks = notification.callbacks || [];

                notification = notification.message;
                notification.notificationId = notificationId;

                notification.date = new Date(notification.createdAt);  // make new date out of iso string

                notification.read = false;
                callbacks.forEach(callback => {
                    if (callback.type === "read")
                        notification.read = true;
                });

                if (!notification.read) {
                    notificationCount++;
                }

                return notification;
            });
            res.locals.recentNotifications = notificationCount;
            next();
        });
};