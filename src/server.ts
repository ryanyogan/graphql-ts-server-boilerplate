import { importSchema } from "graphql-import";
import { GraphQLServer } from "graphql-yoga";
import * as path from "path";
import * as fs from "fs";
import * as Redis from "ioredis";
import { GraphQLSchema } from "graphql";
import { mergeSchemas, makeExecutableSchema } from "graphql-tools";

import { createTypeormConnection } from "./utils/createTypeormConnection";
import { User } from "./entity/User";

export const startServer = async () => {
  const schemas: GraphQLSchema[] = [];
  const folders = fs.readdirSync(path.join(__dirname, "./modules"));

  folders.forEach(folder => {
    const { resolvers } = require(`./modules/${folder}/resolvers`);
    const typeDefs = importSchema(
      path.join(__dirname, `./modules/${folder}/schema.graphql`)
    );
    schemas.push(makeExecutableSchema({ resolvers, typeDefs }));
  });

  const redis = new Redis();

  const server = new GraphQLServer({
    schema: mergeSchemas({ schemas }),
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.get("host")}`
    })
  });

  server.express.get("/confirm/:id", async (req, res) => {
    const { id } = req.params;
    const userId = await redis.get(id);
    if (userId) {
      await User.update({ id: userId as string }, { confirmed: true });
      res.send("Your email has been confirmed.");
    } else {
      res.send("Invalid Confirmation Code");
    }
  });

  await createTypeormConnection();
  const app = await server.start({
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });
  console.log("Server is running on http://localhost:4000"); // eslint-disable-line

  return app;
};
