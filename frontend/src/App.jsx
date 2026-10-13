import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SurveyorDashboard from "./pages/SurveyorDashboard";
import SurveyForm from "./pages/SurveyForm";
import EditRejectedSurvey from "./pages/EditRejectedSurvey";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/surveyor"
          element={
            <ProtectedRoute roles={["SURVEYOR"]}>
              <SurveyorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/survey"
          element={
            <ProtectedRoute roles={["SURVEYOR"]}>
              <SurveyForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/survey/edit/:id"
          element={
            <ProtectedRoute roles={["SURVEYOR"]}>
              <EditRejectedSurvey />
            </ProtectedRoute>
          }
        />

        <Route
          path="/officer"
          element={
            <ProtectedRoute roles={["OFFICER"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;