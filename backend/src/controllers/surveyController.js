
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| Helper: Parse Latitude / Longitude
|--------------------------------------------------------------------------
*/
function parseCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid latitude.");
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid longitude.");
  }

  return {
    lat,
    lon
  };
}

/*
|--------------------------------------------------------------------------
| Helper: Required Text
|--------------------------------------------------------------------------
*/
function requiredText(value) {
  return String(value || "").trim();
}

/*
|--------------------------------------------------------------------------
| Helper: Positive Number
|--------------------------------------------------------------------------
*/
function parsePositiveNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| Helper: Non-negative Number
|--------------------------------------------------------------------------
*/
function parseNonNegativeNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| Helper: Road Type
|--------------------------------------------------------------------------
|
| Frontend may send:
|
| BT(Bituminous)
| CC(Cement Concrete)
| WBM/Gravel
|
| or:
|
| BT
| CC
| WBM
|
|--------------------------------------------------------------------------
*/
function normalizeRoadType(value) {
  const roadType = requiredText(value);

  const roadTypeMap = {
    "BT(Bituminous)": "BT",
    "CC(Cement Concrete)": "CC",
    "WBM/Gravel": "WBM",

    BT: "BT",
    CC: "CC",
    WBM: "WBM"
  };

  const normalizedRoadType =
    roadTypeMap[roadType];

  if (!normalizedRoadType) {
    throw new Error(
      "Invalid Road Type. Allowed values are BT, CC and WBM."
    );
  }

  return normalizedRoadType;
}

/*
|--------------------------------------------------------------------------
| Helper: Calculate Volume
|--------------------------------------------------------------------------
|
| Length = meters
| Width  = meters
| Depth  = centimeters
|
| Volume = Length × Width × (Depth / 100)
|
|--------------------------------------------------------------------------
*/
function calculateVolume(length, width, depth) {
  return length * width * (depth / 100);
}

/*
|--------------------------------------------------------------------------
| CREATE SURVEY
|--------------------------------------------------------------------------
|
| POST /api/surveys
|
|--------------------------------------------------------------------------
*/
export async function createSurvey(req, res) {
  const client = await pool.connect();

  try {
    /*
    |--------------------------------------------------------------------------
    | Basic Survey Fields
    |--------------------------------------------------------------------------
    */
    const zoneName =
      requiredText(req.body.zoneName);

    const circleName =
      requiredText(req.body.circleName);

    const wardName =
      requiredText(req.body.wardName);

    const roadName =
      requiredText(req.body.roadName);

    const roadIssue =
      requiredText(req.body.roadIssue);

    const remarks =
      requiredText(req.body.remarks);

    /*
    |--------------------------------------------------------------------------
    | Required Validation
    |--------------------------------------------------------------------------
    */
    if (
      !zoneName ||
      !circleName ||
      !wardName ||
      !roadIssue
    ) {
      return res.status(400).json({
        message:
          "Zone, Circle, Ward and Road Issue are required."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Coordinates
    |--------------------------------------------------------------------------
    */
    const { lat, lon } =
      parseCoordinates(
        req.body.latitude,
        req.body.longitude
      );

    /*
    |--------------------------------------------------------------------------
    | Quantity Fields
    |--------------------------------------------------------------------------
    */
    const length =
      parsePositiveNumber(
        req.body.length,
        "Length"
      );

    const width =
      parsePositiveNumber(
        req.body.width,
        "Width"
      );

    const depth =
      parsePositiveNumber(
        req.body.depth,
        "Depth"
      );

    /*
    |--------------------------------------------------------------------------
    | Road Type
    |--------------------------------------------------------------------------
    */
    const roadType =
      normalizeRoadType(
        req.body.roadType ||
        req.body.roadName
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Volume
    |--------------------------------------------------------------------------
    */
    const volume =
      calculateVolume(
        length,
        width,
        depth
      );

    /*
    |--------------------------------------------------------------------------
    | Rate
    |--------------------------------------------------------------------------
    |
    | Currently the frontend sends the rate.
    |
    | Later you can move rates into a database table and
    | calculate the rate completely on the backend.
    |
    |--------------------------------------------------------------------------
    */
    const rate =
      parseNonNegativeNumber(
        req.body.rate,
        "Rate"
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Estimated Cost
    |--------------------------------------------------------------------------
    */
    const estimatedCost =
      volume * rate;

    /*
    |--------------------------------------------------------------------------
    | Generate Survey ID
    |--------------------------------------------------------------------------
    */
    const surveyId = uuidv4();

    /*
    |--------------------------------------------------------------------------
    | Start Transaction
    |--------------------------------------------------------------------------
    */
    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | Insert Survey
    |--------------------------------------------------------------------------
    */
    const result = await client.query(
      `
      INSERT INTO surveys
      (
        id,
        surveyor_id,

        zone_name,
        circle_name,
        ward_name,
        road_name,
        road_issue,

        latitude,
        longitude,
        geom,

        length,
        width,
        depth,
        volume,
        road_type,
        rate,
        estimated_cost,

        remarks,

        photo_data,
        photo_mime_type,

        status
      )
      VALUES
      (
        $1,
        $2,

        $3,
        $4,
        $5,
        $6,
        $7,

        $8,
        $9,

        ST_SetSRID(
          ST_MakePoint($9, $8),
          4326
        ),

        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,

        $17,

        $18,
        $19,

        'SUBMITTED'
      )
      RETURNING
        id,
        surveyor_id,

        zone_name,
        circle_name,
        ward_name,
        road_name,
        road_issue,

        latitude,
        longitude,

        length,
        width,
        depth,
        volume,
        road_type,
        rate,
        estimated_cost,

        remarks,

        status,
        survey_date,
        updated_at
      `,
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

        length,
        width,
        depth,

        Number(
          volume.toFixed(3)
        ),

        roadType,

        Number(
          rate.toFixed(2)
        ),

        Number(
          estimatedCost.toFixed(2)
        ),

        remarks || null,

        req.file?.buffer || null,
        req.file?.mimetype || null
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Survey History
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      INSERT INTO survey_history
      (
        survey_id,
        user_id,
        action,
        new_status
      )
      VALUES
      (
        $1,
        $2,
        'SUBMITTED',
        'SUBMITTED'
      )
      `,
      [
        surveyId,
        req.user.id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */
    await client.query("COMMIT");

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */
    return res.status(201).json({
      message:
        "Survey submitted successfully.",

      survey:
        result.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "CREATE SURVEY ERROR:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to create survey."
    });

  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| GET MY SURVEYS
|--------------------------------------------------------------------------
|
| Surveyor can see only his/her surveys.
|
| GET /api/surveys/my
|
|--------------------------------------------------------------------------
*/
export async function getMySurveys(req, res) {
  try {

    const result = await pool.query(
      `
      SELECT
        id,

        zone_name,
        circle_name,
        ward_name,
        road_name,
        road_issue,

        latitude,
        longitude,

        length,
        width,
        depth,
        volume,

        road_type,
        rate,
        estimated_cost,

        remarks,

        status,

        officer_id,
        officer_comments,
        officer_action_date,

        survey_date,
        updated_at

      FROM surveys

      WHERE surveyor_id = $1

      ORDER BY
        survey_date DESC
      `,
      [
        req.user.id
      ]
    );

    return res.json({
      surveys:
        result.rows
    });

  } catch (error) {

    console.error(
      "GET MY SURVEYS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load surveys."
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET OFFICER SURVEYS
|--------------------------------------------------------------------------
|
| Officer sees SUBMITTED surveys.
|
| GET /api/surveys/officer
|
|--------------------------------------------------------------------------
*/
export async function getOfficerSurveys(req, res) {
  try {

    const result = await pool.query(
      `
      SELECT
        s.*,

        u.name AS surveyor_name,
        u.phone AS surveyor_phone

      FROM surveys s

      INNER JOIN users u
        ON u.id = s.surveyor_id

      WHERE
        s.status = 'SUBMITTED'

      ORDER BY
        s.survey_date ASC
      `
    );

    return res.json({
      surveys:
        result.rows
    });

  } catch (error) {

    console.error(
      "GET OFFICER SURVEYS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load officer surveys."
    });
  }
}

/*
|--------------------------------------------------------------------------
| APPROVE SURVEY
|--------------------------------------------------------------------------
|
| Officer approves submitted survey.
|
| PUT /api/surveys/:id/approve
|
|--------------------------------------------------------------------------
*/
export async function approveSurvey(req, res) {
  const client = await pool.connect();

  try {

    const { id } =
      req.params;

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | Lock Survey
    |--------------------------------------------------------------------------
    */
    const result =
      await client.query(
        `
        SELECT
          status

        FROM surveys

        WHERE id = $1

        FOR UPDATE
        `,
        [
          id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        message:
          "Survey not found."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Status
    |--------------------------------------------------------------------------
    */
    if (
      result.rows[0].status !==
      "SUBMITTED"
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        message:
          "Only submitted surveys can be approved."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Survey
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      UPDATE surveys

      SET
        status =
          'OFFICER_APPROVED',

        officer_id =
          $1,

        officer_comments =
          NULL,

        officer_action_date =
          NOW()

      WHERE id = $2
      `,
      [
        req.user.id,
        id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | History
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      INSERT INTO survey_history
      (
        survey_id,
        user_id,
        action,
        old_status,
        new_status
      )
      VALUES
      (
        $1,
        $2,
        'OFFICER_APPROVED',
        'SUBMITTED',
        'OFFICER_APPROVED'
      )
      `,
      [
        id,
        req.user.id
      ]
    );

    await client.query(
      "COMMIT"
    );

    return res.json({
      message:
        "Survey approved successfully."
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    console.error(
      "APPROVE SURVEY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Approval failed."
    });

  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| REJECT SURVEY
|--------------------------------------------------------------------------
|
| Officer rejects submitted survey.
|
| PUT /api/surveys/:id/reject
|
|--------------------------------------------------------------------------
*/
export async function rejectSurvey(req, res) {
  const client = await pool.connect();

  try {

    const { id } =
      req.params;

    const comments =
      requiredText(
        req.body.comments
      );

    if (!comments) {

      return res.status(400).json({
        message:
          "Rejection comments are required."
      });
    }

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | Lock Survey
    |--------------------------------------------------------------------------
    */
    const result =
      await client.query(
        `
        SELECT
          status

        FROM surveys

        WHERE id = $1

        FOR UPDATE
        `,
        [
          id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        message:
          "Survey not found."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Status
    |--------------------------------------------------------------------------
    */
    if (
      result.rows[0].status !==
      "SUBMITTED"
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        message:
          "Only submitted surveys can be rejected."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Survey
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      UPDATE surveys

      SET
        status =
          'REJECTED',

        officer_id =
          $1,

        officer_comments =
          $2,

        officer_action_date =
          NOW()

      WHERE id = $3
      `,
      [
        req.user.id,
        comments,
        id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | History
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      INSERT INTO survey_history
      (
        survey_id,
        user_id,
        action,
        comments,
        old_status,
        new_status
      )
      VALUES
      (
        $1,
        $2,
        'OFFICER_REJECTED',
        $3,
        'SUBMITTED',
        'REJECTED'
      )
      `,
      [
        id,
        req.user.id,
        comments
      ]
    );

    await client.query(
      "COMMIT"
    );

    return res.json({
      message:
        "Survey rejected successfully."
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    console.error(
      "REJECT SURVEY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Rejection failed."
    });

  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| RESUBMIT REJECTED SURVEY
|--------------------------------------------------------------------------
|
| Surveyor can resubmit a rejected survey.
|
| PUT /api/surveys/:id/resubmit
|
|--------------------------------------------------------------------------
*/
export async function resubmitSurvey(req, res) {
  const client = await pool.connect();

  try {

    const { id } =
      req.params;

    /*
    |--------------------------------------------------------------------------
    | Basic Fields
    |--------------------------------------------------------------------------
    */
    const zoneName =
      requiredText(
        req.body.zoneName
      );

    const circleName =
      requiredText(
        req.body.circleName
      );

    const wardName =
      requiredText(
        req.body.wardName
      );

    const roadName =
      requiredText(
        req.body.roadName
      );

    const roadIssue =
      requiredText(
        req.body.roadIssue
      );

    const remarks =
      requiredText(
        req.body.remarks
      );

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */
    if (
      !zoneName ||
      !circleName ||
      !wardName ||
      !roadIssue
    ) {

      return res.status(400).json({
        message:
          "Zone, Circle, Ward and Road Issue are required."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Coordinates
    |--------------------------------------------------------------------------
    */
    const { lat, lon } =
      parseCoordinates(
        req.body.latitude,
        req.body.longitude
      );

    /*
    |--------------------------------------------------------------------------
    | Quantity
    |--------------------------------------------------------------------------
    */
    const length =
      parsePositiveNumber(
        req.body.length,
        "Length"
      );

    const width =
      parsePositiveNumber(
        req.body.width,
        "Width"
      );

    const depth =
      parsePositiveNumber(
        req.body.depth,
        "Depth"
      );

    /*
    |--------------------------------------------------------------------------
    | Road Type
    |--------------------------------------------------------------------------
    */
    const roadType =
      normalizeRoadType(
        req.body.roadType ||
        req.body.roadName
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Volume
    |--------------------------------------------------------------------------
    */
    const volume =
      calculateVolume(
        length,
        width,
        depth
      );

    /*
    |--------------------------------------------------------------------------
    | Rate
    |--------------------------------------------------------------------------
    */
    const rate =
      parseNonNegativeNumber(
        req.body.rate,
        "Rate"
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Cost
    |--------------------------------------------------------------------------
    */
    const estimatedCost =
      volume * rate;

    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Find Survey
    |--------------------------------------------------------------------------
    */
    const result =
      await client.query(
        `
        SELECT *
        FROM surveys

        WHERE
          id = $1
          AND surveyor_id = $2

        FOR UPDATE
        `,
        [
          id,
          req.user.id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        message:
          "Survey not found."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Only REJECTED surveys can be resubmitted
    |--------------------------------------------------------------------------
    */
    if (
      result.rows[0].status !==
      "REJECTED"
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        message:
          "Only rejected surveys can be resubmitted."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Survey
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      UPDATE surveys

      SET
        zone_name = $1,
        circle_name = $2,
        ward_name = $3,
        road_name = $4,
        road_issue = $5,

        latitude = $6,
        longitude = $7,

        geom =
          ST_SetSRID(
            ST_MakePoint($7, $6),
            4326
          ),

        remarks = $8,

        length = $9,
        width = $10,
        depth = $11,
        volume = $12,
        road_type = $13,
        rate = $14,
        estimated_cost = $15,

        status =
          'SUBMITTED',

        officer_comments =
          NULL,

        officer_id =
          NULL,

        officer_action_date =
          NULL

      WHERE id = $16
      `,
      [
        zoneName,
        circleName,
        wardName,
        roadName || null,
        roadIssue,

        lat,
        lon,

        remarks || null,

        length,
        width,
        depth,

        Number(
          volume.toFixed(3)
        ),

        roadType,

        Number(
          rate.toFixed(2)
        ),

        Number(
          estimatedCost.toFixed(2)
        ),

        id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Replace Photo if New Photo Exists
    |--------------------------------------------------------------------------
    */
    if (req.file) {

      await client.query(
        `
        UPDATE surveys

        SET
          photo_data = $1,
          photo_mime_type = $2

        WHERE id = $3
        `,
        [
          req.file.buffer,
          req.file.mimetype,
          id
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | History
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      INSERT INTO survey_history
      (
        survey_id,
        user_id,
        action,
        old_status,
        new_status
      )
      VALUES
      (
        $1,
        $2,
        'RESUBMITTED',
        'REJECTED',
        'SUBMITTED'
      )
      `,
      [
        id,
        req.user.id
      ]
    );

    await client.query(
      "COMMIT"
    );

    return res.json({
      message:
        "Survey resubmitted successfully."
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    console.error(
      "RESUBMIT SURVEY ERROR:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to resubmit survey."
    });

  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| GET ADMIN SURVEYS
|--------------------------------------------------------------------------
|
| Admin receives officer-approved surveys.
|
| GET /api/surveys/admin
|
|--------------------------------------------------------------------------
*/
export async function getAdminSurveys(req, res) {
  try {

    const result =
      await pool.query(
        `
        SELECT
          s.*,

          su.name AS surveyor_name,
          su.phone AS surveyor_phone,

          o.name AS officer_name

        FROM surveys s

        LEFT JOIN users su
          ON su.id =
             s.surveyor_id

        LEFT JOIN users o
          ON o.id =
             s.officer_id

        WHERE
          s.status =
          'OFFICER_APPROVED'

        ORDER BY
          s.updated_at DESC
        `
      );

    return res.json({
      surveys:
        result.rows
    });

  } catch (error) {

    console.error(
      "GET ADMIN SURVEYS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load admin surveys."
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE SURVEY BY ADMIN
|--------------------------------------------------------------------------
|
| Admin can edit an officer-approved survey.
|
| PUT /api/surveys/admin/:id
|
|--------------------------------------------------------------------------
*/
export async function updateSurveyByAdmin(req, res) {
  const client = await pool.connect();

  try {

    const { id } =
      req.params;

    /*
    |--------------------------------------------------------------------------
    | Basic Fields
    |--------------------------------------------------------------------------
    */
    const zoneName =
      requiredText(
        req.body.zoneName
      );

    const circleName =
      requiredText(
        req.body.circleName
      );

    const wardName =
      requiredText(
        req.body.wardName
      );

    const roadName =
      requiredText(
        req.body.roadName
      );

    const roadIssue =
      requiredText(
        req.body.roadIssue
      );

    const remarks =
      requiredText(
        req.body.remarks
      );

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */
    if (
      !zoneName ||
      !circleName ||
      !wardName ||
      !roadIssue
    ) {

      return res.status(400).json({
        message:
          "Zone, Circle, Ward and Road Issue are required."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Coordinates
    |--------------------------------------------------------------------------
    */
    const { lat, lon } =
      parseCoordinates(
        req.body.latitude,
        req.body.longitude
      );

    /*
    |--------------------------------------------------------------------------
    | Quantity
    |--------------------------------------------------------------------------
    */
    const length =
      parsePositiveNumber(
        req.body.length,
        "Length"
      );

    const width =
      parsePositiveNumber(
        req.body.width,
        "Width"
      );

    const depth =
      parsePositiveNumber(
        req.body.depth,
        "Depth"
      );

    /*
    |--------------------------------------------------------------------------
    | Road Type
    |--------------------------------------------------------------------------
    */
    const roadType =
      normalizeRoadType(
        req.body.roadType ||
        req.body.roadName
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Volume
    |--------------------------------------------------------------------------
    */
    const volume =
      calculateVolume(
        length,
        width,
        depth
      );

    /*
    |--------------------------------------------------------------------------
    | Rate
    |--------------------------------------------------------------------------
    */
    const rate =
      parseNonNegativeNumber(
        req.body.rate,
        "Rate"
      );

    /*
    |--------------------------------------------------------------------------
    | Calculate Cost
    |--------------------------------------------------------------------------
    */
    const estimatedCost =
      volume * rate;

    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Lock Survey
    |--------------------------------------------------------------------------
    */
    const result =
      await client.query(
        `
        SELECT
          status

        FROM surveys

        WHERE id = $1

        FOR UPDATE
        `,
        [
          id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        message:
          "Survey not found."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Admin can only edit approved surveys
    |--------------------------------------------------------------------------
    */
    if (
      result.rows[0].status !==
      "OFFICER_APPROVED"
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res.status(403).json({
        message:
          "Admin can edit only officer-approved surveys."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Survey
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      UPDATE surveys

      SET
        zone_name = $1,
        circle_name = $2,
        ward_name = $3,
        road_name = $4,
        road_issue = $5,

        latitude = $6,
        longitude = $7,

        geom =
          ST_SetSRID(
            ST_MakePoint($7, $6),
            4326
          ),

        remarks = $8,

        length = $9,
        width = $10,
        depth = $11,
        volume = $12,
        road_type = $13,
        rate = $14,
        estimated_cost = $15

      WHERE id = $16
      `,
      [
        zoneName,
        circleName,
        wardName,
        roadName || null,
        roadIssue,

        lat,
        lon,

        remarks || null,

        length,
        width,
        depth,

        Number(
          volume.toFixed(3)
        ),

        roadType,

        Number(
          rate.toFixed(2)
        ),

        Number(
          estimatedCost.toFixed(2)
        ),

        id
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | History
    |--------------------------------------------------------------------------
    */
    await client.query(
      `
      INSERT INTO survey_history
      (
        survey_id,
        user_id,
        action,
        old_status,
        new_status
      )
      VALUES
      (
        $1,
        $2,
        'ADMIN_EDIT',
        'OFFICER_APPROVED',
        'OFFICER_APPROVED'
      )
      `,
      [
        id,
        req.user.id
      ]
    );

    await client.query(
      "COMMIT"
    );

    return res.json({
      message:
        "Survey updated successfully."
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    console.error(
      "ADMIN UPDATE SURVEY ERROR:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Unable to update survey."
    });

  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| GET SURVEY BY ID
|--------------------------------------------------------------------------
|
| GET /api/surveys/:id
|
|--------------------------------------------------------------------------
*/
export async function getSurveyById(req, res) {
  try {

    const { id } =
      req.params;

    const result =
      await pool.query(
        `
        SELECT
          s.*,

          u.name AS surveyor_name,
          u.phone AS surveyor_phone

        FROM surveys s

        INNER JOIN users u
          ON u.id =
             s.surveyor_id

        WHERE
          s.id = $1
        `,
        [
          id
        ]
      );

    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        message:
          "Survey not found."
      });
    }

    return res.json({
      survey:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "GET SURVEY BY ID ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve survey."
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET SURVEY PHOTO
|--------------------------------------------------------------------------
|
| GET /api/surveys/:id/photo
|
|--------------------------------------------------------------------------
*/
export async function getSurveyPhoto(req, res) {
  try {

    const { id } =
      req.params;

    const result =
      await pool.query(
        `
        SELECT
          photo_data,
          photo_mime_type

        FROM surveys

        WHERE
          id = $1
        `,
        [
          id
        ]
      );

    if (
      result.rows.length === 0 ||
      !result.rows[0].photo_data
    ) {

      return res.status(404).json({
        message:
          "Photo not found."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Set image content type
    |--------------------------------------------------------------------------
    */
    res.setHeader(
      "Content-Type",
      result.rows[0]
        .photo_mime_type ||
        "image/jpeg"
    );

    /*
    |--------------------------------------------------------------------------
    | Send Binary Image
    |--------------------------------------------------------------------------
    */
    return res.send(
      result.rows[0].photo_data
    );

  } catch (error) {

    console.error(
      "GET SURVEY PHOTO ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve photo."
    });
  }
}

