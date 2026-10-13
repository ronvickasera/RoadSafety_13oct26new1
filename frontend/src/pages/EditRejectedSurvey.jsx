import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import ImageCapture from "../components/ImageCapture";

import {
  getSurveyById,
  resubmitSurvey
} from "../services/surveyService";

function EditRejectedSurvey() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    zoneName: "",
    circleName: "",
    wardName: "",
    roadName: "",
    roadIssue: "",
    latitude: "",
    longitude: "",
    remarks: ""
  });

  const [image, setImage] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSurveyById(id);
        const survey = data.survey;

        if (survey.status !== "REJECTED") {
          alert("Only rejected surveys can be edited.");
          navigate("/surveyor");
          return;
        }

        setFormData({
          zoneName: survey.zone_name || "",
          circleName: survey.circle_name || "",
          wardName: survey.ward_name || "",
          roadName: survey.road_name || "",
          roadIssue: survey.road_issue || "",
          latitude: survey.latitude || "",
          longitude: survey.longitude || "",
          remarks: survey.remarks || ""
        });

        setRejectionComments(
          survey.officer_comments || ""
        );
      } catch (error) {
        alert(error.message);
        navigate("/surveyor");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  function handleChange(event) {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.zoneName ||
      !formData.circleName ||
      !formData.wardName ||
      !formData.roadIssue ||
      !formData.latitude ||
      !formData.longitude
    ) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      await resubmitSurvey(
        id,
        formData,
        image
      );

      alert("Survey resubmitted successfully.");
      navigate("/surveyor");
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Header />
        <main className="survey-container">
          <p>Loading rejected survey...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <main className="survey-container">
        <div className="page-heading">
          <div>
            <h1>Correct & Resubmit Survey</h1>
            <p>Survey ID: {id}</p>
          </div>
        </div>

        <div className="rejection-box">
          <h3>Officer Comments</h3>
          <p>{rejectionComments}</p>
        </div>

        <form
          className="survey-card"
          onSubmit={handleSubmit}
        >
          <section>
            <h2>1. Administrative Details</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Zone Name *</label>
                <input
                  name="zoneName"
                  value={formData.zoneName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Circle Name *</label>
                <input
                  name="circleName"
                  value={formData.circleName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Ward Name *</label>
                <input
                  name="wardName"
                  value={formData.wardName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Road Name</label>
                <input
                  name="roadName"
                  value={formData.roadName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section>
            <h2>2. Road Issue</h2>

            <div className="form-group">
              <label>Road Related Issue *</label>
              <textarea
                name="roadIssue"
                value={formData.roadIssue}
                onChange={handleChange}
                rows="7"
              />
            </div>
          </section>

          <section>
            <h2>3. Survey Location</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Latitude *</label>
                <input
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Longitude *</label>
                <input
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section>
            <h2>4. Photograph</h2>

            <ImageCapture
              image={image}
              setImage={setImage}
            />
          </section>

          <section>
            <h2>5. Remarks</h2>

            <div className="form-group">
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="reset-button"
              onClick={() => navigate("/surveyor")}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Resubmitting..."
                : "Resubmit for Approval"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditRejectedSurvey;
