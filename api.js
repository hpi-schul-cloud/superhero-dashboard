const { URL } = require("url");

const api = (
    req,
    {
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
            (req?.cookies?.jwt?.startsWith("Bearer ") ? "" : "Bearer ") +
            req?.cookies?.jwt;
    } else if (req?.cookies?.jwt) {
        headers["Authorization"] =
            (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
            req.cookies.jwt;
    }

    const baseApiUrl = new URL(version + "/", baseUrl).href;

    const fetchWithDefaults = async (path, options = {}) => {
        const finalUrl = new URL(
            path.startsWith("/") ? path.slice(1) : path,
            baseApiUrl
        ).href;

        const finalHeaders = { ...headers, ...(options.headers || {}) };

        if (options.body && !finalHeaders["Content-Type"]) {
            finalHeaders["Content-Type"] = "application/json";
        }

        const response = await fetch(finalUrl, {
            method: options.method || "GET",
            headers: finalHeaders,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text();
            const error = new Error(`Request failed: ${response.status} ${text}`);
            error.status = response.status;
            throw error;
        }

        return json ? response.json() : response.text();
    };

    return {
        get: (path, options = {}) => fetchWithDefaults(path, { ...options, method: "GET" }),
        post: (path, options = {}) => fetchWithDefaults(path, { ...options, method: "POST" }),
        put: (path, options = {}) => fetchWithDefaults(path, { ...options, method: "PUT" }),
        patch: (path, options = {}) => fetchWithDefaults(path, { ...options, method: "PATCH" }),
        delete: (path, options = {}) => fetchWithDefaults(path, { ...options, method: "DELETE" }),
    };
};

module.exports = { api };