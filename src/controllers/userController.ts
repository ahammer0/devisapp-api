import { Connection } from "promise-mysql";
import UserModel from "../models/userModel";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import Controller from "../utilities/Controller";
import ErrorResponse from "../utilities/ErrorResponse";
import { ReqWithId } from "../types/misc";
import { addCreditRequestBody } from "../types/users";
import PaymentModel from "../models/paymentModel";
import { assertDate, isPast } from "../utilities/datesHandlers";

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
    this.addAccountCredit = this.addAccountCredit.bind(this);
  }

  //TODO refacto to take same time if no email found
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
          password: undefined,
        };

        const payload = { id: user.id, role: "user" };
        const secret: string | undefined = process.env.JWT_SECRET;

        if (
          secret === null ||
          secret === undefined ||
          typeof secret !== "string"
        ) {
          throw new Error("JWT_SECRET is not defined in env");
        }
        const token = jwt.sign(payload, secret, { expiresIn: "1d" });

        res.status(200).json({ user: userWithoutPassword, token });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (err) {
      UserController.handleError(err, res);
    }
  }

  async register(req: Request, res: Response) {
    const {
      email,
      first_name,
      last_name,
      company_name,
      company_address,
      siret,
      ape_code,
      rcs_code,
      tva_number,
      company_type,
      subscription_plan,
      quote_infos,
    } = req.body;
    const password = await bcrypt.hash(req.body.password, 10);

    try {
      const user = await this.userModel.create({
        email,
        password,
        first_name,
        last_name,
        company_name,
        company_address,
        siret,
        ape_code,
        rcs_code,
        tva_number,
        company_type,
        account_status: "waiting",
        subscription_plan: subscription_plan ?? "free",
        quote_infos,
      });
      res.status(201).json({ ...user, password: undefined });
    } catch (e) {
      UserController.handleError(e, res);
    }
  }

  async updateUser(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const id: number = req.id;
    const {
      email,
      first_name,
      last_name,
      company_name,
      company_address,
      siret,
      ape_code,
      rcs_code,
      tva_number,
      company_type,
      subscription_plan,
      quote_infos,
    } = req.body;

    let password: string | undefined;
    if (req.body.password) {
      password = await bcrypt.hash(req.body.password, 10);
    }
    const userToSave = {
      email,
      password,
      first_name,
      last_name,
      company_name,
      company_address,
      siret,
      ape_code,
      rcs_code,
      tva_number,
      company_type,
      subscription_plan,
      quote_infos,
    };
    if (!password) {
      delete userToSave.password;
    }

    try {
      const user = await this.userModel.update(id, userToSave);
      res.status(200).json({ ...user, password: undefined });
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

  async addAccountCredit(req: ReqWithId, res: Response) {
    try {
      const body = req.body as addCreditRequestBody;
      // check request conformity
      if (!body || !(body.plan === 3 || body.plan === 12)) {
        throw new ErrorResponse("Bad Request", 400);
      }
      if (!req.id) {
        throw new Error(
          "User id not fount in request object. This Controller has to be preceded by auth middleware",
        );
      }
      const currentUser = await this.userModel.getById(req.id);
      if (!currentUser) {
        throw new Error(
          `User not found in db, given id :{req.id} should exist`,
        );
      }
      // register payment in db
      let amount: number;
      switch (body.plan) {
        case 3:
          amount = 30;
          break;
        case 12:
          amount = 100;
          break;
        default:
          throw new Error("amount not registered");
      }
      await this.paymentModel.create({
        user_id: req.id,
        amount: amount,
      });

      // creating new date
      let newDate: Date;
      if (isPast(currentUser.expires_at)) {
        newDate = new Date();
      } else {
        newDate = assertDate(currentUser.expires_at);
      }
      newDate.setMonth(newDate.getMonth() + body.plan);

      // update  user's expires_at
      await this.userModel.update(req.id, {
        expires_at: newDate,
        subscription_plan: "paid", // once the user has paid, its account is considered as paid
      });

      // respond 200 with updated user
      const user = await this.userModel.getById(req.id);
      res.status(200).json(user);
      return;
    } catch (e) {
      console.log(e);
      UserController.handleError(e, res);
    }
  }
}
