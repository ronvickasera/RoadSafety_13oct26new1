import express from "express";

import {
  createSurvey,
  getMySurveys,
  getOfficerSurveys,
  approveSurvey,
  rejectSurvey,
  resubmitSurvey,
  getAdminSurveys,
  updateSurveyByAdmin,
  getSurveyById,
  getSurveyPhoto
} from "../controllers/surveyController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  authorizeRoles("SURVEYOR"),
  upload.single("photo"),
  createSurvey
);

router.get(
  "/my",
  authenticateToken,
  authorizeRoles("SURVEYOR"),
  getMySurveys
);

router.put(
  "/:id/resubmit",
  authenticateToken,
  authorizeRoles("SURVEYOR"),
  upload.single("photo"),
  resubmitSurvey
);

router.get(
  "/officer",
  authenticateToken,
  authorizeRoles("OFFICER"),
  getOfficerSurveys
);

router.put(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("OFFICER"),
  approveSurvey
);

router.put(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("OFFICER"),
  rejectSurvey
);

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAdminSurveys
);

router.put(
  "/:id/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateSurveyByAdmin
);

router.get(
  "/:id/photo",
  authenticateToken,
  getSurveyPhoto
);

router.get(
  "/:id",
  authenticateToken,
  getSurveyById
);

export default router;
