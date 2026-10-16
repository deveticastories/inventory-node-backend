import User, { UserDocument } from "../../models/userModel";

export const findByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  return User.findOne({ email }).select("+password");
};