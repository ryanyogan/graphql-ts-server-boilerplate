import { Resolver } from "../../types/graphql-utils";

export default async (
  resolver: Resolver,
  parent: any,
  args: any,
  ctx: any,
  info: any
) => {
  const result = await resolver(parent, args, ctx, info);

  return result;
};
