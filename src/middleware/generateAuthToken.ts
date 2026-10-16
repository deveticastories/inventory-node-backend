import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { UserDocument } from "../models/userModel";

config();

const generateToken = (user: UserDocument): string => {
  const payload: any = {
    _id: user._id,
    employeeType: user.employeeType,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

export default generateToken;