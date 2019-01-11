import { createTypeormConnection } from "../../../utils/createTypeormConnection";
import { User } from "../../../entity/User";
import { Connection } from "typeorm";
import { TestClient } from "../../../utils/testClient";

let userId: string;
let conn: Connection;
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

describe("logout", () => {
  it("logout current user", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);
    const response = await client.me();

    expect(response.data).toEqual({
      me: {
        id: userId,
        email
      }
    });

    await client.logout();
    const response2 = await client.me();

    expect(response2.data.me).toBeNull();
  });
});
