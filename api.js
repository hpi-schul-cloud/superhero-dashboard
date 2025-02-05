const request = require("request");
const rp = require("request-promise");

const api = (
  req,
  { useCallback = false, json = true, version = "v1", adminApi = false } = {}
) => {
  const headers = {};
  if (req && req.cookies && req.cookies.jwt) {
    headers["Authorization"] =
      (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
      req.cookies.jwt;
  }
  // TODO - temporary solution, adjust this before merging,
  //   if (process.env.API_KEY) {
  headers["x-api-key"] =
    process.env.API_KEY || "thisisasupersecureapikeythatisabsolutelysave";
  //   }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3030/api/";
  const adminApiUrl =
    process.env.ADMIN_API_URL || "http://localhost:4030/admin/api/";

  const baseUrl = adminApi ? adminApiUrl : backendUrl;
  const handler = useCallback ? request : rp;
  return handler.defaults({
    baseUrl: new URL(version, baseUrl).href,
    json,
    headers,
  });
};

module.exports = { api };
