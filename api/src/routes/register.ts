import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { contract } from "../config";

const app = new OpenAPIHono();

const RequestSchema = z.object({
  name: z.string(),
  ether: z.string(),
});
const ResponseSchema = z.object({
  message: z.string(),
  txnHash: z.string(),
});

const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "Bad Request",
  }),
});

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Register domain",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Domain registration failed",
    },
  },
  tags: ["Domains"],
});

app.openapi(registerRoute, async c => {
  const { name, ether } = c.req.valid("json");

  const price = ethers.parseEther(ether.toString());

  try {
    const tx = await contract.registerDomain(name, { value: price });
    await tx.wait();
    console.log("Processing request...");
    return c.json(
      {
        message: "domain registered successfully",
        txnHash: tx.hash,
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

export default app;
