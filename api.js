const { Readable } = require("node:stream");

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const appendQueryParams = (searchParams, key, value) => {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    searchParams.append(key, "");
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      appendQueryParams(searchParams, `${key}[${index}]`, entry);
    });
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendQueryParams(searchParams, `${key}[${nestedKey}]`, nestedValue);
    });
    return;
  }

  searchParams.append(key, String(value));
};

const buildUrl = (baseUrl, path, qs) => {
  const absoluteUrl = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);

  if (qs && isPlainObject(qs)) {
    Object.entries(qs).forEach(([key, value]) => {
      appendQueryParams(absoluteUrl.searchParams, key, value);
    });
  }

  return absoluteUrl;
};

const parseResponseBody = async (response, expectJson) => {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") || "";
  const shouldParseJson =
    expectJson || contentType.includes("application/json") || contentType.includes("+json");

  if (shouldParseJson) {
    const text = await response.text();

    if (!text) {
      return undefined;
    }

    return JSON.parse(text);
  }

  return response.text();
};

const createHttpError = async (response, expectJson) => {
  const errorBody = await parseResponseBody(response, expectJson).catch(() => undefined);
  const error = new Error(
    errorBody?.message || response.statusText || `Request failed with status code ${response.status}`
  );

  error.name = "StatusCodeError";
  error.status = response.status;
  error.statusCode = response.status;
  error.error = errorBody;
  error.response = {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: errorBody,
  };

  return error;
};

const serializeBody = (payload, headers) => {
  if (payload === undefined || payload === null) {
    return undefined;
  }

  if (
    typeof payload === "string" ||
    payload instanceof URLSearchParams ||
    payload instanceof Buffer ||
    ArrayBuffer.isView(payload) ||
    payload instanceof ArrayBuffer ||
    payload instanceof FormData
  ) {
    return payload;
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (headers.get("content-type")?.includes("application/json")) {
    return JSON.stringify(payload);
  }

  return String(payload);
};

const createClient = ({ baseUrl, defaultJson, headers: defaultHeaders }) => {
  const execute = async (method, path, options = {}) => {
    const { qs, json, body, headers: requestHeaders, ...unsupportedOptions } = options;

    if (Object.keys(unsupportedOptions).length > 0) {
      throw new Error(
        `Unsupported request options: ${Object.keys(unsupportedOptions).join(", ")}`
      );
    }

    const headers = new Headers({
      ...defaultHeaders,
      ...(requestHeaders || {}),
    });
    const payload = json !== undefined ? json : body;
    const response = await fetch(buildUrl(baseUrl, path, qs), {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : serializeBody(payload, headers),
    });

    if (!response.ok) {
      throw await createHttpError(response, defaultJson || json !== undefined);
    }

    return parseResponseBody(response, defaultJson || json !== undefined);
  };

  const createStreamRequest = async (path, options = {}) => {
    const { qs, headers: requestHeaders, ...unsupportedOptions } = options;

    if (Object.keys(unsupportedOptions).length > 0) {
      throw new Error(
        `Unsupported streaming request options: ${Object.keys(unsupportedOptions).join(", ")}`
      );
    }

    const response = await fetch(buildUrl(baseUrl, path, qs), {
      method: "GET",
      headers: new Headers({
        ...defaultHeaders,
        ...(requestHeaders || {}),
      }),
    });

    if (!response.ok) {
      throw await createHttpError(response, false);
    }

    return Readable.fromWeb(response.body);
  };

  const createRequest = (method) => (path, options = {}) => {
    const promise = execute(method, path, options);

    if (method === "GET") {
      promise.pipe = (destination) => {
        createStreamRequest(path, options)
          .then((stream) => {
            stream.pipe(destination);
          })
          .catch((error) => {
            if (typeof destination.destroy === "function") {
              destination.destroy(error);
            }
          });

        return destination;
      };
    }

    return promise;
  };

  return {
    get: createRequest("GET"),
    post: createRequest("POST"),
    put: createRequest("PUT"),
    patch: createRequest("PATCH"),
    delete: createRequest("DELETE"),
  };
};

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
      (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
      req.cookies.jwt;
  } else if (req && req.cookies && req.cookies.jwt) {
    headers["Authorization"] =
      (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
      req.cookies.jwt;
  }

  const apiRequest = {
    baseUrl: new URL(version, baseUrl).href,
    defaultJson: json,
    headers,
  };

  return createClient(apiRequest);
};

module.exports = { api };
