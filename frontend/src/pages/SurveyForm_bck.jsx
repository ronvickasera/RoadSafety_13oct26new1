// import React from "react";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// import Header from "../components/Header";
// import ImageCapture from "../components/ImageCapture";

// import { getCurrentUser } from "../services/authService";
// import { submitSurvey } from "../services/surveyService";

// function SurveyForm() {
//   const navigate = useNavigate();
//   const user = getCurrentUser();

//   const initialFormData = {
//     zoneName: "",
//     circleName: "",
//     wardName: "",
//     roadName: "",
//     roadIssue: "",
//     latitude: "",
//     longitude: "",
//     remarks: ""
//   };

//   const [formData, setFormData] = useState(initialFormData);
//   const [image, setImage] = useState("");
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [message, setMessage] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");

//   function handleChange(event) {
//     const { name, value } = event.target;

//     setFormData((previous) => ({
//       ...previous,
//       [name]: value
//     }));

//     setErrorMessage("");
//   }

//   function getCurrentLocation() {
//     setMessage("");
//     setErrorMessage("");

//     if (!navigator.geolocation) {
//       setErrorMessage("Geolocation is not supported by this browser.");
//       return;
//     }

//     setLocationLoading(true);

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setFormData((previous) => ({
//           ...previous,
//           latitude: position.coords.latitude.toFixed(6),
//           longitude: position.coords.longitude.toFixed(6)
//         }));

//         setLocationLoading(false);
//         setMessage("Current location captured successfully.");
//       },
//       (error) => {
//         console.error(error);

//         const messages = {
//           1: "Location permission was denied. Please allow location access.",
//           2: "Current location is unavailable. Please try again.",
//           3: "Location request timed out. Please try again."
//         };

//         setErrorMessage(
//           messages[error.code] || "Unable to get current location."
//         );

//         setLocationLoading(false);
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 0
//       }
//     );
//   }

//   function validateForm() {
//     if (!user) {
//       setErrorMessage("Please login again.");
//       navigate("/login");
//       return false;
//     }

//     if (user.role !== "SURVEYOR") {
//       setErrorMessage("Only Surveyors can submit surveys.");
//       return false;
//     }

//     if (!formData.zoneName.trim()) {
//       setErrorMessage("Please enter Zone Name.");
//       return false;
//     }

//     if (!formData.circleName.trim()) {
//       setErrorMessage("Please enter Circle Name.");
//       return false;
//     }

//     if (!formData.wardName.trim()) {
//       setErrorMessage("Please enter Ward Name.");
//       return false;
//     }

//     if (!formData.roadIssue.trim()) {
//       setErrorMessage("Please enter the road-related issue.");
//       return false;
//     }

//     if (!formData.latitude || !formData.longitude) {
//       setErrorMessage("Please capture the current location.");
//       return false;
//     }

//     const latitude = Number(formData.latitude);
//     const longitude = Number(formData.longitude);

//     if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
//       setErrorMessage("Invalid latitude.");
//       return false;
//     }

//     if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
//       setErrorMessage("Invalid longitude.");
//       return false;
//     }

//     return true;
//   }

//   async function handleSubmit(event) {
//     event.preventDefault();

//     setMessage("");
//     setErrorMessage("");

//     if (!validateForm()) {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//       return;
//     }

//     try {
//       setSubmitting(true);

//       await submitSurvey(formData, image);

//       setMessage("Survey submitted successfully.");
//       setFormData(initialFormData);
//       setImage("");

//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } catch (error) {
//       console.error(error);
//       setErrorMessage(
//         error.message || "Unable to submit survey."
//       );
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   function handleReset() {
//     if (submitting) return;

//     if (!window.confirm("Are you sure you want to clear this survey?")) {
//       return;
//     }

//     setFormData(initialFormData);
//     setImage("");
//     setMessage("");
//     setErrorMessage("");
//   }

//   if (!user) {
//     return (
//       <div>
//         <Header />
//         <main className="survey-container">
//           <div className="survey-card">
//             <h2>Login Required</h2>
//             <p>Please login as a Surveyor.</p>
//             <button
//               className="submit-button"
//               onClick={() => navigate("/login")}
//             >
//               Login
//             </button>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   if (user.role !== "SURVEYOR") {
//     return (
//       <div>
//         <Header />
//         <main className="survey-container">
//           <div className="survey-card">
//             <h2>Access Denied</h2>
//             <p>Only Surveyors can submit road safety surveys.</p>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <Header />

//       <main className="survey-container">
//         <div className="page-heading">
//           <div>
//             <h1>Road Safety Survey</h1>
//             <p>Enter the road-related issue details</p>
//           </div>

//           <button
//             type="button"
//             className="secondary-button"
//             onClick={() => navigate("/surveyor")}
//           >
//             My Surveys
//           </button>
//         </div>

//         <div className="user-info-card">
//           <strong>Surveyor:</strong> {user.name}
//           <span> | </span>
//           <strong>Phone:</strong> {user.phone}
//         </div>

//         {message && (
//           <div className="success-message">
//             <span>✅ {message}</span>
//             <button onClick={() => navigate("/surveyor")}>
//               View Surveys
//             </button>
//           </div>
//         )}

//         {errorMessage && (
//           <div className="error-message">
//             ❌ {errorMessage}
//           </div>
//         )}

//         <form className="survey-card" onSubmit={handleSubmit}>
//           <section>
//             <h2>1. Administrative Details</h2>

//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Zone Name *</label>
//                 <input
//                   name="zoneName"
//                   value={formData.zoneName}
//                   onChange={handleChange}
//                   placeholder="Enter zone name"
//                   required
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Circle Name *</label>
//                 <input
//                   name="circleName"
//                   value={formData.circleName}
//                   onChange={handleChange}
//                   placeholder="Enter circle name"
//                   required
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Ward Name *</label>
//                 <input
//                   name="wardName"
//                   value={formData.wardName}
//                   onChange={handleChange}
//                   placeholder="Enter ward name"
//                   required
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Road Name</label>
//                 <input
//                   name="roadName"
//                   value={formData.roadName}
//                   onChange={handleChange}
//                   placeholder="Enter road name"
//                 />
//               </div>
//             </div>
//           </section>

//           <section>
//             <h2>2. Road Issue</h2>

//             <div className="form-group">
//               <label>Road Related Issue *</label>
//               <textarea
//                 name="roadIssue"
//                 value={formData.roadIssue}
//                 onChange={handleChange}
//                 placeholder={
//                   "Enter issues as bullet points:\n• Pothole\n• Damaged road surface\n• Missing road sign"
//                 }
//                 rows="7"
//                 required
//               />
//               <small className="help-text">
//                 Enter each issue on a separate line.
//               </small>
//             </div>

//             <div className="bullet-example">
//               <strong>Example:</strong>
//               <ul>
//                 <li>Large pothole near junction</li>
//                 <li>Damaged road surface</li>
//                 <li>Missing traffic sign</li>
//                 <li>Waterlogging observed</li>
//               </ul>
//             </div>
//           </section>

//           <section>
//             <h2>3. Survey Location</h2>

//             <button
//               type="button"
//               className="location-button"
//               onClick={getCurrentLocation}
//               disabled={locationLoading || submitting}
//             >
//               📍{" "}
//               {locationLoading
//                 ? "Getting Location..."
//                 : "Get Current Location"}
//             </button>

//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Latitude</label>
//                 <input
//                   value={formData.latitude}
//                   placeholder="Latitude"
//                   readOnly
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Longitude</label>
//                 <input
//                   value={formData.longitude}
//                   placeholder="Longitude"
//                   readOnly
//                 />
//               </div>
//             </div>

//             {formData.latitude && formData.longitude && (
//               <div className="coordinates">
//                 📌 Location captured:
//                 <strong>
//                   {" "}
//                   {formData.latitude}, {formData.longitude}
//                 </strong>
//               </div>
//             )}
//           </section>

//           <section>
//             <h2>4. Photograph</h2>
//             <p className="help-text">
//               Capture a clear photograph showing the road issue.
//             </p>

//             <ImageCapture
//               image={image}
//               setImage={setImage}
//             />
//           </section>

//           <section>
//             <h2>5. Remarks</h2>

//             <div className="form-group">
//               <label>Additional Remarks</label>
//               <textarea
//                 name="remarks"
//                 value={formData.remarks}
//                 onChange={handleChange}
//                 placeholder="Enter additional remarks"
//                 rows="4"
//               />
//             </div>
//           </section>

//           <div className="form-actions">
//             <button
//               type="button"
//               className="reset-button"
//               onClick={handleReset}
//               disabled={submitting}
//             >
//               Reset
//             </button>

//             <button
//               type="submit"
//               className="submit-button"
//               disabled={submitting}
//             >
//               {submitting ? "Submitting..." : "Submit Survey"}
//             </button>
//           </div>
//         </form>
//       </main>
//     </div>
//   );
// }

// export default SurveyForm;



// Laltitude , Longitude editable also can get current latitude longitude

import React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Header from "../components/Header";
import ImageCapture from "../components/ImageCapture";

import { getCurrentUser } from "../services/authService";
import { submitSurvey } from "../services/surveyService";

import { computeAllRates, rupee } from "../lib/rates.js";




const zones = [
  "Uppal",
  "Rajendranagar",
  "Serilingampally",
  "LB Nagar",
  "Malkajgiri",
  "Shamshabad",
  "Qutbullapur",
  "Golconda",
  "Charminar",
  "Kukatpally",
  "Secunderabad",
  "Khairatabad"
];

const circles = [
  "Keesara",
  "Alwal",
  "Bowenpally",
  "Moula Ali",
  "Malkajgiri",
  "Ghatkesar",
  "Kapra",
  "Nacharam",
  "Uppal",
  "Boduppal",
  "Nagole",
  "Saroornagar",
  "LB Nagar",
  "Hayathnagar",
  "Adibatla",
  "Badangpet",
  "Jalpally",
  "Shamshabad",
  "Rajendra Nagar",
  "Attapur",
  "Bahadurpura",
  "Falaknuma",
  "Chandrayangutta",
  "Jangammet",
  "Santosh Nagar",
  "Yakutpura",
  "Malakpet",
  "Charminar",
  "Moosarambagh",
  "Goshamahal",
  "Karwan",
  "Golconda",
  "Mehdipatnam",
  "Masab Tank",
  "Khairatabad",
  "Jubilee Hills",
  "Borabanda",
  "Yousufguda",
  "Ameerpet",
  "Kavadiguda",
  "Musheerabad",
  "Amberpet",
  "Tarnaka",
  "Mettuguda",
  "Narsingi",
  "Patancheruvu",
  "Ameenpur",
  "Miyapur",
  "Serilingampally",
  "Madhapur",
  "Allwyn Colony",
  "Kukatpally",
  "Moosapet",
  "Chintal",
  "Jeedimetla",
  "Kompally",
  "Gajularamaram",
  "Nizampet",
  "Dundigal",
  "Medchal"
];

const wards = [
  "Keesara",
  "Chandrapuri Colony",
  "Jawahar Nagar",
  "Dammaiguda",
  "Yapral",
  "Shamirpet",
  "Turkapally",
  "Macha Bollaram",
  "Temple Alwal",
  "Venkatapuram",
  "Bhudevi Nagar",
  "Kanajiguda",
  "Monda Market",
  "Fateh Nagar",
  "Prakash Nagar",
  "Old Bowenpally",
  "Hasmathpet",
  "Balram Nagar",
  "Vinayak Nagar",
  "Moula Ali",
  "Kakatiya Nagar",
  "Neredmet",
  "East Anandbagh",
  "Mirjalguda",
  "Goutham Nagar",
  "Malkajgiri",
  "Nagaram",
  "Ghatkesar",
  "Edulabad",
  "Pocharam",
  "Vampuguda",
  "Kapra",
  "Dr AS Rao Nagar",
  "Kushaiguda",
  "Cherlapally",
  "Shakthi Sai Nagar",
  "H.B. Colony",
  "Mallapur",
  "Nacharam",
  "HMT Nagar",
  "Chilkanagar",
  "Beerappagadda",
  "Habsiguda",
  "Ramanthapur",
  "Venkat Reddy Nagar",
  "Uppal",
  "Medipally",
  "Peerzadiguda",
  "Boduppal",
  "Chengicherla",
  "Nagole",
  "Mansoorabad",
  "GSI",
  "Lecturers Colony",
  "Kuntloor",
  "Pedda Amberpet",
  "Kothapet",
  "Chaitanyapuri",
  "Gaddiannaram",
  "Saroornagar",
  "Doctors Colony",
  "RK Puram",
  "NTR Nagar",
  "Lingojiguda",
  "Champapet",
  "Kharmanghat",
  "Bairamalguda",
  "Hastinapuram",
  "BN Reddy Nagar",
  "Vanasthalipuram",
  "Chintalkunta",
  "High Court Colony",
  "Sahebnagar",
  "Hayathnagar",
  "Thorrur",
  "Kongara Kalan",
  "Adibatla",
  "Turkayamjal",
  "Nadargul",
  "Prashanthi Hills",
  "Jillelaguda",
  "Meerpet",
  "Badangpet",
  "Balapur",
  "Shaheen Nagar",
  "Pahadi Shareef",
  "Jalpally",
  "Thukkuguda",
  "Mankhal",
  "Shamshabad",
  "Kothwalguda",
  "Rajendra Nagar",
  "Bandlaguda Jagir",
  "Kismatpur",
  "Hydershahkote",
  "Attapur",
  "Hyderguda",
  "Suleman Nagar",
  "Shastripuram",
  "Katedan",
  "Mailardevpally",
  "Doodh Bowli",
  "Teegal Kunta",
  "Chandu Lal Baradari",
  "Ramnasthpura",
  "Kishanbagh",
  "Shah Ali Banda",
  "Falaknuma",
  "Jahanuma",
  "Nawab Saheb Kunta",
  "Bandlaguda",
  "Noori Nagar",
  "Barkas",
  "Kanchanbagh",
  "Chandrayangutta",
  "Riyasat Nagar",
  "Lalitha Bagh",
  "Jangammet",
  "Phool Bagh",
  "Quadri Chaman",
  "Bhanu Nagar",
  "Santosh Nagar",
  "IS SADAN",
  "Saraswati Nagar",
  "Gowlipura",
  "Talab Chanchalam",
  "Yakutpura",
  "Dabeerpura",
  "Rein Bazar",
  "Madannapet",
  "Saidabad",
  "Asmangadh",
  "Akberbagh",
  "Chawani",
  "Purani Haveli",
  "Pathergatti",
  "Hari Bowli",
  "Qazipura",
  "Ghansi Bazar",
  "Purana Pul",
  "Moosarambagh",
  "Old Malakpet",
  "MCH Colony",
  "Kala Dera",
  "Azampura",
  "Dattatreya Nagar",
  "Manghalhat",
  "Goshamahal",
  "Begum Bazar",
  "Jambagh",
  "Exhibition Grounds",
  "Langar Houz",
  "Gudimalkapur",
  "Karwan",
  "Tappachabutra",
  "Ziaguda",
  "Nizam Colony",
  "Nanalnagar",
  "Tolichowki",
  "Golconda",
  "Ibrahimbagh",
  "Shaikpet",
  "OU Colony",
  "Asif Nagar",
  "Padmanabha Nagar",
  "Mehdipatnam",
  "Syed Nagar",
  "Vijayanagar Colony",
  "Ahmed Nagar",
  "Shanti Nagar",
  "Mallepally",
  "Red Hills",
  "Gunfoundry",
  "Irrum Manzil",
  "Somajiguda",
  "Khairatabad",
  "Himayathnagar",
  "Jubilee Hills",
  "Venkateshwara Colony",
  "Banjara Hills",
  "Film Nagar",
  "Krishna Nagar",
  "Rahamath Nagar",
  "Karmika Nagar",
  "Rajeev Nagar",
  "Borabanda",
  "Erragadda",
  "Vengal Rao Nagar",
  "Srinagar Colony",
  "Yousufguda",
  "AG Colony",
  "Begumpet",
  "Ameerpet",
  "SR Nagar",
  "BK Guda",
  "Sanathnagar",
  "Gandhi Nagar",
  "Kavadiguda",
  "Bakaram",
  "Bholakpur",
  "Padmarao Nagar",
  "Bansilalpet",
  "Ramgopalpet",
  "Adikmet",
  "Bagh Lingampally",
  "Musheerabad",
  "Ramnagar",
  "Bapuji Nagar",
  "BARKATPURA",
  "Kachiguda",
  "Golnaka",
  "Patel Nagar",
  "Amberpet",
  "Bagh Amberpet",
  "Tilak Nagar",
  "Nallakunta",
  "Boudha Nagar",
  "Tarnaka",
  "Seethaphalmandi",
  "Chilkalguda",
  "Mettuguda",
  "Lalapet",
  "North Lalaguda",
  "Addagutta",
  "Narsingi",
  "Kokapet",
  "Gandipet",
  "Manikonda",
  "Neknampur",
  "Tellapur",
  "Muthangi",
  "Patancheruvu",
  "JP Colony",
  "Ramachandrapuram (RC Puram)",
  "Bharathi Nagar",
  "Beeramguda",
  "Ameenpur",
  "Bollaram",
  "Hafeezpet",
  "Madeenaguda",
  "Chanda Nagar",
  "Deepthisri Nagar",
  "Miyapur",
  "Maktha Mahabubpet",
  "Gachibowli",
  "Nallagandla",
  "Serilingampally",
  "Masjid Banda",
  "Sri Ram Nagar",
  "Kondapur",
  "Anjaiah Nagar",
  "HITEC City",
  "Madhapur",
  "Izzath Nagar",
  "Matrusri Nagar",
  "Mayuri Nagar",
  "Hyder Nagar",
  "Bhagya Nagar Colony",
  "Shamshiguda",
  "Allwyn Colony",
  "Vivekananda Nagar Colony",
  "Venkateshwara Nagar",
  "Kukatpally",
  "Balaji Nagar",
  "Vasanth Nagar",
  "KPHB Colony",
  "Kaithalapur",
  "Gayatri Nagar",
  "Allapur",
  "Moti Nagar",
  "Moosapet",
  "Prashanth Nagar",
  "Balanagar",
  "Rodamestri Nagar",
  "Jagathgiri Gutta",
  "Ranga Reddy Nagar",
  "Chintal",
  "Giri Nagar",
  "Ganesh Nagar",
  "Padma Nagar",
  "Quthbullapur",
  "Pet Basheerabad",
  "Kompally",
  "Doolapally",
  "Subhash Nagar",
  "Saibaba Nagar",
  "Mahadevpuram",
  "Gajularamaram",
  "Shapur Nagar",
  "Suraram",
  "Nizampet",
  "Bachupally",
  "Bhandari Layout",
  "Pragathi Nagar",
  "Bahadurpally",
  "Bowrampet",
  "Dundigal",
  "Medchal",
  "Pudur-Kistapur",
  "Gundlapochampally"
];

const TypeofRoad = [
  "CC(Cement Concrete)",
  "BT(Bituminous)",
  "WBM/Gravel",
];

const TypeofRoadIssue = [
  "Pot Holes",
  "Patch Works",
];


function SurveyForm() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const initialFormData = {
    zoneName: "",
    circleName: "",
    wardName: "",
    roadName: "",
    roadIssue: "",
    latitude: "",
    longitude: "",
    remarks: ""
  };

  const [formData, setFormData] = useState(initialFormData);
  const [image, setImage] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  // const rates = useMemo(() => computeAllRates(assumptions), [assumptions]);

  //  // Length/Width entered in metres, Depth in cm — matches the artifact's
  // // convention (potholes are typically a few metres across but only a few
  // // cm deep). Volume = L(m) x W(m) x D(cm)/100 = cum.
  // const volume = useMemo(() => {
  //   const l = parseFloat(length), w = parseFloat(width), d = parseFloat(depth);
  //   if (!l || !w || !d) return 0;
  //   return l * w * (d / 100);
  // }, [length, width, depth]);

  // const rate = rates[roadType];
  // const cost = volume * (rate ? rate.total : 0);

  // ============================================================
  // ROAD QUANTITY / RATE CALCULATION
  // ============================================================

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");

  // Calculate all rates using default assumptions
  const rates = useMemo(() => computeAllRates(), []);

  // Selected road type
  const roadType = formData.roadName;

  // Map form road type to rates.js key
  const roadRateKey = {
    "BT(Bituminous)": "BT",
    "CC(Cement Concrete)": "CC",
    "WBM/Gravel": "WBM"
  };

  const rateKey = roadRateKey[roadType];

  const rate = rateKey ? rates?.[rateKey] : null;

  // Length = metres
  // Width  = metres
  // Depth  = centimetres
  // Volume = L × W × Depth/100
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

  // Estimated cost
  const cost = volume * (rate?.total || 0);




  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    // Default location: Hyderabad
    const defaultLatitude = 17.385044;
    const defaultLongitude = 78.486671;

    const map = L.map(mapContainerRef.current).setView(
      [defaultLatitude, defaultLongitude],
      11
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }
    ).addTo(map);

    mapRef.current = map;

    // Fix map rendering when container size becomes available
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);


  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setErrorMessage("");
  }

  // ============================================================
  // GET CURRENT GPS LOCATION
  // ============================================================

  function getCurrentLocation() {
    setMessage("");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((previous) => ({
          ...previous,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));

        setLocationLoading(false);

        setMessage(
          "Current location captured successfully."
        );
      },
      (error) => {
        console.error(error);

        const messages = {
          1: "Location permission was denied. Please allow location access.",
          2: "Current location is unavailable. Please try again.",
          3: "Location request timed out. Please try again."
        };

        setErrorMessage(
          messages[error.code] ||
          "Unable to get current location."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }


  //Show location on map

  function showLocationOnMap() {
    setMessage("");
    setErrorMessage("");

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setErrorMessage(
        "Invalid latitude. Latitude must be between -90 and 90."
      );
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setErrorMessage(
        "Invalid longitude. Longitude must be between -180 and 180."
      );
      return;
    }

    updateMapLocation(latitude, longitude);
  }

  //reusable map function

  function updateMapLocation(latitude, longitude) {
    if (!mapRef.current) {
      return;
    }

    const map = mapRef.current;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const marker = L.marker([
      latitude,
      longitude
    ]).addTo(map);

    marker.bindPopup(
      `
      <div>
        <strong>Survey Location</strong><br/>
        Latitude: ${latitude.toFixed(6)}<br/>
        Longitude: ${longitude.toFixed(6)}
      </div>
    `
    ).openPopup();

    markerRef.current = marker;

    map.setView(
      [latitude, longitude],
      16,
      {
        animate: true
      }
    );
  }


  // ============================================================
  // VALIDATE FORM
  // ============================================================

  function validateForm() {
    if (!user) {
      setErrorMessage("Please login again.");
      navigate("/login");
      return false;
    }

    if (user.role !== "SURVEYOR") {
      setErrorMessage(
        "Only Surveyors can submit surveys."
      );
      return false;
    }

    if (!formData.zoneName.trim()) {
      setErrorMessage("Please enter Zone Name.");
      return false;
    }

    if (!formData.circleName.trim()) {
      setErrorMessage("Please enter Circle Name.");
      return false;
    }

    if (!formData.wardName.trim()) {
      setErrorMessage("Please enter Ward Name.");
      return false;
    }

    if (!formData.roadIssue.trim()) {
      setErrorMessage(
        "Please enter the road-related issue."
      );
      return false;
    }

    // ============================================================
    // LATITUDE / LONGITUDE VALIDATION
    // ============================================================

    if (
      formData.latitude === "" ||
      formData.longitude === ""
    ) {
      setErrorMessage(
        "Please enter Latitude and Longitude or use Get Current Location."
      );
      return false;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setErrorMessage(
        "Invalid latitude. Latitude must be between -90 and 90."
      );
      return false;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setErrorMessage(
        "Invalid longitude. Longitude must be between -180 and 180."
      );
      return false;
    }

    return true;
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    try {
      setSubmitting(true);

      await submitSurvey(formData, image);

      setMessage(
        "Survey submitted successfully."
      );

      setFormData(initialFormData);
      setImage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message ||
        "Unable to submit survey."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // RESET
  // ============================================================

  function handleReset() {
    if (submitting) return;

    if (
      !window.confirm(
        "Are you sure you want to clear this survey?"
      )
    ) {
      return;
    }

    setFormData(initialFormData);
    setImage("");
    setMessage("");
    setErrorMessage("");
  }

  // ============================================================
  // LOGIN CHECK
  // ============================================================

  if (!user) {
    return (
      <div>
        <Header />

        <main className="survey-container">
          <div className="survey-card">
            <h2>Login Required</h2>

            <p>
              Please login as a Surveyor.
            </p>

            <button
              className="submit-button"
              onClick={() =>
                navigate("/login")
              }
            >
              Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // ROLE CHECK
  // ============================================================

  if (user.role !== "SURVEYOR") {
    return (
      <div>
        <Header />

        <main className="survey-container">
          <div className="survey-card">
            <h2>Access Denied</h2>

            <p>
              Only Surveyors can submit road safety
              surveys.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // FORM
  // ============================================================

  return (
    <div>
      <Header />

      <main className="survey-container">

        {/* PAGE HEADER */}

        <div className="page-heading">
          <div>
            <h1>Road Safety Survey</h1>

            <p>
              Enter the road-related issue details
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/surveyor")
            }
          >
            My Surveys
          </button>
        </div>

        {/* USER INFORMATION */}

        <div className="user-info-card">
          <strong>Surveyor:</strong>{" "}
          {user.name}

          <span> | </span>

          <strong>Phone:</strong>{" "}
          {user.phone}
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="success-message">
            <span>
              ✅ {message}
            </span>

            <button
              onClick={() =>
                navigate("/surveyor")
              }
            >
              View Surveys
            </button>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div className="error-message">
            ❌ {errorMessage}
          </div>
        )}

        <form
          className="survey-card"
          onSubmit={handleSubmit}
        >

          {/* ================================================= */}
          {/* 1. ADMINISTRATIVE DETAILS */}
          {/* ================================================= */}

          <section>

            <h2>
              1. Administrative Details
            </h2>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Zone Name *
                </label>

                {/* <input
                  name="zoneName"
                  value={formData.zoneName}
                  onChange={handleChange}
                  placeholder="Enter zone name"
                  required
                /> */}

                <select
                  name="zoneName"
                  value={formData.zoneName}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Zone
                  </option>

                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}

                </select>



              </div>

              <div className="form-group">

                <label>
                  Circle Name *
                </label>

                {/* <input
                  name="circleName"
                  value={formData.circleName}
                  onChange={handleChange}
                  placeholder="Enter circle name"
                  required
                /> */}

                <select
                  name="circleName"
                  value={formData.circleName}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Circle
                  </option>

                  {circles.map((circle) => (
                    <option key={circle} value={circle}>
                      {circle}
                    </option>
                  ))}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Ward Name *
                </label>

                {/* <input
                  name="wardName"
                  value={formData.wardName}
                  onChange={handleChange}
                  placeholder="Enter ward name"
                  required
                /> */}

                <select
                  name="wardName"
                  value={formData.wardName}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Ward
                  </option>

                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}

                </select>


              </div>

              <div className="form-group">

                <label>
                  Type of Road
                </label>

                {/* <input
                  name="roadName"
                  value={formData.roadName}
                  onChange={handleChange}
                  placeholder="Enter road name"
                /> */}

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
                    <option key={typeofroad} value={typeofroad}>
                      {typeofroad}
                    </option>
                  ))}

                </select>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* 2.Type of ROAD ISSUE */}
          {/* ================================================= */}

          <section>

            <h2>
              2. Type of Road Issue
            </h2>

            <div className="form-group">

              <label>
                Road Related Issue *
              </label>

              {/* <textarea
                name="roadIssue"
                value={formData.roadIssue}
                onChange={handleChange}
                placeholder={
                  "Enter issues as bullet points:\n• Pothole\n• Damaged road surface\n• Missing road sign"
                }
                rows="7"
                required
              />

              <small className="help-text">
                Enter each issue on a separate line.
              </small> */}

              <select
                name="roadIssue"
                value={formData.roadIssue}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Road Issue
                </option>

                {TypeofRoadIssue.map((roadissue) => (
                  <option key={roadissue} value={roadissue}>
                    {roadissue}
                  </option>
                ))}

              </select>


            </div>

            {/* <div className="bullet-example">

              <strong>
                Example:
              </strong>

              <ul>
                <li>
                  Large pothole near junction
                </li>

                <li>
                  Damaged road surface
                </li>

                <li>
                  Missing traffic sign
                </li>

                <li>
                  Waterlogging observed
                </li>
              </ul>

            </div> */}

          </section>

          {/* ================================================= */}
          {/* 3. SURVEY LOCATION */}
          {/* ================================================= */}

          {/* <section>

            <h2>
              3. Survey Location
            </h2>

            <p className="help-text">
              You can either capture your current
              GPS location or enter the coordinates
              manually.
            </p>

          
            <button
              type="button"
              className="location-button"
              onClick={getCurrentLocation}
              disabled={
                locationLoading ||
                submitting
              }
            >
              📍{" "}

              {locationLoading
                ? "Getting Location..."
                : "Get Current Location"}
            </button>

           

            <div className="form-grid">

             

              <div className="form-group">

                <label>
                  Latitude *
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Example: 17.385044"
                  min="-90"
                  max="90"
                  step="any"
                  required
                />

                <small className="help-text">
                  Range: -90 to 90
                </small>

              </div>

             

              <div className="form-group">

                <label>
                  Longitude *
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Example: 78.486671"
                  min="-180"
                  max="180"
                  step="any"
                  required
                />

                <small className="help-text">
                  Range: -180 to 180
                </small>

              </div>

            </div>

           

            {formData.latitude &&
              formData.longitude && (
                <div className="coordinates">

                  📌 Location:

                  <strong>
                    {" "}
                    {formData.latitude},{" "}
                    {formData.longitude}
                  </strong>

                </div>
              )}

          </section>   */}


          <section>

            <h2>
              3. Survey Location
            </h2>

            <p className="help-text">
              You can either capture your current GPS location
              or enter the coordinates manually.
            </p>

            {/* ================================================= */}
            {/* CURRENT LOCATION BUTTON */}
            {/* ================================================= */}

            <button
              type="button"
              className="location-button"
              onClick={getCurrentLocation}
              disabled={
                locationLoading ||
                submitting
              }
            >
              📍{" "}

              {locationLoading
                ? "Getting Location..."
                : "Get Current Location"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={showLocationOnMap}
              disabled={submitting}
            >
              🗺️ Show on Map
            </button>


            {/* ================================================= */}
            {/* LATITUDE / LONGITUDE */}
            {/* ================================================= */}

            <div className="form-grid">

              {/* LATITUDE */}

              <div className="form-group">

                <label>
                  Latitude *
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Example: 17.385044"
                  min="-90"
                  max="90"
                  step="any"
                  required
                />

                <small className="help-text">
                  Range: -90 to 90
                </small>

              </div>

              {/* LONGITUDE */}

              <div className="form-group">

                <label>
                  Longitude *
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Example: 78.486671"
                  min="-180"
                  max="180"
                  step="any"
                  required
                />

                <small className="help-text">
                  Range: -180 to 180
                </small>

              </div>

            </div>

            {/* ================================================= */}
            {/* COORDINATE DISPLAY */}
            {/* ================================================= */}

            {formData.latitude &&
              formData.longitude && (

                <div className="coordinates">

                  📌 Location:

                  <strong>
                    {" "}
                    {formData.latitude},{" "}
                    {formData.longitude}
                  </strong>

                </div>

              )}

            {/* ================================================= */}
            {/* LEAFLET MAP */}
            {/* ================================================= */}

            <div className="form-group">

              <label>
                Survey Location Map
              </label>

              <div
                ref={mapContainerRef}
                className="survey-location-map"
              />

              <small className="help-text">
                The marker shows the latitude and longitude
                entered above.
              </small>

            </div>

          </section>

          {/* ================================================= */}
          {/* 4. PHOTOGRAPH */}
          {/* ================================================= */}

          <section>

            <h2>
              4. Photograph
            </h2>

            <p className="help-text">
              Capture a clear photograph showing
              the road issue.
            </p>

            <ImageCapture
              image={image}
              setImage={setImage}
            />

          </section>

          {/* ================================================= */}
          {/* 5. REMARKS */}
          {/* ================================================= */}

          <section>

            <h2>
              5. Remarks
            </h2>

            <div className="form-group">

              <label>
                Additional Remarks
              </label>

              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter additional remarks"
                rows="4"
              />

            </div>

          </section>

          {/* calculation */}



          <div className="grid3">
            <div className="field">
              <label>Length (m)</label>
              <input type="number" min="0" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} />
            </div>
            <div className="field">
              <label>Width (m)</label>
              <input type="number" min="0" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
            <div className="field">
              <label>Depth (cm)</label>
              <input type="number" min="0" step="0.5" value={depth} onChange={(e) => setDepth(e.target.value)} />
            </div>
          </div>

          <div className="breakdown">
            <div className="row">
              <span>Volume</span>
              <span className="mono">{volume.toFixed(3)} cum</span>
            </div>
            <div className="row">
              <span>Rate ({roadType})</span>
              <span className="mono">{rupee(rate ? rate.total : 0)}/cum</span>
            </div>
            <div className="row total">
              <span>Estimated cost</span>
              <span className="mono">{rupee(cost)}</span>
            </div>
          </div>


          {/* ================================================= */}
          {/* FORM ACTIONS */}
          {/* ================================================= */}

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
                : "Submit Survey"}
            </button>

          </div>


        </form>

      </main>
    </div>
  );
}

export default SurveyForm;
