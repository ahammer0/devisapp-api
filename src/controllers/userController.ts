import { Connection } from "promise-mysql";
import UserModel from "../models/userModel";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import Controller from "../utilities/Controller";
import ErrorResponse from "../utilities/ErrorResponse";
import { ReqWithId } from "../types/misc";
import { user } from "../types/users";
import PaymentModel from "../models/paymentModel";
import { passwordValidator } from "../utilities/validators";
import svgCaptcha from "svg-captcha";
import { UserCreateSchema, UserUpdateByUserSchema } from "../schemas/user";
import { Schema } from "../utilities/DTO";

export default class UserController extends Controller {
  userModel: UserModel;
  paymentModel: PaymentModel;

  constructor(db: Connection) {
    super(db);
    this.userModel = new UserModel(this.db);
    this.paymentModel = new PaymentModel(this.db);

    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.checkToken = this.checkToken.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  //should take same time whether the user exists or not
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const secret: string | undefined = process.env.JWT_SECRET;

    if (secret === null || secret === undefined || typeof secret !== "string") {
      throw new Error("JWT_SECRET is not defined in env");
    }
    try {
      let user: user | null;
      try {
        user = await this.userModel.getByEmail(email);
      } catch {
        user = null;
      }
      const isMatch = bcrypt.compareSync(password, user?.password ?? "");
      if (user && isMatch) {
        const userWithoutPassword = {
          ...user,
          password: undefined,
        };

        const payload = { id: user.id, role: "user" };
        const token = jwt.sign(payload, secret, { expiresIn: "1d" });

        if (user.account_status === "blocked") {
          res.status(401).json({ message: "Your account is blocked" });
          return;
        } else if (user.account_status === "deleted") {
          res.status(401).json({ message: "Invalid credentials" });
          return;
        }

        res.status(200).json({ user: userWithoutPassword, token });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (err) {
      UserController.handleError(err, res);
    }
  }

  async register(req: Request, res: Response) {
    try {
      const userInput = new UserCreateSchema(req.body);
      const captcha = Schema.validateString(req.body.captcha);
      const captchaToken = Schema.validateString(req.body.captchaToken);
      const password = await bcrypt.hash(userInput.password, 10);

      //check if captcha is valid
      const decoded = jwt.decode(captchaToken);
      //@ts-expect-error value is indeed in decoded
      if (decoded && "value" in decoded) {
        if (decoded.value !== captcha) {
          throw new ErrorResponse("Invalid Captcha", 400);
        }
      } else {
        throw new ErrorResponse("Invalid Captcha", 400);
      }

      const user = await this.userModel.create({
        ...userInput,
        password,
      });
      res.status(201).json({ ...user, password: undefined });
    } catch (e) {
      UserController.handleError(e, res);
    }
  }

  async updateUser(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const id = req.id;
      const userInput = new UserUpdateByUserSchema(req.body);

      if (userInput.password) {
        userInput.password = await bcrypt.hash(
          passwordValidator(userInput.password),
          10,
        );
      }

      const user = await this.userModel.update(id, userInput);
      res.status(200).json({ ...user, password: undefined });
    } catch (e) {
      UserController.handleError(e, res);
    }
  }
  async deleteUser(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const id: number = req.id;
      await this.userModel.delete(id);

      res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (e) {
      UserController.handleError(e, res);
    }
  }

  async checkToken(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      //Token validation
      if (!token) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in env");
      }
      let decoded: JwtPayload & { role: string; id: number };
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload & {
          role: string;
          id: number;
        };
      } catch {
        throw new ErrorResponse("Unauthorized: Invalid token", 401);
      }
      if (
        !(
          "role" in decoded &&
          "id" in decoded &&
          typeof decoded.id === "number" &&
          typeof decoded.role === "string"
        )
      ) {
        throw new ErrorResponse("Unauthorized: Invalid token", 401);
      }

      //Getting corresponding user
      const user = await this.userModel.getById(decoded.id);
      if (!user) {
        throw new ErrorResponse("Unauthorized: Invalid token", 401);
      }

      //Building response
      const response = {
        role: decoded.role,
        userInfos: user,
      };

      res.status(200).json(response);
    } catch (e) {
      UserController.handleError(e, res);
    }
  }

  async getCaptcha(_req: Request, res: Response) {
    try {
      const captcha = svgCaptcha.create({ size: 4 });
      const payload = { value: captcha.text };
      const secret: string | undefined = process.env.JWT_SECRET;

      if (
        secret === null ||
        secret === undefined ||
        typeof secret !== "string"
      ) {
        throw new Error("JWT_SECRET is not defined in env");
      }
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });

      res.status(200).json({ captcha: captcha.data, token });
    } catch (e) {
      UserController.handleError(e, res);
    }
  }
}
