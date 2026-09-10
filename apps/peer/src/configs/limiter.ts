import { rateLimit } from "express-rate-limit";
import { HttpResponse } from "#/utilities/response.js";

const limiter = (minute = 10, limit = 1000) => {
  return rateLimit({
    windowMs: minute * 60 * 1000,
    limit: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.clientIp!;
    },
    handler: (req, res) => {
      req.log.error("Rate limit exceeded for ip: %s", req.clientIp);
      return HttpResponse.error(res, 429, "You've made too many requests!");
    },
  });
};

export default limiter;
