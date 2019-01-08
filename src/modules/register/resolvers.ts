import * as bcrypt from "bcryptjs";
import * as yup from "yup";
import { ResolverMap } from "../../types/graphql-utils";
import { GQL } from "../..//types/schema";
import { User } from "../../entity/User";
import { formatYupError } from "../../utils/formatYupError";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail
} from "./errorMessages";
import { createConfirmEmailLink } from "../../utils/createConfirmEmailLink";

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: yup
    .string()
    .min(3)
    .max(255)
});

export const resolvers: ResolverMap = {
  Query: {
    foo: () => "bar"
  },
  Mutation: {
    register: async (
      _,
      { email, password }: GQL.IRegisterOnMutationArguments,
      { redis, url }
    ) => {
      try {
        await schema.validate({ email, password }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const userAlreadyExists = await User.findOne({
        where: { email },
        select: ["id"]
      });

      if (userAlreadyExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        email,
        password: hashedPassword
      });
      await user.save();

      const link = await createConfirmEmailLink(url, user.id, redis);

      return null;
    }
  }
};
