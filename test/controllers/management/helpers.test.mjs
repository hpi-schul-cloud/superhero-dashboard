import { createPoliciesBody } from '../../../controllers/management/helpers.js';
import moment from 'moment';
import sinon from 'sinon';
import { expect } from 'chai';

describe('Management controller helpers tests: ', () => {
	describe("createPoliciesBody", () => {
		let momentFormatMock;

		beforeEach(() => {
			momentFormatMock = sinon.mock(moment.fn);
		});

		afterEach(() => {
			momentFormatMock.restore();
		});

		it("should call moments format method with proper string format", () => {
			// given
			const policiesData = [{}];
			momentFormatMock.expects('format').withArgs('DD.MM.YYYY HH:mm').once();
			// when
			createPoliciesBody(policiesData);
			// then
			momentFormatMock.verify();
		});

		it("should not loose any consent policy", () => {
			const policiesData = [{}, {}, {}];

			// when
			const result = createPoliciesBody(policiesData);

			// then
			expect(result.length).to.be.equal(policiesData.length);
		});

		it("should return correct title", () => {
			// given
			const policyData1 = {
				title: 'Title 1',
			};
			const policyData2 = {
				title: 'Title 2',
			};
			const policiesData = [policyData1, policyData2];

			// when
			const result = createPoliciesBody(policiesData);

			// then
			expect(result[0][0]).to.equal(policyData1.title);
			expect(result[1][0]).to.equal(policyData2.title);
		});

		it("should return correct text", () => {
			// given
			const policyData1 = {
				consentText: 'Text 1',
			};
			const policyData2 = {
				consentText: 'Text 2',
			};
			const policiesData = [policyData1, policyData2];

			// when
			const result = createPoliciesBody(policiesData);

			// then
			expect(result[0][1]).to.equal(policyData1.consentText);
			expect(result[1][1]).to.equal(policyData2.consentText);
		});

		it("should return correct published date", () => {
			// given
			const date1 = '2020-01-01T00:00:00.000+00:00';
			const date2 = '2020-02-01T00:00:00.000+00:00';
			const policyData1 = {
				publishedAt: date1,
			};
			const policyData2 = {
				publishedAt: date2,
			};
			const policiesData = [policyData1, policyData2];

			// when
			const result = createPoliciesBody(policiesData);

			// then
			// Calculate expected dates dynamically using the same logic as the implementation
			// This makes the test timezone-independent
			const expectedDateFormat1 = moment(date1).format('DD.MM.YYYY HH:mm');
			const expectedDateFormat2 = moment(date2).format('DD.MM.YYYY HH:mm');
			expect(result[0][2]).to.equal(expectedDateFormat1);
			expect(result[1][2]).to.equal(expectedDateFormat2);
		});

		it("should return correct links for policies", () => {
			const policyData1 = {
				consentDataId: 123,
			};
			const policyData2 = {
				consentDataId: 456,
			};
			const policiesData = [policyData1, policyData2];

			// when
			const result = createPoliciesBody(policiesData);

			// then
			expect(result[0][3]).to.deep.include.members([{
				link: `/base64Files/${policyData1.consentDataId}`,
				class: 'base64File-download-btn',
				icon: 'file-o',
				title: 'Datenschutzerklärung der Instanz',
			}]);
			expect(result[1][3]).to.deep.include.members([{
				link: `/base64Files/${policyData2.consentDataId}`,
				class: 'base64File-download-btn',
				icon: 'file-o',
				title: 'Datenschutzerklärung der Instanz',
			}]);
		});
	});
});
