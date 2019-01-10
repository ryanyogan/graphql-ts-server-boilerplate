import { Resolver, GraphQLMiddlewareFunc } from "../types/graphql-utils";

export const createMiddleware = (
  middlewareFunc: GraphQLMiddlewareFunc,
  resolverFunc: Resolver
) => (parent: any, args: any, ctx: any, info: any) =>
  middlewareFunc(resolverFunc, parent, args, ctx, info);
