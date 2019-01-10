// tslint:disable-next-line:no-implicit-dependencies
import { request } from "graphql-request";
import { User } from "../../../entity/User";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "../errorMessages";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { Connection } from "typeorm";

const email = "foo@example.com";
const password = "asdasd";

const mutation = (e: string, p: string) => `
  mutation {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConnection();
});

afterAll(async () => {
  conn.close();
});

describe("Register User", async () => {
  test("check for duplicate emails", async () => {
    const response = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );

    expect(response).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    // Test for duplicate emails
    const response2: any = await request(
      process.env.TEST_HOST as string,
      mutation(email, password)
    );
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  it("catches a bad email", async () => {
    const response3: any = await request(
      process.env.TEST_HOST as string,
      mutation("e", password)
    );
    expect(response3).toEqual({
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
    });
  });

  it("catches bad password and email", async () => {
    const response4: any = await request(
      process.env.TEST_HOST as string,
      mutation("e", "db")
    );
    expect(response4).toEqual({
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
    });
  });
});
