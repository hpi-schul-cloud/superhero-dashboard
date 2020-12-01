const sinon = require('sinon');
const { expect } = require('chai');

const redirectHelper = require('../../../helpers/redirect');
const managementHelpers = require('../../../controllers/management/helpers');
const api = require('../../../api');

const rp = {
	post() {},
	get() {},
};
const apiStub = sinon.stub(api, 'api').returns(rp);
const createPoliciesBodyStub = sinon.stub(managementHelpers, 'createPoliciesBody');

const { updateInstancePolicy, mainRoute } = require('../../../controllers/management/managementLogic');

describe("Management controller logic tests: ", () => {
	let req;
	let res;
	let rpStub;

	beforeEach(() => {
		req = {
			body: {},
		};
		res = {
			locals: {
				currentUser: "Test user",
			},
			render(templateName, props) {
				this.templateName = templateName;
				this.props = props;
			},
			redirect(route) {
				this.route = route;
			},
		};
	});

	after(() => {
		apiStub.restore();
		createPoliciesBodyStub.restore();
	});

	afterEach(() => {
		rpStub.restore();
	});

	describe('/uploadConsent route: updatingInstancePolicy', () => {
		it('should call safeBackRedirect helper function if api call is successful', async () => {
			// given
			rpStub = sinon.stub(rp, 'post');
			const safeBackRedirectMock = sinon.mock(redirectHelper);

			rpStub.resolves();
			safeBackRedirectMock.expects('safeBackRedirect').withArgs(req, res).once();

			// when
			await updateInstancePolicy(req, res);

			// then
			safeBackRedirectMock.verify();
			safeBackRedirectMock.restore();
		});

		it('should call api under "/consentVersions" endpoint', async () => {
			// given
			rpStub = sinon.stub(rp, 'post');
			rpStub.resolves();
			const safeBackRedirectStub = sinon.stub(redirectHelper, 'safeBackRedirect');

			// when
			await updateInstancePolicy(req, res);

			// then
			sinon.assert.calledWith(rpStub, '/consentVersions');
			safeBackRedirectStub.restore();
		});

		it('should call api with proper parameters', async () => {
			// given
			rpStub = sinon.stub(rp, 'post');
			rpStub.resolves();
			const safeBackRedirectStub = sinon.stub(redirectHelper, 'safeBackRedirect');
			const requestParamesters = {
				consentTitle: "Test title",
				consentText: "Test text",
				consentData: "Test data",
			};
			Object.assign(req.body, requestParamesters);

			// when
			await updateInstancePolicy(req, res);

			// then
			sinon.assert.calledWithExactly(rpStub, sinon.match.string, sinon.match({
				json: {
					title: requestParamesters.consentTitle,
					consentText: requestParamesters.consentText,
					publishedAt: sinon.match.string,
					consentTypes: sinon.match.array.contains(['privacy']),
					consentData: requestParamesters.consentData,
					shdUpload: true,
				}
			}));
			safeBackRedirectStub.restore();
		});
	});

	describe('/ route', () => {
		it("should call api get request", async () => {
			// given
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves();

			// when
			await mainRoute(req, res, () => {});

			// then
			sinon.assert.calledOnce(rpStub);
		});

		it('should call api get request under "/consentVersions" endpoint', async () => {
			// given
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves();

			// when
			await mainRoute(req, res, () => {});

			// then
			sinon.assert.calledWith(rpStub, "/consentVersions");
		});

		it('should call api get request with proper parameters', async () => {
			// given
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves();

			// when
			await mainRoute(req, res, () => {});

			// then
			sinon.assert.calledWith(rpStub, sinon.match.string, sinon.match({
				qs: {
					$limit: 100,
					consentTypes: 'privacy',
					$sort: {
						publishedAt: -1,
					},
				},
			}));
		});

		it('should render proper template if api call was successful', async () => {
			// given
			const consentVersionData = { data: [] };
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves(consentVersionData);

			// when
			await mainRoute(req, res, () => {});

			// then
			expect(res.templateName).to.be.equal('management/management');
		});

		it('should pass proper policies headers to the template', async () => {
			// given
			const consentVersionData = { data: [] };
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves(consentVersionData);

			// when
			await mainRoute(req, res, () => {});

			// then
			const expectedHeaders = [
				'Titel',
				'Beschreibung',
				'Hochgeladen am',
				'Link',
			];

			expect(res.props.policiesHead).to.eql(expectedHeaders);
		});

		it('should pass proper policies body to the template', async () => {
			// given
			const consentVersionData = { data: [] };
			rpStub = sinon.stub(rp, 'get');
			rpStub.resolves(consentVersionData);

			const policiesBody = ['policyBody1', 'policyBody2'];
			createPoliciesBodyStub.returns(policiesBody);

			// when
			await mainRoute(req, res, () => {});

			// then
			expect(res.props.policiesBody).to.equal(policiesBody);
			createPoliciesBodyStub.restore();
		});
	});
});


