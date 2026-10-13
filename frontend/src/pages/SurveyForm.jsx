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
    //
    // Each BOQ card contains:
    //
    // card
    //   └── dimensions[]
    //          ├── Dimension #1
    //          ├── Dimension #2
    //          └── Dimension #3
    //
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

                    return BT_ROAD_BOQ || [];

                }

                if (
                    formData.roadName ===
                    "CC Road"
                ) {

                    return CC_ROAD_BOQ || [];

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


                setBoqCards([]);


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


                setBoqCards([]);


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
        item => ({

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
                    item?.defaultDepth ||
                    0.001
                )

        });


    // ==========================================================
    // CREATE BOQ CARD
    // ==========================================================

    const createBOQCard =
        item => {

            if (
                !item
            ) {

                return null;

            }


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

                // ==================================================
                // MULTIPLE DIMENSION ROWS
                // ==================================================

                dimensions: [

                    createDimensionRow(
                        item
                    )

                ]

            };

        };


    // ==========================================================
    // ADD BOQ CARD
    // ==========================================================

    const addBOQCard =
        () => {

            if (
                !formData.roadName
            ) {

                setErrorMessage(
                    "Please select Road Type first."
                );

                return;

            }


            if (
                !formData.roadIssue
            ) {

                setErrorMessage(
                    "Please select Road Issue first."
                );

                return;

            }


            if (
                availableBOQItems.length === 0
            ) {

                setErrorMessage(
                    "No BOQ items are available for the selected Road Type."
                );

                return;

            }


            const item =
                availableBOQItems[0];


            const newCard =
                createBOQCard(
                    item
                );


            setBoqCards(
                prev => [
                    ...prev,
                    newCard
                ]
            );


            setErrorMessage("");

        };


    // ==========================================================
    // ADD SPECIFIC BOQ ITEM
    // ==========================================================

    const addSpecificBOQItem =
        item => {

            if (
                !item
            ) {

                return;

            }


            const newCard =
                createBOQCard(
                    item
                );


            setBoqCards(
                prev => [
                    ...prev,
                    newCard
                ]
            );


            setErrorMessage("");

        };


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
    // ADD DIMENSION ROW
    // ==========================================================

    const addDimensionRow =
        boqCardId => {

            setBoqCards(
                prev =>

                    prev.map(
                        card => {

                            if (
                                card.id !==
                                boqCardId
                            ) {

                                return card;

                            }


                            return {

                                ...card,

                                dimensions: [

                                    ...(card.dimensions || []),

                                    createDimensionRow(
                                        card.boqItem
                                    )

                                ]

                            };

                        }
                    )
            );


            setErrorMessage("");

        };


    // ==========================================================
    // UPDATE DIMENSION ROW
    // ==========================================================

    const updateDimensionRow = (
        boqCardId,
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
                            boqCardId
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

    const deleteDimensionRow = (
        boqCardId,
        dimensionId
    ) => {

        setBoqCards(
            prev =>

                prev.map(
                    card => {

                        if (
                            card.id !==
                            boqCardId
                        ) {

                            return card;

                        }


                        const dimensions =
                            card.dimensions ||
                            [];


                        if (
                            dimensions.length <=
                            1
                        ) {

                            Swal.fire({

                                icon:
                                    "info",

                                title:
                                    "Cannot Delete",

                                text:
                                    "At least one Road Dimension row is required.",

                                confirmButtonText:
                                    "OK"

                            });


                            return card;

                        }


                        return {

                            ...card,

                            dimensions:
                                dimensions.filter(
                                    dimension =>
                                        dimension.id !==
                                        dimensionId
                                )

                        };

                    }
                )
        );


        setErrorMessage("");

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
    // CALCULATED BOQ CARDS
    //
    // Each dimension is calculated separately.
    // Then all dimensions are aggregated into the BOQ card.
    // ==========================================================

    const calculatedCards =
        useMemo(
            () => {

                return boqCards.map(
                    card => {

                        const dimensions =
                            card.dimensions ||
                            [];


                        // ==================================================
                        // CALCULATE EVERY DIMENSION
                        // ==================================================

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


                        // ==================================================
                        // AGGREGATE CARD VALUES
                        // ==================================================

                        const aggregated =
                            dimensionCalculations.reduce(
                                (
                                    totals,
                                    row
                                ) => {

                                    return {

                                        area:
                                            totals.area +
                                            Number(
                                                row.area ||
                                                0
                                            ),

                                        quantity:
                                            totals.quantity +
                                            Number(
                                                row.quantity ||
                                                0
                                            ),

                                        direct:
                                            totals.direct +
                                            Number(
                                                row.direct ||
                                                0
                                            ),

                                        vat:
                                            totals.vat +
                                            Number(
                                                row.vat ||
                                                0
                                            ),

                                        qcc:
                                            totals.qcc +
                                            Number(
                                                row.qcc ||
                                                0
                                            ),

                                        ls:
                                            totals.ls +
                                            Number(
                                                row.ls ||
                                                0
                                            ),

                                        total:
                                            totals.total +
                                            Number(
                                                row.total ||
                                                0
                                            )

                                    };

                                },
                                {

                                    area:
                                        0,

                                    quantity:
                                        0,

                                    direct:
                                        0,

                                    vat:
                                        0,

                                    qcc:
                                        0,

                                    ls:
                                        0,

                                    total:
                                        0

                                }
                            );


                        // ==================================================
                        // TOTAL LENGTH
                        // ==================================================

                        const length =
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


                        // ==================================================
                        // TOTAL WIDTH
                        // ==================================================

                        const width =
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


                        // ==================================================
                        // TOTAL DEPTH
                        // ==================================================

                        const depth =
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


                        // ==================================================
                        // RATE
                        //
                        // Do NOT add rates.
                        //
                        // Example:
                        //
                        // 500 sqm × ₹21.45
                        // 200 sqm × ₹21.45
                        //
                        // Card rate remains ₹21.45.
                        // ==================================================

                        const firstValidRate =
                            dimensionCalculations.find(
                                row =>
                                    Number(
                                        row.rate
                                    ) > 0
                            );


                        const rate =
                            Number(
                                firstValidRate?.rate ||
                                card.boqItem?.rate ||
                                0
                            );


                        return {

                            ...card,

                            dimensions:
                                dimensionCalculations,

                            length,

                            width,

                            depth,

                            area:
                                aggregated.area,

                            quantity:
                                aggregated.quantity,

                            rate,

                            direct:
                                aggregated.direct,

                            vat:
                                aggregated.vat,

                            qcc:
                                aggregated.qcc,

                            ls:
                                aggregated.ls,

                            total:
                                aggregated.total

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
                            card.length ||
                            0
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
                            card.width ||
                            0
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
                            card.depth ||
                            0
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
                            card.area ||
                            0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // GRAND TOTAL
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
                            card.total ||
                            0
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
                            card.direct ||
                            0
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
                            card.vat ||
                            0
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
                            card.qcc ||
                            0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // TOTAL QUANTITY
    // ==========================================================

    const grandQuantity =
        useMemo(
            () => {

                return calculatedCards.reduce(
                    (
                        sum,
                        card
                    ) =>

                        sum +
                        Number(
                            card.quantity ||
                            0
                        ),

                    0

                );

            },
            [
                calculatedCards
            ]
        );


    // ==========================================================
    // SURVEY RATE
    //
    // For multiple BOQ items, a single "rate" is not always
    // mathematically meaningful because different BOQs can have
    // different units.
    //
    // We therefore use weighted direct cost / quantity where
    // possible.
    // ==========================================================

    const surveyRate =
        useMemo(
            () => {

                if (
                    grandQuantity <= 0
                ) {

                    if (
                        calculatedCards.length === 1
                    ) {

                        return Number(
                            calculatedCards[0]?.rate ||
                            0
                        );

                    }

                    return 0;

                }


                return (
                    grandDirect /
                    grandQuantity
                );

            },
            [
                calculatedCards,
                grandQuantity,
                grandDirect
            ]
        );


    // ==========================================================
    // VALIDATION
    // ==========================================================

    const validateForm =
        () => {

            setErrorMessage("");


            // ==================================================
            // LOCATION
            // ==================================================

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


            // ==================================================
            // ROAD
            // ==================================================

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


            // ==================================================
            // BOQ
            // ==================================================

            if (
                calculatedCards.length === 0
            ) {

                setErrorMessage(
                    "Please add at least one BOQ Item."
                );

                return false;

            }


            // ==================================================
            // MAIN LOCATION
            // ==================================================

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
            // VALIDATE EACH BOQ CARD
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
                        `Please enter valid Latitude and Longitude for BOQ Card #${i + 1}.`
                    );

                    return false;

                }


                const dimensions =
                    card.dimensions ||
                    [];


                if (
                    dimensions.length === 0
                ) {

                    setErrorMessage(
                        `Please add at least one Road Dimension for BOQ Card #${i + 1}.`
                    );

                    return false;

                }


                // ==================================================
                // VALIDATE EACH DIMENSION
                // ==================================================

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
                            `Please enter valid Length for BOQ Card #${i + 1}, Dimension #${j + 1}.`
                        );

                        return false;

                    }


                    if (
                        !Number.isFinite(width) ||
                        width <= 0
                    ) {

                        setErrorMessage(
                            `Please enter valid Width for BOQ Card #${i + 1}, Dimension #${j + 1}.`
                        );

                        return false;

                    }


                    // ==================================================
                    // DEPTH
                    // ==================================================

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
                                `Please enter valid Depth for BOQ Card #${i + 1}, Dimension #${j + 1}.`
                            );

                            return false;

                        }

                    }


                    // ==================================================
                    // COST
                    // ==================================================

                    if (
                        Number(
                            dimension.total ||
                            0
                        ) <= 0
                    ) {

                        setErrorMessage(
                            `Unable to calculate cost for BOQ Card #${i + 1}, Dimension #${j + 1}. Please check the BOQ rate and dimensions.`
                        );

                        return false;

                    }

                }


                // ==================================================
                // CARD TOTAL
                // ==================================================

                if (
                    Number(
                        card.total ||
                        0
                    ) <= 0
                ) {

                    setErrorMessage(
                        `Unable to calculate total cost for BOQ Card #${i + 1}.`
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
    // BUILD BOQ PAYLOAD
    //
    // This preserves every dimension row.
    // ==========================================================

    const buildBOQPayload =
        () => {

            return calculatedCards.map(
                (
                    card,
                    index
                ) => {

                    const dimensions =
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

                                id:
                                    dimension.id,

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
                                    ),

                                area:
                                    Number(
                                        dimension.area ||
                                        0
                                    ),

                                quantity:
                                    Number(
                                        dimension.quantity ||
                                        0
                                    ),

                                rate:
                                    Number(
                                        dimension.rate ||
                                        0
                                    ),

                                direct:
                                    Number(
                                        dimension.direct ||
                                        0
                                    ),

                                vat:
                                    Number(
                                        dimension.vat ||
                                        0
                                    ),

                                qcc:
                                    Number(
                                        dimension.qcc ||
                                        0
                                    ),

                                ls:
                                    Number(
                                        dimension.ls ||
                                        0
                                    ),

                                total:
                                    Number(
                                        dimension.total ||
                                        0
                                    )

                            })
                        );


                    return {

                        cardNumber:
                            index + 1,

                        id:
                            card.id,

                        // ==========================================
                        // BOQ
                        // ==========================================

                        code:
                            card.boqItem?.code ||
                            "",

                        // shortDescription:
                        //     card.boqItem?.shortDescription ||
                        //     "",

                        // description:
                        //     card.boqItem?.description ||
                        //     "",

                        unit:
                            card.boqItem?.unit ||
                            "",

                        // ==========================================
                        // LOCATION
                        // ==========================================

                        latitude:
                            Number(
                                card.latitude
                            ),

                        longitude:
                            Number(
                                card.longitude
                            ),

                        // ==========================================
                        // AGGREGATED DIMENSIONS
                        // ==========================================

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
                            ),

                        // ==========================================
                        // INDIVIDUAL DIMENSIONS
                        // ==========================================

                        dimensionCount:
                            dimensions.length,

                        dimensions

                    };

                }
            );

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
                    buildBOQPayload();


                // ==================================================
                // TOP LEVEL TOTALS
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


                const finalDirectCost =
                    Number(
                        grandDirect.toFixed(2)
                    );


                const finalVat =
                    Number(
                        grandVat.toFixed(2)
                    );


                const finalQcc =
                    Number(
                        grandQcc.toFixed(2)
                    );


                const finalEstimatedCost =
                    Number(
                        estimatedCost.toFixed(2)
                    );


                const finalRate =
                    Number(
                        surveyRate.toFixed(2)
                    );


                // ==================================================
                // SURVEY DATA
                // ==================================================

                const surveyData = {

                    ...formData,

                    // ==========================================
                    // MAIN LOCATION
                    // ==========================================

                    latitude:
                        Number(
                            formData.latitude
                        ),

                    longitude:
                        Number(
                            formData.longitude
                        ),

                    // ==========================================
                    // ROAD TYPE
                    // ==========================================

                    roadType:
                        getSubmissionRoadType(),

                    // ==========================================
                    // ROAD ISSUE
                    // ==========================================

                    roadIssue:
                        formData.roadIssue,

                    // ==========================================
                    // TOTAL DIMENSIONS
                    // ==========================================

                    length:
                        totalLengthValue,

                    width:
                        totalWidthValue,

                    depth:
                        totalDepthValue,

                    area:
                        totalAreaValue,

                    // ==========================================
                    // RATE
                    //
                    // Important:
                    // Do not sum individual rates.
                    // ==========================================

                    rate:
                        finalRate,

                    // ==========================================
                    // LEGACY BACKEND FIELDS
                    // ==========================================

                    roadIssueCode:
                        calculatedCards[0]?.boqItem?.code ||
                        "",

                    roadIssueDescription:
                        calculatedCards[0]?.boqItem?.description ||
                        "",

                    // ==========================================
                    // BOQ
                    // ==========================================

                    boqItemCount:
                        boqItems.length,

                    boqItems,

                    // ==========================================
                    // GRAND COST
                    // ==========================================

                    directCost:
                        finalDirectCost,

                    vat:
                        finalVat,

                    qcc:
                        finalQcc,

                    estimatedCost:
                        finalEstimatedCost

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
                    "Road Type:",
                    surveyData.roadType
                );

                console.log(
                    "Road Issue:",
                    surveyData.roadIssue
                );

                console.log(
                    "Total BOQ Items:",
                    boqItems.length
                );

                console.log(
                    "Total Dimensions:",
                    boqItems.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            Number(
                                item.dimensionCount ||
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
                    "Rate:",
                    finalRate
                );

                console.log(
                    "Direct Cost:",
                    finalDirectCost
                );

                console.log(
                    "VAT:",
                    finalVat
                );

                console.log(
                    "QCC:",
                    finalQcc
                );

                console.log(
                    "Estimated Cost:",
                    finalEstimatedCost
                );

                console.log(
                    "BOQ Items:",
                    boqItems
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
                                        Total Dimensions:
                                    </strong>
                                    ${boqItems.reduce(
                                (
                                    sum,
                                    item
                                ) =>
                                    sum +
                                    Number(
                                        item.dimensionCount ||
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
                                        Total Area:
                                    </strong>
                                    ${totalAreaValue} sqm
                                </p>

                                <p>
                                    <strong>
                                        Rate:
                                    </strong>
                                    ${rupee(finalRate)}
                                </p>

                                <p>
                                    <strong>
                                        Estimated Cost:
                                    </strong>
                                    ${rupee(finalEstimatedCost)}
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

    const renderBOQCard = (card, cardIndex) => {
        return (
            <div
                key={card.id}
                style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    padding: "20px",
                    marginTop: "15px",
                    background: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
            >

                {/* ==========================================
                CARD HEADER
            ========================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "18px",
                        borderBottom: "1px solid #e5e7eb",
                        paddingBottom: "12px",
                        gap: "15px"
                    }}
                >

                    <div>

                        <h3
                            style={{
                                margin: "0 0 5px 0",
                                fontSize: "17px"
                            }}
                        >
                            BOQ Card #{cardIndex + 1}
                        </h3>

                        <strong>
                            {/* {card.boqItem?.code}
                            {" - "} */}
                            {/* {card.boqItem?.shortDescription} */}
                        </strong>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            removeBOQCard(card.id)
                        }
                        style={{
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 14px",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Remove
                    </button>

                </div>


                {/* ==========================================
                DESCRIPTION
            ========================================== */}

                {/* <div
                    style={{
                        background: "#f8fafc",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "18px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#475569"
                    }}
                >
                    {card.boqItem?.description}
                </div> */}


                {/* ==========================================
                LOCATION
            ========================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                        gap: "15px",
                        marginBottom: "15px"
                    }}
                >

                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginBottom: "4px"
                            }}
                        >
                            BOQ Latitude
                        </div>

                        <strong>
                            {card.latitude || "-"}
                        </strong>
                    </div>


                    <div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginBottom: "4px"
                            }}
                        >
                            BOQ Longitude
                        </div>

                        <strong>
                            {card.longitude || "-"}
                        </strong>
                    </div>

                </div>


                {/* ==========================================
                ROAD DIMENSIONS
            ========================================== */}

                <div
                    style={{
                        marginTop: "24px"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                            gap: "15px",
                            flexWrap: "wrap"
                        }}
                    >

                        <div>

                            <h4
                                style={{
                                    margin: "0 0 5px 0",
                                    fontSize: "17px"
                                }}
                            >
                                Road Dimensions
                            </h4>

                            {/* <p
                                style={{
                                    margin: "0",
                                    fontSize: "13px",
                                    color: "#64748b"
                                }}
                            >
                                Add one or more measurements
                                for this BOQ item.
                            </p> */}

                        </div>


                        {/* <button
                            type="button"
                            onClick={() =>
                                addDimensionRow(card.id)
                            }
                            style={{
                                border: "none",
                                background: "#2563eb",
                                color: "#fff",
                                padding: "10px 16px",
                                borderRadius: "7px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                whiteSpace: "nowrap"
                            }}
                        >
                            + Add Dimension
                        </button> */}

                    </div>


                    {/* ==========================================
                    DIMENSIONS
                ========================================== */}

                    {(card.dimensions || []).map(
                        (dimension, dimensionIndex) => (

                            <div
                                key={dimension.id}
                                style={{
                                    border:
                                        "1px solid #dbe2ea",
                                    borderRadius: "10px",
                                    padding: "18px",
                                    marginBottom: "14px",
                                    background: "#ffffff",
                                    boxShadow:
                                        "0 2px 6px rgba(15,23,42,0.04)"
                                }}
                            >

                                {/* DIMENSION HEADER */}

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems: "center",
                                        marginBottom: "15px"
                                    }}
                                >

                                    <div
                                        style={{
                                            fontWeight: "700",
                                            color: "#334155",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Dimension #
                                        {dimensionIndex + 1}
                                    </div>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteDimensionRow(
                                                card.id,
                                                dimension.id
                                            )
                                        }
                                        style={{
                                            border:
                                                "1px solid #ef4444",
                                            background: "#fff5f5",
                                            color: "#dc2626",
                                            borderRadius: "6px",
                                            padding: "7px 12px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            fontSize: "12px"
                                        }}
                                    >
                                        Delete
                                    </button>

                                </div>


                                {/* INPUTS */}

                                <div className="grid3">

                                    <div className="field">

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
                                            onChange={e =>
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


                                    <div className="field">

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
                                            onChange={e =>
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


                                    <div className="field">

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
                                            onChange={e =>
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
                                        />

                                    </div>

                                </div>

                                {/* ADDRESS INPUT */}
                                <div className="field" style={{ marginTop: "12px" }}>
                                    <label>Work Location / Address</label>

                                    <input
                                        type="text"
                                        value={dimension.address || ""}
                                        onChange={e =>
                                            updateDimensionRow(
                                                card.id,
                                                dimension.id,
                                                "address",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter road name, location or address"
                                    />
                                </div>


                                {/* ==========================================
                                DIMENSION CALCULATION
                            ========================================== */}

                                {/* <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "14px",
                                        background: "#f8fafc",
                                        border:
                                            "1px solid #e2e8f0",
                                        borderRadius: "8px"
                                    }}
                                >

                                    <div
                                        style={{
                                            fontWeight: "700",
                                            fontSize: "13px",
                                            marginBottom: "10px",
                                            color: "#334155"
                                        }}
                                    >
                                        Dimension Calculation
                                    </div>


                                    <div className="breakdown">

                                        <div className="row">
                                            <span>Unit</span>

                                            <span className="mono">
                                                {
                                                    card.boqItem?.unit ||
                                                    "-"
                                                }
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>Area</span>

                                            <span className="mono">
                                                {
                                                    Number(
                                                        dimension.area || 0
                                                    ).toFixed(2)
                                                }
                                                {" sqm"}
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>Quantity</span>

                                            <span className="mono">
                                                {
                                                    Number(
                                                        dimension.quantity ||
                                                        0
                                                    ).toFixed(3)
                                                }
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>Rate</span>

                                            <span className="mono">
                                                {
                                                    rupee(
                                                        dimension.rate || 0
                                                    )
                                                }
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>Direct Cost</span>

                                            <span className="mono">
                                                {
                                                    rupee(
                                                        dimension.direct ||
                                                        0
                                                    )
                                                }
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>VAT</span>

                                            <span className="mono">
                                                {
                                                    rupee(
                                                        dimension.vat || 0
                                                    )
                                                }
                                            </span>
                                        </div>


                                        <div className="row">
                                            <span>QCC</span>

                                            <span className="mono">
                                                {
                                                    rupee(
                                                        dimension.qcc || 0
                                                    )
                                                }
                                            </span>
                                        </div>


                                        <div
                                            className="row total"
                                            style={{
                                                marginTop: "8px",
                                                borderTop:
                                                    "1px solid #cbd5e1",
                                                paddingTop: "9px",
                                                fontWeight: "700"
                                            }}
                                        >

                                            <span>
                                                Dimension Cost
                                            </span>

                                            <span className="mono">
                                                {
                                                    rupee(
                                                        dimension.total ||
                                                        0
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>

                                </div> */}

                            </div>

                        )
                    )}



                    <button
                        type="button"
                        onClick={() =>
                            addDimensionRow(card.id)
                        }
                        style={{
                            border: "none",
                            background: "#2563eb",
                            color: "#fff",
                            padding: "10px 16px",
                            borderRadius: "7px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        + Add Dimension
                    </button>





                    {/* ==========================================
                    BOQ TOTAL
                ========================================== */}

                    <div
                        style={{
                            marginTop: "15px",
                            padding: "16px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "9px"
                        }}
                    >

                        {/* <h4
                            style={{
                                marginTop: 0,
                                color: "#1e3a8a"
                            }}
                        >
                            BOQ Item Total
                        </h4> */}


                        <div className="breakdown">


                            <div className="row">
                                <span>
                                    Number of Dimensions
                                </span>

                                <span className="mono">
                                    {
                                        card.dimensions?.length ||
                                        0
                                    }
                                </span>
                            </div>


                            <div className="row">
                                <span>
                                    Total Quantity
                                </span>

                                <span className="mono">
                                    {
                                        Number(
                                            card.quantity || 0
                                        ).toFixed(3)
                                    }
                                </span>
                            </div>


                            <div className="row">
                                <span>
                                    Rate
                                </span>

                                <span className="mono">
                                    {
                                        rupee(
                                            card.rate || 0
                                        )
                                    }
                                </span>
                            </div>


                            <div className="row">
                                <span>
                                    Direct Cost
                                </span>

                                <span className="mono">
                                    {
                                        rupee(
                                            card.direct || 0
                                        )
                                    }
                                </span>
                            </div>


                            <div className="row">
                                <span>
                                    VAT
                                </span>

                                
                            

                            <span className="mono">
                                {
                                    rupee(
                                        card.vat || 0
                                    )
                                }
                            </span>
                        </div>


                        <div className="row">
                            <span>
                                QCC
                            </span>

                            <span className="mono">
                                {
                                    rupee(
                                        card.qcc || 0
                                    )
                                }
                            </span>
                        </div>


                        <div
                            className="row total"
                            style={{
                                marginTop: "10px",
                                borderTop:
                                    "2px solid #93c5fd",
                                paddingTop: "10px",
                                fontWeight: "700"
                            }}
                        >

                            <span>
                                BOQ Estimated Cost
                            </span>

                            <span className="mono">
                                {
                                    rupee(
                                        card.total || 0
                                    )
                                }
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            </div >
        );
};





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


                            <div
                                className="field"
                            />

                        </div>

                    </div>


                    {/* =================================================
                            AVAILABLE BOQ ITEMS
                        ================================================= */}

                    {/* =========================================================
    BOQ ITEMS WITH CARDS DIRECTLY BELOW THEIR ITEM
========================================================= */}

                    {formData.roadName &&
                        formData.roadIssue && (

                            <div className="section">

                                <h2>
                                    Road Work BOQ
                                </h2>

                                <p
                                    style={{
                                        color: "#64748b",
                                        marginTop: "0",
                                        marginBottom: "20px"
                                    }}
                                >
                                    Select a BOQ item and add one or more
                                    measurement cards directly below it.
                                </p>


                                {/* =================================================
                EACH BOQ ITEM
            ================================================= */}

                                {availableBOQItems.map(
                                    (item) => {

                                        const itemCards =
                                            calculatedCards.filter(
                                                card =>
                                                    card.boqItem?.code ===
                                                    item.code
                                            );


                                        return (

                                            <div
                                            // key={item.code}
                                            // style={{
                                            //     marginBottom: "25px",
                                            //     border:
                                            //         "1px solid #dbe2ea",
                                            //     borderRadius: "12px",
                                            //     background: "#f8fafc",
                                            //     overflow: "hidden"
                                            // }}
                                            >

                                                {/* =================================================
                                BOQ ITEM HEADER
                            ================================================= */}

                                                <div
                                                    style={{
                                                        padding: "18px",
                                                        background: "#ffffff",
                                                        borderBottom:
                                                            "1px solid #e2e8f0"
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems: "flex-start",
                                                            gap: "20px"
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                flex: 1
                                                            }}
                                                        >

                                                            <div
                                                                style={{
                                                                    fontSize: "18px",
                                                                    fontWeight: "700",
                                                                    color: "#0f172a",
                                                                    marginBottom: "6px"
                                                                }}
                                                            >

                                                                {item.code}

                                                            </div>


                                                            <div
                                                                style={{
                                                                    fontSize: "15px",
                                                                    fontWeight: "600",
                                                                    color: "#334155",
                                                                    marginBottom: "8px"
                                                                }}
                                                            >

                                                                {/* {
                                                                        item.shortDescription
                                                                    } */}

                                                            </div>


                                                            {/* <div
                                                                    style={{
                                                                        fontSize: "13px",
                                                                        color: "#64748b"
                                                                    }}
                                                                >

                                                                    Rate:
                                                                    {" "}

                                                                    <strong
                                                                        style={{
                                                                            color: "#0f172a"
                                                                        }}
                                                                    >
                                                                        {
                                                                            rupee(
                                                                                item.rate || 0
                                                                            )
                                                                        }
                                                                    </strong>

                                                                    {" / "}

                                                                    {
                                                                        item.unit
                                                                    }

                                                                </div> */}


                                                            {/* <div
                                                                    style={{
                                                                        marginTop: "8px",
                                                                        color: "#2563eb",
                                                                        fontSize: "13px",
                                                                        fontWeight: "600"
                                                                    }}
                                                                >

                                                                    Added:
                                                                    {" "}
                                                                    {
                                                                        itemCards.length
                                                                    }
                                                                    {" "}
                                                                    time
                                                                    {
                                                                        itemCards.length === 1
                                                                            ? ""
                                                                            : "s"
                                                                    }

                                                                </div> */}

                                                        </div>


                                                        {/* ADD BOQ BUTTON */}

                                                        {/* <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addSpecificBOQItem(
                                                                        item
                                                                    )
                                                                }
                                                                style={{
                                                                    minWidth: "190px",
                                                                    padding:
                                                                        "11px 18px",
                                                                    border: "none",
                                                                    borderRadius: "7px",
                                                                    background:
                                                                        "#16a34a",
                                                                    color: "#ffffff",
                                                                    cursor:
                                                                        "pointer",
                                                                    fontWeight:
                                                                        "700",
                                                                    fontSize:
                                                                        "13px"
                                                                }}
                                                            >

                                                                + Add BOQ Item

                                                            </button> */}

                                                    </div>

                                                    {/* Name of work  */}

                                                    <div
                                                        style={{
                                                            marginTop: "15px",
                                                            padding: "12px",
                                                            background:
                                                                "#f8fafc",
                                                            borderRadius: "7px",
                                                            fontSize: "13px",
                                                            lineHeight: "1.5",
                                                            color: "#475569"
                                                        }}
                                                    >

                                                        {/* {
                                                                item.nameOfWork
                                                            } */}

                                                        <div
                                                            style={{
                                                                fontWeight: "700",
                                                                color: "#510bf3",
                                                                marginBottom: "6px",
                                                                fontSize: "12px",
                                                                textTransform: "uppercase"
                                                            }}
                                                        >
                                                            Name of Work
                                                        </div>

                                                        <div>
                                                            {item.nameOfWork || "—"}
                                                        </div>

                                                    </div>


                                                    {/* DESCRIPTION */}

                                                    <div
                                                        style={{
                                                            marginTop: "15px",
                                                            padding: "12px",
                                                            background:
                                                                "#f8fafc",
                                                            borderRadius: "7px",
                                                            fontSize: "13px",
                                                            lineHeight: "1.5",
                                                            color: "#475569"
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontWeight: "700",
                                                                color: "#510bf3",
                                                                marginBottom: "6px",
                                                                fontSize: "12px",
                                                                textTransform: "uppercase"
                                                            }}
                                                        >
                                                            Description of Work
                                                        </div>

                                                        <div>
                                                            {item.description || "—"}
                                                        </div>

                                                        {/* {
                                                                item.description
                                                            } */}

                                                    </div>




                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addSpecificBOQItem(
                                                                item
                                                            )
                                                        }
                                                        style={{
                                                            minWidth: "190px",
                                                            padding:
                                                                "11px 18px",
                                                            border: "none",
                                                            borderRadius: "7px",
                                                            background:
                                                                "#16a34a",
                                                            color: "#ffffff",
                                                            cursor:
                                                                "pointer",
                                                            fontWeight:
                                                                "700",
                                                            fontSize:
                                                                "13px"
                                                        }}
                                                    >

                                                        + Add BOQ Item

                                                    </button>

                                                </div>


                                                {/* =================================================
                                CARDS DIRECTLY BELOW THIS BOQ ITEM
                            ================================================= */}

                                                {itemCards.length > 0 && (

                                                    <div
                                                        style={{
                                                            padding:
                                                                "15px 18px 20px 18px"
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                fontSize: "13px",
                                                                fontWeight: "700",
                                                                color: "#475569",
                                                                marginBottom:
                                                                    "10px"
                                                            }}
                                                        >

                                                            Added BOQ Work
                                                            {" "}
                                                            (
                                                            {
                                                                itemCards.length
                                                            }
                                                            )

                                                        </div>


                                                        {itemCards.map(
                                                            (
                                                                card
                                                            ) => {

                                                                /*
                                                                 * Find the global card index
                                                                 * so the numbering remains
                                                                 * unique.
                                                                 */

                                                                const globalIndex =
                                                                    calculatedCards.findIndex(
                                                                        c =>
                                                                            c.id ===
                                                                            card.id
                                                                    );


                                                                return renderBOQCard(
                                                                    card,
                                                                    globalIndex
                                                                );

                                                            }
                                                        )}

                                                    </div>

                                                )}

                                            </div>

                                        );

                                    }
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
                            from all BOQ dimension rows.

                        </p>


                        <div
                            className="grid3"
                        >

                            {/* LENGTH */}

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
                                    Sum of all dimension rows
                                </small>

                            </div>


                            {/* WIDTH */}

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
                                    Sum of all dimension rows
                                </small>

                            </div>


                            {/* DEPTH */}

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
                                    Sum of all dimension rows
                                </small>

                            </div>


                            {/* AREA */}

                            <div
                                className="field"
                            >

                                <label>
                                    Total Area (sqm)
                                </label>


                                <input
                                    type="number"
                                    value={
                                        totalArea.toFixed(3)
                                    }
                                    readOnly
                                />


                                <small>
                                    Sum of calculated areas
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

                            {/* BOQ ITEMS */}

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


                            {/* DIMENSIONS */}

                            <div
                                className="row"
                            >

                                <span>
                                    Number of Dimensions
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


                            {/* LENGTH */}

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


                            {/* WIDTH */}

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


                            {/* DEPTH */}

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


                            {/* AREA */}

                            <div
                                className="row"
                            >

                                <span>
                                    Total Area
                                </span>

                                <span
                                    className="mono"
                                >

                                    {
                                        totalArea.toFixed(3)
                                    }
                                    {" sqm"}

                                </span>

                            </div>


                            {/* QUANTITY */}

                            <div
                                className="row"
                            >

                                <span>
                                    Total Quantity
                                </span>

                                <span
                                    className="mono"
                                >

                                    {
                                        grandQuantity.toFixed(3)
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
                                            surveyRate
                                        )
                                    }

                                </span>

                            </div>


                            {/* DIRECT COST */}

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


                            {/* VAT */}

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


                            {/* QCC */}

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


                            {/* GRAND TOTAL */}

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