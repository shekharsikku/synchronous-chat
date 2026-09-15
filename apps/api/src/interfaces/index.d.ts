declare module "express" {
  interface Request {
    user?: string;
  }
}

export {};
