import { Request } from "express";
import mongoose from "mongoose";

export interface RequestWithAuthData extends Request {
  userId?: mongoose.Types.ObjectId;
  role?: string;
}

