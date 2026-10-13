import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otp.js";
import { generateToken } from "../utils/token.js";

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function isValidPhone(phone) {
  return /^[0-9]{10,15}$/.test(phone);
}

export async function sendRegistrationOTP(req, res) {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Phone number is already registered." });
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 5);

    await pool.query(
      `UPDATE otp_verifications
       SET verified = TRUE
       WHERE phone = $1 AND verified = FALSE`,
      [phone]
    );

    await pool.query(
      `INSERT INTO otp_verifications
       (phone, otp_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
      [phone, otpHash, expiryMinutes]
    );

    // DEVELOPMENT ONLY. Replace with an SMS provider in production.
    console.log(`OTP for ${phone}: ${otp}`);

    return res.json({
      message: "OTP generated successfully.",
      developmentOTP: otp
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to generate OTP." });
  }
}

export async function verifyRegistrationOTP(req, res) {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();

    if (!isValidPhone(phone) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Valid phone number and 6-digit OTP are required." });
    }

    const result = await pool.query(
      `SELECT *
       FROM otp_verifications
       WHERE phone = $1 AND verified = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "OTP not found. Request a new OTP." });
    }

    const record = result.rows[0];

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    if (record.attempts >= 5) {
      return res.status(429).json({ message: "Too many OTP attempts." });
    }

    const valid = await verifyOTP(otp, record.otp_hash);

    if (!valid) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1",
        [record.id]
      );

      return res.status(400).json({ message: "Invalid OTP." });
    }

    await pool.query(
      "UPDATE otp_verifications SET verified = TRUE WHERE id = $1",
      [record.id]
    );

    return res.json({
      message: "OTP verified successfully.",
      verified: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "OTP verification failed." });
  }
}

export async function registerUser(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const role = String(req.body.role || "").toUpperCase();

    if (!name || !phone || !password || !role) {
      return res.status(400).json({
        message: "Name, phone, password and role are required."
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    if (!["SURVEYOR", "OFFICER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Phone number is already registered." });
    }

    const otpResult = await pool.query(
      `SELECT id
       FROM otp_verifications
       WHERE phone = $1 AND verified = TRUE
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        message: "Please verify your phone number using OTP first."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
       (name, phone, password_hash, role, is_verified, is_active)
       VALUES ($1, $2, $3, $4, TRUE, TRUE)
       RETURNING id, name, phone, role, is_verified, is_active, created_at`,
      [name, phone, passwordHash, role]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      message: `${role} registered successfully.`,
      token,
      user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed." });
  }
}

export async function login(req, res) {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!isValidPhone(phone) || !password) {
      return res.status(400).json({
        message: "Valid phone number and password are required."
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE phone = $1 AND is_active = TRUE`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid phone number or password."
      });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid phone number or password."
      });
    }

    const token = generateToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed." });
  }
}
