const {axios, INTEGRATIONS_URL} = require('../index')
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

axios
  .get(INTEGRATIONS_URL)
  .then((response) => {

    const csvWriter = createCsvWriter({
      path: "integrations.csv",
      header: [
        { id: "name", title: "Name" },
        { id: "sandbox", title: "Sandbox" },
        { id: "lastModified", title: "Last Modified" },
        { id: "createdAt", title: "Created At" },
      ],
    });

    const records = [];
    response.data.forEach((item) => {
      if (item.sandbox) {
        return;
      }

      records.push({
        name: item.name,
        sandbox: item.sandbox ? "Yes" : "No",
        lastModified: item.lastModified,
        createdAt: item.createdAt,
      });
    });

    csvWriter.writeRecords(records).then(() => {
      console.log("...Done");
    });
    console.log(response.data.length);
    console.log(response.headers);
    console.log(response.status);
  })
  .catch((error) => {
    console.error("Error...");
  });
