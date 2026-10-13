import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import Swal from "sweetalert2";

import {
    useNavigate
} from "react-router-dom";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import proj4 from "proj4";

import {
    point
} from "@turf/helpers";

import booleanPointInPolygon
    from "@turf/boolean-point-in-polygon";

import Header
    from "../components/Header";

import ImageCapture
    from "../components/ImageCapture";

import {
    getCurrentUser
} from "../services/authService";

import {
    submitSurvey
} from "../services/surveyService";

import {
    computeBTRoad,
    computeCCRoad,
    rupee,
    BT_ROAD_BOQ,
    CC_ROAD_BOQ
} from "../lib/rates";

import {
    locationGroups
} from "../lib/locationData";


// ============================================================
// CRS
// ============================================================

proj4.defs(
    "EPSG:32644",
    "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs +type=crs"
);


// ============================================================
// COMPONENT
// ============================================================

function SurveyForm() {

    const navigate =
        useNavigate();


    // ==========================================================
    // MAP
    // ==========================================================

    const mapRef =
        useRef(null);

    const mapContainerRef =
        useRef(null);

    const markerRef =
        useRef(null);

    const locationFeaturesRef =
        useRef([]);


    // ==========================================================
    // USER
    // ==========================================================

    const [user, setUser] =
        useState(null);


    const [image, setImage] =
        useState(null);


    const [locationLoading, setLocationLoading] =
        useState(false);


    const [submitting, setSubmitting] =
        useState(false);


    const [message, setMessage] =
        useState("");


    const [errorMessage, setErrorMessage] =
        useState("");


    // ==========================================================
    // ROAD DIMENSIONS
    // ==========================================================

    const [length, setLength] =
        useState("");


    const [width, setWidth] =
        useState("");


    // ==========================================================
    // BT LAYERS
    // ==========================================================

    const [dbmDepth, setDbmDepth] =
        useState("0.05");


    const [sdbcDepth, setSdbcDepth] =
        useState("0.025");


    // ==========================================================
    // CC LAYERS
    // ==========================================================

    const [rockCutDepth, setRockCutDepth] =
        useState("0.06");


    const [earthDepth, setEarthDepth] =
        useState("0.05");


    const [pccDepth, setPccDepth] =
        useState("0.075");


    const [vccDepth, setVccDepth] =
        useState("0.10");


    // ==========================================================
    // FORM DATA
    // ==========================================================

    const [formData, setFormData] =
        useState({

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
    // LOCATION FEATURES
    // ==========================================================

    const locationFeatures =
        useMemo(
            () => {

                return locationGroups.flatMap(
                    group =>
                        group.features || []
                );

            },
            []
        );


    useEffect(
        () => {

            locationFeaturesRef.current =
                locationFeatures;

        },
        [
            locationFeatures
        ]
    );


    // ==========================================================
    // ZONES
    // ==========================================================

    const zones =
        useMemo(
            () => {

                return [
                    ...new Set(

                        locationFeatures

                            .map(
                                feature =>
                                    feature.properties?.ZONE
                            )

                            .filter(Boolean)

                    )
                ].sort();

            },
            [
                locationFeatures
            ]
        );


    // ==========================================================
    // CIRCLES
    // ==========================================================

    const availableCircles =
        useMemo(
            () => {

                if (
                    !formData.zoneName
                ) {

                    return [];

                }


                return [
                    ...new Set(

                        locationFeatures

                            .filter(
                                feature =>
                                    feature.properties?.ZONE ===
                                    formData.zoneName
                            )

                            .map(
                                feature =>
                                    feature.properties?.CIRCLE
                            )

                            .filter(Boolean)

                    )
                ].sort();

            },
            [
                locationFeatures,
                formData.zoneName
            ]
        );


    // ==========================================================
    // WARDS
    // ==========================================================

    const availableWards =
        useMemo(
            () => {

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
                                feature =>

                                    feature.properties?.ZONE ===
                                    formData.zoneName &&

                                    feature.properties?.CIRCLE ===
                                    formData.circleName
                            )

                            .map(
                                feature =>
                                    feature.properties?.ward
                            )

                            .filter(Boolean)

                    )
                ].sort();

            },
            [
                locationFeatures,
                formData.zoneName,
                formData.circleName
            ]
        );


    // ==========================================================
    // ROAD TYPES
    // ==========================================================

    const TypeofRoad = [

        "BT Road",

        "CC Road"

    ];


    // ==========================================================
    // ROAD ISSUE / BOQ ITEMS
    // ==========================================================

    const roadIssuesByType = {

        "BT Road":
            BT_ROAD_BOQ,

        "CC Road":
            CC_ROAD_BOQ

    };


    const availableRoadIssues =
        useMemo(
            () => {

                if (
                    !formData.roadName
                ) {

                    return [];

                }


                return (
                    roadIssuesByType[
                        formData.roadName
                    ] || []
                );

            },
            [
                formData.roadName
            ]
        );


    // ==========================================================
    // ROAD TYPE KEY
    // ==========================================================

    const roadTypeRateKey = {

        "BT Road":
            "BT_ROAD",

        "CC Road":
            "CC_ROAD"

    };


    const rateKey =
        roadTypeRateKey[
            formData.roadName
        ];


    // ==========================================================
    // ROAD TYPE
    // ==========================================================

    const isBTRoad =
        rateKey === "BT_ROAD";


    const isCCRoad =
        rateKey === "CC_ROAD";


    // ==========================================================
    // FIND LOCATION FROM COORDINATES
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


        let projectedCoordinate;


        try {

            projectedCoordinate =
                proj4(

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


        const clickedPoint =
            point(
                projectedCoordinate
            );


        for (
            const feature of features
        ) {

            if (
                !feature?.geometry
            ) {

                continue;

            }


            const geometryType =
                feature.geometry.type;


            if (
                geometryType !==
                    "Polygon" &&

                geometryType !==
                    "MultiPolygon"
            ) {

                continue;

            }


            try {

                const isInside =
                    booleanPointInPolygon(
                        clickedPoint,
                        feature
                    );


                if (
                    isInside
                ) {

                    const properties =
                        feature.properties ||
                        {};


                    return {

                        zone:
                            properties.ZONE ||
                            "",

                        circle:
                            properties.CIRCLE ||
                            "",

                        ward:
                            properties.ward ||
                            "",

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
    // APPLY MAP LOCATION
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


        if (
            location
        ) {

            setFormData(
                prev => ({

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

                })
            );


            setErrorMessage("");


            setMessage(
                `Location identified: ${location.ward}`
            );


            return location;

        }


        setFormData(
            prev => ({

                ...prev,

                latitude:
                    latitude.toFixed(6),

                longitude:
                    longitude.toFixed(6),

                zoneName: "",

                circleName: "",

                wardName: ""

            })
        );


        setMessage("");


        setErrorMessage(
            "The selected location is outside the available Zone, Circle and Ward boundaries."
        );


        return null;

    };


    // ==========================================================
    // USER CHECK
    // ==========================================================

    useEffect(
        () => {

            const currentUser =
                getCurrentUser();


            if (
                !currentUser
            ) {

                navigate(
                    "/login"
                );

                return;

            }


            setUser(
                currentUser
            );

        },
        [
            navigate
        ]
    );


    // ==========================================================
    // INITIALIZE MAP
    // ==========================================================

    useEffect(
        () => {

            if (
                !mapContainerRef.current ||
                mapRef.current
            ) {

                return;

            }


            const map =
                L.map(
                    mapContainerRef.current
                ).setView(
                    [
                        17.3850,
                        78.4867
                    ],
                    11
                );


            L.tileLayer(

                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

                {

                    maxZoom:
                        20,

                    attribution:
                        "&copy; OpenStreetMap contributors"

                }

            ).addTo(
                map
            );


            map.on(
                "click",
                event => {

                    const {
                        lat,
                        lng
                    } =
                        event.latlng;


                    if (
                        markerRef.current
                    ) {

                        markerRef.current.setLatLng(
                            [
                                lat,
                                lng
                            ]
                        );

                    } else {

                        markerRef.current =
                            L.marker(
                                [
                                    lat,
                                    lng
                                ]
                            ).addTo(
                                map
                            );

                    }


                    applyMapLocation(
                        lat,
                        lng
                    );

                }
            );


            mapRef.current =
                map;


            setTimeout(
                () => {

                    map.invalidateSize();

                },
                300
            );


            return () => {

                map.remove();

                mapRef.current =
                    null;

                markerRef.current =
                    null;

            };

        },
        []
    );


    // ==========================================================
    // MAP POSITION
    // ==========================================================

    useEffect(
        () => {

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


            mapRef.current.setView(
                [
                    lat,
                    lng
                ],
                17
            );


            if (
                markerRef.current
            ) {

                markerRef.current.setLatLng(
                    [
                        lat,
                        lng
                    ]
                );

            } else {

                markerRef.current =
                    L.marker(
                        [
                            lat,
                            lng
                        ]
                    ).addTo(
                        mapRef.current
                    );

            }

        },
        [
            formData.latitude,
            formData.longitude
        ]
    );


    // ==========================================================
    // FORM CHANGE
    // ==========================================================

    const handleChange =
        event => {

            const {
                name,
                value
            } =
                event.target;


            // --------------------------------------------------
            // ZONE
            // --------------------------------------------------

            if (
                name === "zoneName"
            ) {

                setFormData(
                    prev => ({

                        ...prev,

                        zoneName:
                            value,

                        circleName:
                            "",

                        wardName:
                            ""

                    })
                );

                return;

            }


            // --------------------------------------------------
            // CIRCLE
            // --------------------------------------------------

            if (
                name === "circleName"
            ) {

                setFormData(
                    prev => ({

                        ...prev,

                        circleName:
                            value,

                        wardName:
                            ""

                    })
                );

                return;

            }


            // --------------------------------------------------
            // ROAD TYPE
            // --------------------------------------------------

            if (
                name === "roadName"
            ) {

                setFormData(
                    prev => ({

                        ...prev,

                        roadName:
                            value,

                        roadIssue:
                            ""

                    })
                );

                // Reset layer values
                setDbmDepth(
                    "0.05"
                );

                setSdbcDepth(
                    "0.025"
                );

                setRockCutDepth(
                    "0.06"
                );

                setEarthDepth(
                    "0.05"
                );

                setPccDepth(
                    "0.075"
                );

                setVccDepth(
                    "0.10"
                );

                return;

            }


            // --------------------------------------------------
            // NORMAL FIELD
            // --------------------------------------------------

            setFormData(
                prev => ({

                    ...prev,

                    [name]:
                        value

                })
            );

        };


    // ==========================================================
    // CURRENT LOCATION
    // ==========================================================

    const getCurrentLocation =
        () => {

            setLocationLoading(
                true
            );

            setErrorMessage("");

            setMessage("");


            if (
                !navigator.geolocation
            ) {

                setErrorMessage(
                    "Geolocation is not supported by this browser."
                );

                setLocationLoading(
                    false
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    applyMapLocation(
                        latitude,
                        longitude
                    );


                    setLocationLoading(
                        false
                    );

                },

                error => {

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

                    setLocationLoading(
                        false
                    );

                },

                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0

                }

            );

        };


    // ==========================================================
    // ROAD CALCULATION
    // ==========================================================

    const roadCalculation =
        useMemo(
            () => {

                const l =
                    Number(
                        length
                    ) || 0;


                const w =
                    Number(
                        width
                    ) || 0;


                if (
                    l <= 0 ||
                    w <= 0 ||
                    !formData.roadIssue
                ) {

                    return null;

                }


                // ==============================================
                // BT ROAD
                // ==============================================

                if (
                    rateKey ===
                    "BT_ROAD"
                ) {

                    return computeBTRoad({

                        length:
                            l,

                        width:
                            w,

                        dbmDepth:
                            Number(
                                dbmDepth
                            ) ||
                            0.05,

                        sdbcDepth:
                            Number(
                                sdbcDepth
                            ) ||
                            0.025,

                        selectedItem:
                            formData.roadIssue

                    });

                }


                // ==============================================
                // CC ROAD
                // ==============================================

                if (
                    rateKey ===
                    "CC_ROAD"
                ) {

                    return computeCCRoad({

                        length:
                            l,

                        width:
                            w,

                        rockCutDepth:
                            Number(
                                rockCutDepth
                            ) ||
                            0.06,

                        rockCutPercentage:
                            0.75,

                        earthDepth:
                            Number(
                                earthDepth
                            ) ||
                            0.05,

                        pccDepth:
                            Number(
                                pccDepth
                            ) ||
                            0.075,

                        vccDepth:
                            Number(
                                vccDepth
                            ) ||
                            0.10,

                        selectedItem:
                            formData.roadIssue

                    });

                }


                return null;

            },
            [

                rateKey,

                formData.roadIssue,

                length,

                width,

                dbmDepth,

                sdbcDepth,

                rockCutDepth,

                earthDepth,

                pccDepth,

                vccDepth

            ]
        );


    // ==========================================================
    // AREA
    // ==========================================================

    const area =
        useMemo(
            () => {

                const l =
                    Number(
                        length
                    ) || 0;


                const w =
                    Number(
                        width
                    ) || 0;


                if (
                    l <= 0 ||
                    w <= 0
                ) {

                    return 0;

                }


                return l * w;

            },
            [
                length,
                width
            ]
        );


    // ==========================================================
    // COST
    // ==========================================================

    const cost =
        roadCalculation?.total ||
        0;


    // ==========================================================
    // SELECTED BOQ ITEM
    // ==========================================================

    const selectedBOQItem =
        useMemo(
            () => {

                if (
                    !formData.roadIssue
                ) {

                    return null;

                }


                const list =
                    roadIssuesByType[
                        formData.roadName
                    ] || [];


                return (
                    list.find(
                        item =>
                            item.code ===
                            formData.roadIssue
                    ) ||
                    null
                );

            },
            [
                formData.roadName,
                formData.roadIssue
            ]
        );


    // ==========================================================
    // VALIDATION
    // ==========================================================

    const validateForm =
        () => {

            setErrorMessage("");


            if (
                !formData.zoneName
            ) {

                setErrorMessage(
                    "Please select Zone."
                );

                return false;

            }


            if (
                !formData.circleName
            ) {

                setErrorMessage(
                    "Please select Circle."
                );

                return false;

            }


            if (
                !formData.wardName
            ) {

                setErrorMessage(
                    "Please select Ward."
                );

                return false;

            }


            if (
                !formData.roadName
            ) {

                setErrorMessage(
                    "Please select Road Type."
                );

                return false;

            }


            if (
                !formData.roadIssue
            ) {

                setErrorMessage(
                    "Please select Road Issue / BOQ Item."
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
                    "Please capture a valid location."
                );

                return false;

            }


            const l =
                Number(
                    length
                );


            const w =
                Number(
                    width
                );


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
                !roadCalculation
            ) {

                setErrorMessage(
                    "Unable to calculate the estimate. Please check the selected Road Issue."
                );

                return false;

            }


            return true;

        };


    // ==========================================================
    // SUBMISSION DEPTH
    // ==========================================================

    // const getSubmissionDepth =
    //     () => {

    //         // BT DBM
    //         if (
    //             formData.roadIssue ===
    //             "BT-02"
    //         ) {

    //             return (
    //                 Number(
    //                     dbmDepth
    //                 ) *
    //                 100
    //             );

    //         }


    //         // BT SDBC
    //         if (
    //             formData.roadIssue ===
    //             "BT-04"
    //         ) {

    //             return (
    //                 Number(
    //                     sdbcDepth
    //                 ) *
    //                 100
    //             );

    //         }


    //         // CC PCC
    //         if (
    //             formData.roadIssue ===
    //             "CC-04"
    //         ) {

    //             return (
    //                 Number(
    //                     pccDepth
    //                 ) *
    //                 100
    //             );

    //         }


    //         // CC VCC
    //         if (
    //             formData.roadIssue ===
    //             "CC-05"
    //         ) {

    //             return (
    //                 Number(
    //                     vccDepth
    //                 ) *
    //                 100
    //             );

    //         }


    //         // Surface items
    //         return 0;

    //     };


    const getSubmissionDepth = () => {

    // ======================================================
    // BT ROAD
    // ======================================================

    if (formData.roadIssue === "BT-01") {

        // Tack coat - no physical layer depth
        // Backend requires positive depth.
        return 0.001;

    }


    if (formData.roadIssue === "BT-02") {

        // DBM 50mm
        return (
            (Number(dbmDepth) || 0.05) *
            100
        );

    }


    if (formData.roadIssue === "BT-03") {

        // Tack coat
        return 0.001;

    }


    if (formData.roadIssue === "BT-04") {

        // SDBC 25mm
        return (
            (Number(sdbcDepth) || 0.025) *
            100
        );

    }


    // ======================================================
    // CC ROAD
    // ======================================================

    if (formData.roadIssue === "CC-01") {

        // Rock cutting
        return (
            (Number(rockCutDepth) || 0.06) *
            100
        );

    }


    if (formData.roadIssue === "CC-02") {

        // Earth excavation
        return (
            (Number(earthDepth) || 0.05) *
            100
        );

    }


    if (formData.roadIssue === "CC-03") {

        // Earth carting is based on excavation quantity.
        return (
            (Number(earthDepth) || 0.05) *
            100
        );

    }


    if (formData.roadIssue === "CC-04") {

        // PCC 75mm
        return (
            (Number(pccDepth) || 0.075) *
            100
        );

    }


    if (formData.roadIssue === "CC-05") {

        // VCC 100mm
        return (
            (Number(vccDepth) || 0.10) *
            100
        );

    }


    return 0.001;

};


    // ==========================================================
    // SUBMISSION ROAD TYPE
    // ==========================================================

    const getSubmissionRoadType =
        () => {

            if (
                rateKey ===
                "BT_ROAD"
            ) {

                return "BT";

            }


            if (
                rateKey ===
                "CC_ROAD"
            ) {

                return "CC";

            }


            return "";

        };


    // ==========================================================
    // SUBMIT
    // ==========================================================

    const handleSubmit =
        async event => {

            event.preventDefault();


            setMessage("");

            setErrorMessage("");


            if (
                !validateForm()
            ) {

                return;

            }


            try {

                setSubmitting(
                    true
                );


                const surveyData = {

                    ...formData,


                    // ------------------------------------------
                    // ROAD DIMENSIONS
                    // ------------------------------------------

                    length:
                        Number(
                            length
                        ),

                    width:
                        Number(
                            width
                        ),


                    // ------------------------------------------
                    // DEPTH
                    // ------------------------------------------

                    depth:
                        Number(
                            getSubmissionDepth()
                        ),


                    // ------------------------------------------
                    // AREA
                    // ------------------------------------------

                    area:
                        Number(
                            area.toFixed(3)
                        ),


                    // ------------------------------------------
                    // ROAD TYPE
                    // ------------------------------------------

                    roadType:
                        getSubmissionRoadType(),


                    // ------------------------------------------
                    // SELECTED BOQ ITEM
                    // ------------------------------------------

                    roadIssueCode:
                        formData.roadIssue,


                    roadIssueDescription:
                        selectedBOQItem?.description ||
                        "",


                    // ------------------------------------------
                    // RATE
                    // ------------------------------------------

                    rate:
                        Number(
                            (
                                selectedBOQItem?.rate ||
                                0
                            ).toFixed(2)
                        ),


                    // ------------------------------------------
                    // ESTIMATED COST
                    // ------------------------------------------

                    estimatedCost:
                        Number(
                            cost.toFixed(2)
                        ),


                    // ------------------------------------------
                    // BOQ
                    // ------------------------------------------

                    boq:
                        roadCalculation?.items ||
                        []

                };


                console.log(
                    "Submitting survey:",
                    surveyData
                );


                await submitSurvey(
                    surveyData,
                    image
                );


                setSubmitting(
                    false
                );


                handleReset();


                const result =
                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Survey Submitted Successfully!",

                        text:
                            "The road work survey has been submitted successfully.",

                        confirmButtonText:
                            "View Surveys",

                        confirmButtonColor:
                            "#3085d6",

                        allowOutsideClick:
                            false,

                        allowEscapeKey:
                            false

                    });


                if (
                    result.isConfirmed
                ) {

                    navigate(
                        "/surveyor"
                    );

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

                setSubmitting(
                    false
                );

            }

        };


    // ==========================================================
    // RESET
    // ==========================================================

    const handleReset =
        () => {

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


            setImage(null);


            setMessage("");

            setErrorMessage("");


            setDbmDepth(
                "0.05"
            );

            setSdbcDepth(
                "0.025"
            );


            setRockCutDepth(
                "0.06"
            );

            setEarthDepth(
                "0.05"
            );

            setPccDepth(
                "0.075"
            );

            setVccDepth(
                "0.10"
            );


            if (
                markerRef.current &&
                mapRef.current
            ) {

                mapRef.current.removeLayer(
                    markerRef.current
                );

                markerRef.current =
                    null;

            }


            if (
                mapRef.current
            ) {

                mapRef.current.setView(

                    [
                        17.3850,
                        78.4867
                    ],

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

                            <div
                                className="user-info"
                            >

                                Surveyor:{" "}

                                <strong>

                                    {
                                        user.name ||
                                        user.username ||
                                        user.phone ||
                                        "User"
                                    }

                                </strong>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {message && (

                        <div
                            className="success-message"
                        >

                            {message}

                        </div>

                    )}


                    {/* =================================================
                        ERROR MESSAGE
                    ================================================= */}

                    {errorMessage && (

                        <div
                            className="error-message"
                        >

                            {errorMessage}

                        </div>

                    )}


                    <form
                        onSubmit={
                            handleSubmit
                        }
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
                                            zone => (

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

                                            {
                                                formData.zoneName
                                                    ? "Select Circle"
                                                    : "Select Zone First"
                                            }

                                        </option>


                                        {availableCircles.map(
                                            circle => (

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

                                            {
                                                formData.circleName
                                                    ? "Select Ward"
                                                    : "Select Circle First"
                                            }

                                        </option>


                                        {availableWards.map(
                                            ward => (

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
                            MAP LOCATION
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

                                        {
                                            locationLoading
                                                ? "Getting Location..."
                                                : "📍 Get Current Location"
                                        }

                                    </button>

                                </div>

                            </div>


                            {/* MAP */}

                            <div
                                ref={
                                    mapContainerRef
                                }
                                className="survey-map"
                                style={{

                                    width:
                                        "100%",

                                    height:
                                        "350px",

                                    marginTop:
                                        "15px"

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
                                            road => (

                                                <option
                                                    key={road}
                                                    value={road}
                                                >
                                                    {road}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {/* ROAD ISSUE */}

                                <div
                                    className="field"
                                    style={{
                                        gridColumn:
                                            "span 2"
                                    }}
                                >

                                    <label>
                                        Road Issue / BOQ Item
                                    </label>


                                    <select
                                        name="roadIssue"
                                        value={
                                            formData.roadIssue
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !formData.roadName
                                        }
                                        required
                                    >

                                        <option value="">

                                            {
                                                formData.roadName
                                                    ? "Select Road Issue / BOQ Item"
                                                    : "Select Road Type First"
                                            }

                                        </option>


                                        {availableRoadIssues.map(
                                            issue => (

                                                <option
                                                    key={
                                                        issue.code
                                                    }
                                                    value={
                                                        issue.code
                                                    }
                                                >

                                                    {issue.code}
                                                    {" - "}
                                                    {issue.shortDescription}

                                                </option>

                                            )
                                        )}

                                    </select>


                                    {/* FULL DESCRIPTION */}

                                    {selectedBOQItem && (

                                        <small
                                            style={{
                                                display:
                                                    "block",

                                                marginTop:
                                                    "8px",

                                                lineHeight:
                                                    "1.5",

                                                color:
                                                    "#555"
                                            }}
                                        >

                                            <strong>
                                                Selected BOQ:
                                            </strong>

                                            {" "}

                                            {
                                                selectedBOQItem.description
                                            }

                                        </small>

                                    )}

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            ROAD DIMENSIONS
                        ================================================= */}

                        <div className="section">

                            <h2>
                                Road Dimensions
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
                                        step="0.01"
                                        value={
                                            length
                                        }
                                        onChange={
                                            e =>
                                                setLength(
                                                    e.target.value
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
                                        step="0.01"
                                        value={
                                            width
                                        }
                                        onChange={
                                            e =>
                                                setWidth(
                                                    e.target.value
                                                )
                                        }
                                        placeholder="Enter width"
                                    />

                                </div>

                            </div>


                            {/* =================================================
                                BT LAYER DETAILS
                            ================================================= */}

                            {isBTRoad && (

                                <div
                                    className="layer-panel"
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >

                                    <h3>
                                        BT Layer Details
                                    </h3>


                                    <div
                                        className="grid3"
                                    >


                                        {/* DBM */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                DBM Thickness (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.005"
                                                value={
                                                    dbmDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setDbmDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />


                                            <small>
                                                Default: 0.050 m
                                                (50 mm)
                                            </small>

                                        </div>


                                        {/* SDBC */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                SDBC Thickness (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.005"
                                                value={
                                                    sdbcDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setSdbcDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />


                                            <small>
                                                Default: 0.025 m
                                                (25 mm)
                                            </small>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                CC LAYER DETAILS
                            ================================================= */}

                            {isCCRoad && (

                                <div
                                    className="layer-panel"
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >

                                    <h3>
                                        CC Layer Details
                                    </h3>


                                    <div
                                        className="grid3"
                                    >


                                        {/* ROCK */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                Rock Cutting Depth (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    rockCutDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setRockCutDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                            <small>
                                                75% of calculated rock quantity is used as per supplied BOQ.
                                            </small>

                                        </div>


                                        {/* EARTH */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                Earth Excavation Depth (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    earthDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setEarthDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </div>


                                        {/* PCC */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                PCC 1:4:8 Thickness (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.005"
                                                value={
                                                    pccDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setPccDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </div>


                                        {/* VCC */}

                                        <div
                                            className="field"
                                        >

                                            <label>
                                                VCC 1:2:4 Thickness (m)
                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                step="0.005"
                                                value={
                                                    vccDepth
                                                }
                                                onChange={
                                                    e =>
                                                        setVccDepth(
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            RATE & COST
                        ================================================= */}

                        <div className="section">

                            <h2>
                                Rate & Cost Calculation
                            </h2>


                            <div className="breakdown">


                                {/* ROAD TYPE */}

                                <div
                                    className="row"
                                >

                                    <span>
                                        Road Type
                                    </span>


                                    <span
                                        className="mono"
                                    >

                                        {
                                            formData.roadName ||
                                            "Not selected"
                                        }

                                    </span>

                                </div>


                                {/* SELECTED ITEM */}

                                <div
                                    className="row"
                                >

                                    <span>
                                        Selected BOQ Item
                                    </span>


                                    <span
                                        className="mono"
                                    >

                                        {
                                            selectedBOQItem
                                                ? `${selectedBOQItem.code} - ${selectedBOQItem.shortDescription}`
                                                : "Not selected"
                                        }

                                    </span>

                                </div>


                                {/* AREA */}

                                {area > 0 && (

                                    <div
                                        className="row"
                                    >

                                        <span>
                                            Road Area
                                        </span>


                                        <span
                                            className="mono"
                                        >

                                            {
                                                area.toFixed(
                                                    2
                                                )
                                            }

                                            {" sqm"}

                                        </span>

                                    </div>

                                )}


                                {/* =================================================
                                    BOQ
                                ================================================= */}

                                {roadCalculation?.items?.length >
                                    0 && (

                                        <>

                                            <div
                                                className="boq-heading"
                                                style={{

                                                    marginTop:
                                                        "15px",

                                                    marginBottom:
                                                        "8px",

                                                    fontWeight:
                                                        "700"

                                                }}
                                            >

                                                BOQ Breakdown

                                            </div>


                                            {roadCalculation.items.map(
                                                item => (

                                                    <div
                                                        className="row"
                                                        key={
                                                            item.code
                                                        }
                                                    >

                                                        <span>

                                                            <strong>
                                                                {item.code}
                                                            </strong>

                                                            {" — "}

                                                            {
                                                                item.description
                                                            }

                                                        </span>


                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                rupee(
                                                                    item.v
                                                                )
                                                            }

                                                        </span>

                                                    </div>

                                                )
                                            )}

                                        </>

                                    )}


                                {/* =================================================
                                    DIRECT COST
                                ================================================= */}

                                {roadCalculation && (

                                    <>

                                        <div
                                            className="row"
                                            style={{
                                                marginTop:
                                                    "10px"
                                            }}
                                        >

                                            <span>
                                                Direct Cost
                                            </span>


                                            <span
                                                className="mono"
                                            >

                                                {
                                                    rupee(
                                                        roadCalculation.direct ||
                                                        0
                                                    )
                                                }

                                            </span>

                                        </div>


                                        {/* VAT */}

                                        <div
                                            className="row"
                                        >

                                            <span>
                                                VAT 5%
                                            </span>


                                            <span
                                                className="mono"
                                            >

                                                {
                                                    rupee(
                                                        roadCalculation.vat ||
                                                        0
                                                    )
                                                }

                                            </span>

                                        </div>


                                        {/* QCC */}

                                        <div
                                            className="row"
                                        >

                                            <span>
                                                QCC
                                            </span>


                                            <span
                                                className="mono"
                                            >

                                                {
                                                    rupee(
                                                        roadCalculation.qcc ||
                                                        0
                                                    )
                                                }

                                            </span>

                                        </div>


                                        {/* L/S */}

                                        <div
                                            className="row"
                                        >

                                            <span>
                                                L/S
                                            </span>


                                            <span
                                                className="mono"
                                            >

                                                {
                                                    rupee(
                                                        roadCalculation.ls ||
                                                        0
                                                    )
                                                }

                                            </span>

                                        </div>


                                        {/* TOTAL */}

                                        <div
                                            className="row total"
                                        >

                                            <span>
                                                Estimated Cost
                                            </span>


                                            <span
                                                className="mono"
                                            >

                                                {
                                                    rupee(
                                                        cost
                                                    )
                                                }

                                            </span>

                                        </div>

                                    </>

                                )}

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
                                image={
                                    image
                                }
                                setImage={
                                    setImage
                                }
                            />

                        </div>


                        {/* =================================================
                            REMARKS
                        ================================================= */}

                        <div className="section">

                            <h2>
                                Remarks
                            </h2>


                            <div
                                className="field"
                            >

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

                        <div
                            className="form-actions"
                        >


                            {/* RESET */}

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


                            {/* SUBMIT */}

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={
                                    submitting
                                }
                            >

                                {
                                    submitting
                                        ? "Submitting..."
                                        : "Submit Estimate"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </>

    );

}


export default SurveyForm;