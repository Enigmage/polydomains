import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import registerRouter from "./routes/register";
import { swaggerUI } from "@hono/swagger-ui";

const PORT = process.env.PORT || 8080;

const app = new OpenAPIHono();

// Middleware
app.use("*", async (c, next) => {
  c.res.headers.set("Content-Type", "application/json");
  await next();
});

app.doc("/docs", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Polydomains",
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Local development server",
    },
  ],
});

app.get("/swagger", swaggerUI({ url: "/docs" }));
app.route("/domains", registerRouter);

export default {
  port: PORT,
  fetch: app.fetch,
};
