import { Connection } from "promise-mysql";
import UserModel from "../models/userModel";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import Controller from "../utilities/Controller";
import ErrorResponse from "../utilities/ErrorResponse";

export default class UserController extends Controller {
  userModel: UserModel;

  constructor(db: Connection) {
    super(db);
    this.userModel = new UserModel(this.db);

    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.checkToken = this.checkToken.bind(this);
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

  async updateUser(req: Request, res: Response) {
    //@ts-ignore
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

    let password;
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
    } catch (e) {}
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as JwtPayload & { role: string; id: number };
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
        userInfos: user
      }
      
      res.status(200).json(response);
    } catch (e) {
      console.log(e)
      UserController.handleError(e, res);
    }
  }
}
