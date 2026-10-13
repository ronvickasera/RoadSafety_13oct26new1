import { apiRequest } from "./api";

async function imageDataUrlToBlob(imageDataUrl) {
  const response = await fetch(imageDataUrl);
  return response.blob();
}

function appendSurveyFields(data, formData) {
  data.append("zoneName", formData.zoneName);
  data.append("circleName", formData.circleName);
  data.append("wardName", formData.wardName);
  data.append("roadName", formData.roadName || "");
  data.append("roadIssue", formData.roadIssue);
  data.append("latitude", formData.latitude);
  data.append("longitude", formData.longitude);
  data.append("remarks", formData.remarks || "");
}

export async function submitSurvey(formData, image) {
  const data = new FormData();

  appendSurveyFields(data, formData);

  if (image) {
    const blob = await imageDataUrlToBlob(image);
    data.append("photo", blob, "road-safety-photo.jpg");
  }

  return apiRequest("/surveys", {
    method: "POST",
    body: data
  });
}

export async function getMySurveys() {
  return apiRequest("/surveys/my");
}

export async function resubmitSurvey(id, formData, image) {
  const data = new FormData();

  appendSurveyFields(data, formData);

  if (image) {
    const blob = await imageDataUrlToBlob(image);
    data.append("photo", blob, "road-safety-resubmission.jpg");
  }

  return apiRequest(`/surveys/${id}/resubmit`, {
    method: "PUT",
    body: data
  });
}

export async function getOfficerSurveys() {
  return apiRequest("/surveys/officer");
}

export async function approveSurvey(id) {
  return apiRequest(`/surveys/${id}/approve`, {
    method: "PUT"
  });
}

export async function rejectSurvey(id, comments) {
  return apiRequest(`/surveys/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ comments })
  });
}

export async function getAdminSurveys() {
  return apiRequest("/surveys/admin");
}

export async function updateSurvey(id, formData) {
  return apiRequest(`/surveys/${id}/admin`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });
}

export async function getSurveyById(id) {
  return apiRequest(`/surveys/${id}`);
}
