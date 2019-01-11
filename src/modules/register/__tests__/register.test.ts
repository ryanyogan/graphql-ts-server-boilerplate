import { User } from "../../../entity/User";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "../errorMessages";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { Connection } from "typeorm";
import { TestClient } from "../../../utils/testClient";

const email = "foo@example.com";
const password = "asdasd";

let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConnection();
});

afterAll(async () => {
  conn.close();
});

describe("Register User", async () => {
  test("check for duplicate emails", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.register(email, password);
    expect(response).toEqual({ data: { register: null } });

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);

    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    // Test for duplicate emails
    const response2 = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  it("catches a bad email", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.register("e", password);
    expect(response).toEqual({
      data: {
        register: [
          {
            path: "email",
            message: emailNotLongEnough
          },
          {
            path: "email",
            message: invalidEmail
          }
        ]
      }
    });
  });

  it("catches bad password and email", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    const response = await client.register("d", "db");
    expect(response).toEqual({
      data: {
        register: [
          {
            path: "email",
            message: emailNotLongEnough
          },
          {
            path: "email",
            message: invalidEmail
          },
          {
            path: "password",
            message: passwordNotLongEnough
          }
        ]
      }
    });
  });
});
