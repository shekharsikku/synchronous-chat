import type { UserInfo } from "#/utilities/helpers.ts";

declare module "express" {
  interface Request {
    user?: UserInfo;
  }
}
