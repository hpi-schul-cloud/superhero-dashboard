const request = require("request");
const rp = require("request-promise");

const api = (
  req,
  { useCallback = false, json = true, version = "v1", adminApi = false } = {}
) => {
  let baseUrl = process.env.BACKEND_URL || "http://localhost:3030/api/";

  const headers = {};

  if (adminApi) {
    baseUrl = process.env.ADMIN_API_URL || "http://localhost:4030/admin/api/";
    headers["x-api-key"] = process.env.ADMIN_API_KEY || "thisisasupersecureapikeythatisabsolutelysave";
  } else if (req && req.cookies && req.cookies.jwt) {
    headers["Authorization"] =
      (req.cookies.jwt.startsWith("Bearer ") ? "" : "Bearer ") +
      req.cookies.jwt;
  }

  const handler = useCallback ? request : rp;

  const apiRequest = {
    baseUrl: new URL(version, baseUrl).href,
    json,
    headers,
  };
  
  return handler.defaults(apiRequest);
};

module.exports = { api };
