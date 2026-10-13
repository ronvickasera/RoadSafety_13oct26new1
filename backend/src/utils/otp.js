import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function hashOTP(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}
