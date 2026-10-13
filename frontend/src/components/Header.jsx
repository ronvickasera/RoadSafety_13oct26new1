import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";

import { getCurrentUser, logout } from "../services/authService";

function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="app-header">
      <div className="header-inner">

        <button
          className="brand-button"
          onClick={() => {
            if (!user) {
              navigate("/login");
            } else if (user.role === "SURVEYOR") {
              navigate("/surveyor");
            } else if (user.role === "OFFICER") {
              navigate("/officer");
            } else {
              navigate("/admin");
            }
          }}
        >
          <span className="brand-icon">
            <FaMapMarkerAlt />
          </span>

          <span>Road Works Estimator</span>
        </button>

        {user && (
          <div className="header-user">
            <span>
              {user.name} ({user.role})
            </span>

            <button
              className="header-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}

      </div>
    </header>
  );
}

export default Header;