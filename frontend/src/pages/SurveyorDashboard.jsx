import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import { getMySurveys } from "../services/surveyService";

function SurveyorDashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSurveys() {
    try {
      const data = await getMySurveys();
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

  function statusClass(status) {
    if (status === "SUBMITTED") return "status-submitted";
    if (status === "OFFICER_APPROVED") return "status-approved";
    if (status === "REJECTED") return "status-rejected";
    return "";
  }

  return (
    <div>
      <Header />

      <main className="survey-container">
        <div className="page-heading">
          <div>
            <h1>Surveyor Dashboard</h1>
            <p>View and manage your road safety surveys.</p>
          </div>

          <button
            className="submit-button"
            onClick={() => navigate("/survey")}
          >
            + New Survey
          </button>
        </div>

        {loading && <p>Loading surveys...</p>}

        {!loading && surveys.length === 0 && (
          <div className="survey-card">
            <h3>No surveys found</h3>
            <button
              className="submit-button"
              onClick={() => navigate("/survey")}
            >
              Create Survey
            </button>
          </div>
        )}

        {/* <div className="survey-list">
          {surveys.map((survey) => (
            
            <div className="survey-card" key={survey.id}>
              <div className="survey-header">
                <h3>{survey.road_name || "Road Survey"}</h3>
                <span className={statusClass(survey.status)}>
                  {survey.status}
                </span>
              </div>

              <p><strong>Zone:</strong> {survey.zone_name}</p>
              <p><strong>Circle:</strong> {survey.circle_name}</p>
              <p><strong>Ward:</strong> {survey.ward_name}</p>
              <p><strong>Issue:</strong> {survey.road_issue}</p>
              <p>
                <strong>Location:</strong>{" "}
                {survey.latitude}, {survey.longitude}
              </p>

              {survey.status === "REJECTED" && (
                <div className="rejection-box">
                  <h4>Officer Rejection Comments</h4>
                  <p>{survey.officer_comments}</p>

                  <button
                    className="submit-button"
                    onClick={() =>
                      navigate(`/survey/edit/${survey.id}`)
                    }
                  >
                    Correct & Resubmit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div> */}


        {/* <div className="survey-list">
          {surveys.map((survey) => {
            console.log("FULL SURVEY:", survey);

            return (
              <div className="survey-card" key={survey.id}>

                <div className="survey-header">
                  <h3>{survey.road_name || "Road Survey"}</h3>

                  <span className={statusClass(survey.status)}>
                    {survey.status}
                  </span>
                </div>

                <p>
                  <strong>Zone:</strong> {survey.zone_name || "N/A"}
                </p>

                <p>
                  <strong>Circle:</strong> {survey.circle_name || "N/A"}
                </p>

                <p>
                  <strong>Ward:</strong> {survey.ward_name || "N/A"}
                </p>

                <p>
                  <strong>Road Type:</strong> {survey.road_type || "N/A"}
                </p>

                <p>
                  <strong>Road Issue:</strong> {survey.road_issue || "N/A"}
                </p>

                <p>
                  <strong>Length:</strong> {survey.length ?? "N/A"} m
                </p>

                <p>
                  <strong>Width:</strong> {survey.width ?? "N/A"} m
                </p>

                <p>
                  <strong>Depth:</strong> {survey.depth ?? "N/A"} cm
                </p>

                <p>
                  <strong>Volume:</strong> {survey.volume ?? "N/A"}
                </p>

                <p>
                  <strong>Rate:</strong> ₹{survey.rate ?? "N/A"}
                </p>

                <p>
                  <strong>Estimated Cost:</strong>{" "}
                  ₹{survey.estimated_cost ?? "N/A"}
                </p>

                <p>
                  <strong>Remarks:</strong> {survey.remarks || "N/A"}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {survey.latitude ?? "N/A"}, {survey.longitude ?? "N/A"}
                </p>

                <p>
                  <strong>Survey Date:</strong>{" "}
                  {survey.survey_date
                    ? new Date(survey.survey_date).toLocaleString()
                    : "N/A"}
                </p>

                {survey.status === "REJECTED" && (
                  <div className="rejection-box">
                    <h4>Officer Rejection Comments</h4>

                    <p>
                      {survey.officer_comments || "No comments provided"}
                    </p>

                    <button
                      className="submit-button"
                      onClick={() =>
                        navigate(`/survey/edit/${survey.id}`)
                      }
                    >
                      Correct & Resubmit
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div> */}


        <div className="survey-table-wrapper">

          <div className="survey-table-toolbar">
            <div>
              <h2>Road Safety Surveys</h2>
              <p>
                Survey records submitted by you
              </p>
            </div>

            <div className="survey-count">
              <span>{surveys.length}</span>
              <small>Total Surveys</small>
            </div>
          </div>

          <div className="survey-table-container">
            <table className="survey-table">

              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Road</th>
                  {/* <th>Zone</th>
                  <th>Circle</th> */}
                  <th>Ward</th>
                  <th>Road Type</th>
                  <th>Issue</th>
                  <th>Length (m)</th>
                  <th>Width (m)</th>
                  <th>Depth (cm)</th>
                  <th>Volume</th>
                  <th>Rate</th>
                  <th>Estimated Cost</th>
                  {/* <th>Location</th> */}
                  <th>Survey Date</th>
                  <th>Status</th>
                  {/* <th>Action</th> */}
                </tr>
              </thead>

              <tbody>
                {surveys.length > 0 ? (
                  surveys.map((survey, index) => {

                    console.log("FULL SURVEY:", survey);

                    return (
                      <tr key={survey.id}>

                        {/* S.No */}
                        <td className="serial-column">
                          {index + 1}
                        </td>

                        {/* Road */}
                        <td>
                          <div
                            className="road-name"
                            title={survey.road_name}
                          >
                            {survey.road_name || "N/A"}
                          </div>

                          <div className="survey-id">
                            ID: {survey.id?.slice(0, 8)}...
                          </div>
                        </td>

                        {/* Zone */}
                        {/* <td>
                          {survey.zone_name || "N/A"}
                        </td> */}

                        {/* Circle */}
                        {/* <td>
                          {survey.circle_name || "N/A"}
                        </td> */}

                        {/* Ward */}
                        <td>
                          {survey.ward_name || "N/A"}
                        </td>

                        {/* Road Type */}
                        <td>
                          {survey.road_type || "N/A"}
                        </td>

                        {/* Issue */}
                        <td>
                          <span
                            className="issue-text"
                            title={survey.road_issue}
                          >
                            {survey.road_issue || "N/A"}
                          </span>
                        </td>

                        {/* Length */}
                        <td className="numeric-cell">
                          {survey.length ?? "—"}
                        </td>

                        {/* Width */}
                        <td className="numeric-cell">
                          {survey.width ?? "—"}
                        </td>

                        {/* Depth */}
                        <td className="numeric-cell">
                          {survey.depth ?? "—"}
                        </td>

                        {/* Volume */}
                        <td className="numeric-cell">
                          {survey.volume ?? "—"}
                        </td>

                        {/* Rate */}
                        <td className="currency-cell">
                          {survey.rate != null
                            ? `₹${Number(survey.rate).toLocaleString("en-IN")}`
                            : "—"}
                        </td>

                        {/* Estimated Cost */}
                        <td className="currency-cell cost-cell">
                          {survey.estimated_cost != null
                            ? `₹${Number(
                              survey.estimated_cost
                            ).toLocaleString("en-IN")}`
                            : "—"}
                        </td>

                        {/* Location */}
                        {/* <td>
                          <div className="location-cell">
                            <span>
                              {survey.latitude ?? "—"}
                            </span>

                            <span>
                              {survey.longitude ?? "—"}
                            </span>
                          </div>
                        </td> */}

                        {/* Survey Date */}
                        <td>
                          <div className="date-cell">
                            {survey.survey_date
                              ? new Date(
                                survey.survey_date
                              ).toLocaleDateString("en-IN")
                              : "—"}

                            <small>
                              {survey.survey_date
                                ? new Date(
                                  survey.survey_date
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                                : ""}
                            </small>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`survey-status ${statusClass(
                              survey.status
                            )}`}
                          >
                            <span className="status-dot"></span>
                            {survey.status || "UNKNOWN"}
                          </span>
                        </td>

                        {/* Action */}
                        {/* <td className="action-cell">

                          {survey.status === "REJECTED" ? (
                            <button
                              className="table-action-button"
                              onClick={() =>
                                navigate(
                                  `/survey/edit/${survey.id}`
                                )
                              }
                            >
                              Correct & Resubmit
                            </button>
                          ) : (
                            <button
                              className="table-view-button"
                              onClick={() =>
                                navigate(
                                  `/survey/view/${survey.id}`
                                )
                              }
                            >
                              View
                            </button>
                          )
                          
                          }

                        </td> */}

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="17"
                      className="empty-table-state"
                    >
                      <div className="empty-state-content">
                        <div className="empty-state-icon">
                          📋
                        </div>

                        <h3>No Surveys Found</h3>

                        <p>
                          You haven't submitted any road safety
                          surveys yet.
                        </p>

                        <button
                          className="submit-button"
                          onClick={() =>
                            navigate("/survey")
                          }
                        >
                          + Create New Survey
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>


      </main>
    </div>
  );
}

export default SurveyorDashboard;
