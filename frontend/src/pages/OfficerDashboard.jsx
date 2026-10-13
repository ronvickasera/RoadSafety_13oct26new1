import React from "react";
import { useEffect, useState } from "react";

import Header from "../components/Header";
import {
  getOfficerSurveys,
  approveSurvey,
  rejectSurvey
} from "../services/surveyService";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function OfficerDashboard() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [comments, setComments] = useState("");

  async function loadSurveys() {
    try {
      const data = await getOfficerSurveys();
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

  async function handleApprove(id) {
    if (!window.confirm("Approve this survey?")) return;

    try {
      await approveSurvey(id);
      alert("Survey approved successfully.");
      loadSurveys();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleReject(id) {
    if (!comments.trim()) {
      alert("Enter rejection comments.");
      return;
    }

    try {
      await rejectSurvey(id, comments);
      alert("Survey rejected.");
      setRejectingId(null);
      setComments("");
      loadSurveys();
    } catch (error) {
      alert(error.message);
    }
  }

  function photoUrl(id) {
    return `${API_URL}/surveys/${id}/photo`;
  }

  return (
    <div>
      <Header />

      <main className="survey-container">
        <div className="page-heading">
          <div>
            <h1>Officer Dashboard</h1>
            <p>Surveys awaiting officer verification.</p>
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
            <h3>No pending surveys.</h3>
          </div>
        )}

        {surveys.map((survey) => (
          <div className="survey-card" key={survey.id}>
            <div className="survey-header">
              <h2>{survey.road_name || "Road Survey"}</h2>
              <span className="status-submitted">
                SUBMITTED
              </span>
            </div>

            <p>
              <strong>Surveyor:</strong>{" "}
              {survey.surveyor_name} ({survey.surveyor_phone})
            </p>

            <p><strong>Zone:</strong> {survey.zone_name}</p>
            <p><strong>Circle:</strong> {survey.circle_name}</p>
            <p><strong>Ward:</strong> {survey.ward_name}</p>

            <div className="issue-box">
              <strong>Road Issue</strong>
              <p>{survey.road_issue}</p>
            </div>

            <p>
              <strong>Location:</strong>{" "}
              {survey.latitude}, {survey.longitude}
            </p>

            <a
              className="map-link"
              href={`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              📍 Open Location
            </a>

            {survey.photo_data && (
              <div className="survey-photo">
                <img
                  src={photoUrl(survey.id)}
                  alt="Road issue"
                />
              </div>
            )}

            {rejectingId === survey.id ? (
              <div className="reject-panel">
                <label>Rejection Comments *</label>

                <textarea
                  rows="4"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Explain what the Surveyor needs to correct."
                />

                <div className="form-actions">
                  <button
                    className="reset-button"
                    onClick={() => {
                      setRejectingId(null);
                      setComments("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => handleReject(survey.id)}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-actions">
                <button
                  className="submit-button"
                  onClick={() => handleApprove(survey.id)}
                >
                  ✓ Approve
                </button>

                <button
                  className="danger-button"
                  onClick={() => {
                    setRejectingId(survey.id);
                    setComments("");
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

export default OfficerDashboard;
