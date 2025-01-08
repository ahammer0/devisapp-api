import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenPayloadDecoded, ReqWithId } from "../types/misc";

const requireAdmin = (req: ReqWithId, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in env");
  }
  if (!req.headers.authorization) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret) as TokenPayloadDecoded;
    if (decoded.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    req.id = decoded.id;
    next();
  } catch{
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
export default requireAdmin;
