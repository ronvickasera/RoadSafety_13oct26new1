import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import proj4 from "proj4";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import Header from "../components/Header";
import ImageCapture from "../components/ImageCapture";

import { getCurrentUser } from "../services/authService";
import { submitSurvey } from "../services/surveyService";

import { computeAllRates, rupee } from "../lib/rates";
import { locationGroups } from "../lib/locationData";


// ============================================================
// CRS DEFINITION
// ============================================================

// LocationGroups coordinates are assumed to be EPSG:32644
// WGS 84 / UTM Zone 44N

proj4.defs(
  "EPSG:32644",
  "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs +type=crs"
);


// ============================================================
// COMPONENT
// ============================================================

function SurveyForm() {

  const navigate = useNavigate();


  // ==========================================================
  // MAP REFS
  // ==========================================================

  const mapRef = useRef(null);

  const mapContainerRef = useRef(null);

  const markerRef = useRef(null);

  const locationFeaturesRef = useRef([]);


  // ==========================================================
  // USER / FORM STATES
  // ==========================================================

  const [user, setUser] = useState(null);

  const [image, setImage] = useState(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  // ==========================================================
  // ROAD QUANTITY
  // ==========================================================

  const [length, setLength] = useState("");

  const [width, setWidth] = useState("");

  const [depth, setDepth] = useState("");


  // ==========================================================
  // FORM DATA
  // ==========================================================

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


  // ==========================================================
  // FLATTEN LOCATION GEOJSON
  // ==========================================================

  /*
    locationGroups structure:

    [
      {
        type: "FeatureCollection",
        features: [
          Feature,
          Feature,
          ...
        ]
      }
    ]

  */

  const locationFeatures = useMemo(() => {

    return locationGroups.flatMap(
      (group) => group.features || []
    );

  }, []);


  // Keep latest features available to map click handler
  useEffect(() => {

    locationFeaturesRef.current =
      locationFeatures;

  }, [locationFeatures]);


  // ==========================================================
  // ZONE LIST
  // ==========================================================

  const zones = useMemo(() => {

    return [
      ...new Set(

        locationFeatures

          .map(
            (feature) =>
              feature.properties?.ZONE
          )

          .filter(Boolean)

      )
    ].sort();

  }, [locationFeatures]);


  // ==========================================================
  // CIRCLE LIST
  // ==========================================================

  const availableCircles = useMemo(() => {

    if (!formData.zoneName) {
      return [];
    }

    return [

      ...new Set(

        locationFeatures

          .filter(
            (feature) =>
              feature.properties?.ZONE ===
              formData.zoneName
          )

          .map(
            (feature) =>
              feature.properties?.CIRCLE
          )

          .filter(Boolean)

      )

    ].sort();

  }, [
    locationFeatures,
    formData.zoneName
  ]);


  // ==========================================================
  // WARD LIST
  // ==========================================================

  const availableWards = useMemo(() => {

    if (
      !formData.zoneName ||
      !formData.circleName
    ) {
      return [];
    }

    return [

      ...new Set(

        locationFeatures

          .filter(
            (feature) =>
              feature.properties?.ZONE ===
                formData.zoneName &&

              feature.properties?.CIRCLE ===
                formData.circleName
          )

          .map(
            (feature) =>
              feature.properties?.ward
          )

          .filter(Boolean)

      )

    ].sort();

  }, [
    locationFeatures,
    formData.zoneName,
    formData.circleName
  ]);


  // ==========================================================
  // ROAD TYPES
  // ==========================================================

  const TypeofRoad = [

    "CC(Cement Concrete)",

    "BT(Bituminous)",

    "WBM/Gravel"

  ];


  // ==========================================================
  // ROAD ISSUES
  // ==========================================================

  const TypeofRoadIssue = [

    "Pot Holes",

    "Patch Works"

  ];


  // ==========================================================
  // GET LOCATION FROM LAT/LON
  // ==========================================================

  const findLocationFromCoordinates = (
    latitude,
    longitude
  ) => {

    const features =
      locationFeaturesRef.current;


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return null;

    }


    // --------------------------------------------------------
    // Convert WGS84:
    //
    // [longitude, latitude]
    //
    // to EPSG:32644:
    //
    // [Easting, Northing]
    // --------------------------------------------------------

    let projectedCoordinate;

    try {

      projectedCoordinate = proj4(

        "EPSG:4326",

        "EPSG:32644",

        [
          longitude,
          latitude
        ]

      );

    } catch (error) {

      console.error(
        "Coordinate transformation error:",
        error
      );

      return null;

    }


    const clickedPoint = point(
      projectedCoordinate
    );


    // --------------------------------------------------------
    // CHECK EACH POLYGON
    // --------------------------------------------------------

    for (const feature of features) {

      if (!feature?.geometry) {
        continue;
      }


      const geometryType =
        feature.geometry.type;


      if (
        geometryType !== "Polygon" &&
        geometryType !== "MultiPolygon"
      ) {

        continue;

      }


      try {

        const isInside =
          booleanPointInPolygon(
            clickedPoint,
            feature
          );


        if (isInside) {

          const properties =
            feature.properties || {};


          return {

            zone:
              properties.ZONE || "",

            circle:
              properties.CIRCLE || "",

            ward:
              properties.ward || "",

            feature

          };

        }

      } catch (error) {

        console.error(
          "Point-in-polygon error:",
          error
        );

      }

    }


    return null;

  };


  // ==========================================================
  // APPLY LOCATION TO FORM
  // ==========================================================

  const applyMapLocation = (
    latitude,
    longitude
  ) => {

    const location =
      findLocationFromCoordinates(
        latitude,
        longitude
      );


    if (location) {

      console.log(
        "Location identified:",
        location
      );


      setFormData((prev) => ({

        ...prev,

        latitude:
          latitude.toFixed(6),

        longitude:
          longitude.toFixed(6),

        zoneName:
          location.zone,

        circleName:
          location.circle,

        wardName:
          location.ward

      }));


      setErrorMessage("");

      setMessage(
        `Location identified: ${location.ward}`
      );


      return location;

    }


    // --------------------------------------------------------
    // No polygon found
    // --------------------------------------------------------

    setFormData((prev) => ({

      ...prev,

      latitude:
        latitude.toFixed(6),

      longitude:
        longitude.toFixed(6),

      zoneName: "",

      circleName: "",

      wardName: ""

    }));


    setMessage("");

    setErrorMessage(
      "The selected location is outside the available Zone, Circle and Ward boundaries."
    );


    return null;

  };


  // ==========================================================
  // USER LOGIN CHECK
  // ==========================================================

  useEffect(() => {

    const currentUser =
      getCurrentUser();


    if (!currentUser) {

      navigate("/login");

      return;

    }


    setUser(currentUser);

  }, [navigate]);


  // ==========================================================
  // INITIALIZE MAP
  // ==========================================================

  useEffect(() => {

    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {

      return;

    }


    // --------------------------------------------------------
    // CREATE MAP
    // --------------------------------------------------------

    const map =
      L.map(
        mapContainerRef.current
      ).setView(
        [17.3850, 78.4867],
        11
      );


    // --------------------------------------------------------
    // OPEN STREET MAP
    // --------------------------------------------------------

    L.tileLayer(

      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

      {

        maxZoom: 20,

        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

      }

    ).addTo(map);


    // ========================================================
    // MAP CLICK
    // ========================================================

    map.on("click", (event) => {

      const {
        lat,
        lng
      } = event.latlng;


      console.log(
        "Map clicked:",
        lat,
        lng
      );


      // ------------------------------------------------------
      // MOVE / CREATE MARKER
      // ------------------------------------------------------

      if (markerRef.current) {

        markerRef.current.setLatLng([
          lat,
          lng
        ]);

      } else {

        markerRef.current =
          L.marker([
            lat,
            lng
          ]).addTo(map);

      }


      // ------------------------------------------------------
      // FIND ZONE / CIRCLE / WARD
      // ------------------------------------------------------

      applyMapLocation(
        lat,
        lng
      );

    });


    // Save map reference
    mapRef.current = map;


    // Fix Leaflet rendering issue
    setTimeout(() => {

      map.invalidateSize();

    }, 300);


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      map.remove();

      mapRef.current = null;

      markerRef.current = null;

    };

  }, []);


  // ==========================================================
  // UPDATE MAP WHEN LAT/LON CHANGES
  // ==========================================================

  useEffect(() => {

    const lat =
      parseFloat(
        formData.latitude
      );

    const lng =
      parseFloat(
        formData.longitude
      );


    if (
      !mapRef.current ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {

      return;

    }


    // --------------------------------------------------------
    // Move map
    // --------------------------------------------------------

    mapRef.current.setView(
      [lat, lng],
      17
    );


    // --------------------------------------------------------
    // Move marker
    // --------------------------------------------------------

    if (markerRef.current) {

      markerRef.current.setLatLng([
        lat,
        lng
      ]);

    } else {

      markerRef.current =
        L.marker([
          lat,
          lng
        ]).addTo(
          mapRef.current
        );

    }

  }, [
    formData.latitude,
    formData.longitude
  ]);


  // ==========================================================
  // HANDLE FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;


    // --------------------------------------------------------
    // Zone changed
    // --------------------------------------------------------

    if (name === "zoneName") {

      setFormData((prev) => ({

        ...prev,

        zoneName: value,

        circleName: "",

        wardName: ""

      }));

      return;

    }


    // --------------------------------------------------------
    // Circle changed
    // --------------------------------------------------------

    if (name === "circleName") {

      setFormData((prev) => ({

        ...prev,

        circleName: value,

        wardName: ""

      }));

      return;

    }


    // --------------------------------------------------------
    // Normal field
    // --------------------------------------------------------

    setFormData((prev) => ({

      ...prev,

      [name]: value

    }));

  };


  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const getCurrentLocation = () => {

    setLocationLoading(true);

    setErrorMessage("");

    setMessage("");


    if (!navigator.geolocation) {

      setErrorMessage(
        "Geolocation is not supported by this browser."
      );

      setLocationLoading(false);

      return;

    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        // ----------------------------------------------------
        // Apply current location
        // This also identifies Zone/Circle/Ward
        // ----------------------------------------------------

        applyMapLocation(
          latitude,
          longitude
        );


        setLocationLoading(false);

      },


      (error) => {

        let errorText =
          "Unable to get current location.";


        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {

          errorText =
            "Location permission was denied. Please allow location access.";

        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {

          errorText =
            "Current location is unavailable.";

        } else if (
          error.code ===
          error.TIMEOUT
        ) {

          errorText =
            "Location request timed out.";

        }


        setErrorMessage(
          errorText
        );

        setLocationLoading(false);

      },


      {

        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 0

      }

    );

  };


  // ==========================================================
  // RATES
  // ==========================================================

  const rates =
    useMemo(
      () => computeAllRates(),
      []
    );


  const roadType =
    formData.roadName;


  const roadTypeRateKey = {

    "BT(Bituminous)": "BT",

    "CC(Cement Concrete)": "CC",

    "WBM/Gravel": "WBM"

  };


  const rateKey =
    roadTypeRateKey[
      roadType
    ];


  const rate =
    rateKey
      ? rates?.[rateKey]
      : null;


  // ==========================================================
  // VOLUME
  // ==========================================================

  const volume =
    useMemo(() => {

      const l =
        parseFloat(length);

      const w =
        parseFloat(width);

      const d =
        parseFloat(depth);


      if (

        !Number.isFinite(l) ||

        !Number.isFinite(w) ||

        !Number.isFinite(d) ||

        l <= 0 ||

        w <= 0 ||

        d <= 0

      ) {

        return 0;

      }


      return (
        l *
        w *
        (d / 100)
      );

    }, [
      length,
      width,
      depth
    ]);


  // ==========================================================
  // COST
  // ==========================================================

  const cost =
    useMemo(() => {

      return (
        volume *
        (rate?.total || 0)
      );

    }, [
      volume,
      rate
    ]);


  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm = () => {

    if (!formData.zoneName) {

      setErrorMessage(
        "Please select Zone."
      );

      return false;

    }


    if (!formData.circleName) {

      setErrorMessage(
        "Please select Circle."
      );

      return false;

    }


    if (!formData.wardName) {

      setErrorMessage(
        "Please select Ward."
      );

      return false;

    }


    if (!formData.roadName) {

      setErrorMessage(
        "Please select Road Type."
      );

      return false;

    }


    if (!formData.roadIssue) {

      setErrorMessage(
        "Please select Road Issue."
      );

      return false;

    }


    const lat =
      parseFloat(
        formData.latitude
      );

    const lng =
      parseFloat(
        formData.longitude
      );


    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {

      setErrorMessage(
        "Please capture or enter a valid current location."
      );

      return false;

    }


    const l =
      parseFloat(length);

    const w =
      parseFloat(width);

    const d =
      parseFloat(depth);


    if (
      !Number.isFinite(l) ||
      l <= 0
    ) {

      setErrorMessage(
        "Please enter a valid Length."
      );

      return false;

    }


    if (
      !Number.isFinite(w) ||
      w <= 0
    ) {

      setErrorMessage(
        "Please enter a valid Width."
      );

      return false;

    }


    if (
      !Number.isFinite(d) ||
      d <= 0
    ) {

      setErrorMessage(
        "Please enter a valid Depth."
      );

      return false;

    }


    return true;

  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    setMessage("");

    setErrorMessage("");


    if (!validateForm()) {

      return;

    }


    try {

      setSubmitting(true);


      const surveyData = {

        ...formData,

        length:
          Number(length),

        width:
          Number(width),

        depth:
          Number(depth),

        volume:
          Number(
            volume.toFixed(3)
          ),

        roadType:
          rateKey,

        rate:
          Number(
            (
              rate?.total || 0
            ).toFixed(2)
          ),

        estimatedCost:
          Number(
            cost.toFixed(2)
          )

      };


      await submitSurvey(
        surveyData,
        image
      );


      setMessage(
        "Survey submitted successfully."
      );


      // ------------------------------------------------------
      // RESET FORM
      // ------------------------------------------------------

      setFormData({

        zoneName: "",

        circleName: "",

        wardName: "",

        roadName: "",

        roadIssue: "",

        latitude: "",

        longitude: "",

        remarks: ""

      });


      setLength("");

      setWidth("");

      setDepth("");

      setImage(null);


      // ------------------------------------------------------
      // REMOVE MARKER
      // ------------------------------------------------------

      if (
        markerRef.current &&
        mapRef.current
      ) {

        mapRef.current.removeLayer(
          markerRef.current
        );

        markerRef.current = null;

      }

    } catch (error) {

      console.error(
        "Survey submission error:",
        error
      );


      setErrorMessage(

        error?.response?.data?.message ||

        error?.message ||

        "Failed to submit survey."

      );

    } finally {

      setSubmitting(false);

    }

  };


  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {

    setFormData({

      zoneName: "",

      circleName: "",

      wardName: "",

      roadName: "",

      roadIssue: "",

      latitude: "",

      longitude: "",

      remarks: ""

    });


    setLength("");

    setWidth("");

    setDepth("");

    setImage(null);

    setMessage("");

    setErrorMessage("");


    // Remove marker

    if (
      markerRef.current &&
      mapRef.current
    ) {

      mapRef.current.removeLayer(
        markerRef.current
      );

      markerRef.current = null;

    }


    // Reset map

    if (mapRef.current) {

      mapRef.current.setView(
        [17.3850, 78.4867],
        11
      );

    }

  };


  // ==========================================================
  // JSX
  // ==========================================================

  return (

    <>

      <Header />


      <div className="survey-page">

        <div className="survey-container">


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="survey-header">

            <h1>
              Road Works Estimator
            </h1>


            {user && (

              <div className="user-info">

                Surveyor:{" "}

                <strong>

                  {user.name ||

                    user.username ||

                    user.phone ||

                    "User"}

                </strong>

              </div>

            )}

          </div>


          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {message && (

            <div className="success-message">

              {message}


              <button
                type="button"
                onClick={() =>
                  navigate("/surveyor")
                }
              >

                View Surveys

              </button>

            </div>

          )}


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {errorMessage && (

            <div className="error-message">

              {errorMessage}

            </div>

          )}


          <form
            onSubmit={handleSubmit}
          >


            {/* =================================================
                LOCATION DETAILS
            ================================================= */}

            <div className="section">

              <h2>
                Location Details
              </h2>


              <div className="grid3">


                {/* ZONE */}

                <div className="field">

                  <label>
                    Zone
                  </label>


                  <select
                    name="zoneName"
                    value={
                      formData.zoneName
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Zone
                    </option>


                    {zones.map(
                      (zone) => (

                        <option
                          key={zone}
                          value={zone}
                        >

                          {zone}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* CIRCLE */}

                <div className="field">

                  <label>
                    Circle
                  </label>


                  <select
                    name="circleName"
                    value={
                      formData.circleName
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !formData.zoneName
                    }
                    required
                  >

                    <option value="">

                      {formData.zoneName

                        ? "Select Circle"

                        : "Select Zone First"}

                    </option>


                    {availableCircles.map(
                      (circle) => (

                        <option
                          key={circle}
                          value={circle}
                        >

                          {circle}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* WARD */}

                <div className="field">

                  <label>
                    Ward
                  </label>


                  <select
                    name="wardName"
                    value={
                      formData.wardName
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !formData.circleName
                    }
                    required
                  >

                    <option value="">

                      {formData.circleName

                        ? "Select Ward"

                        : "Select Circle First"}

                    </option>


                    {availableWards.map(
                      (ward) => (

                        <option
                          key={ward}
                          value={ward}
                        >

                          {ward}

                        </option>

                      )
                    )}

                  </select>

                </div>


              </div>

            </div>


            {/* =================================================
                SURVEY LOCATION
            ================================================= */}

            <div className="section">

              <h2>
                Survey Location
              </h2>


              <div className="grid3">


                {/* LATITUDE */}

                <div className="field">

                  <label>
                    Latitude
                  </label>


                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={
                      formData.latitude
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Latitude"
                  />

                </div>


                {/* LONGITUDE */}

                <div className="field">

                  <label>
                    Longitude
                  </label>


                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={
                      formData.longitude
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Longitude"
                  />

                </div>


                {/* CURRENT LOCATION */}

                <div className="field">

                  <label>
                    Current Location
                  </label>


                  <button
                    type="button"
                    className="location-button"
                    onClick={
                      getCurrentLocation
                    }
                    disabled={
                      locationLoading
                    }
                  >

                    {locationLoading

                      ? "Getting Location..."

                      : "📍 Get Current Location"}

                  </button>

                </div>


              </div>


              {/* =================================================
                  MAP
              ================================================= */}

              <div
                ref={
                  mapContainerRef
                }
                className="survey-map"
                style={{

                  width: "100%",

                  height: "350px",

                  marginTop: "15px"

                }}
              />

            </div>


            {/* =================================================
                ROAD DETAILS
            ================================================= */}

            <div className="section">

              <h2>
                Road Details
              </h2>


              <div className="grid3">


                {/* ROAD TYPE */}

                <div className="field">

                  <label>
                    Road Type
                  </label>


                  <select
                    name="roadName"
                    value={
                      formData.roadName
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Road Type
                    </option>


                    {TypeofRoad.map(
                      (typeofroad) => (

                        <option
                          key={
                            typeofroad
                          }
                          value={
                            typeofroad
                          }
                        >

                          {typeofroad}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* ROAD ISSUE */}

                <div className="field">

                  <label>
                    Road Issue
                  </label>


                  <select
                    name="roadIssue"
                    value={
                      formData.roadIssue
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Road Issue
                    </option>


                    {TypeofRoadIssue.map(
                      (issue) => (

                        <option
                          key={issue}
                          value={issue}
                        >

                          {issue}

                        </option>

                      )
                    )}

                  </select>

                </div>


              </div>

            </div>


            {/* =================================================
                ROAD QUANTITY
            ================================================= */}

            <div className="section">

              <h2>
                Road Quantity
              </h2>


              <div className="grid3">


                {/* LENGTH */}

                <div className="field">

                  <label>
                    Length (m)
                  </label>


                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={length}
                    onChange={(event) =>
                      setLength(
                        event.target.value
                      )
                    }
                    placeholder="Enter length"
                  />

                </div>


                {/* WIDTH */}

                <div className="field">

                  <label>
                    Width (m)
                  </label>


                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={width}
                    onChange={(event) =>
                      setWidth(
                        event.target.value
                      )
                    }
                    placeholder="Enter width"
                  />

                </div>


                {/* DEPTH */}

                <div className="field">

                  <label>
                    Depth (cm)
                  </label>


                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={depth}
                    onChange={(event) =>
                      setDepth(
                        event.target.value
                      )
                    }
                    placeholder="Enter depth"
                  />

                </div>


              </div>

            </div>


            {/* =================================================
                RATE & COST
            ================================================= */}

            <div className="section">

              <h2>
                Rate & Cost Calculation
              </h2>


              <div className="breakdown">


                <div className="row">

                  <span>
                    Road Type
                  </span>

                  <span className="mono">

                    {roadType ||
                      "Not selected"}

                  </span>

                </div>


                <div className="row">

                  <span>
                    Rate Type
                  </span>

                  <span className="mono">

                    {rateKey ||
                      "Not selected"}

                  </span>

                </div>


                <div className="row">

                  <span>
                    Volume
                  </span>

                  <span className="mono">

                    {volume.toFixed(3)}
                    {" "}m³

                  </span>

                </div>


                <div className="row">

                  <span>
                    Rate
                  </span>

                  <span className="mono">

                    {rate

                      ? `${rupee(
                          rate.total
                        )}/m³`

                      : "₹0/m³"}

                  </span>

                </div>


                <div className="row total">

                  <span>
                    Estimated Cost
                  </span>

                  <span className="mono">

                    {rupee(cost)}

                  </span>

                </div>


              </div>

            </div>


            {/* =================================================
                PHOTO
            ================================================= */}

            <div className="section">

              <h2>
                Photo
              </h2>


              <ImageCapture
                image={image}
                setImage={setImage}
              />

            </div>


            {/* =================================================
                REMARKS
            ================================================= */}

            <div className="section">

              <h2>
                Remarks
              </h2>


              <div className="field">

                <textarea
                  name="remarks"
                  value={
                    formData.remarks
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Enter remarks"
                />

              </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="form-actions">


              <button
                type="button"
                className="reset-button"
                onClick={
                  handleReset
                }
                disabled={
                  submitting
                }
              >

                Reset

              </button>


              <button
                type="submit"
                className="submit-button"
                disabled={
                  submitting
                }
              >

                {submitting

                  ? "Submitting..."

                  : "Submit Estimate"}

              </button>


            </div>


          </form>

        </div>

      </div>

    </>

  );

}


export default SurveyForm;