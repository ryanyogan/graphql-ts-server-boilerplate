import { Request, Response } from "express";
import { User } from "../entity/User";
import { redis } from "../redis";

export const confirmEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = await redis.get(id);

  if (userId) {
    await User.update({ id: userId as string }, { confirmed: true });
    await redis.del(id);
    res.send("Your email has been confirmed.");
  } else {
    res.send("Invalid Confirmation Code");
  }
};
