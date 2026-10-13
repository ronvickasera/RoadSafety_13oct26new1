import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";

function parseCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid latitude.");
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid longitude.");
  }

  return { lat, lon };
}

function requiredText(value) {
  return String(value || "").trim();
}

export async function createSurvey(req, res) {
  const client = await pool.connect();

  try {
    const zoneName = requiredText(req.body.zoneName);
    const circleName = requiredText(req.body.circleName);
    const wardName = requiredText(req.body.wardName);
    const roadName = requiredText(req.body.roadName);
    const roadIssue = requiredText(req.body.roadIssue);
    const remarks = requiredText(req.body.remarks);

    if (!zoneName || !circleName || !wardName || !roadIssue) {
      return res.status(400).json({
        message: "Zone, Circle, Ward and Road Issue are required."
      });
    }

    const { lat, lon } = parseCoordinates(
      req.body.latitude,
      req.body.longitude
    );

    const surveyId = uuidv4();

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO surveys
       (
         id, surveyor_id, zone_name, circle_name, ward_name,
         road_name, road_issue, latitude, longitude, geom,
         remarks, photo_data, photo_mime_type, status
       )
       VALUES
       (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         ST_SetSRID(ST_MakePoint($9, $8), 4326),
         $10, $11, $12, 'SUBMITTED'
       )
       RETURNING
         id, surveyor_id, zone_name, circle_name, ward_name,
         road_name, road_issue, latitude, longitude, remarks,
         status, survey_date`,
      [
        surveyId,
        req.user.id,
        zoneName,
        circleName,
        wardName,
        roadName || null,
        roadIssue,
        lat,
        lon,
        remarks || null,
        req.file?.buffer || null,
        req.file?.mimetype || null
      ]
    );

    await client.query(
      `INSERT INTO survey_history
       (survey_id, user_id, action, new_status)
       VALUES ($1, $2, 'SUBMITTED', 'SUBMITTED')`,
      [surveyId, req.user.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Survey submitted successfully.",
      survey: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({
      message: error.message || "Unable to create survey."
    });
  } finally {
    client.release();
  }
}

export async function getMySurveys(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id, zone_name, circle_name, ward_name, road_name,
         road_issue, latitude, longitude, remarks, status,
         officer_comments, survey_date, updated_at
       FROM surveys
       WHERE surveyor_id = $1
       ORDER BY survey_date DESC`,
      [req.user.id]
    );

    return res.json({ surveys: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load surveys." });
  }
}

export async function getOfficerSurveys(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         s.*,
         u.name AS surveyor_name,
         u.phone AS surveyor_phone
       FROM surveys s
       INNER JOIN users u ON u.id = s.surveyor_id
       WHERE s.status = 'SUBMITTED'
       ORDER BY s.survey_date ASC`
    );

    return res.json({ surveys: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unable to load officer surveys."
    });
  }
}

export async function approveSurvey(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT status
       FROM surveys
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Survey not found." });
    }

    if (result.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only submitted surveys can be approved."
      });
    }

    await client.query(
      `UPDATE surveys
       SET status = 'OFFICER_APPROVED',
           officer_id = $1,
           officer_comments = NULL,
           officer_action_date = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );

    await client.query(
      `INSERT INTO survey_history
       (survey_id, user_id, action, old_status, new_status)
       VALUES ($1, $2, 'OFFICER_APPROVED', 'SUBMITTED', 'OFFICER_APPROVED')`,
      [id, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({ message: "Survey approved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Approval failed." });
  } finally {
    client.release();
  }
}

export async function rejectSurvey(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const comments = requiredText(req.body.comments);

    if (!comments) {
      return res.status(400).json({
        message: "Rejection comments are required."
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT status
       FROM surveys
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Survey not found." });
    }

    if (result.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only submitted surveys can be rejected."
      });
    }

    await client.query(
      `UPDATE surveys
       SET status = 'REJECTED',
           officer_id = $1,
           officer_comments = $2,
           officer_action_date = NOW()
       WHERE id = $3`,
      [req.user.id, comments, id]
    );

    await client.query(
      `INSERT INTO survey_history
       (survey_id, user_id, action, comments, old_status, new_status)
       VALUES ($1, $2, 'OFFICER_REJECTED', $3, 'SUBMITTED', 'REJECTED')`,
      [id, req.user.id, comments]
    );

    await client.query("COMMIT");

    return res.json({ message: "Survey rejected successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Rejection failed." });
  } finally {
    client.release();
  }
}

export async function resubmitSurvey(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const zoneName = requiredText(req.body.zoneName);
    const circleName = requiredText(req.body.circleName);
    const wardName = requiredText(req.body.wardName);
    const roadName = requiredText(req.body.roadName);
    const roadIssue = requiredText(req.body.roadIssue);
    const remarks = requiredText(req.body.remarks);

    if (!zoneName || !circleName || !wardName || !roadIssue) {
      return res.status(400).json({
        message: "Zone, Circle, Ward and Road Issue are required."
      });
    }

    const { lat, lon } = parseCoordinates(
      req.body.latitude,
      req.body.longitude
    );

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT *
       FROM surveys
       WHERE id = $1 AND surveyor_id = $2
       FOR UPDATE`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Survey not found." });
    }

    if (result.rows[0].status !== "REJECTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only rejected surveys can be resubmitted."
      });
    }

    await client.query(
      `UPDATE surveys
       SET zone_name = $1,
           circle_name = $2,
           ward_name = $3,
           road_name = $4,
           road_issue = $5,
           latitude = $6,
           longitude = $7,
           geom = ST_SetSRID(ST_MakePoint($7, $6), 4326),
           remarks = $8,
           status = 'SUBMITTED',
           officer_comments = NULL,
           officer_id = NULL,
           officer_action_date = NULL
       WHERE id = $9`,
      [
        zoneName,
        circleName,
        wardName,
        roadName || null,
        roadIssue,
        lat,
        lon,
        remarks || null,
        id
      ]
    );

    if (req.file) {
      await client.query(
        `UPDATE surveys
         SET photo_data = $1,
             photo_mime_type = $2
         WHERE id = $3`,
        [req.file.buffer, req.file.mimetype, id]
      );
    }

    await client.query(
      `INSERT INTO survey_history
       (survey_id, user_id, action, old_status, new_status)
       VALUES ($1, $2, 'RESUBMITTED', 'REJECTED', 'SUBMITTED')`,
      [id, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Survey resubmitted successfully."
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({
      message: error.message || "Unable to resubmit survey."
    });
  } finally {
    client.release();
  }
}

export async function getAdminSurveys(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         s.*,
         su.name AS surveyor_name,
         su.phone AS surveyor_phone,
         o.name AS officer_name
       FROM surveys s
       LEFT JOIN users su ON su.id = s.surveyor_id
       LEFT JOIN users o ON o.id = s.officer_id
       WHERE s.status = 'OFFICER_APPROVED'
       ORDER BY s.updated_at DESC`
    );

    return res.json({ surveys: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unable to load admin surveys."
    });
  }
}

export async function updateSurveyByAdmin(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const zoneName = requiredText(req.body.zoneName);
    const circleName = requiredText(req.body.circleName);
    const wardName = requiredText(req.body.wardName);
    const roadName = requiredText(req.body.roadName);
    const roadIssue = requiredText(req.body.roadIssue);
    const remarks = requiredText(req.body.remarks);

    if (!zoneName || !circleName || !wardName || !roadIssue) {
      return res.status(400).json({
        message: "Zone, Circle, Ward and Road Issue are required."
      });
    }

    const { lat, lon } = parseCoordinates(
      req.body.latitude,
      req.body.longitude
    );

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT status
       FROM surveys
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Survey not found." });
    }

    if (result.rows[0].status !== "OFFICER_APPROVED") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Admin can edit only officer-approved surveys."
      });
    }

    await client.query(
      `UPDATE surveys
       SET zone_name = $1,
           circle_name = $2,
           ward_name = $3,
           road_name = $4,
           road_issue = $5,
           latitude = $6,
           longitude = $7,
           geom = ST_SetSRID(ST_MakePoint($7, $6), 4326),
           remarks = $8
       WHERE id = $9`,
      [
        zoneName,
        circleName,
        wardName,
        roadName || null,
        roadIssue,
        lat,
        lon,
        remarks || null,
        id
      ]
    );

    await client.query(
      `INSERT INTO survey_history
       (survey_id, user_id, action, old_status, new_status)
       VALUES ($1, $2, 'ADMIN_EDIT', 'OFFICER_APPROVED', 'OFFICER_APPROVED')`,
      [id, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({ message: "Survey updated successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Unable to update survey." });
  } finally {
    client.release();
  }
}

export async function getSurveyById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         s.*,
         u.name AS surveyor_name,
         u.phone AS surveyor_phone
       FROM surveys s
       INNER JOIN users u ON u.id = s.surveyor_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }

    return res.json({ survey: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unable to retrieve survey."
    });
  }
}

export async function getSurveyPhoto(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT photo_data, photo_mime_type
       FROM surveys
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return res.status(404).json({ message: "Photo not found." });
    }

    res.setHeader(
      "Content-Type",
      result.rows[0].photo_mime_type || "image/jpeg"
    );

    return res.send(result.rows[0].photo_data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to retrieve photo." });
  }
}
