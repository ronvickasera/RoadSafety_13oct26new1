import jwt from "jsonwebtoken";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}
