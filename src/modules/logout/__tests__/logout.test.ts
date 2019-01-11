import axios from "axios";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { User } from "../../../entity/User";
import { Connection } from "typeorm";

let userId: string;
let conn: Connection;
const email = "bob5@bob.com";
const password = "jlkajoioiqwe";

const loginMutation = (e: string, p: string) => `
  mutation Login {
    login(email: "${e}", password: "${p}") {
      path
      message
    }
  }
`;

const logoutMutation = `
  mutation {
    logout
  }
`;

const meQuery = `
  {
    me {
      id
      email
    }
  }
`;

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

describe("logout", () => {
  it("logout current user", async () => {
    await axios.post(
      process.env.TEST_HOST as string,
      {
        query: loginMutation(email, password)
      },
      {
        withCredentials: true
      }
    );

    const response1 = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      {
        withCredentials: true
      }
    );

    expect(response1.data.data).toEqual({
      me: {
        id: userId,
        email
      }
    });

    await axios.post(
      process.env.TEST_HOST as string,
      {
        query: logoutMutation
      },
      { withCredentials: true }
    );

    const response = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      { withCredentials: true }
    );
    expect(response.data.data.me).toBeNull();
  });
});
