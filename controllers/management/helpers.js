const moment = require('moment');
moment.locale('de');
const createPoliciesBody = (policiesData) => {
	return policiesData.map((consentVersion) => {
		const title = consentVersion.title;
		const text = consentVersion.consentText;
		const publishedAt = moment(consentVersion.publishedAt).format('DD.MM.YYYY HH:mm');
		const linkToPolicy = consentVersion.consentDataId;
		const links = [];
		if (linkToPolicy) {
			links.push({
				link: `/base64Files/${linkToPolicy}`,
				class: 'base64File-download-btn',
				icon: 'file-o',
				title: 'Datenschutzerklärung der Instanz',
			});
		}
		return [title, text, publishedAt, links];
	});
};

module.exports = {
	createPoliciesBody,
};