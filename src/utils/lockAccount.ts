import { Redis } from "ioredis";
import { removeAllUserSessions } from "./removeAllUserSessions";
import { User } from "../entity/User";

export const forgotPasswordLockAccount = async (
  userId: string,
  redis: Redis
) => {
  // Restrict login access
  await User.update({ id: userId }, { forgotPasswordLocked: true });
  // Remove all user sessions from redis
  await removeAllUserSessions(userId, redis);
};
