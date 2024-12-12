import { Connection } from "promise-mysql";
import UserModel from "../models/userModel";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";

export default class UserController {
  db: Connection;
  userModel: UserModel;

  constructor(db: Connection) {
    this.db = db;
    this.userModel = new UserModel(this.db);
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const user = await this.userModel.getByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (user && isMatch) {
        const userWithoutPassword = {
         ...user,
          password: undefined 
        }
        res.status(200).json(userWithoutPassword);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (err) {
      res.status(401).json({ message: "Invalid credentials" });
    }
  }

}
