import { Request } from "express";
export type TokenPayloadDecoded = {
  id: number;
  role:"user" | "admin";
  iat: number;
  exp: number;
};

export interface ReqWithId extends Request {
  id?: number;
}
