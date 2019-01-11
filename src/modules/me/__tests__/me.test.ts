import axios from "axios";
import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { User } from "../../../entity/User";
import { Connection } from "typeorm";

let conn: Connection;
let userId: string;
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

describe("me", () => {
  it("returns null if there is no cookie", async () => {
    const response = await axios.post(process.env.TEST_HOST as string, {
      query: meQuery
    });
    expect(response.data.data.me).toBeNull();
  });

  it("retreives current user ", async () => {
    await axios.post(
      process.env.TEST_HOST as string,
      {
        query: loginMutation(email, password)
      },
      {
        withCredentials: true
      }
    );

    const response = await axios.post(
      process.env.TEST_HOST as string,
      {
        query: meQuery
      },
      {
        withCredentials: true
      }
    );

    expect(response.data.data).toEqual({
      me: {
        id: userId,
        email
      }
    });
  });
});
