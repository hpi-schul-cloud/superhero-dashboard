const { Readable } = require("node:stream");

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);


const apiClient = ({ baseUrl, defaultJson, headers: defaultHeaders }) => {
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
    if (/^https?:\/\//i.test(path)) {
      throw new Error(
        `Absolute URLs are not allowed. Received: ${path}. Only relative paths starting with "/" are permitted.`
      );
    }

    const url = new URL(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);

    if (qs && isPlainObject(qs)) {
      Object.entries(qs).forEach(([key, value]) => {
        appendQueryParams(url.searchParams, key, value);
      });
    }

    return url;
  };

  const parseResponseBody = async (response, expectJson, responseType) => {
    if (response.status === 204 || response.status === 205) {
      return undefined;
    }

    if (responseType === "text") {
      return response.text();
    }

    const contentType = response.headers.get("content-type") || "";
    const shouldParseJson =
      expectJson || contentType.includes("application/json") || contentType.includes("+json");

    if (shouldParseJson) {
      const text = await response.text();

      if (!text) {
        return undefined;
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        const positionMatch = error.message.match(/position (\d+)/);
        const errorPosition = positionMatch ? Number(positionMatch[1]) : undefined;
        const contextStart = errorPosition === undefined ? undefined : Math.max(0, errorPosition - 4);
        const contextEnd = errorPosition === undefined ? undefined : Math.min(text.length, errorPosition + 5);

        error.responseParseDetails = {
          status: response.status,
          contentType,
          bodyLength: text.length,
          errorPosition,
          contextStart,
          nearbyCharacterCodes:
            contextStart === undefined
              ? undefined
              : Array.from({ length: contextEnd - contextStart }, (_, index) =>
                  text.charCodeAt(contextStart + index)
                ),
        };
        throw error;
      }
    }

    return response.text();
  };

  const createHttpError = async (response, expectJson, responseType) => {
    let bodyParseDetails;
    const errorBody = await parseResponseBody(response, expectJson, responseType).catch((parseError) => {
      bodyParseDetails = parseError.responseParseDetails;
      return undefined;
    });
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
      bodyParseDetails,
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

  const destroyDestination = (destination, error) => {
    if (typeof destination.destroy === "function") {
      destination.destroy(error);
    }
  };

  const pipeStreamToDestination = (stream, destination) => {
    stream.on("error", (error) => destroyDestination(destination, error));
    stream.pipe(destination);
  };

  const createDeferredGetRequest = (path, options, execute, createStreamRequest) => {
    let fetchStarted = false;
    let actualPromise = null;

    const startFetch = () => {
      if (fetchStarted) {
        return actualPromise;
      }

      fetchStarted = true;
      actualPromise = execute("GET", path, options);
      return actualPromise;
    };

    const startStream = (destination) => {
      if (fetchStarted) {
        return destination;
      }

      fetchStarted = true;
      createStreamRequest(path, options)
        .then((stream) => pipeStreamToDestination(stream, destination))
        .catch((error) => destroyDestination(destination, error));

      return destination;
    };

    return {
      pipe: (destination) => startStream(destination),
      then: (onFulfilled, onRejected) => startFetch().then(onFulfilled, onRejected),
      catch: (onRejected) => startFetch().catch(onRejected),
      finally: (onFinally) => startFetch().finally(onFinally),
    };
  };

  const execute = async (method, path, options = {}) => {
    const { qs, json, body, headers: requestHeaders, responseType, ...unsupportedOptions } = options;

    if (responseType !== undefined && responseType !== "json" && responseType !== "text") {
      throw new Error(`Unsupported response type: ${responseType}`);
    }

    const expectsJson = responseType ? responseType === "json" : defaultJson || json !== undefined;

    if (Object.keys(unsupportedOptions).length > 0) {
      throw new Error(
        `Unsupported request options: ${Object.keys(unsupportedOptions).join(", ")}`
      );
    }

    const headers = new Headers({
      ...defaultHeaders,
      ...(requestHeaders || {}),
    });

    if (expectsJson && !headers.has("accept")) {
      headers.set("accept", "application/json");
    }

    const payload = json !== undefined ? json : body;
    const response = await fetch(buildUrl(baseUrl, path, qs), {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : serializeBody(payload, headers),
    });

    if (!response.ok) {
      throw await createHttpError(response, expectsJson, responseType);
    }

    return parseResponseBody(response, expectsJson, responseType);
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
    if (method === "GET") {
      return createDeferredGetRequest(path, options, execute, createStreamRequest);
    }

    return execute(method, path, options);
  };

  return {
    get: createRequest("GET"),
    post: createRequest("POST"),
    put: createRequest("PUT"),
    patch: createRequest("PATCH"),
    delete: createRequest("DELETE"),
    del: createRequest("DELETE"),
  };
};

const api = (
  req,
  {
    json = true,
    version = "v1",
    adminApi = false,
    forwardUserJwt = false,
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
    if (forwardUserJwt && req && req.cookies && req.cookies.jwt) {
      headers["Authorization"] =
        (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
        req.cookies.jwt;
    }
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

  return apiClient(apiRequest);
};

module.exports = { api };
