import * as Redis from "ioredis";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { User } from "../../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../../utils/testClient";
import { createForgotPasswordLink } from "../../../utils/createForgotPasswordLink";
import { forgotPasswordLockAccount } from "../../../utils/lockAccount";
import { forgotPasswordLocked } from "../../login/errorMessages";
import { passwordNotLongEnough } from "../../register/errorMessages";
import { expiredKeyError } from "../errorMessages";

let userId: string;
let conn: Connection;
const redis = new Redis();
const email = "bob5@bob.com";
const password = "jlkajoioiqwe";
const newPassword = "newPassword";

beforeAll(async () => {
  conn = await createTypeormConnection();
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("forgot password", () => {
  test("the entire forgot password flow", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    // Lock the users account
    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink("", userId, redis);
    const [key] = url.split("/").slice(-1);

    // Ensure a user may not login once initiated forgot password
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: "email",
            message: forgotPasswordLocked
          }
        ]
      }
    });

    // Try changing the password to an invalid password
    expect(await client.forgotPasswordChange("a", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: passwordNotLongEnough
          }
        ]
      }
    });

    const response = await client.forgotPasswordChange(newPassword, key);

    expect(response.data).toEqual({
      forgotPasswordChange: null
    });

    // Ensure the redis key expires after the password is changed

    expect(await client.forgotPasswordChange("asdadsasdasaad", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: expiredKeyError
          }
        ]
      }
    });

    // Validate we may not login, account is unlocked
    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null
      }
    });
  });
});
