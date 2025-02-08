const jwt = require('jsonwebtoken');
const { api } = require('../api');

const isJWT = (req) => {
    return (req && req.cookies && req.cookies.jwt);
};

const isAuthenticated = (req) => {
   if(!isJWT(req)) {
        return Promise.resolve(false);
    }

    return api(req).post('/authentication', {json: {
        strategy: 'jwt',
        accessToken: req.cookies.jwt
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
    if(isJWT(req)) {
        payload = (jwt.decode(req.cookies.jwt, {complete: true}) || {}).payload;
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
    isJWT,
    authChecker,
    isAuthenticated,
    restrictSidebar,
    populateCurrentUser
};
