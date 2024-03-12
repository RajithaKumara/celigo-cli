const {
  axios,
  INTEGRATIONS_URL,
  INTEGRATIONS_CONNECTIONS_URL,
} = require("../index");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

axios
  .get(INTEGRATIONS_URL)
  .then((response) => {
    const csvWriter = createCsvWriter({
      path: "connections.csv",
      header: [
        { id: "name", title: "Name" },
        { id: "sandbox", title: "Sandbox" },
        { id: "baseURI", title: "OHRM URL" },
        { id: "connIndex", title: "Instance Index" },
        { id: "iClientId", title: "iClientId" },
      ],
    });

    const integrations = {};
    const ohrmConnections = [];
    const promises = [];
    response.data.forEach((item) => {
      if (item.sandbox) {
        return;
      }

      integrations[item._id] = item;
      promises.push(
        axios.get(INTEGRATIONS_CONNECTIONS_URL.replace("{id}", item._id), {
          customConfig: { _id: item._id },
        })
      );
    });

    Promise.all(promises).then((responses) => {
      responses.forEach((response) => {
        const inetgrationId = response.config.customConfig._id;
        response.data.forEach((conn) => {
          if (
            conn?.http?.baseURI.includes(".example.org") ||
            conn?.http?.baseURI.includes(".example.com")
          ) {
            ohrmConnections.push({ conn, _id: inetgrationId });
          }
        });
      });

      const records = [];
      const counts = {};
      ohrmConnections.forEach((connection) => {
        const integration = integrations[connection._id];

        if (!counts[integration._id]) {
          counts[integration._id] = 0;
        }
        counts[integration._id]++;
        records.push({
          name: integration.name,
          sandbox: integration.sandbox ? "Yes" : "No",
          baseURI: connection.conn?.http?.baseURI,
          iClientId: connection.conn?.http?._iClientId,
          connIndex: counts[integration._id],
        });
      });

      csvWriter.writeRecords(records).then(() => {
        console.log("...Done");
      });
    });
  })
  .catch((error) => {
    console.error(`Error: ${INTEGRATIONS_URL}`);
  });
