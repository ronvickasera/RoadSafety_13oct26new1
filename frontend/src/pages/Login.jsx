// import React from "react";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import { login } from "../services/authService";

// function Login() {
//   const navigate = useNavigate();

//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleLogin(event) {
//     event.preventDefault();

//     if (!phone || !password) {
//       alert("Enter phone number and password.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const data = await login(phone, password);

//       if (data.user.role === "SURVEYOR") navigate("/surveyor");
//       else if (data.user.role === "OFFICER") navigate("/officer");
//       else if (data.user.role === "ADMIN") navigate("/admin");
//     } catch (error) {
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div>
//       <Header />

//       <main className="auth-container">
//         <form className="auth-card" onSubmit={handleLogin}>
//           <h1>Road Safety Survey</h1>
//           <h2>Login</h2>

//           <div className="form-group">
//             <label>Phone Number</label>
//             <input
//               type="tel"
//               value={phone}
//               onChange={(e) =>
//                 setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
//               }
//               placeholder="Phone Number"
//             />
//           </div>

//           <div className="form-group">
//             <label>Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Password"
//             />
//           </div>

//           <button
//             className="submit-button"
//             type="submit"
//             disabled={loading}
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>

//           <button
//             className="secondary-button full-width"
//             type="button"
//             onClick={() => navigate("/register")}
//           >
//             Register New Account
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }

// export default Login;


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import { login } from "../services/authService";

import roadSurveyImage from "../img/road.jpg";

import { FaMapMarkerAlt } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (!phone || !password) {
      alert("Enter phone number and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await login(phone, password);

      if (data.user.role === "SURVEYOR") {
        navigate("/surveyor");
      } else if (data.user.role === "OFFICER") {
        navigate("/officer");
      } else if (data.user.role === "ADMIN") {
        navigate("/admin");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Header />

      <main
        className="auth-container"
        // style={{
        //   backgroundImage: `linear-gradient(
        //     rgba(10, 30, 52, 0.72),
        //     rgba(10, 30, 52, 0.82)
        //   ), url(${roadSurveyImage})`
        // }}
        style={{
          backgroundImage: `linear-gradient(
      rgba(10, 30, 52, 0.78),
      rgba(10, 30, 52, 0.88)
    ), url(${roadSurveyImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <div className="login-overlay-content">
          <form className="auth-card" onSubmit={handleLogin}>

            <div className="login-brand">
              {/* <div className="login-icon">
                <FaMapMarkerAlt />
              </div> */}

              <div>
                <span className="brand-icon">
                  <FaMapMarkerAlt />
                </span>

                <span>Road Works Survey</span>
                {/* <h1>Road Safety Survey</h1> */}
                {/* <p>Municipal Road Infrastructure Management</p> */}
              </div>
            </div>

            <div className="login-divider" />

            <div className="login-heading">
              <h2>Sign in</h2>
              <p>
                Enter your registered credentials to access the survey system.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 15)
                  )
                }
                placeholder="Enter phone number"
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              className="secondary-button full-width"
              type="button"
              onClick={() => navigate("/register")}
              disabled={loading}
            >
              Register New Account
            </button>

            <div className="login-footer">
              <span>Road Safety Management System</span>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
