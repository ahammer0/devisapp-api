import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, secret);
    //@ts-ignore
    req.id = decoded.id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
export default requireAuth;
