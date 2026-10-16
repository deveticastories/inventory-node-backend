import bcrypt from "bcrypt";
import { UserDocument } from "../../models/userModel";
import * as authRepository from "./authRepository";

export const loginUser = async (
  email: string,
  password: string,
): Promise<UserDocument | null> => {
  const user = await authRepository.findByEmail(email);
  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }
  return null;
};