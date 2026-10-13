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
    BT_ROAD_BOQ,
    CC_ROAD_BOQ,
    ROAD_ISSUES,
    computeBOQItem,
    rupee
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

    const navigate = useNavigate();


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


    // ==========================================================
    // IMAGE
    // ==========================================================

    const [image, setImage] =
        useState(null);


    // ==========================================================
    // LOCATION
    // ==========================================================

    const [locationLoading, setLocationLoading] =
        useState(false);


    // ==========================================================
    // SUBMIT
    // ==========================================================

    const [submitting, setSubmitting] =
        useState(false);


    // ==========================================================
    // MESSAGES
    // ==========================================================

    const [message, setMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");


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
    // BOQ CARDS
    // ==========================================================

    const [boqCards, setBoqCards] =
        useState([]);


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
    // AVAILABLE BOQ ITEMS
    // ==========================================================

    const availableBOQItems =
        useMemo(
            () => {

                if (
                    formData.roadName ===
                    "BT Road"
                ) {

                    return BT_ROAD_BOQ;

                }

                if (
                    formData.roadName ===
                    "CC Road"
                ) {

                    return CC_ROAD_BOQ;

                }

                return [];

            },
            [
                formData.roadName
            ]
        );


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
    // UPDATE MAP WHEN MAIN LOCATION CHANGES
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
    // KEEP BOQ LOCATION SYNCHRONIZED WITH MAIN LOCATION
    // ==========================================================

    useEffect(
        () => {

            if (
                !formData.latitude ||
                !formData.longitude
            ) {

                return;

            }


            setBoqCards(
                prev =>

                    prev.map(
                        card => ({

                            ...card,

                            latitude:
                                formData.latitude,

                            longitude:
                                formData.longitude

                        })
                    )

            );

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


                setErrorMessage("");

                return;

            }


            // --------------------------------------------------
            // ROAD ISSUE
            // --------------------------------------------------

            if (
                name === "roadIssue"
            ) {

                setFormData(
                    prev => ({

                        ...prev,

                        roadIssue:
                            value

                    })
                );


                setErrorMessage("");

                return;

            }


            // --------------------------------------------------
            // NORMAL
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
    // CREATE DIMENSION ROW
    // ==========================================================

    const createDimensionRow =
        item => {

            return {

                id:
                    `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`,

                length:
                    "",

                width:
                    "",

                depth:
                    String(
                        item.defaultDepth ||
                        0.001
                    )

            };

        };


    // ==========================================================
    // CREATE BOQ CARD
    // ==========================================================

    const createBOQCard =
        item => {

            return {

                id:
                    `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`,

                boqItem:
                    item,

                latitude:
                    formData.latitude || "",

                longitude:
                    formData.longitude || "",

                dimensions: [

                    createDimensionRow(
                        item
                    )

                ]

            };

        };


    // ==========================================================
    // AUTOMATICALLY LOAD ALL BOQ ITEMS
    // ==========================================================

    useEffect(
        () => {

            if (
                !formData.roadName ||
                !formData.roadIssue ||
                availableBOQItems.length === 0
            ) {

                setBoqCards([]);

                return;

            }


            const newCards =
                availableBOQItems.map(
                    item =>
                        createBOQCard(item)
                );


            setBoqCards(
                newCards
            );

        },
        [
            formData.roadName,
            formData.roadIssue,
            availableBOQItems
        ]
    );


    // ==========================================================
    // UPDATE BOQ CARD
    // ==========================================================

    const updateBOQCard = (
        id,
        field,
        value
    ) => {

        setBoqCards(
            prev =>

                prev.map(
                    card => {

                        if (
                            card.id !== id
                        ) {

                            return card;

                        }


                        return {

                            ...card,

                            [field]:
                                value

                        };

                    }
                )

        );

    };


    // ==========================================================
    // REMOVE BOQ CARD
    // ==========================================================

    const removeBOQCard =
        id => {

            setBoqCards(
                prev =>
                    prev.filter(
                        card =>
                            card.id !== id
                    )
            );

        };


    // ==========================================================
    // ADD DIMENSION ROW
    // ==========================================================

    const addDimensionRow =
        cardId => {

            setBoqCards(
                prev =>

                    prev.map(
                        card => {

                            if (
                                card.id !==
                                cardId
                            ) {

                                return card;

                            }


                            const newDimension =
                                createDimensionRow(
                                    card.boqItem
                                );


                            return {

                                ...card,

                                dimensions: [

                                    ...(card.dimensions || []),

                                    newDimension

                                ]

                            };

                        }
                    )

            );

        };


    // ==========================================================
    // UPDATE DIMENSION ROW
    // ==========================================================

    const updateDimensionRow = (
        cardId,
        dimensionId,
        field,
        value
    ) => {

        setBoqCards(
            prev =>

                prev.map(
                    card => {

                        if (
                            card.id !==
                            cardId
                        ) {

                            return card;

                        }


                        return {

                            ...card,

                            dimensions:

                                (
                                    card.dimensions ||
                                    []
                                ).map(
                                    dimension => {

                                        if (
                                            dimension.id !==
                                            dimensionId
                                        ) {

                                            return dimension;

                                        }


                                        return {

                                            ...dimension,

                                            [field]:
                                                value

                                        };

                                    }
                                )

                        };

                    }
                )

        );

    };


    // ==========================================================
    // DELETE DIMENSION ROW
    // ==========================================================

    const removeDimensionRow = async (
        cardId,
        dimensionId
    ) => {

        const card =
            boqCards.find(
                item =>
                    item.id ===
                    cardId
            );


        if (!card) {

            return;

        }


        const dimensions =
            card.dimensions || [];


        if (
            dimensions.length === 1
        ) {

            await Swal.fire({

                icon:
                    "warning",

                title:
                    "Cannot Delete",

                text:
                    "At least one Road Dimension row is required.",

                confirmButtonText:
                    "OK"

            });

            return;

        }


        setBoqCards(
            prev =>

                prev.map(
                    currentCard => {

                        if (
                            currentCard.id !==
                            cardId
                        ) {

                            return currentCard;

                        }


                        return {

                            ...currentCard,

                            dimensions:

                                (
                                    currentCard.dimensions ||
                                    []
                                ).filter(
                                    dimension =>
                                        dimension.id !==
                                        dimensionId
                                )

                        };

                    }
                )

        );

    };


    // ==========================================================
    // CALCULATED BOQ CARDS
    // ==========================================================

    const calculatedCards =
        useMemo(
            () => {

                return boqCards.map(
                    card => {

                        const dimensions =
                            card.dimensions || [];


                        // --------------------------------------
                        // CALCULATE EACH DIMENSION
                        // --------------------------------------

                        const dimensionCalculations =
                            dimensions.map(
                                dimension => {

                                    const calculation =
                                        computeBOQItem({

                                            roadType:
                                                formData.roadName,

                                            boqItem:
                                                card.boqItem,

                                            length:
                                                dimension.length,

                                            width:
                                                dimension.width,

                                            depth:
                                                dimension.depth

                                        });


                                    return {

                                        ...dimension,

                                        ...calculation

                                    };

                                }
                            );


                        // --------------------------------------
                        // TOTAL LENGTH
                        // --------------------------------------

                        const totalLength =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    (
                                        Number(
                                            row.length
                                        ) || 0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL WIDTH
                        // --------------------------------------

                        const totalWidth =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    (
                                        Number(
                                            row.width
                                        ) || 0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL DEPTH
                        // --------------------------------------

                        const totalDepth =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    (
                                        Number(
                                            row.depth
                                        ) || 0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL AREA
                        // --------------------------------------

                        const totalArea =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.area ||
                                        0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL QUANTITY
                        // --------------------------------------

                        const totalQuantity =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.quantity ||
                                        0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL DIRECT
                        // --------------------------------------

                        const totalDirect =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.direct ||
                                        0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL VAT
                        // --------------------------------------

                        const totalVat =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.vat ||
                                        0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL QCC
                        // --------------------------------------

                        const totalQcc =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.qcc ||
                                        0
                                    ),

                                0
                            );


                        // --------------------------------------
                        // TOTAL COST
                        // --------------------------------------

                        const totalCost =
                            dimensionCalculations.reduce(
                                (
                                    sum,
                                    row
                                ) =>

                                    sum +
                                    Number(
                                        row.total ||
                                        0
                                    ),

                                0
                            );


                        return {

                            ...card,

                            dimensions:
                                dimensionCalculations,

                            length:
                                totalLength,

                            width:
                                totalWidth,

                            depth:
                                totalDepth,

                            area:
                                totalArea,

                            quantity:
                                totalQuantity,

                            direct:
                                totalDirect,

                            vat:
                                totalVat,

                            qcc:
                                totalQcc,

                            total:
                                totalCost

                        };

                    }
                );

            },
            [
                boqCards,
                formData.roadName
            ]
        );


    // ==========================================================
    // TOTAL LENGTH
    // ==========================================================

    const totalLength =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.length || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // TOTAL WIDTH
    // ==========================================================

    const totalWidth =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.width || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // TOTAL DEPTH
    // ==========================================================

    const totalDepth =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.depth || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // TOTAL AREA
    // ==========================================================

    const totalArea =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.area || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // GRAND ESTIMATE
    // ==========================================================

    const estimatedCost =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.total || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // GRAND DIRECT COST
    // ==========================================================

    const grandDirect =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.direct || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // GRAND VAT
    // ==========================================================

    const grandVat =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.vat || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // GRAND QCC
    // ==========================================================

    const grandQcc =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.qcc || 0
                        ),

                    0

                );

            },
            [
                calculatedCards
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
                    "Please select Road Issue."
                );

                return false;

            }


            if (
                calculatedCards.length === 0
            ) {

                setErrorMessage(
                    "No BOQ items are available for the selected Road Type."
                );

                return false;

            }


            const mainLat =
                Number(
                    formData.latitude
                );


            const mainLng =
                Number(
                    formData.longitude
                );


            if (
                !Number.isFinite(mainLat) ||
                !Number.isFinite(mainLng)
            ) {

                setErrorMessage(
                    "Please capture a valid main survey location."
                );

                return false;

            }


            // ==================================================
            // VALIDATE BOQ ITEMS
            // ==================================================

            for (
                let i = 0;
                i < calculatedCards.length;
                i++
            ) {

                const card =
                    calculatedCards[i];


                const lat =
                    Number(
                        card.latitude
                    );


                const lng =
                    Number(
                        card.longitude
                    );


                if (
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lng)
                ) {

                    setErrorMessage(
                        `Please enter valid Latitude and Longitude for BOQ Item #${i + 1}.`
                    );

                    return false;

                }


                const dimensions =
                    card.dimensions || [];


                if (
                    dimensions.length === 0
                ) {

                    setErrorMessage(
                        `Please add at least one Road Dimension for BOQ Item #${i + 1}.`
                    );

                    return false;

                }


                // ==============================================
                // VALIDATE EACH DIMENSION
                // ==============================================

                for (
                    let j = 0;
                    j < dimensions.length;
                    j++
                ) {

                    const dimension =
                        dimensions[j];


                    const length =
                        Number(
                            dimension.length
                        );


                    const width =
                        Number(
                            dimension.width
                        );


                    if (
                        !Number.isFinite(length) ||
                        length <= 0
                    ) {

                        setErrorMessage(
                            `Please enter valid Length in BOQ Item #${i + 1}, Dimension #${j + 1}.`
                        );

                        return false;

                    }


                    if (
                        !Number.isFinite(width) ||
                        width <= 0
                    ) {

                        setErrorMessage(
                            `Please enter valid Width in BOQ Item #${i + 1}, Dimension #${j + 1}.`
                        );

                        return false;

                    }


                    if (
                        card.boqItem?.unit ===
                        "Cum"
                    ) {

                        const depth =
                            Number(
                                dimension.depth
                            );


                        if (
                            !Number.isFinite(depth) ||
                            depth <= 0
                        ) {

                            setErrorMessage(
                                `Please enter valid Depth in BOQ Item #${i + 1}, Dimension #${j + 1}.`
                            );

                            return false;

                        }

                    }

                }


                if (
                    Number(
                        card.total || 0
                    ) <= 0
                ) {

                    setErrorMessage(
                        `Unable to calculate cost for BOQ Item #${i + 1}.`
                    );

                    return false;

                }

            }


            return true;

        };


    // ==========================================================
    // SUBMISSION ROAD TYPE
    // ==========================================================

    const getSubmissionRoadType =
        () => {

            if (
                formData.roadName ===
                "BT Road"
            ) {

                return "BT";

            }


            if (
                formData.roadName ===
                "CC Road"
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


                // ==================================================
                // BUILD BOQ ITEMS
                // ==================================================

                const boqItems =
                    calculatedCards.map(
                        (
                            card,
                            index
                        ) => ({

                            cardNumber:
                                index + 1,

                            id:
                                card.id,


                            // --------------------------------------
                            // BOQ
                            // --------------------------------------

                            code:
                                card.boqItem?.code ||
                                "",

                            shortDescription:
                                card.boqItem?.shortDescription ||
                                "",

                            description:
                                card.boqItem?.description ||
                                "",

                            unit:
                                card.boqItem?.unit ||
                                "",


                            // --------------------------------------
                            // LOCATION
                            // --------------------------------------

                            latitude:
                                Number(
                                    card.latitude
                                ),

                            longitude:
                                Number(
                                    card.longitude
                                ),


                            // --------------------------------------
                            // INDIVIDUAL DIMENSION ROWS
                            // --------------------------------------

                            dimensions:

                                (
                                    card.dimensions ||
                                    []
                                ).map(
                                    (
                                        dimension,
                                        dimensionIndex
                                    ) => ({

                                        dimensionNumber:
                                            dimensionIndex + 1,

                                        length:
                                            Number(
                                                dimension.length ||
                                                0
                                            ),

                                        width:
                                            Number(
                                                dimension.width ||
                                                0
                                            ),

                                        depth:
                                            Number(
                                                dimension.depth ||
                                                0
                                            )

                                    })
                                ),


                            // --------------------------------------
                            // BOQ TOTAL DIMENSIONS
                            // --------------------------------------

                            length:
                                Number(
                                    card.length ||
                                    0
                                ),

                            width:
                                Number(
                                    card.width ||
                                    0
                                ),

                            depth:
                                Number(
                                    card.depth ||
                                    0
                                ),


                            // --------------------------------------
                            // CALCULATION
                            // --------------------------------------

                            area:
                                Number(
                                    card.area ||
                                    0
                                ),

                            quantity:
                                Number(
                                    card.quantity ||
                                    0
                                ),

                            rate:
                                Number(
                                    card.rate ||
                                    0
                                ),

                            direct:
                                Number(
                                    card.direct ||
                                    0
                                ),

                            vat:
                                Number(
                                    card.vat ||
                                    0
                                ),

                            qcc:
                                Number(
                                    card.qcc ||
                                    0
                                ),

                            ls:
                                Number(
                                    card.ls ||
                                    0
                                ),

                            total:
                                Number(
                                    card.total ||
                                    0
                                )

                        })
                    );


                // ==================================================
                // TOTAL DIMENSIONS
                // ==================================================

                const totalLengthValue =
                    Number(
                        totalLength.toFixed(3)
                    );


                const totalWidthValue =
                    Number(
                        totalWidth.toFixed(3)
                    );


                const totalDepthValue =
                    Number(
                        totalDepth.toFixed(3)
                    );


                const totalAreaValue =
                    Number(
                        totalArea.toFixed(3)
                    );


                // ==================================================
                // SURVEY DATA
                // ==================================================

                const surveyData = {

                    ...formData,

                    latitude:
                        Number(
                            formData.latitude
                        ),

                    longitude:
                        Number(
                            formData.longitude
                        ),

                    roadType:
                        getSubmissionRoadType(),

                    roadIssue:
                        formData.roadIssue,


                    // ----------------------------------------------
                    // TOTAL DIMENSIONS
                    // ----------------------------------------------

                    length:
                        totalLengthValue,

                    width:
                        totalWidthValue,

                    depth:
                        totalDepthValue,

                    area:
                        totalAreaValue,


                    // ----------------------------------------------
                    // LEGACY BACKEND FIELDS
                    // ----------------------------------------------

                    roadIssueCode:
                        calculatedCards[0]
                            ?.boqItem
                            ?.code ||
                        "",

                    roadIssueDescription:
                        calculatedCards[0]
                            ?.boqItem
                            ?.description ||
                        "",


                    rate:
                        Number(

                            calculatedCards.reduce(
                                (
                                    sum,
                                    card
                                ) =>

                                    sum +
                                    Number(
                                        card.rate ||
                                        0
                                    ),

                                0

                            ).toFixed(2)

                        ),


                    // ----------------------------------------------
                    // BOQ
                    // ----------------------------------------------

                    boqItemCount:
                        boqItems.length,

                    boqItems,


                    // ----------------------------------------------
                    // GRAND COST
                    // ----------------------------------------------

                    directCost:
                        Number(
                            grandDirect.toFixed(2)
                        ),

                    vat:
                        Number(
                            grandVat.toFixed(2)
                        ),

                    qcc:
                        Number(
                            grandQcc.toFixed(2)
                        ),

                    estimatedCost:
                        Number(
                            estimatedCost.toFixed(2)
                        )

                };


                // ==================================================
                // DEBUG
                // ==================================================

                console.log(
                    "======================================"
                );

                console.log(
                    "SUBMITTING ROAD ESTIMATE"
                );

                console.log(
                    "Total BOQ Items:",
                    boqItems.length
                );

                console.log(
                    "Total Dimension Rows:",

                    boqItems.reduce(
                        (
                            sum,
                            item
                        ) =>

                            sum +
                            (
                                item.dimensions?.length ||
                                0
                            ),

                        0
                    )
                );

                console.log(
                    "Total Length:",
                    totalLengthValue
                );

                console.log(
                    "Total Width:",
                    totalWidthValue
                );

                console.log(
                    "Total Depth:",
                    totalDepthValue
                );

                console.log(
                    "Total Area:",
                    totalAreaValue
                );

                console.log(
                    "Grand Estimate:",
                    estimatedCost
                );

                console.log(
                    "Full Payload:",
                    surveyData
                );

                console.log(
                    "======================================"
                );


                // ==================================================
                // API SUBMIT
                // ==================================================

                await submitSurvey(
                    surveyData,
                    image
                );


                // ==================================================
                // SUCCESS
                // ==================================================

                setSubmitting(
                    false
                );


                const result =
                    await Swal.fire({

                        icon:
                            "success",

                        title:
                            "Estimate Submitted Successfully!",

                        html:

                            `<div style="font-size:16px">

                                <p>
                                    Your road work estimate has been
                                    submitted successfully.
                                </p>

                                <p>
                                    <strong>
                                        BOQ Items:
                                    </strong>
                                    ${boqItems.length}
                                </p>

                                <p>
                                    <strong>
                                        Dimension Rows:
                                    </strong>
                                    ${
                                        boqItems.reduce(
                                            (
                                                sum,
                                                item
                                            ) =>

                                                sum +
                                                (
                                                    item.dimensions?.length ||
                                                    0
                                                ),

                                            0
                                        )
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Total Length:
                                    </strong>
                                    ${totalLengthValue} m
                                </p>

                                <p>
                                    <strong>
                                        Total Width:
                                    </strong>
                                    ${totalWidthValue} m
                                </p>

                                <p>
                                    <strong>
                                        Total Depth:
                                    </strong>
                                    ${totalDepthValue} m
                                </p>

                                <p>
                                    <strong>
                                        Estimated Cost:
                                    </strong>
                                    ${rupee(estimatedCost)}
                                </p>

                            </div>`,

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

                    handleReset();

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


            setBoqCards([]);


            setImage(null);


            setMessage("");

            setErrorMessage("");


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
    // RENDER
    // ==========================================================

    return (

        <>

            <Header />


            <div
                className="survey-page"
            >

                <div
                    className="survey-container"
                >


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div
                        className="survey-header"
                    >

                        <h1>
                            Road Works Estimator
                        </h1>


                        {user && (

                            <div
                                className="user-info"
                            >

                                Surveyor:
                                {" "}

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

                        <div
                            className="section"
                        >

                            <h2>
                                Location Details
                            </h2>


                            <div
                                className="grid3"
                            >

                                {/* ZONE */}

                                <div
                                    className="field"
                                >

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

                                <div
                                    className="field"
                                >

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

                                <div
                                    className="field"
                                >

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
                            SURVEY LOCATION
                        ================================================= */}

                        <div
                            className="section"
                        >

                            <h2>
                                Survey Location
                            </h2>


                            <div
                                className="grid3"
                            >

                                {/* LATITUDE */}

                                <div
                                    className="field"
                                >

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

                                <div
                                    className="field"
                                >

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

                                <div
                                    className="field"
                                >

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

                        <div
                            className="section"
                        >

                            <h2>
                                Road Details
                            </h2>


                            <div
                                className="grid3"
                            >

                                {/* ROAD TYPE */}

                                <div
                                    className="field"
                                >

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
                                >

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
                                        disabled={
                                            !formData.roadName
                                        }
                                        required
                                    >

                                        <option value="">

                                            {
                                                formData.roadName
                                                    ? "Select Road Issue"
                                                    : "Select Road Type First"
                                            }

                                        </option>


                                        {ROAD_ISSUES.map(
                                            issue => (

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
                            BOQ WORK ITEMS
                        ================================================= */}

                        {calculatedCards.length > 0 && (

                            <div
                                className="section"
                            >

                                {/* SECTION HEADER */}

                                <div
                                    style={{
                                        display:
                                            "flex",

                                        justifyContent:
                                            "space-between",

                                        alignItems:
                                            "center",

                                        gap:
                                            "12px",

                                        flexWrap:
                                            "wrap",

                                        marginBottom:
                                            "8px"
                                    }}
                                >

                                    <h2
                                        style={{
                                            margin:
                                                "0"
                                        }}
                                    >
                                        BOQ Work Items
                                    </h2>


                                    <span
                                        style={{
                                            padding:
                                                "6px 12px",

                                            borderRadius:
                                                "20px",

                                            background:
                                                "#eff6ff",

                                            color:
                                                "#1d4ed8",

                                            fontSize:
                                                "13px",

                                            fontWeight:
                                                "600"
                                        }}
                                    >

                                        {
                                            calculatedCards.length
                                        }

                                        {" "}

                                        BOQ Items

                                    </span>

                                </div>


                                <p
                                    style={{
                                        marginTop:
                                            "0",

                                        marginBottom:
                                            "20px",

                                        color:
                                            "#64748b",

                                        fontSize:
                                            "14px"
                                    }}
                                >

                                    All applicable BOQ items for the
                                    selected Road Type and Road Issue
                                    are automatically loaded below.
                                    Add one or more Road Dimension
                                    rows for each work item.

                                </p>


                                {/* =================================================
                                    ALL BOQ CARDS
                                ================================================= */}

                                {calculatedCards.map(
                                    (
                                        card,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                card.id
                                            }
                                            style={{

                                                border:
                                                    "1px solid #d1d5db",

                                                borderRadius:
                                                    "10px",

                                                padding:
                                                    "20px",

                                                marginBottom:
                                                    "20px",

                                                background:
                                                    "#ffffff",

                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.06)"

                                            }}
                                        >

                                            {/* CARD HEADER */}

                                            <div
                                                style={{

                                                    display:
                                                        "flex",

                                                    justifyContent:
                                                        "space-between",

                                                    alignItems:
                                                        "center",

                                                    gap:
                                                        "15px",

                                                    marginBottom:
                                                        "18px",

                                                    borderBottom:
                                                        "1px solid #e5e7eb",

                                                    paddingBottom:
                                                        "12px"

                                                }}
                                            >

                                                <div>

                                                    <h3
                                                        style={{
                                                            margin:
                                                                "0 0 8px 0",

                                                            color:
                                                                "#1e293b"
                                                        }}
                                                    >

                                                        BOQ Item #
                                                        {
                                                            index + 1
                                                        }

                                                    </h3>


                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",

                                                            alignItems:
                                                                "center",

                                                            gap:
                                                                "10px",

                                                            flexWrap:
                                                                "wrap"
                                                        }}
                                                    >

                                                        <span
                                                            style={{
                                                                background:
                                                                    "#eff6ff",

                                                                color:
                                                                    "#1d4ed8",

                                                                padding:
                                                                    "4px 9px",

                                                                borderRadius:
                                                                    "5px",

                                                                fontSize:
                                                                    "12px",

                                                                fontWeight:
                                                                    "700"
                                                            }}
                                                        >

                                                            {
                                                                card.boqItem?.code
                                                            }

                                                        </span>


                                                        <strong
                                                            style={{
                                                                color:
                                                                    "#334155"
                                                            }}
                                                        >

                                                            {
                                                                card.boqItem?.shortDescription
                                                            }

                                                        </strong>

                                                    </div>

                                                </div>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeBOQCard(
                                                            card.id
                                                        )
                                                    }
                                                    style={{

                                                        background:
                                                            "#dc2626",

                                                        color:
                                                            "#fff",

                                                        border:
                                                            "none",

                                                        borderRadius:
                                                            "6px",

                                                        padding:
                                                            "8px 14px",

                                                        cursor:
                                                            "pointer",

                                                        fontWeight:
                                                            "600",

                                                        flexShrink:
                                                            0

                                                    }}
                                                >

                                                    Remove

                                                </button>

                                            </div>


                                            {/* DESCRIPTION */}

                                            <div
                                                style={{

                                                    background:
                                                        "#f8fafc",

                                                    padding:
                                                        "12px",

                                                    borderRadius:
                                                        "6px",

                                                    marginBottom:
                                                        "18px",

                                                    fontSize:
                                                        "13px",

                                                    lineHeight:
                                                        "1.5",

                                                    color:
                                                        "#475569"

                                                }}
                                            >

                                                {
                                                    card.boqItem?.description
                                                }

                                            </div>


                                            {/* =================================================
                                                ROAD DIMENSIONS
                                            ================================================= */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        "20px"
                                                }}
                                            >

                                                {/* DIMENSION HEADER */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",

                                                        justifyContent:
                                                            "space-between",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            "12px",

                                                        marginBottom:
                                                            "14px",

                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >

                                                    <div>

                                                        <h4
                                                            style={{
                                                                margin:
                                                                    "0 0 4px 0",

                                                                color:
                                                                    "#1e293b",

                                                                fontSize:
                                                                    "16px"
                                                            }}
                                                        >

                                                            Road Dimensions

                                                        </h4>


                                                        <small
                                                            style={{
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >

                                                            Add one or more
                                                            dimension rows
                                                            for this BOQ item.

                                                        </small>

                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addDimensionRow(
                                                                card.id
                                                            )
                                                        }
                                                        style={{
                                                            display:
                                                                "inline-flex",

                                                            alignItems:
                                                                "center",

                                                            gap:
                                                                "6px",

                                                            padding:
                                                                "9px 14px",

                                                            border:
                                                                "1px solid #2563eb",

                                                            borderRadius:
                                                                "7px",

                                                            background:
                                                                "#2563eb",

                                                            color:
                                                                "#ffffff",

                                                            fontWeight:
                                                                "600",

                                                            fontSize:
                                                                "13px",

                                                            cursor:
                                                                "pointer"
                                                        }}
                                                    >

                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "18px",

                                                                lineHeight:
                                                                    "1"
                                                            }}
                                                        >
                                                            +
                                                        </span>

                                                        Add Dimension

                                                    </button>

                                                </div>


                                                {/* =================================================
                                                    DIMENSION ROWS
                                                ================================================= */}

                                                {
                                                    (
                                                        card.dimensions ||
                                                        []
                                                    ).map(
                                                        (
                                                            dimension,
                                                            dimensionIndex
                                                        ) => (

                                                            <div
                                                                key={
                                                                    dimension.id
                                                                }
                                                                style={{
                                                                    border:
                                                                        "1px solid #e2e8f0",

                                                                    borderRadius:
                                                                        "8px",

                                                                    padding:
                                                                        "14px",

                                                                    marginBottom:
                                                                        "12px",

                                                                    background:
                                                                        "#f8fafc"
                                                                }}
                                                            >

                                                                {/* ROW HEADER */}

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",

                                                                        justifyContent:
                                                                            "space-between",

                                                                        alignItems:
                                                                            "center",

                                                                        marginBottom:
                                                                            "12px"
                                                                    }}
                                                                >

                                                                    <strong
                                                                        style={{
                                                                            color:
                                                                                "#334155",

                                                                            fontSize:
                                                                                "13px"
                                                                        }}
                                                                    >

                                                                        Dimension #
                                                                        {
                                                                            dimensionIndex + 1
                                                                        }

                                                                    </strong>


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeDimensionRow(
                                                                                card.id,
                                                                                dimension.id
                                                                            )
                                                                        }
                                                                        style={{
                                                                            border:
                                                                                "none",

                                                                            background:
                                                                                "#fee2e2",

                                                                            color:
                                                                                "#b91c1c",

                                                                            borderRadius:
                                                                                "6px",

                                                                            padding:
                                                                                "6px 10px",

                                                                            cursor:
                                                                                "pointer",

                                                                            fontSize:
                                                                                "12px",

                                                                            fontWeight:
                                                                                "600"
                                                                        }}
                                                                    >

                                                                        Delete

                                                                    </button>

                                                                </div>


                                                                {/* DIMENSION INPUTS */}

                                                                <div
                                                                    className="grid3"
                                                                >

                                                                    {/* LENGTH */}

                                                                    <div
                                                                        className="field"
                                                                    >

                                                                        <label>
                                                                            Length (m)
                                                                        </label>


                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                dimension.length
                                                                            }
                                                                            onChange={
                                                                                e =>
                                                                                    updateDimensionRow(
                                                                                        card.id,
                                                                                        dimension.id,
                                                                                        "length",
                                                                                        e.target.value
                                                                                    )
                                                                            }
                                                                            placeholder="Enter length"
                                                                        />

                                                                    </div>


                                                                    {/* WIDTH */}

                                                                    <div
                                                                        className="field"
                                                                    >

                                                                        <label>
                                                                            Width (m)
                                                                        </label>


                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                dimension.width
                                                                            }
                                                                            onChange={
                                                                                e =>
                                                                                    updateDimensionRow(
                                                                                        card.id,
                                                                                        dimension.id,
                                                                                        "width",
                                                                                        e.target.value
                                                                                    )
                                                                            }
                                                                            placeholder="Enter width"
                                                                        />

                                                                    </div>


                                                                    {/* DEPTH */}

                                                                    <div
                                                                        className="field"
                                                                    >

                                                                        <label>
                                                                            Depth (m)
                                                                        </label>


                                                                        <input
                                                                            type="number"
                                                                            min="0.001"
                                                                            step="0.001"
                                                                            value={
                                                                                dimension.depth
                                                                            }
                                                                            onChange={
                                                                                e =>
                                                                                    updateDimensionRow(
                                                                                        card.id,
                                                                                        dimension.id,
                                                                                        "depth",
                                                                                        e.target.value
                                                                                    )
                                                                            }
                                                                            disabled={
                                                                                card.boqItem?.unit !==
                                                                                "Cum"
                                                                            }
                                                                            placeholder="Enter depth"
                                                                        />


                                                                        {
                                                                            card.boqItem?.unit !==
                                                                            "Cum" && (

                                                                                <small
                                                                                    style={{
                                                                                        color:
                                                                                            "#64748b"
                                                                                    }}
                                                                                >

                                                                                    Depth is not applicable
                                                                                    for this BOQ item.

                                                                                </small>

                                                                            )
                                                                        }

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        )
                                                    )
                                                }


                                                {/* =================================================
                                                    BOQ DIMENSION SUMMARY
                                                ================================================= */}

                                                <div
                                                    style={{
                                                        display:
                                                            "grid",

                                                        gridTemplateColumns:
                                                            "repeat(auto-fit, minmax(160px, 1fr))",

                                                        gap:
                                                            "10px",

                                                        marginTop:
                                                            "14px"
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            background:
                                                                "#eff6ff",

                                                            border:
                                                                "1px solid #bfdbfe",

                                                            borderRadius:
                                                                "7px",

                                                            padding:
                                                                "10px"
                                                        }}
                                                    >

                                                        <small
                                                            style={{
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Total Length
                                                        </small>

                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "700",

                                                                color:
                                                                    "#1e3a8a"
                                                            }}
                                                        >

                                                            {
                                                                Number(
                                                                    card.length ||
                                                                    0
                                                                ).toFixed(3)
                                                            }

                                                            {" m"}

                                                        </div>

                                                    </div>


                                                    <div
                                                        style={{
                                                            background:
                                                                "#f0fdf4",

                                                            border:
                                                                "1px solid #bbf7d0",

                                                            borderRadius:
                                                                "7px",

                                                            padding:
                                                                "10px"
                                                        }}
                                                    >

                                                        <small
                                                            style={{
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Total Width
                                                        </small>

                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "700",

                                                                color:
                                                                    "#166534"
                                                            }}
                                                        >

                                                            {
                                                                Number(
                                                                    card.width ||
                                                                    0
                                                                ).toFixed(3)
                                                            }

                                                            {" m"}

                                                        </div>

                                                    </div>


                                                    <div
                                                        style={{
                                                            background:
                                                                "#fff7ed",

                                                            border:
                                                                "1px solid #fed7aa",

                                                            borderRadius:
                                                                "7px",

                                                            padding:
                                                                "10px"
                                                        }}
                                                    >

                                                        <small
                                                            style={{
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Total Depth
                                                        </small>

                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "700",

                                                                color:
                                                                    "#9a3412"
                                                            }}
                                                        >

                                                            {
                                                                Number(
                                                                    card.depth ||
                                                                    0
                                                                ).toFixed(3)
                                                            }

                                                            {" m"}

                                                        </div>

                                                    </div>


                                                    <div
                                                        style={{
                                                            background:
                                                                "#f5f3ff",

                                                            border:
                                                                "1px solid #ddd6fe",

                                                            borderRadius:
                                                                "7px",

                                                            padding:
                                                                "10px"
                                                        }}
                                                    >

                                                        <small
                                                            style={{
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Dimension Rows
                                                        </small>

                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "700",

                                                                color:
                                                                    "#5b21b6"
                                                            }}
                                                        >

                                                            {
                                                                (
                                                                    card.dimensions ||
                                                                    []
                                                                ).length
                                                            }

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* =================================================
                                                RATE & COST CALCULATION
                                            ================================================= */}

                                            <div
                                                style={{

                                                    marginTop:
                                                        "20px",

                                                    padding:
                                                        "15px",

                                                    background:
                                                        "#f8fafc",

                                                    borderRadius:
                                                        "8px",

                                                    border:
                                                        "1px solid #e2e8f0"

                                                }}
                                            >

                                                <h4
                                                    style={{
                                                        marginTop:
                                                            "0"
                                                    }}
                                                >

                                                    Rate & Cost Calculation

                                                </h4>


                                                <div
                                                    className="breakdown"
                                                >

                                                    {/* UNIT */}

                                                    <div
                                                        className="row"
                                                    >

                                                        <span>
                                                            Unit
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                card.boqItem?.unit
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* AREA */}

                                                    <div
                                                        className="row"
                                                    >

                                                        <span>
                                                            Area
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                Number(
                                                                    card.area ||
                                                                    0
                                                                ).toFixed(2)
                                                            }

                                                            {" sqm"}

                                                        </span>

                                                    </div>


                                                    {/* QUANTITY */}

                                                    <div
                                                        className="row"
                                                    >

                                                        <span>
                                                            Quantity
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                Number(
                                                                    card.quantity ||
                                                                    0
                                                                ).toFixed(3)
                                                            }

                                                            {" "}

                                                            {
                                                                card.boqItem?.unit
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* RATE */}

                                                    <div
                                                        className="row"
                                                    >

                                                        <span>
                                                            Rate
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                rupee(
                                                                    card.rate ||
                                                                    0
                                                                )
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* DIRECT */}

                                                    <div
                                                        className="row"
                                                    >

                                                        <span>
                                                            Direct Cost
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                rupee(
                                                                    card.direct ||
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
                                                            VAT
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                rupee(
                                                                    card.vat ||
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
                                                                    card.qcc ||
                                                                    0
                                                                )
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* TOTAL */}

                                                    <div
                                                        className="row total"
                                                        style={{

                                                            marginTop:
                                                                "10px",

                                                            borderTop:
                                                                "2px solid #d1d5db",

                                                            paddingTop:
                                                                "10px",

                                                            fontWeight:
                                                                "700"

                                                        }}
                                                    >

                                                        <span>
                                                            Card Estimated Cost
                                                        </span>

                                                        <span
                                                            className="mono"
                                                        >

                                                            {
                                                                rupee(
                                                                    card.total ||
                                                                    0
                                                                )
                                                            }

                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}


                        {/* =================================================
                            TOTAL ROAD DIMENSIONS
                        ================================================= */}

                        <div
                            className="section"
                            style={{

                                border:
                                    "1px solid #cbd5e1",

                                background:
                                    "#f8fafc"

                            }}
                        >

                            <h2>
                                Total Road Dimensions
                            </h2>


                            <p
                                style={{
                                    color:
                                        "#64748b",

                                    fontSize:
                                        "14px"
                                }}
                            >

                                These totals are calculated automatically
                                from all dimension rows across all BOQ
                                work items.

                            </p>


                            <div
                                className="grid3"
                            >

                                {/* TOTAL LENGTH */}

                                <div
                                    className="field"
                                >

                                    <label>
                                        Total Length (m)
                                    </label>


                                    <input
                                        type="number"
                                        value={
                                            totalLength.toFixed(3)
                                        }
                                        readOnly
                                    />


                                    <small>
                                        Sum of all dimension Length values
                                    </small>

                                </div>


                                {/* TOTAL WIDTH */}

                                <div
                                    className="field"
                                >

                                    <label>
                                        Total Width (m)
                                    </label>


                                    <input
                                        type="number"
                                        value={
                                            totalWidth.toFixed(3)
                                        }
                                        readOnly
                                    />


                                    <small>
                                        Sum of all dimension Width values
                                    </small>

                                </div>


                                {/* TOTAL DEPTH */}

                                <div
                                    className="field"
                                >

                                    <label>
                                        Total Depth (m)
                                    </label>


                                    <input
                                        type="number"
                                        value={
                                            totalDepth.toFixed(3)
                                        }
                                        readOnly
                                    />


                                    <small>
                                        Sum of all dimension Depth values
                                    </small>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            GRAND ESTIMATE
                        ================================================= */}

                        <div
                            className="section"
                            style={{

                                border:
                                    "2px solid #2563eb",

                                background:
                                    "#eff6ff"

                            }}
                        >

                            <h2>
                                Final Estimate
                            </h2>


                            <div
                                className="breakdown"
                            >

                                <div
                                    className="row"
                                >

                                    <span>
                                        Number of BOQ Items
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            calculatedCards.length
                                        }

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total Dimension Rows
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            calculatedCards.reduce(
                                                (
                                                    sum,
                                                    card
                                                ) =>

                                                    sum +
                                                    (
                                                        card.dimensions?.length ||
                                                        0
                                                    ),

                                                0
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total Length
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            totalLength.toFixed(3)
                                        }

                                        {" m"}

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total Width
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            totalWidth.toFixed(3)
                                        }

                                        {" m"}

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total Depth
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            totalDepth.toFixed(3)
                                        }

                                        {" m"}

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total Direct Cost
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            rupee(
                                                grandDirect
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total VAT
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            rupee(
                                                grandVat
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="row"
                                >

                                    <span>
                                        Total QCC
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            rupee(
                                                grandQcc
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="row total"
                                    style={{

                                        marginTop:
                                            "15px",

                                        padding:
                                            "15px",

                                        borderRadius:
                                            "8px",

                                        background:
                                            "#1d4ed8",

                                        color:
                                            "#ffffff",

                                        fontSize:
                                            "20px",

                                        fontWeight:
                                            "700"

                                    }}
                                >

                                    <span>
                                        GRAND ESTIMATE COST
                                    </span>

                                    <span
                                        className="mono"
                                    >

                                        {
                                            rupee(
                                                estimatedCost
                                            )
                                        }

                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            PHOTO
                        ================================================= */}

                        <div
                            className="section"
                        >

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

                        <div
                            className="section"
                        >

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