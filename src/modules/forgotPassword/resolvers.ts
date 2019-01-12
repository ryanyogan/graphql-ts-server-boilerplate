import * as yup from "yup";
import * as bcrypt from "bcryptjs";
import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import { GQL } from "../../types/schema";
import { userNotFoundError, expiredKeyError } from "./errorMessages";
import { forgotPasswordLockAccount } from "../../utils/lockAccount";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { forgotPasswordPrefix } from "../../constants";
import { registerPasswordValidation } from "../../yupSchemas";
import { formatYupError } from "../../utils/formatYupError";

const schema = yup.object().shape({
  newPassword: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    foo3: () => "foo3"
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: "email",
            message: userNotFoundError
          }
        ];
      }

      await forgotPasswordLockAccount(user.id, redis);
      // @todo add frontend url

      await createForgotPasswordLink("", user.id, redis);
      // @todo send email with url

      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;
      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: expiredKeyError
          }
        ];
      }

      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (error) {
        return formatYupError(error);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await Promise.all([
        User.update(
          { id: userId },
          {
            forgotPasswordLocked: false,
            password: hashedPassword
          }
        ),
        redis.del(redisKey)
      ]);

      return null;
    }
  }
};
