const path = require("path");
const { createServer } = require("http");
const { parse } = require("url");

// Ensure we're in production mode
process.env.NODE_ENV = "production";

const nextServer = require("./.next/standalone/server.js");
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

createServer(async (req, res) => {
  try {
    // Be sure to pass `true` as the second argument to `url.parse`.
    const parsedUrl = parse(req.url, true);
    await nextServer.requestHandler(req, res, parsedUrl);
  } catch (err) {
    console.error("Error occurred handling", req.url, err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
})
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
