import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { contract } from "./config";

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

const getOwnerRoute = createRoute({
  method: "get",
  path: "/owner/:name",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            owner: z.string(),
          }),
        },
      },
      description: "Get domain owner",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to fetch domain owner",
    },
  },
  tags: ["Domains"],
});

app.openapi(getOwnerRoute, async c => {
  const name = c.req.param("name");
  console.log(name);

  try {
    const owner = await contract.getDomainOwner(name);
    return c.json({ owner }, 200);
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

// 2. Set Record for a Domain
const setRecordRoute = createRoute({
  method: "post",
  path: "/setRecord",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
            record: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Set domain record",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to set domain record",
    },
  },
  tags: ["Domains"],
});

app.openapi(setRecordRoute, async c => {
  const { name, record } = c.req.valid("json");

  try {
    const tx = await contract.setRecord(name, record);
    await tx.wait();
    return c.json({ message: "Record set successfully" }, 200);
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

// 3. Transfer Domain Ownership
const transferRoute = createRoute({
  method: "post",
  path: "/transfer",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
            newOwner: z.string(),
          }),
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
      description: "Transfer domain ownership",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to transfer domain ownership",
    },
  },
  tags: ["Domains"],
});

app.openapi(transferRoute, async c => {
  const { name, newOwner } = c.req.valid("json");

  try {
    const tx = await contract.transferDomain(name, newOwner);
    await tx.wait();
    return c.json(
      {
        message: "Domain ownership transferred successfully",
        txnHash: tx.hash,
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

// 4. Withdraw Contract Balance
const withdrawRoute = createRoute({
  method: "post",
  path: "/withdraw",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Withdraw contract balance",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to withdraw balance",
    },
  },
  tags: ["Admin"],
});

app.openapi(withdrawRoute, async c => {
  try {
    const tx = await contract.withdraw();
    await tx.wait();
    return c.json({ message: "Balance withdrawn successfully" }, 200);
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

const getRecordRoute = createRoute({
  method: "get",
  path: "/record/:name",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema.extend({
            record: z.string().nullable().openapi({ example: "Some data" }),
          }),
        },
      },
      description: "Get domain record",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Domain not found",
    },
  },
  tags: ["Domains"],
});

app.openapi(getRecordRoute, async c => {
  const { name } = c.req.param();

  try {
    const record = await contract.getRecord(name);
    return c.json(
      {
        message: "Domain record retrieved successfully",
        record: record || null,
        txnHash: "",
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 404);
  }
});

const rentDomainRoute = createRoute({
  method: "post",
  path: "/rent",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestSchema.extend({
            duration: z.number().openapi({ example: 10 }),
          }),
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
      description: "Domain rented successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to rent domain",
    },
  },
  tags: ["Domains"],
});

app.openapi(rentDomainRoute, async c => {
  const { name, ether, duration } = c.req.valid("json");

  const price = ethers.parseEther(ether.toString());

  try {
    const tx = await contract.rentDomain(name, duration, { value: price });
    await tx.wait();
    return c.json(
      {
        message: "Domain rented successfully",
        txnHash: tx.hash,
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

const cancelRentalRoute = createRoute({
  method: "post",
  path: "/cancel-rental",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().openapi({ example: "aviral" }),
          }),
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
      description: "Rental canceled successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Failed to cancel rental",
    },
  },
  tags: ["Domains"],
});

app.openapi(cancelRentalRoute, async c => {
  const { name } = c.req.valid("json");

  try {
    const tx = await contract.cancelRental(name);
    await tx.wait();
    return c.json(
      {
        message: "Rental canceled successfully",
        txnHash: tx.hash,
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 400);
  }
});

const rentalDetailsRoute = createRoute({
  method: "get",
  path: "/rental/:name",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema.extend({
            renter: z.string().openapi({ example: "0x123...456" }),
            endTime: z.number().openapi({ example: 1712123456 }),
          }),
        },
      },
      description: "Rental details retrieved successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Rental details not found",
    },
  },
  tags: ["Domains"],
});

app.openapi(rentalDetailsRoute, async c => {
  const { name } = c.req.param();

  try {
    const [renter, endTime] = await contract.getRentalDetails(name);
    return c.json(
      {
        message: "Rental details retrieved successfully",
        renter,
        endTime: Number(endTime.toString()),
        txnHash: "",
      },
      200,
    );
  } catch (err) {
    return c.json({ message: err }, 404);
  }
});

const getDomainsRoute = createRoute({
  method: "get", // Use GET for retrieving data
  path: "/:address", // Define the address as a route parameter
  request: {
    params: z.object({
      address: z
        .string()
        .openapi({ example: "0x123...456" })
        .describe("The Ethereum address of the user"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema.extend({
            address: z.string().openapi({ example: "0x123...456" }),
            domains: z.array(z.string()).openapi({
              example: ["domain1", "domain2", "domain3"],
            }),
          }),
        },
      },
      description: "Domains retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Invalid Ethereum address",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "No domains found for the provided address",
    },
  },
  tags: ["Domains"],
});

app.openapi(getDomainsRoute, async c => {
  const address = c.req.param("address"); // Fetch address from route params
  console.log("Address: ", address);
  try {
    // // Validate Ethereum address
    // if (!ethers.isAddress(address)) {
    //   return c.json({ code: 400, message: "Invalid Ethereum address" }, 400);
    // }

    const domains: string[] = await contract.getDomainsForUser(address);

    if (domains.length === 0) {
      return c.json(
        { code: 404, message: "No domains found for the provided address" },
        404,
      );
    }

    return c.json(
      {
        message: "Domains retrieved successfully",
        address,
        domains,
        txnHash: "",
      },
      200,
    );
  } catch (err) {
    console.log(err);
    return c.json({ code: 400, message: "Failed to retrieve domains" }, 400);
  }
});

// const BuyDomainRequestSchema = z.object({
//   name: z.string(),
//   ether: z.string(),
// });
//
// const BuyDomainResponseSchema = z.object({
//   message: z.string(),
//   txnHash: z.string(),
// });
//
// const buyRentedDomainRoute = createRoute({
//   method: "post",
//   path: "/buy-rented-domain",
//   request: {
//     body: {
//       content: {
//         "application/json": {
//           schema: BuyDomainRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       content: {
//         "application/json": {
//           schema: BuyDomainResponseSchema,
//         },
//       },
//       description: "Domain purchased successfully",
//     },
//     400: {
//       content: {
//         "application/json": {
//           schema: ErrorSchema,
//         },
//       },
//       description: "Failed to purchase domain",
//     },
//   },
//   tags: ["Domains"],
// });
//
// app.openapi(buyRentedDomainRoute, async c => {
//   const { name, ether } = c.req.valid("json");
//
//   // Convert the ether string to a BigNumber value
//   const purchasePrice = ethers.parseEther(ether.toString());
//
//   try {
//     // Call the smart contract's function to buy the rented domain
//     const tx = await contract.buyRentedDomain(name, { value: purchasePrice });
//     await tx.wait();
//
//     // Returning the successful response
//     return c.json(
//       {
//         message: "Domain purchased successfully",
//         txnHash: tx.hash,
//       },
//       200,
//     );
//   } catch (err) {
//     // Handle any errors and return a 400 status
//     return c.json({ message: err }, 400);
//   }
// });
export default app;
