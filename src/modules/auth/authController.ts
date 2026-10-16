import { Request, Response } from "express";
import * as authService from "./authService";
import generateToken from "../../middleware/generateAuthToken";
import { message } from "../../constants/responseMessage";

export const login = async (
  req: Request,
  res: Response,
): Promise<Response<any, Record<string, any>> | undefined> => {
  const { email, password } = req.body;

  try {
    const user = await authService.loginUser(email, password);

    if (!user) {
      return res.status(400).json({ message: message.INVALID_LOGIN });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.cookie("token", token).status(200).json({
      success: true,

      message: message.LOGIN_SUCCESS,
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};