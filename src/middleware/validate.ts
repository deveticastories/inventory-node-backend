import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { statusCode } from "../constants/statusCode";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: result.error.issues
          .map((issue) => issue.message)
          .join(", "),
      });
    }

    req.body = result.data;
    next();
  };
};