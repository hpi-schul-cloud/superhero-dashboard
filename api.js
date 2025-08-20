const api = (
  req,
  {
    // The `useCallback` option is deprecated as native fetch is promise-based.
    // The returned client will always be promise-based.
    useCallback = false,
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
    if (req && req.cookies && req.cookies.jwt) {
      headers["Authorization"] =
        (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
        req.cookies.jwt;
    }
  } else if (req && req.cookies && req.cookies.jwt) {
    headers["Authorization"] =
      (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
      req.cookies.jwt;
  }

  const urlJoin = (base, p) => {
    const newBase = base.endsWith("/") ? base : base + "/";
    const newPath = p.startsWith("/") ? p.substring(1) : p;
    return newBase + newPath;
  };

  const fetchWithDefaults = async (method, uri, options = {}) => {
    let path;
    let mergedOptions = { ...options };

    if (typeof uri === "object") {
      mergedOptions = { ...uri, ...options };
      path = mergedOptions.uri;
      delete mergedOptions.uri;
    } else {
      path = uri;
    }

    const baseApiUrl = new URL(version, baseUrl).href;

    let url = urlJoin(baseApiUrl, path || '');

    const fetchOptions = {
      method,
      headers: { ...headers, ...mergedOptions.headers },
      ...mergedOptions,
    };

    if (mergedOptions.body) {
      if (
        json &&
        typeof mergedOptions.body === "object" &&
        !(mergedOptions.body instanceof FormData) &&
        !(mergedOptions.body instanceof URLSearchParams)
      ) {
        fetchOptions.body = JSON.stringify(mergedOptions.body);
        if (!fetchOptions.headers["Content-Type"]) {
          fetchOptions.headers["Content-Type"] = "application/json";
        }
      }
    } else if (mergedOptions.json && typeof mergedOptions.json === 'object') {
        fetchOptions.body = JSON.stringify(mergedOptions.json);
        if (!fetchOptions.headers["Content-Type"]) {
            fetchOptions.headers["Content-Type"] = "application/json";
        }
    } else if (mergedOptions.form) {
      fetchOptions.body = new URLSearchParams(mergedOptions.form);
      if (!fetchOptions.headers["Content-Type"]) {
        fetchOptions.headers["Content-Type"] =
          "application/x-www-form-urlencoded";
      }
    } else if (mergedOptions.formData) {
      fetchOptions.body = mergedOptions.formData;
    }

    if (mergedOptions.qs) {
      const params = new URLSearchParams(mergedOptions.qs);
      url = `${url}?${params}`;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const error = new Error(
        `Request failed with status code ${response.status}`
      );
      error.statusCode = response.status;
      error.response = response;
      try {
        error.error = await response.json();
      } catch (e) {
        try {
          error.error = await response.text();
        } catch (e2) {
          // ignore
        }
      }
      throw error;
    }

    if (mergedOptions.resolveWithFullResponse) {
      return response;
    }

    if (filesStorageApi) {
      return response;
    }

    if (json) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
    }

    return response.text();
  };

  const client = {};
  const methods = ["get", "post", "put", "delete", "patch", "head", "options"];
  for (const method of methods) {
    client[method] = (uri, options) =>
      fetchWithDefaults(method.toUpperCase(), uri, options);
  }

  return client;
};

module.exports = { api };
