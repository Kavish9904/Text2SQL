const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Handle API routes
      if (parsedUrl.pathname.startsWith("/api/")) {
        const target = "https://text2sql-backend.onrender.com" + req.url;
        console.log(`Proxying API request to: ${target}`);
        // Forward the request to the API
        const apiRes = await fetch(target, {
          method: req.method,
          headers: req.headers,
          body: req.method !== "GET" ? req : undefined,
        });
        // Forward the response back
        res.writeHead(apiRes.status, apiRes.headers);
        apiRes.body.pipe(res);
        return;
      }

      // Handle all other routes with Next.js
      await handle(req, res, parsedUrl);
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
});
