const { db } = require("./check-db.js"); // Wait, I didn't export db in check-db.js.

// Just test the endpoint locally!
const http = require("http");
http.get("http://localhost:3000/api/patients", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log(data));
}).on("error", console.error);
