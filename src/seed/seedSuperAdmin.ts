import bcrypt from "bcrypt";
import User from "../models/userModel";

export const seedSuperAdmin = async (): Promise<void> => {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required",
    );
  }

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    staffName: "Super Admin",
    mobileNumber: "9876543210",
    employeeId: "EMP001",
    email,
    password: passwordHash,
    employeeType: "Admin",
  });

  console.log(`Admin created: ${email}`);
};