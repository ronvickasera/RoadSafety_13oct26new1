import bcrypt from "bcryptjs";
import pool from "./src/config/db.js";

async function createUsers() {
  try {
    const officerPassword = await bcrypt.hash("Officer@123", 12);
    const adminPassword = await bcrypt.hash("Admin@123", 12);

    await pool.query(
      `INSERT INTO users
       (name, phone, password_hash, role, is_verified, is_active)
       VALUES ('Road Safety Officer', '9000000001', $1, 'OFFICER', TRUE, TRUE)
       ON CONFLICT (phone) DO NOTHING`,
      [officerPassword]
    );

    await pool.query(
      `INSERT INTO users
       (name, phone, password_hash, role, is_verified, is_active)
       VALUES ('System Administrator', '9000000002', $1, 'ADMIN', TRUE, TRUE)
       ON CONFLICT (phone) DO NOTHING`,
      [adminPassword]
    );

    console.log("Development Officer/Admin users created or already exist.");
    console.log("Officer: 9000000001 / Officer@123");
    console.log("Admin:   9000000002 / Admin@123");
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

createUsers();
