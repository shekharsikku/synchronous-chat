import type { UserInfo } from "#/utils/helpers.ts";

declare module "express" {
  interface Request {
    user?: UserInfo;
  }
}
