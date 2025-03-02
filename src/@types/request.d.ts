import { UserInterface, TokenInterface } from "../interface";

declare module "express" {
  interface Request {
    user?: UserInterface;
    token?: TokenInterface;
  }
}
