const { URL } = require("url");

const api = (
    req,
    {
        useCallback = false, // ignored
        json = true,
        version = "v1",
        adminApi = false,
        filesStorageApi = false,
    } = {}
) => {
    let baseUrl = process.env.BACKEND_URL || "http://localhost:3030/api/";

    const headers = {};

    if (adminApi) {
        baseUrl = process.env.ADMIN_API_URL || "http://localhost:4030/admin/api/";
        headers["x-api-key"] =
            process.env.ADMIN_API_KEY ||
            "thisisasupersecureapikeythatisabsolutelysave";
    } else if (filesStorageApi) {
        baseUrl = process.env.FILES_STORAGE_API_URL || "http://localhost:4444/api/";
        headers["Authorization"] =
            (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
            req.cookies.jwt;
    } else if (req && req.cookies && req.cookies.jwt) {
        headers["Authorization"] =
            (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
            req.cookies.jwt;
    }

    const baseApiUrl = new URL(version + "/", baseUrl).href;

    const fetchWithDefaults = async (path, options = {}) => {
        const finalUrl = new URL(path, baseApiUrl).href;
        const finalHeaders = { ...headers, ...(options.headers || {}) };

        const response = await fetch(finalUrl, {
            method: options.method || "GET",
            headers: finalHeaders,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Request failed: ${response.status} ${text}`);
        }

        return json ? response.json() : response.text();
    };

    return fetchWithDefaults;
};

module.exports = { api };