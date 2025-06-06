/*
 * One Controller per layout view
 */

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/authentication');
const { api } = require('../api');
const moment = require('moment');
const { isFeatureFlagTrue } = require('../helpers/featureFlagHelper');
moment.locale('de');

const USER_MIGRATION_ENABLED = isFeatureFlagTrue(process.env.FEATURE_USER_LOGIN_MIGRATION_ENABLED);

const getTableActions = (item, path) => {
	let tableActions = [
		{
			link: path + item._id,
			class: 'btn-edit',
			icon: 'edit',
			title: 'bearbeiten',
		},
		{
			link: path + item._id,
			class: 'btn-delete',
			icon: 'trash-o',
			method: 'delete',
			title: 'löschen',
		},
		{
			link: path + 'jwt/' + item._id,
			class: 'btn-jwt',
			icon: 'sign-in',
			method: 'get',
			title: 'JWT erstellen',
		},
		{
			link: '/accounts/account/' + item._id,
			class: 'btn-account',
			icon: 'address-card',
			method: 'get',
			title: 'Accountinformationen anzeigen',
		},
	];
	if (item.email) {
		tableActions.push({
			link: `${path}registrationlink/${item._id}?save=true&patchUser=true`,
			class: 'btn-reglink',
			icon: 'share-alt',
			title: 'Registrierungslink generieren',
		});
	}
	if (USER_MIGRATION_ENABLED) {
		tableActions.push({
			link: path + item._id,
			class: 'btn-migration-rollback',
			icon: 'rotate-left',
			title: 'Migration rückgängig machen',
		});
	}
	return tableActions;
};

const inviteWithMail = async (user, req) => {
	// make single role to array
	if (!Array.isArray(req.body.roles)) {
		req.body.roles = [req.body.roles];
	}

	let userrole = 'student';
	if (!req.body.roles.join('').includes('student')) {
		userrole = 'employee';
	}

	let rawData = {
		role: userrole,
		save: true,
		schoolId: req.body.schoolId,
		toHash: user.email,
		patchUser: true,
	};

	// check raw link data
	for (var k in rawData) {
		if (rawData.hasOwnProperty(k) && (rawData[k] === undefined || rawData[k] === '')) return Promise.reject();
	}

	let linkData = await api(req).post('/registrationlink', { json: rawData });

	// create & send mail
	let content = {
		text:
			'Sehr geehrte/r ' +
			user.firstName +
			' ' +
			user.lastName +
			',\n\n' +
			'Sie wurden in die ' +
			(process.env.SC_NAV_TITLE || 'Schul-Cloud') +
			' eingeladen, bitte registrieren Sie sich unter folgendem Link:\n' +
			linkData.shortLink +
			'\n\n' +
			'Mit freundlichen Grüßen' +
			'\nIhr ' +
			(process.env.SC_NAV_TITLE || 'Schul-Cloud') +
			' Team',
	};
	api(req)
		.post('/mails', {
			json: {
				headers: {},
				email: user.email,
				subject: 'Einladung in die ' + (process.env.SC_NAV_TITLE || 'Schul-Cloud'),
				content: content,
			},
		})
		.then((_) => {
			return;
		});
};

const getCreateHandler = (service) => {
	return async function (req, res, next) {
		req.body.schoolId = req.query.schoolId;
		if (req.body.silent !== 'true') {
			api(req)
				.post('/' + service + '/', {
					// TODO: sanitize
					json: req.body,
				})
				.then((data) => {
					inviteWithMail(data, req);
					res.redirect(req.header('Referer'));
				})
				.catch((err) => {
					next(err);
				});
		} else {
			try {
				let importHash = await api(req).post('/hash/', {
					json: {
						toHash: req.body.email,
						save: true,
					},
				});
				if (!importHash) {
					req.session.notification = {
						type: 'danger',
						message: `Fehler beim Erstellen des importHash`,
					};
					return res.redirect(req.header('Referer'));
				}
				let user = await api(req).post('/users/', {
					json: {
						schoolId: req.body.classOrSchoolId,

						firstName: req.body.firstName,
						lastName: req.body.lastName,
						email: req.body.email,

						roles: Array.isArray(req.body.roles) ? req.body.roles : [req.body.roles],

						importHash: importHash,
					},
				});
				if (!user) {
					req.session.notification = {
						type: 'danger',
						message: `Fehler beim Erstellen des Nutzers (#1)`,
					};
					return res.redirect(req.header('Referer'));
				}
				const pin = await api(req).post('/registrationPins/', {
					json: { email: req.body.email, silent: true, byRole: req.body.byRole, importHash: importHash },
				});
				if (!(pin || {}).pin) {
					req.session.notification = {
						type: 'danger',
						message: `Fehler beim Erstellen der Pin`,
					};
					return res.redirect(req.header('Referer'));
				}
				const createdUser = await api(req).post('/registration/', {
					json: {
						classOrSchoolId: req.body.classOrSchoolId,
						importHash: importHash,
						userId: user._id,

						firstName: req.body.firstName,
						lastName: req.body.lastName,
						email: req.body.email,
						password_1: req.body.password,
						password_2: req.body.password,

						pin: pin.pin,

						privacyConsent: true,
						termsOfUseConsent: true,
					},
				});
				if (!createdUser) {
					req.session.notification = {
						type: 'danger',
						message: `Fehler beim Erstellen des Nutzers (#2)`,
					};
					return res.redirect(req.header('Referer'));
				}
				req.session.notification = {
					type: 'success',
					message: `Der Nutzer ${req.body.email} wurde erfolgreich erstellt und kann sich nun einloggen.`,
				};
				return res.redirect(req.header('Referer'));
			} catch (err) {
				next(err);
			}
		}
	};
};

const getUpdateHandler = (service) => {
	return function (req, res, next) {
		/**if (req.body.roles[0].includes(',')) {
            req.body.roles = req.body.roles[0].split(',');
        }**/
		api(req)
			.patch('/' + service + '/' + req.params.id, {
				// TODO: sanitize
				json: req.body,
			})
			.then((data) => {
				res.redirect(req.header('Referer'));
			})
			.catch((err) => {
				next(err);
			});
	};
};

const getDetailHandler = (service, query) => {
	return function (req, res, next) {
		api(req)
			.get('/' + service + '/' + req.params.id, { qs: query })
			.then((data) => {
				res.json(data);
			})
			.catch((err) => {
				next(err);
			});
	};
};

const getMostSignificantRole = (roles) => {
	return roles.find((role) => role === 'administrator') ||
		roles.find((role) => role === 'teacher') ||
		roles.find((role) => role === 'student');
};

const getDeleteHandler = (service) => {
	let roles;
	return function (req, res, next) {
		api(req)
			.get('/users/' + req.params.id, { qs: { $populate: ['roles'] } })
			.then(async (user) => {
				roles = user.roles.map((role) => {
					return role.name;
				});
				return roles;
			})
			.then((roles) => {
				const pathRole = getMostSignificantRole(roles);
				if (pathRole === undefined) {
					const error = new Error('Deletion is supported only for users with role student, teacher or administrator.');
					error.status = 403;
					throw error;
				}
				api(req)
					.delete(`/users/v2/admin/${pathRole}/${req.params.id}`)
					.then((data) => {
						res.redirect(req.header('Referer'));
					})
					.catch((err) => {
						next(err);
					});
			})
			.catch((err) => {
				next(err);
			});
	};
};
// secure routes
router.use(authHelper.authChecker);

router.get('/user/:id', function (req, res, next) {
	api(req)
		.get('/users/', {
			qs: {
				_id: req.params.id,
				$populate: ['roles'],
			},
		})
		.then((response) => {
			if (response.total < 1) {
				const error = new Error("This user doesn't exist");
				error.status = 400;
				throw error;
			}

			const user = response.data[0];

			const schoolPromise = api(req).get('/schools/' + user.schoolId.toString());
			return Promise.all([user, schoolPromise]);
		})
		.then(([user, school]) => {
			const head = ['Vorname', 'Nachname', 'E-Mail-Adresse', 'Rollen', 'Schule', ''];

			const roles = user.roles
				.map((role) => {
					return role.name;
				})
				.join(', ');

			const body = [
				[
					user.firstName || '',
					user.lastName || '',
					user.email || '',
					roles || '',
					school.name,
					getTableActions(user, '/users/'),
				],
			];

			res.render('users/users', {
				title: 'Users',
				head,
				body,
				pagination: {},
				role: user.roles,
				user: res.locals.currentUser || '',
				schoolId: req.query.schoolId || '',
				limit: true,
				themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
			});
		})
		.catch((err) => {
			next(err);
		});
});

router.get('/search', function (req, res, next) {
	const itemsPerPage = req.query.limit || 10;
	const currentPage = parseInt(req.query.p) || 1;

	api(req)
		.get('/users/', {
			qs: {
				$or: [
					{
						firstName: {
							$regex: _.escapeRegExp(req.query.q),
							$options: 'i',
						},
					},
					{
						lastName: {
							$regex: _.escapeRegExp(req.query.q),
							$options: 'i',
						},
					},
					{
						ldapId: {
							$regex: _.escapeRegExp(req.query.q),
								$options: 'i',
						},
					},
				],
				schoolId: req.query.schoolId ? req.query.schoolId : undefined,
				$limit: itemsPerPage,
				$skip: itemsPerPage * (currentPage - 1),
				$sort: req.query.sort,
				$populate: ['roles', 'schoolId'],
			},
		})
		.then((data) => {
			api(req)
				.get('/roles')
				.then((role) => {
					const head = ['ID', 'Vorname', 'Nachname', 'E-Mail-Adresse', 'Rollen', 'Schule', 'External Id', ''];

					const body = data.data.map((item) => {
						let roles = item.roles
							.map((role) => {
								return role.name;
							})
							.join(', ');
						return [
							item._id || '',
							item.firstName || '',
							item.lastName || '',
							item.email || '',
							roles || '',
							(item.schoolId || {}).name || '',
							item.ldapId || '',
							getTableActions(item, '/users/'),
						];
					});

					let sortQuery = '';
					if (req.query.sort) {
						sortQuery = '&sort=' + req.query.sort;
					}

					let limitQuery = '';
					if (req.query.limit) {
						limitQuery = '&limit=' + req.query.limit;
					}

					const pagination = {
						currentPage,
						numPages: Math.ceil(data.total / itemsPerPage),
						baseUrl: '/users/search/?q=' + res.req.query.q + '&p={{page}}' + sortQuery + limitQuery,
					};

					res.render('users/users', {
						title: 'Users',
						head,
						body,
						pagination,
						role: role.data,
						user: res.locals.currentUser,
						schoolId: req.query.schoolId,
						limit: true,
					});
				});
		});
});

router.get('/jwt/:id', async (req, res, next) => {
	try {
		const getJWT = api(req, {version: 'v3'}).post('/shd/supportJwt', {
			json: {
				userId: req.params.id,
			},
		});
		const getUser = api(req).get('/users/' + req.params.id);

		const [jwt, user] = await Promise.all([getJWT, getUser]);

		res.render('users/jwt', {
			title: `JWT für ${user.displayName}`,
			jwt: jwt.accessToken || '',
			user: user,
			themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
		});
	} catch (err) {
		next(err);
	}
});

router.patch('/:id', getUpdateHandler('users'));
router.get('/:id', getDetailHandler('users', { $populate: 'roles' }));
router.delete('/:id', getDeleteHandler('users'));
router.post('/', getCreateHandler('users'));

router.get('/', function (req, res, next) {
	if (res.req.query.schoolId) {
		const itemsPerPage = req.query.limit || 10;
		const currentPage = parseInt(req.query.p) || 1;

		api(req)
			.get('/roles', { qs: { $limit: 25 } })
			.then((role) => {
				api(req)
					.get('/users?schoolId=' + res.req.query.schoolId, {
						qs: {
							$limit: itemsPerPage,
							$skip: itemsPerPage * (currentPage - 1),
							$sort: req.query.sort,
							$populate: 'roles',
						},
					})
					.then((data) => {
						const head = ['ID', 'Vorname', 'Nachname', 'E-Mail-Adresse', 'Rollen', 'External Id', ''];

						const body = data.data.map((item) => {
							if (!item.deletedAt) {
								let roles = item.roles
									.map((role) => {
										return role.name;
									})
									.join(', ');
								return [
									item._id || '',
									item.firstName || '',
									item.lastName || '',
									item.email || '',
									roles || '',
									item.ldapId || '',
									getTableActions(item, '/users/'),
								];
							}
						});

						let sortQuery = '';
						if (req.query.sort) {
							sortQuery = '&sort=' + req.query.sort;
						}

						let limitQuery = '';
						if (req.query.limit) {
							limitQuery = '&limit=' + req.query.limit;
						}

						const pagination = {
							currentPage,
							numPages: Math.ceil(data.total / itemsPerPage),
							baseUrl: '/users/?schoolId=' + res.req.query.schoolId + '&p={{page}}' + sortQuery + limitQuery,
						};

						api(req)
							.get('/schools/' + req.query.schoolId)
							.then((schoolData) => {
								res.render('users/users', {
									title: 'Users',
									head,
									body,
									pagination,
									schoolId: req.query.schoolId,
									role: role.data,
									user: res.locals.currentUser,
									school: schoolData,
									limit: true,
									themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
								});
							});
					});
			});
	} else {
		api(req)
			.get('/schools/', { qs: { $limit: false } })
			.then((schools) => {
				res.render('users/preselect', {
					title: 'Users',
					user: res.locals.currentUser,
					schools: schools.data,
					themeTitle: process.env.SC_NAV_TITLE || 'Schul-Cloud',
				});
			});
	}
});

const generateRegistrationLink = () => {
	return function (req, res, next) {
		api(req)
			.get('/users/' + req.params.id, { qs: { $populate: ['roles'] } })
			.then(async (user) => {
				let roles = user.roles.map((role) => {
					return role.name;
				});

				let userrole = 'student';
				if (!roles.join('').includes('student')) {
					userrole = 'employee';
				}

				let rawData = {
					role: userrole,
					save: true,
					schoolId: user.schoolId,
					toHash: user.email,
					patchUser: true,
				};

				// check raw link data
				for (var k in rawData) {
					if (rawData.hasOwnProperty(k) && (rawData[k] === undefined || rawData[k] === '')) next();
				}

				let linkData = await api(req).post('/registrationlink', { json: rawData });
				res.json({ invitation: linkData.shortLink, currentSchool: user.schoolId });
			})
			.catch((err) => {
				next(err);
			});
	};
};

router.get('/registrationlink/:id', generateRegistrationLink());

router.post('/:id/rollback-migration', (req, res, next) => {
	const userId = req.params.id;

	api(req, { version: 'v3' }).post(`/user-login-migrations/users/${userId}/rollback-migration`)
		.then(async () => {
			req.session.notification = {
				type: 'success',
				message: `Die Migration für den Nutzer wurde erfolgreich zurückgesetzt`,
			};

			res.redirect(req.header('Referer'));
		})
		.catch((err) => {
			next(err);
		});
});

module.exports = router;
