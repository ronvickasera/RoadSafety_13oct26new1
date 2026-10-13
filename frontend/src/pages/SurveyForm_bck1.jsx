import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Header from "../components/Header";
import ImageCapture from "../components/ImageCapture";
import { getCurrentUser } from "../services/authService";
import { submitSurvey } from "../services/surveyService";
import { computeAllRates, rupee } from "../lib/rates";
import { locationGroups } from "../lib/locationData";

function SurveyForm() {
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");

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


  const selectedZone = locationGroups.find(
    (zone) => zone.zone === formData.zoneName
  );

  const availableCircles = selectedZone?.circles || [];

  const selectedCircle = availableCircles.find(
    (circle) => circle.circle === formData.circleName
  );

  const availableWards = selectedCircle?.wards || [];



  // const zones = [
  //   "Uppal",
  //   "Rajendranagar",
  //   "Serilingampally",
  //   "LB Nagar",
  //   "Malkajgiri",
  //   "Shamshabad",
  //   "Qutbullapur",
  //   "Golconda",
  //   "Charminar",
  //   "Kukatpally",
  //   "Secunderabad",
  //   "Khairatabad"
  // ];

  // const circles = [
  //   "Keesara",
  //   "Alwal",
  //   "Bowenpally",
  //   "Moula Ali",
  //   "Malkajgiri",
  //   "Ghatkesar",
  //   "Kapra",
  //   "Nacharam",
  //   "Uppal",
  //   "Boduppal",
  //   "Nagole",
  //   "Saroornagar",
  //   "LB Nagar",
  //   "Hayathnagar",
  //   "Adibatla",
  //   "Badangpet",
  //   "Jalpally",
  //   "Shamshabad",
  //   "Rajendra Nagar",
  //   "Attapur",
  //   "Bahadurpura",
  //   "Falaknuma",
  //   "Chandrayangutta",
  //   "Jangammet",
  //   "Santosh Nagar",
  //   "Yakutpura",
  //   "Malakpet",
  //   "Charminar",
  //   "Moosarambagh",
  //   "Goshamahal",
  //   "Karwan",
  //   "Golconda",
  //   "Mehdipatnam",
  //   "Masab Tank",
  //   "Khairatabad",
  //   "Jubilee Hills",
  //   "Borabanda",
  //   "Yousufguda",
  //   "Ameerpet",
  //   "Kavadiguda",
  //   "Musheerabad",
  //   "Amberpet",
  //   "Tarnaka",
  //   "Mettuguda",
  //   "Narsingi",
  //   "Patancheruvu",
  //   "Ameenpur",
  //   "Miyapur",
  //   "Serilingampally",
  //   "Madhapur",
  //   "Allwyn Colony",
  //   "Kukatpally",
  //   "Moosapet",
  //   "Chintal",
  //   "Jeedimetla",
  //   "Kompally",
  //   "Gajularamaram",
  //   "Nizampet",
  //   "Dundigal",
  //   "Medchal"
  // ];

  // const wards = [
  //   "Keesara",
  //   "Chandrapuri Colony",
  //   "Jawahar Nagar",
  //   "Dammaiguda",
  //   "Yapral",
  //   "Shamirpet",
  //   "Turkapally",
  //   "Macha Bollaram",
  //   "Temple Alwal",
  //   "Venkatapuram",
  //   "Bhudevi Nagar",
  //   "Kanajiguda",
  //   "Monda Market",
  //   "Fateh Nagar",
  //   "Prakash Nagar",
  //   "Old Bowenpally",
  //   "Hasmathpet",
  //   "Balram Nagar",
  //   "Vinayak Nagar",
  //   "Moula Ali",
  //   "Kakatiya Nagar",
  //   "Neredmet",
  //   "East Anandbagh",
  //   "Mirjalguda",
  //   "Goutham Nagar",
  //   "Malkajgiri",
  //   "Nagaram",
  //   "Ghatkesar",
  //   "Edulabad",
  //   "Pocharam",
  //   "Vampuguda",
  //   "Kapra",
  //   "Dr AS Rao Nagar",
  //   "Kushaiguda",
  //   "Cherlapally",
  //   "Shakthi Sai Nagar",
  //   "H.B. Colony",
  //   "Mallapur",
  //   "Nacharam",
  //   "HMT Nagar",
  //   "Chilkanagar",
  //   "Beerappagadda",
  //   "Habsiguda",
  //   "Ramanthapur",
  //   "Venkat Reddy Nagar",
  //   "Uppal",
  //   "Medipally",
  //   "Peerzadiguda",
  //   "Boduppal",
  //   "Chengicherla",
  //   "Nagole",
  //   "Mansoorabad",
  //   "GSI",
  //   "Lecturers Colony",
  //   "Kuntloor",
  //   "Pedda Amberpet",
  //   "Kothapet",
  //   "Chaitanyapuri",
  //   "Gaddiannaram",
  //   "Saroornagar",
  //   "Doctors Colony",
  //   "RK Puram",
  //   "NTR Nagar",
  //   "Lingojiguda",
  //   "Champapet",
  //   "Kharmanghat",
  //   "Bairamalguda",
  //   "Hastinapuram",
  //   "BN Reddy Nagar",
  //   "Vanasthalipuram",
  //   "Chintalkunta",
  //   "High Court Colony",
  //   "Sahebnagar",
  //   "Hayathnagar",
  //   "Thorrur",
  //   "Kongara Kalan",
  //   "Adibatla",
  //   "Turkayamjal",
  //   "Nadargul",
  //   "Prashanthi Hills",
  //   "Jillelaguda",
  //   "Meerpet",
  //   "Badangpet",
  //   "Balapur",
  //   "Shaheen Nagar",
  //   "Pahadi Shareef",
  //   "Jalpally",
  //   "Thukkuguda",
  //   "Mankhal",
  //   "Shamshabad",
  //   "Kothwalguda",
  //   "Rajendra Nagar",
  //   "Bandlaguda Jagir",
  //   "Kismatpur",
  //   "Hydershahkote",
  //   "Attapur",
  //   "Hyderguda",
  //   "Suleman Nagar",
  //   "Shastripuram",
  //   "Katedan",
  //   "Mailardevpally",
  //   "Doodh Bowli",
  //   "Teegal Kunta",
  //   "Chandu Lal Baradari",
  //   "Ramnasthpura",
  //   "Kishanbagh",
  //   "Shah Ali Banda",
  //   "Falaknuma",
  //   "Jahanuma",
  //   "Nawab Saheb Kunta",
  //   "Bandlaguda",
  //   "Noori Nagar",
  //   "Barkas",
  //   "Kanchanbagh",
  //   "Chandrayangutta",
  //   "Riyasat Nagar",
  //   "Lalitha Bagh",
  //   "Jangammet",
  //   "Phool Bagh",
  //   "Quadri Chaman",
  //   "Bhanu Nagar",
  //   "Santosh Nagar",
  //   "IS SADAN",
  //   "Saraswati Nagar",
  //   "Gowlipura",
  //   "Talab Chanchalam",
  //   "Yakutpura",
  //   "Dabeerpura",
  //   "Rein Bazar",
  //   "Madannapet",
  //   "Saidabad",
  //   "Asmangadh",
  //   "Akberbagh",
  //   "Chawani",
  //   "Purani Haveli",
  //   "Pathergatti",
  //   "Hari Bowli",
  //   "Qazipura",
  //   "Ghansi Bazar",
  //   "Purana Pul",
  //   "Moosarambagh",
  //   "Old Malakpet",
  //   "MCH Colony",
  //   "Kala Dera",
  //   "Azampura",
  //   "Dattatreya Nagar",
  //   "Manghalhat",
  //   "Goshamahal",
  //   "Begum Bazar",
  //   "Jambagh",
  //   "Exhibition Grounds",
  //   "Langar Houz",
  //   "Gudimalkapur",
  //   "Karwan",
  //   "Tappachabutra",
  //   "Ziaguda",
  //   "Nizam Colony",
  //   "Nanalnagar",
  //   "Tolichowki",
  //   "Golconda",
  //   "Ibrahimbagh",
  //   "Shaikpet",
  //   "OU Colony",
  //   "Asif Nagar",
  //   "Padmanabha Nagar",
  //   "Mehdipatnam",
  //   "Syed Nagar",
  //   "Vijayanagar Colony",
  //   "Ahmed Nagar",
  //   "Shanti Nagar",
  //   "Mallepally",
  //   "Red Hills",
  //   "Gunfoundry",
  //   "Irrum Manzil",
  //   "Somajiguda",
  //   "Khairatabad",
  //   "Himayathnagar",
  //   "Jubilee Hills",
  //   "Venkateshwara Colony",
  //   "Banjara Hills",
  //   "Film Nagar",
  //   "Krishna Nagar",
  //   "Rahamath Nagar",
  //   "Karmika Nagar",
  //   "Rajeev Nagar",
  //   "Borabanda",
  //   "Erragadda",
  //   "Vengal Rao Nagar",
  //   "Srinagar Colony",
  //   "Yousufguda",
  //   "AG Colony",
  //   "Begumpet",
  //   "Ameerpet",
  //   "SR Nagar",
  //   "BK Guda",
  //   "Sanathnagar",
  //   "Gandhi Nagar",
  //   "Kavadiguda",
  //   "Bakaram",
  //   "Bholakpur",
  //   "Padmarao Nagar",
  //   "Bansilalpet",
  //   "Ramgopalpet",
  //   "Adikmet",
  //   "Bagh Lingampally",
  //   "Musheerabad",
  //   "Ramnagar",
  //   "Bapuji Nagar",
  //   "BARKATPURA",
  //   "Kachiguda",
  //   "Golnaka",
  //   "Patel Nagar",
  //   "Amberpet",
  //   "Bagh Amberpet",
  //   "Tilak Nagar",
  //   "Nallakunta",
  //   "Boudha Nagar",
  //   "Tarnaka",
  //   "Seethaphalmandi",
  //   "Chilkalguda",
  //   "Mettuguda",
  //   "Lalapet",
  //   "North Lalaguda",
  //   "Addagutta",
  //   "Narsingi",
  //   "Kokapet",
  //   "Gandipet",
  //   "Manikonda",
  //   "Neknampur",
  //   "Tellapur",
  //   "Muthangi",
  //   "Patancheruvu",
  //   "JP Colony",
  //   "Ramachandrapuram (RC Puram)",
  //   "Bharathi Nagar",
  //   "Beeramguda",
  //   "Ameenpur",
  //   "Bollaram",
  //   "Hafeezpet",
  //   "Madeenaguda",
  //   "Chanda Nagar",
  //   "Deepthisri Nagar",
  //   "Miyapur",
  //   "Maktha Mahabubpet",
  //   "Gachibowli",
  //   "Nallagandla",
  //   "Serilingampally",
  //   "Masjid Banda",
  //   "Sri Ram Nagar",
  //   "Kondapur",
  //   "Anjaiah Nagar",
  //   "HITEC City",
  //   "Madhapur",
  //   "Izzath Nagar",
  //   "Matrusri Nagar",
  //   "Mayuri Nagar",
  //   "Hyder Nagar",
  //   "Bhagya Nagar Colony",
  //   "Shamshiguda",
  //   "Allwyn Colony",
  //   "Vivekananda Nagar Colony",
  //   "Venkateshwara Nagar",
  //   "Kukatpally",
  //   "Balaji Nagar",
  //   "Vasanth Nagar",
  //   "KPHB Colony",
  //   "Kaithalapur",
  //   "Gayatri Nagar",
  //   "Allapur",
  //   "Moti Nagar",
  //   "Moosapet",
  //   "Prashanth Nagar",
  //   "Balanagar",
  //   "Rodamestri Nagar",
  //   "Jagathgiri Gutta",
  //   "Ranga Reddy Nagar",
  //   "Chintal",
  //   "Giri Nagar",
  //   "Ganesh Nagar",
  //   "Padma Nagar",
  //   "Quthbullapur",
  //   "Pet Basheerabad",
  //   "Kompally",
  //   "Doolapally",
  //   "Subhash Nagar",
  //   "Saibaba Nagar",
  //   "Mahadevpuram",
  //   "Gajularamaram",
  //   "Shapur Nagar",
  //   "Suraram",
  //   "Nizampet",
  //   "Bachupally",
  //   "Bhandari Layout",
  //   "Pragathi Nagar",
  //   "Bahadurpally",
  //   "Bowrampet",
  //   "Dundigal",
  //   "Medchal",
  //   "Pudur-Kistapur",
  //   "Gundlapochampally"
  // ];


  const TypeofRoad = [
    "CC(Cement Concrete)",
    "BT(Bituminous)",
    "WBM/Gravel"
  ];

  const TypeofRoadIssue = [
    "Pot Holes",
    "Patch Works"
  ];

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView(
      [17.3850, 78.4867],
      11
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(map);

    map.on("click", (event) => {
      const { lat, lng } = event.latlng;

      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
    });

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (
      !mapRef.current ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    mapRef.current.setView([lat, lng], 17);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
  }, [formData.latitude, formData.longitude]);

  // const handleChange = (event) => {
  //   const { name, value } = event.target;

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "zoneName") {
      setFormData((prev) => ({
        ...prev,
        zoneName: value,
        circleName: "",
        wardName: ""
      }));

      return;
    }

    if (name === "circleName") {
      setFormData((prev) => ({
        ...prev,
        circleName: value,
        wardName: ""
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };



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
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));

        setLocationLoading(false);
      },
      (error) => {
        let errorText = "Unable to get current location.";

        if (error.code === error.PERMISSION_DENIED) {
          errorText =
            "Location permission was denied. Please allow location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorText = "Current location is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorText = "Location request timed out.";
        }

        setErrorMessage(errorText);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const rates = useMemo(() => computeAllRates(), []);

  const roadType = formData.roadName;

  const roadTypeRateKey = {
    "BT(Bituminous)": "BT",
    "CC(Cement Concrete)": "CC",
    "WBM/Gravel": "WBM"
  };

  const rateKey = roadTypeRateKey[roadType];

  const rate = rateKey ? rates?.[rateKey] : null;

  const volume = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);

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

    return l * w * (d / 100);
  }, [length, width, depth]);

  const cost = useMemo(() => {
    return volume * (rate?.total || 0);
  }, [volume, rate]);

  const validateForm = () => {
    if (!formData.zoneName) {
      setErrorMessage("Please select Zone.");
      return false;
    }

    if (!formData.circleName) {
      setErrorMessage("Please select Circle.");
      return false;
    }

    if (!formData.wardName) {
      setErrorMessage("Please select Ward.");
      return false;
    }

    if (!formData.roadName) {
      setErrorMessage("Please select Road Type.");
      return false;
    }

    if (!formData.roadIssue) {
      setErrorMessage("Please select Road Issue.");
      return false;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErrorMessage(
        "Please capture or enter a valid current location."
      );
      return false;
    }

    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);

    if (!Number.isFinite(l) || l <= 0) {
      setErrorMessage("Please enter a valid Length.");
      return false;
    }

    if (!Number.isFinite(w) || w <= 0) {
      setErrorMessage("Please enter a valid Width.");
      return false;
    }

    if (!Number.isFinite(d) || d <= 0) {
      setErrorMessage("Please enter a valid Depth.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
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
        length: Number(length),
        width: Number(width),
        depth: Number(depth),
        volume: Number(volume.toFixed(3)),
        roadType: rateKey,
        rate: Number((rate?.total || 0).toFixed(2)),
        estimatedCost: Number(cost.toFixed(2))
      };

      await submitSurvey(surveyData, image);

      setMessage("Survey submitted successfully.");

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

      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    } catch (error) {
      console.error("Survey submission error:", error);

      setErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit survey."
      );
    } finally {
      setSubmitting(false);
    }
  };

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

    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current.setView([17.3850, 78.4867], 11);
    }
  };

  return (
    <>
      <Header />

      <div className="survey-page">
        <div className="survey-container">

          <div className="survey-header">
            <h1>Road Works Estimator</h1>

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

          {message && (
            <div className="success-message">
              {message}

              <button
                onClick={() =>
                  navigate("/surveyor")
                }
              >
                View Surveys
              </button>

            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="section">
              <h2>Location Details</h2>

              <div className="grid3">


                <div className="field">
                  <label>Zone</label>

                  <select
                    name="zoneName"
                    value={formData.zoneName}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Zone</option>

                    {locationGroups.map((zone) => (
                      <option
                        key={zone.zone}
                        value={zone.zone}
                      >
                        {zone.zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Circle</label>

                  <select
                    name="circleName"
                    value={formData.circleName}
                    onChange={handleChange}
                    disabled={!formData.zoneName}
                    required
                  >
                    <option value="">
                      {formData.zoneName
                        ? "Select Circle"
                        : "Select Zone First"}
                    </option>

                    {availableCircles.map((circle) => (
                      <option
                        key={circle.circle}
                        value={circle.circle}
                      >
                        {circle.circle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Ward</label>

                  <select
                    name="wardName"
                    value={formData.wardName}
                    onChange={handleChange}
                    disabled={!formData.circleName}
                    required
                  >
                    <option value="">
                      {formData.circleName
                        ? "Select Ward"
                        : "Select Circle First"}
                    </option>

                    {availableWards.map((ward) => (
                      <option
                        key={ward}
                        value={ward}
                      >
                        {ward}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>




            <div className="section">
              <h2>Survey Location</h2>

              <div className="grid3">

                <div className="field">
                  <label>Latitude</label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                  />
                </div>

                <div className="field">
                  <label>Longitude</label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                  />
                </div>

                <div className="field">
                  <label>Current Location</label>

                  <button
                    type="button"
                    className="location-button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading
                      ? "Getting Location..."
                      : "📍 Get Current Location"}
                  </button>
                </div>

              </div>

              <div
                ref={mapContainerRef}
                className="survey-map"
                style={{
                  width: "100%",
                  height: "350px",
                  marginTop: "15px"
                }}
              />
            </div>

            <div className="section">
              <h2>Road Details</h2>

              <div className="grid3">

                <div className="field">
                  <label>Road Type</label>

                  <select
                    name="roadName"
                    value={formData.roadName}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Road Type
                    </option>

                    {TypeofRoad.map((typeofroad) => (
                      <option
                        key={typeofroad}
                        value={typeofroad}
                      >
                        {typeofroad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Road Issue</label>

                  <select
                    name="roadIssue"
                    value={formData.roadIssue}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Road Issue
                    </option>

                    {TypeofRoadIssue.map((issue) => (
                      <option
                        key={issue}
                        value={issue}
                      >
                        {issue}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            <div className="section">
              <h2>Road Quantity</h2>

              <div className="grid3">

                <div className="field">
                  <label>Length (m)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={length}
                    onChange={(event) =>
                      setLength(event.target.value)
                    }
                    placeholder="Enter length"
                  />
                </div>

                <div className="field">
                  <label>Width (m)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={width}
                    onChange={(event) =>
                      setWidth(event.target.value)
                    }
                    placeholder="Enter width"
                  />
                </div>

                <div className="field">
                  <label>Depth (cm)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={depth}
                    onChange={(event) =>
                      setDepth(event.target.value)
                    }
                    placeholder="Enter depth"
                  />
                </div>

              </div>
            </div>

            <div className="section">
              <h2>Rate & Cost Calculation</h2>

              <div className="breakdown">

                <div className="row">
                  <span>Road Type</span>

                  <span className="mono">
                    {roadType || "Not selected"}
                  </span>
                </div>

                <div className="row">
                  <span>Rate Type</span>

                  <span className="mono">
                    {rateKey || "Not selected"}
                  </span>
                </div>

                <div className="row">
                  <span>Volume</span>

                  <span className="mono">
                    {volume.toFixed(3)} m³
                  </span>
                </div>

                <div className="row">
                  <span>Rate</span>

                  <span className="mono">
                    {rate
                      ? `${rupee(rate.total)}/m³`
                      : "₹0/m³"}
                  </span>
                </div>

                <div className="row total">
                  <span>Estimated Cost</span>

                  <span className="mono">
                    {rupee(cost)}
                  </span>
                </div>

              </div>
            </div>

            <div className="section">
              <h2>Photo</h2>

              <ImageCapture
                image={image}
                setImage={setImage}
              />
            </div>

            <div className="section">
              <h2>Remarks</h2>

              <div className="field">
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter remarks"
                />
              </div>
            </div>

            <div className="form-actions">

              <button
                type="button"
                className="reset-button"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>

              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
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

