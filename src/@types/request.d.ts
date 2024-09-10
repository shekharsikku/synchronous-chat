import "express";
import { UserInterface, UserTokenInterface } from "../interface";

declare module "express" {
  interface Request {
    user?: UserInterface;
    token?: UserTokenInterface;
  }
}
