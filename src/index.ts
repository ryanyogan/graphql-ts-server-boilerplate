import "reflect-metadata";
import { importSchema } from "graphql-import";
import { GraphQLServer } from "graphql-yoga";
import * as path from "path";

import { resolvers } from "./resolvers";
import { createTypeormConnection } from "./utils/createTypeormConnection";

export const startServer = async () => {
  const typeDefs = importSchema(path.join(__dirname, "./schema.graphql"));

  const server = new GraphQLServer({ typeDefs, resolvers });
  await createTypeormConnection();
  await server.start();
  console.log("Server is running on http://localhost:4000");
};

startServer();
