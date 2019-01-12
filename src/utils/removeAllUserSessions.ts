import { userSessionIdPrefix, redisSessionPrefix } from "../constants";
import { Redis } from "ioredis";

export const removeAllUserSessions = async (userId: string, redis: Redis) => {
  const sessionIds = await redis.lrange(
    `${userSessionIdPrefix}${userId}`,
    0,
    -1
  );

  await Promise.all(
    sessionIds.map((sess: string) => {
      return redis.del(`${redisSessionPrefix}${sess}`);
    })
  );
};
