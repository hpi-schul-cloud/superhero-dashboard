const request = require('request');
var rp = require('request-promise');

const api = (req, { useCallback = false, json = true, version = 'v1', bearer = false } = {}) => {
    const headers = {};
    if(req && req.cookies && req.cookies.jwt) {
        headers['Authorization'] = bearer ? 'Bearer ' + req.cookies.jwt : req.cookies.jwt;
    }
    if(process.env.API_KEY) {
        headers['x-api-key'] = process.env.API_KEY;
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3030/api/';
    const handler = useCallback ? request : rp;
    return handler.defaults({
		baseUrl: new URL(version, baseUrl).href,
        json,
        headers
    });
};

module.exports = { api };
