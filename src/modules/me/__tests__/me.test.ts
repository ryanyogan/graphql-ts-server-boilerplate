import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { User } from "../../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../../utils/testClient";

let conn: Connection;
let userId: string;
const email = "bob5@bob.com";
const password = "jlkajoioiqwe";

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
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.me();
    expect(response.data.me).toBeNull();
  });

  it("retreives current user ", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);

    const response = await client.me();

    expect(response.data).toEqual({
      me: {
        id: userId,
        email
      }
    });
  });
});
