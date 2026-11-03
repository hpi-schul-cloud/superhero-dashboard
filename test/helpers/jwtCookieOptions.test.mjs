import { expect } from 'chai';
import getJwtCookieOptions from '../../helpers/jwtCookieOptions.js';

describe('JWT cookie options', () => {
	let originalSameSite;
	let originalSecure;

	beforeEach(() => {
		originalSameSite = process.env.COOKIE__SAME_SITE;
		originalSecure = process.env.COOKIE__SECURE;
		delete process.env.COOKIE__SAME_SITE;
		delete process.env.COOKIE__SECURE;
	});

	afterEach(() => {
		if (originalSameSite === undefined) {
			delete process.env.COOKIE__SAME_SITE;
		} else {
			process.env.COOKIE__SAME_SITE = originalSameSite;
		}
		if (originalSecure === undefined) {
			delete process.env.COOKIE__SECURE;
		} else {
			process.env.COOKIE__SECURE = originalSecure;
		}
	});

	it('defaults SameSite to lax and derives Secure from the request', () => {
		expect(getJwtCookieOptions({ secure: false })).to.include({ sameSite: 'lax', secure: false, httpOnly: true });
		expect(getJwtCookieOptions({ secure: true })).to.include({ sameSite: 'lax', secure: true, httpOnly: true });
	});

	it('preserves an explicit false Secure override', () => {
		process.env.COOKIE__SECURE = 'false';
		expect(getJwtCookieOptions({ secure: true }).secure).to.equal(false);
	});

	it('allows SameSite=None when Secure is enabled', () => {
		process.env.COOKIE__SAME_SITE = 'none';
		process.env.COOKIE__SECURE = 'true';
		expect(getJwtCookieOptions({ secure: false })).to.include({ sameSite: 'none', secure: true });
	});

	it('rejects SameSite=None when Secure is disabled', () => {
		process.env.COOKIE__SAME_SITE = 'none';
		process.env.COOKIE__SECURE = 'false';
		expect(() => getJwtCookieOptions({ secure: true })).to.throw(/requires COOKIE__SECURE/);

		process.env.COOKIE__SECURE = 'auto';
		expect(() => getJwtCookieOptions({ secure: false })).to.throw(/requires COOKIE__SECURE/);
	});
});
