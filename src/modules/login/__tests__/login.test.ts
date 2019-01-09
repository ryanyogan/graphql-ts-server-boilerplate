import { request } from "graphql-request";
import { invalidLogin, confirmEmail } from "../errorMessages";
import { User } from "../../../entity/User";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";

const email = "test@example.com";
const password = "asdasd";

const registerMutation = (e: string, p: string) => `
  mutation Register {
    register(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginMutation = (e: string, p: string) => `
  mutation Login {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const loginExpectError = async (e: string, p: string, errMsg: string) => {
  const response = await request(
    process.env.TEST_HOST as string,
    loginMutation(e, p)
  );

  expect(response).toEqual({
    login: [
      {
        path: "email",
        message: errMsg
      }
    ]
  });
};

beforeAll(async () => {
  await createTypeormConnection();
});

describe("Login Module", () => {
  it("returns invalid login for non-registered user", async () => {
    await loginExpectError("bad@bad.com", "badPassword", invalidLogin);
  });

  it("returns a message for non-confirmed emails", async () => {
    await request(
      process.env.TEST_HOST as string,
      registerMutation(email, password)
    );

    await loginExpectError(email, password, confirmEmail);
    await User.update({ email }, { confirmed: true });
    await loginExpectError(email, "notPassProvided", invalidLogin);

    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );

    expect(response).toEqual({ login: null });
  });
});
