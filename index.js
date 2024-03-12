const Axios = require("axios");
const Storage = require("node-storage");

const store = new Storage("data/db.json");

const token = process.env.TOKEN;

const axios = Axios.create({ headers: { Authorization: `Bearer ${token}` } });

axios.interceptors.response.use(
  function (response) {
    const { config, headers } = response;
    if (config.url && headers) {
      const url = config.url.replaceAll(".", "_");
      const etag = headers["etag"];

      const cachedEtag = store.get(`etag.${url}`)?.headers?.etag;

      if (etag && etag !== cachedEtag) {
        store.put(`etag.${url}`, {
          data: response.data,
          headers: response.headers,
          status: response.status,
        });
      }
    }

    return response;
  },
  function (error) {
    if (error.response?.status === 304) {
      console.log("304: Taking response from cache");
      const url = error.response.config.url.replaceAll(".", "_");
      const cacheData = store.get(`etag.${url}`)?.data;

      if (cacheData) {
        return Promise.resolve({
          ...error.response,
          status: 200,
          data: cacheData,
        });
      }
    }

    return Promise.reject(error);
  }
);

axios.interceptors.request.use(
  function (config) {
    if (config.url) {
      const url = config.url.replaceAll(".", "_");
      const cachedEtag = store.get(`etag.${url}`)?.headers?.etag;

      console.log(cachedEtag);
      if (cachedEtag) {
        config.headers = {
          ...config.headers,
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
          "If-None-Match": cachedEtag,
        };
      }
    }

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
// delete axios.defaults.adapter['delete'];

const TOKEN_INFO_URL = "https://api.integrator.io/v1/tokenInfo";
const USERS_URL = "https://api.integrator.io/v1/ashares";
const INTEGRATIONS_URL = "https://api.integrator.io/v1/integrations";
const INTEGRATIONS_FLOWS_URL =
  "https://api.integrator.io/v1/integrations/{id}/flows";
const INTEGRATIONS_CONNECTIONS_URL =
  "https://api.integrator.io/v1/integrations/{id}/connections";
const INTEGRATIONS_EXPORTS_URL =
  "https://api.integrator.io/v1/integrations/{id}/exports";
const INTEGRATIONS_IMPORTS_URL =
  "https://api.integrator.io/v1/integrations/{id}/imports";

module.exports = {
  axios,
  INTEGRATIONS_URL,
  INTEGRATIONS_FLOWS_URL,
  INTEGRATIONS_CONNECTIONS_URL,
  INTEGRATIONS_EXPORTS_URL,
  INTEGRATIONS_IMPORTS_URL,
};
