import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { sendOTP, verifyOTP, registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("SURVEYOR");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSendOTP() {
    if (!name.trim()) return alert("Enter your name.");
    if (!/^\d{10,15}$/.test(phone)) return alert("Enter a valid phone number.");

    try {
      setLoading(true);
      const data = await sendOTP(phone);

      if (data.developmentOTP) {
        alert(`Development OTP: ${data.developmentOTP}`);
      }

      setMessage("OTP generated successfully.");
      setStep(2);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!/^\d{6}$/.test(otp)) {
      return alert("Enter the 6-digit OTP.");
    }

    try {
      setLoading(true);
      await verifyOTP(phone, otp);
      setMessage("Phone number verified successfully.");
      setStep(3);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (password.length < 8) {
      return alert("Password must contain at least 8 characters.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }

    try {
      setLoading(true);

      const data = await registerUser(
        name,
        phone,
        password,
        role
      );

      if (data.user.role === "SURVEYOR") navigate("/surveyor");
      else if (data.user.role === "OFFICER") navigate("/officer");
      else if (data.user.role === "ADMIN") navigate("/admin");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header />

      <main className="auth-container">
        <div className="auth-card">
          <h1>Road Safety Survey</h1>
          <h2>Create Account</h2>

          {message && <div className="success-message">{message}</div>}

          {step === 1 && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  placeholder="10 digit phone number"
                />
              </div>

              <div className="form-group">
                <label>Register As *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="SURVEYOR">Surveyor</option>
                  <option value="OFFICER">Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                className="submit-button"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p>OTP generated for <strong>{phone}</strong>.</p>

              <div className="form-group">
                <label>6 Digit OTP *</label>
                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter OTP"
                  maxLength={6}
                />
              </div>

              <button
                className="submit-button"
                onClick={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                className="secondary-button full-width"
                onClick={() => setStep(1)}
              >
                Change Phone
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Selected Role</label>
                <input value={role} readOnly />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>

              <button
                className="submit-button"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </>
          )}

          <div className="auth-footer">
            Already registered?{" "}
            <button onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
