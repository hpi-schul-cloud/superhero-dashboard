// const jwt = require('jsonwebtoken');
// TODO: can we remove jsonwebtoken?
const { api } = require('../api');

/* const isJWT = (req) => {
    return (req && req.cookies && req.cookies.jwt);
}; */

const isLoggedIn = (req) => {
    return (req && req.cookies && req.cookies.isLoggedIn);
};

const isAuthenticated = (req) => {
   if(!isLoggedIn(req)) {
        return Promise.resolve(false);
    }

    return api(req).post('/authentication', {json: {
        strategy: 'isLoggedIn',
        accessToken: req.cookies.isLoggedIn
    }}).then(_ => {
        return true;
    }).catch(_ => {
        return false;
    });
};

const authChecker = (req, res, next) => {
    isAuthenticated(req)
        .then(isAuthenticated => {
            if(isAuthenticated) {

                // fetch user profile
                populateCurrentUser(req, res)
                    .then(_ => {
                        return restrictSidebar(req, res);
                    })
                    .then(_ => {
                        next();
                    });
            } else {
                res.redirect('/login/');
            }
        });
};

const populateCurrentUser = (req, res) => {
    let payload = {};
    if(isLoggedIn(req)) {
        payload = (req.cookies.isLoggedIn || {}).payload;
        res.locals.currentPayload = payload;
    }

    if(payload.userId) {
        return api(req).get('/users/' + payload.userId + '?$populate=roles').then(data => {
            let access = false;
            data.roles.map(role => {
                if (role.name === 'superhero')
                    access = true;
            });
            if (!access) {
                res.redirect('/logout');
            }
            res.locals.currentUser = data;
            return data;
        });
    }

    return Promise.resolve();
};

const restrictSidebar = (req, res) => {
    res.locals.sidebarItems = [
        {
            name: 'Übersicht',
            icon: 'th-large',
            link: '/dashboard/',
        },
        {
            name: 'Statistiken',
            icon: 'line-chart',
            link: '/statistics/',
        },
        {
            name: 'Schulen',
            icon: 'graduation-cap',
            link: '/schools/'
        },
        {
            name: 'Users',
            icon: 'user',
            link: '/users/'
        },
        {
            name: 'Accounts',
            icon: 'address-card',
            link: '/accounts/'
        },
        {
            name: 'Rollen',
            icon: 'superpowers',
            link: '/roles/'
        },
        {
            name: 'Helpdesk',
            icon: 'handshake-o',
            link: '/helpdesk/'
        },
        {
            name: 'Bundesländer',
            icon: 'globe',
            link: '/federalstates/'
        },
        {
            name: 'Allg. Verwaltung',
            icon: 'gear',
            link: '/management/'
        },
        {
            name: 'CTL Tools',
            icon: 'window-maximize',
            link: '/ctltools/',
        },
        {
            name: 'Datenspeicher',
            icon: 'server',
            link: '/storageproviders/'
        },
        {
            name: 'Löschung',
            icon: 'trash',
            link: '/batch-deletion/'
        },
    ];

    res.locals.sidebarItems = res.locals.sidebarItems.filter((item) => item.enabled == null || item.enabled);
};

module.exports = {
    isLoggedIn,
    authChecker,
    isAuthenticated,
    restrictSidebar,
    populateCurrentUser
};
