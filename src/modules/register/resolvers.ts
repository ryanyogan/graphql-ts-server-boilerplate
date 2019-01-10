import * as yup from "yup";
import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import { GQL } from "../../types/schema";
import { formatYupError } from "../../utils/formatYupError";
import { v4 } from "uuid";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail
} from "./errorMessages";
// import { createConfirmEmailLink } from "../../utils/createConfirmEmailLink";
// import { sendEmail } from "../../utils/sendEmail";

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
      { email, password }: GQL.IRegisterOnMutationArguments
    ) =>
      // { redis, url }
      {
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

        const user = User.create({
          id: v4(), // We need to do this on the DB layer
          email,
          password
        });
        await user.save();

        // if (process.env.NODE_ENV !== "test") {
        //   await sendEmail(
        //     email,
        //     await createConfirmEmailLink(url, user.id, redis)
        //   );
        // }

        return null;
      }
  }
};
