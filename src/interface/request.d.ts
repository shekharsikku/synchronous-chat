import { UserInterface, TokenInterface } from "../interface/index.d.ts";

declare module "express" {
  interface Request {
    user?: UserInterface;
    token?: TokenInterface;
  }
}
