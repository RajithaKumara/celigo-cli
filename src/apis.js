const {
  axios,
  INTEGRATIONS_URL,
  INTEGRATIONS_CONNECTIONS_URL,
  INTEGRATIONS_EXPORTS_URL,
  INTEGRATIONS_IMPORTS_URL,
} = require("../index");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

axios
  .get(INTEGRATIONS_URL)
  .then((response) => {
    const csvWriter = createCsvWriter({
      path: "apis.csv",
      header: [
        { id: "id", title: "Int. ID" },
        { id: "name", title: "Name" },
        { id: "sandbox", title: "Sandbox" },
        { id: "exportName", title: "Resource Name" },
        { id: "method", title: "HTTP Method" },
        { id: "relativeURI", title: "Relative URI" },
        { id: "requestMediaType", title: "Media Type" },
      ],
    });

    const integrations = {};
    const promises = [];
    const exportPromises = [];
    const importPromises = [];
    let flag = false;
    response.data.forEach((item) => {
      if (item.sandbox) {
        return;
      }

      if (flag) {
        return;
      }

      integrations[item._id] = item;
      promises.push(
        axios.get(INTEGRATIONS_CONNECTIONS_URL.replace("{id}", item._id), {
          customConfig: { _id: item._id },
        })
      );
      exportPromises.push(
        axios.get(INTEGRATIONS_EXPORTS_URL.replace("{id}", item._id), {
          customConfig: { _id: item._id },
        })
      );
      importPromises.push(
        axios.get(INTEGRATIONS_IMPORTS_URL.replace("{id}", item._id), {
          customConfig: { _id: item._id },
        })
      );

      // flag = true;
    });

    const connectionRecords = [];
    const ohrmConnections = [];
    const integrationConnections = {};
    Promise.all(promises).then((responses) => {
      responses.forEach((response) => {
        const integrationId = response.config.customConfig._id;
        response.data.forEach((conn) => {
          if (
            conn?.http?.baseURI.includes(".example.com") ||
            conn?.http?.baseURI.includes(".example.com")
          ) {
            integrationConnections[conn._id] = { conn, _id: integrationId };
          }
        });
      });

      // ##########################################################################################################

      const exportRecords = [];
      Promise.all(exportPromises).then((responses) => {
        responses.forEach((response) => {
          const integrationId = response.config.customConfig._id;
          response.data.forEach((exportResource) => {
            if (integrationConnections[exportResource?._connectionId]) {

              const integration = integrations[integrationId];
              exportRecords.push({
                id: integration._id,
                name: integration.name,
                sandbox: integration.sandbox ? "Yes" : "No",
                exportName: exportResource?.name,
                relativeURI: exportResource?.http?.relativeURI.startsWith("/")
                  ? exportResource?.http?.relativeURI
                  : `/${exportResource?.http?.relativeURI}`,
                method: exportResource?.http?.method,
                requestMediaType: exportResource?.http?.requestMediaType,
              });
            }
          });
        });

        // ##########################################################################################################

        // const importRecords = [];
        Promise.all(importPromises).then((responses) => {
          responses.forEach((response) => {
            const integrationId = response.config.customConfig._id;
            response.data.forEach((importResource) => {
              if (integrationConnections[importResource?._connectionId]) {
                const integration = integrations[integrationId];
                exportRecords.push({
                  id: integration._id,
                  name: integration.name,
                  sandbox: integration.sandbox ? "Yes" : "No",
                  exportName: importResource?.name,
                  relativeURI: importResource?.http?.relativeURI[0].startsWith("/")
                    ? importResource?.http?.relativeURI[0]
                    : `/${importResource?.http?.relativeURI[0]}`,
                  method: importResource?.http?.method[0],
                  requestMediaType: importResource?.http?.requestMediaType,
                });
              }
            });
          });

          csvWriter.writeRecords(exportRecords).then(() => {
            console.log("...Done");
          });
        });
      });
    });
  })
  .catch((error) => {
    console.error(`Error: ${INTEGRATIONS_URL}`);
  });
