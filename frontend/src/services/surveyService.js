import { apiRequest } from "./api";

/**
 * Convert a Data URL / Base64 image into a Blob.
 */
async function imageDataUrlToBlob(imageDataUrl) {
  const response = await fetch(imageDataUrl);
  return response.blob();
}

/**
 * Append all survey fields to FormData.
 */
function appendSurveyFields(data, formData) {
  // Location hierarchy
  data.append("zoneName", formData.zoneName || "");
  data.append("circleName", formData.circleName || "");
  data.append("wardName", formData.wardName || "");

  // Road information
  data.append("roadName", formData.roadName || "");
  data.append("roadIssue", formData.roadIssue || "");

  // Coordinates
  data.append("latitude", String(formData.latitude ?? ""));
  data.append("longitude", String(formData.longitude ?? ""));

  // Measurement fields
  data.append("length", String(formData.length ?? ""));
  data.append("width", String(formData.width ?? ""));
  data.append("depth", String(formData.depth ?? ""));

  // Calculated fields
  data.append("volume", String(formData.volume ?? ""));
  data.append("roadType", formData.roadType || "");
  data.append("rate", String(formData.rate ?? ""));
  data.append(
    "estimatedCost",
    String(formData.estimatedCost ?? "")
  );

  // Remarks
  data.append("remarks", formData.remarks || "");
}

/**
 * Submit a new survey.
 */
export async function submitSurvey(formData, image) {
  const data = new FormData();

  appendSurveyFields(data, formData);

  // Add photo
  if (image) {
    const blob = await imageDataUrlToBlob(image);

    data.append(
      "photo",
      blob,
      "road-safety-photo.jpg"
    );
  }

  // Debug FormData
  console.log("========== SUBMIT SURVEY ==========");

  for (const [key, value] of data.entries()) {
    console.log(
      key,
      value instanceof Blob
        ? `Blob (${value.type}, ${value.size} bytes)`
        : value
    );
  }

  console.log("===================================");

  return apiRequest("/surveys", {
    method: "POST",
    body: data
  });
}

/**
 * Get surveys submitted by logged-in surveyor.
 */
export async function getMySurveys() {
  return apiRequest("/surveys/my");
}

/**
 * Resubmit a rejected survey.
 */
export async function resubmitSurvey(id, formData, image) {
  const data = new FormData();

  appendSurveyFields(data, formData);

  // Add replacement photo if provided
  if (image) {
    const blob = await imageDataUrlToBlob(image);

    data.append(
      "photo",
      blob,
      "road-safety-resubmission.jpg"
    );
  }

  console.log("========== RESUBMIT SURVEY ==========");

  for (const [key, value] of data.entries()) {
    console.log(
      key,
      value instanceof Blob
        ? `Blob (${value.type}, ${value.size} bytes)`
        : value
    );
  }

  console.log("=====================================");

  return apiRequest(`/surveys/${id}/resubmit`, {
    method: "PUT",
    body: data
  });
}

/**
 * Get surveys pending with officer.
 */
export async function getOfficerSurveys() {
  return apiRequest("/surveys/officer");
}

/**
 * Approve a survey.
 */
export async function approveSurvey(id) {
  return apiRequest(`/surveys/${id}/approve`, {
    method: "PUT"
  });
}

/**
 * Reject a survey.
 */
export async function rejectSurvey(id, comments) {
  return apiRequest(`/surveys/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      comments
    })
  });
}

/**
 * Get officer-approved surveys for admin.
 */
export async function getAdminSurveys() {
  return apiRequest("/surveys/admin");
}

/**
 * Update an officer-approved survey from admin.
 *
 * Uses JSON because this endpoint does not upload a photo.
 */
export async function updateSurvey(id, formData) {
  return apiRequest(`/surveys/${id}/admin`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });
}

/**
 * Get a single survey.
 */
export async function getSurveyById(id) {
  return apiRequest(`/surveys/${id}`);
}