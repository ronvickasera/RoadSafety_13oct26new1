import React from "react";
import { useEffect, useState } from "react";

import Header from "../components/Header";
import {
  getAdminSurveys,
  updateSurvey
} from "../services/surveyService";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AdminDashboard() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  async function loadSurveys() {
    try {
      const data = await getAdminSurveys();
      setSurveys(data.surveys);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSurveys();
  }, []);

  function startEdit(survey) {
    setEditingId(survey.id);

    setEditData({
      zoneName: survey.zone_name || "",
      circleName: survey.circle_name || "",
      wardName: survey.ward_name || "",
      roadName: survey.road_name || "",
      roadIssue: survey.road_issue || "",
      latitude: survey.latitude || "",
      longitude: survey.longitude || "",
      remarks: survey.remarks || ""
    });
  }

  function handleChange(event) {
    setEditData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  async function saveEdit() {
    try {
      await updateSurvey(editingId, editData);
      alert("Survey updated successfully.");
      setEditingId(null);
      loadSurveys();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div>
      <Header />

      <main className="survey-container">
        <div className="page-heading">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Officer-approved surveys.</p>
          </div>

          <button
            className="secondary-button"
            onClick={loadSurveys}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading surveys...</p>}

        {!loading && surveys.length === 0 && (
          <div className="survey-card">
            <h3>No officer-approved surveys.</h3>
          </div>
        )}

        {surveys.map((survey) => (
          <div className="survey-card" key={survey.id}>
            {editingId === survey.id ? (
              <>
                <h2>Edit Survey</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Zone</label>
                    <input
                      name="zoneName"
                      value={editData.zoneName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Circle</label>
                    <input
                      name="circleName"
                      value={editData.circleName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ward</label>
                    <input
                      name="wardName"
                      value={editData.wardName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Road</label>
                    <input
                      name="roadName"
                      value={editData.roadName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      name="latitude"
                      value={editData.latitude}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      name="longitude"
                      value={editData.longitude}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Road Issue</label>
                  <textarea
                    name="roadIssue"
                    rows="6"
                    value={editData.roadIssue}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    rows="4"
                    value={editData.remarks}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="reset-button"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>

                  <button
                    className="submit-button"
                    onClick={saveEdit}
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="survey-header">
                  <h2>{survey.road_name || "Road Survey"}</h2>
                  <span className="status-approved">
                    OFFICER APPROVED
                  </span>
                </div>

                <p>
                  <strong>Surveyor:</strong>{" "}
                  {survey.surveyor_name}
                </p>

                <p>
                  <strong>Officer:</strong>{" "}
                  {survey.officer_name || "-"}
                </p>

                <p><strong>Zone:</strong> {survey.zone_name}</p>
                <p><strong>Circle:</strong> {survey.circle_name}</p>
                <p><strong>Ward:</strong> {survey.ward_name}</p>
                <p><strong>Issue:</strong> {survey.road_issue}</p>

                <p>
                  <strong>Location:</strong>{" "}
                  {survey.latitude}, {survey.longitude}
                </p>

                {survey.photo_data && (
                  <div className="survey-photo">
                    <img
                      src={`${API_URL}/surveys/${survey.id}/photo`}
                      alt="Road issue"
                    />
                  </div>
                )}

                <button
                  className="submit-button"
                  onClick={() => startEdit(survey)}
                >
                  Edit Survey
                </button>
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

export default AdminDashboard;
