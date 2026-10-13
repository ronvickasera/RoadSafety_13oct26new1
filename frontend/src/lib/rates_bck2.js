// ============================================================
// rates.js
// Road Works Estimator
// BT ROAD + CC ROAD
// ============================================================


// ============================================================
// BASIC SOR
// ============================================================

export const SOR = {

    bitumenRate: 67,

    aggRate20mm: 1300,

    metalRate40mm: 1000,

    gravelRate: 109,

    cementRate: 5.1,

    sandRate: 777,

    waterRate: 109,

    potholeMachineRate: 1041,

    mixerRate: 815,

    compactorRate: 60,

    labAsphaltSprayer: 765,

    labMazdoorUnskilled: 715,

    labMason: 795,

    ohp: 0.13615,

    cutBT: 1150,

    cutCC: 2392,

    cutWBM: 294

};


// ============================================================
// FULL ROAD SOR
// ============================================================

export const ROAD_SOR = {

    // ==========================================================
    // CC ROAD
    // ==========================================================

    CC_ROAD: {

        rockCutting: 474,

        earthExcavation: 162.66,

        earthCarting20Km: 269.80,

        pcc148: 4888.17,

        vcc124: 5905.12,

        vatPct: 0.05,

        qccPct: 0.01,

        ls: 4862.97

    },


    // ==========================================================
    // BT ROAD
    // ==========================================================

    BT_ROAD: {

        tackCoat035: 21.45,

        dbm50mm: 9627.74,

        tackCoat025: 14.36,

        sdbc25mm: 10088.30,

        vatPct: 0.05,

        qccPct: 0.005,

        ls: 22520

    }

};


// ============================================================
// BT ROAD BOQ DEFINITIONS
// ============================================================

export const BT_ROAD_BOQ = [

    {

        code: "BT-01",

        shortDescription:
            "Tack Coat 0.35 kg/sqm",

        description:
            "Providing and applying tack coat with bituminous emulsion confirming to IS 8887 at 0.35 Kgs per 1 Sqm / 3.5 Kg per 10 Sqm on WBM surface granular base and spraying the bituminous emulsion uniformly in the normal range of spraying temperature and applied uniformly with the aid of a bitumen pressure sprayer and spraying bar with nozzles including cost and conveyance of bitumen, labour charges, hire and operational charges of all T&P necessary to complete as per specification.",

        unit: "Sqm",

        rate:
            ROAD_SOR.BT_ROAD.tackCoat035

    },

    {

        code: "BT-02",

        shortDescription:
            "Dense Graded Bituminous Macadam 50mm",

        description:
            "Providing and laying 50mm thick dense graded bituminous macadam with 40-60 TPH HMP producing an average output of 17 cum per hour using crushed aggregates of specified grading-II as per Table 500-10 of MORTH premixed with bituminous binder 60/70 Grade as per IS 73 @ 4.5 per cent by weight of total mix and filler cement at 2% by weight of total aggregates including loading of material with FE loader, heating of binder, aggregates and filler in Drum/Batch type Hot Mix Plant, transporting the hot mix to work site by tippers, laying with a mechanical paver finisher to the required grade, level and alignment, rolling with smooth wheeled rollers and vibratory rollers to achieve the desired compaction and density including hire and operational charges of all T&P, seigniorage charges and all taxes etc. complete for finished item of work as per MORTH specification clause No. 507 complete in all respects but excluding cost of Tack Coat.",

        unit: "Cum",

        rate:
            ROAD_SOR.BT_ROAD.dbm50mm

    },

    {

        code: "BT-03",

        shortDescription:
            "Tack Coat 0.25 kg/10 sqm",

        description:
            "Providing and applying tack coat with bituminous emulsion confirming to IS 8887 at 0.25 Kgs per 10 Sqm on WBM surface granular base and spraying the bituminous emulsion uniformly in the normal range of spraying temperature and applied uniformly with the aid of a bitumen pressure sprayer and spraying bar with nozzles including cost and conveyance of bitumen, labour charges, hire and operational charges of all T&P necessary to complete as per specification.",

        unit: "Sqm",

        rate:
            ROAD_SOR.BT_ROAD.tackCoat025

    },

    {

        code: "BT-04",

        shortDescription:
            "Semi Dense Bituminous Concrete 25mm",

        description:
            "Providing and laying 25mm thick semi dense bituminous concrete with 40 to 60 TPH HMP producing an average output of 17 Cum/hour using crushed granite aggregates of Grading 2 as per Table 500-15 of MORTH premixed with bituminous binder of 60/70 grade as per IS:73 @ 5% by weight of total mix and filler i.e. cement @ 2.00% by weight of aggregates in Drum/Batch type hot mix plant using FE loader, transporting the hot mix to work site by tippers, laying with mechanical paver finisher to the required grade, level and alignment, rolling with smooth wheeled roller and vibratory roller as per clause 501.6 and 501.70 to achieve the desired compaction and density including all hire and operational charges, taxes, seigniorage charges etc. complete as per MORTH specification No. 508 complete in all respects for finished item of work but excluding cost of Tack Coat.",

        unit: "Cum",

        rate:
            ROAD_SOR.BT_ROAD.sdbc25mm

    }

];


// ============================================================
// CC ROAD BOQ DEFINITIONS
// ============================================================

export const CC_ROAD_BOQ = [

    {

        code: "CC-01",

        shortDescription:
            "Rock Cutting",

        description:
            "Rock Cutting including cost and conveyance of all material charges as per specification.",

        unit: "Cum",

        rate:
            ROAD_SOR.CC_ROAD.rockCutting

    },

    {

        code: "CC-02",

        shortDescription:
            "Earth Work Excavation",

        description:
            "Earth work excavation and depositing on bank with an initial lead of 10m and initial lift of 2m in case of head lead only in loamy and clay soils like black cotton soil, red earth or ordinary gravel SS 20-B as per specification.",

        unit: "Cum",

        rate:
            ROAD_SOR.CC_ROAD.earthExcavation

    },

    {

        code: "CC-03",

        shortDescription:
            "Earth Carting 20 KM",

        description:
            "Carting the excavated earth with a lead of 20KM including loading, unloading, stacking including cost and conveyance of all materials charges and labour charges etc., complete as per standard specification.",

        unit: "Cum",

        rate:
            ROAD_SOR.CC_ROAD.earthCarting20Km

    },

    {

        code: "CC-04",

        shortDescription:
            "PCC 1:4:8",

        description:
            "Plain Cement Concrete (1:4:8) proportion using 20mm metal with concrete mixture including cost and conveyance of all materials like cement, sand, coarse aggregate, water etc. to site, seigniorage charges on all materials, turnover tax and labour charges for mixing, laying concrete, ramming in 15cm layers, finishing top surface to the required level, curing etc. complete for finished item of work as per SSR No. 402 CC road.",

        unit: "Cum",

        rate:
            ROAD_SOR.CC_ROAD.pcc148

    },

    {

        code: "CC-05",

        shortDescription:
            "VCC 1:2:4",

        description:
            "Laying VCC (1:2:4) proportion using 20mm to 10mm HBG including cost and conveyance of all materials like cement, sand, coarse aggregate, water etc. to site, cost of seigniorage charges on all materials, all taxes and labour charges for mixing, laying concrete for foundation tamping, vibrating, lifting, curing, finishing top surface for benching, kerbing, lintel and table drain, but excluding centering shuttering charges, cost of steel and fabrication charges etc. complete for finished item of work as per specification per 1 Cum.",

        unit: "Cum",

        rate:
            ROAD_SOR.CC_ROAD.vcc124

    }

];


// ============================================================
// PATCH WORK ASSUMPTIONS
// Kept for compatibility with existing application.
// ============================================================

export const defaultAssumptions = {

    bt: {

        density: 2.3,

        bitumenPct: 0.05,

        aggDensity: 1.55,

        wastage: 0.10,

        machineOutput: 1.2,

        crewOutput: 5.0,

        cutRate: SOR.cutBT

    },

    cc: {

        cementKg: 320,

        sandVol: 0.45,

        aggVol: 0.9,

        waterKl: 0.18,

        crewOutput: 3.0,

        mixerOutput: 1.5,

        cutRate: SOR.cutCC

    },

    wbm: {

        metalVol: 1.25,

        gravelVol: 0.2,

        crewOutput: 4.0,

        compactorOutput: 1.0,

        cutRate: SOR.cutWBM

    }

};


// ============================================================
// PATCH WORK - BT
// ============================================================

export function computeBT(
    a = defaultAssumptions.bt
) {

    const assumptions = {

        ...defaultAssumptions.bt,

        ...(a || {})

    };


    const bitKg =
        assumptions.density *
        1000 *
        assumptions.bitumenPct;


    const bitCost =
        bitKg *
        SOR.bitumenRate;


    const aggT =
        assumptions.density *
        (1 - assumptions.bitumenPct);


    const aggVol =
        (aggT / assumptions.aggDensity) *
        (1 + assumptions.wastage);


    const aggCost =
        aggVol *
        SOR.aggRate20mm;


    const mchCost =
        (1 / assumptions.machineOutput) *
        SOR.potholeMachineRate;


    const crewDay =
        SOR.labAsphaltSprayer +
        2 * SOR.labMazdoorUnskilled;


    const labCost =
        crewDay /
        assumptions.crewOutput;


    const direct =
        bitCost +
        aggCost +
        mchCost +
        labCost;


    const ohp =
        direct *
        SOR.ohp;


    const restoration =
        direct +
        ohp;


    const total =
        restoration +
        assumptions.cutRate;


    return {

        type: "BT",

        items: [

            {

                code: "BT-P01",

                l:
                    `Bitumen (${bitKg.toFixed(1)} kg/cum @ ₹${SOR.bitumenRate}/kg)`,

                v:
                    bitCost

            },

            {

                code: "BT-P02",

                l:
                    `Aggregate (${aggVol.toFixed(2)} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,

                v:
                    aggCost

            },

            {

                code: "BT-P03",

                l:
                    `Pot-hole repair machine (@ ₹${SOR.potholeMachineRate}/hr ÷ ${assumptions.machineOutput} cum/hr)`,

                v:
                    mchCost

            },

            {

                code: "BT-P04",

                l:
                    `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,

                v:
                    labCost

            }

        ],

        direct,

        ohp,

        restoration,

        cutRate:
            assumptions.cutRate,

        total

    };

}


// ============================================================
// PATCH WORK - CC
// ============================================================

export function computeCC(
    a = defaultAssumptions.cc
) {

    const assumptions = {

        ...defaultAssumptions.cc,

        ...(a || {})

    };


    const cemCost =
        assumptions.cementKg *
        SOR.cementRate;


    const sandCost =
        assumptions.sandVol *
        SOR.sandRate;


    const aggCost =
        assumptions.aggVol *
        SOR.aggRate20mm;


    const waterCost =
        assumptions.waterKl *
        SOR.waterRate;


    const crewDay =
        SOR.labMason +
        2 * SOR.labMazdoorUnskilled;


    const labCost =
        crewDay /
        assumptions.crewOutput;


    const mchCost =
        (1 / assumptions.mixerOutput) *
        SOR.mixerRate;


    const direct =
        cemCost +
        sandCost +
        aggCost +
        waterCost +
        labCost +
        mchCost;


    const ohp =
        direct *
        SOR.ohp;


    const restoration =
        direct +
        ohp;


    const total =
        restoration +
        assumptions.cutRate;


    return {

        type: "CC",

        items: [

            {

                code: "CC-P01",

                l:
                    `Cement (${assumptions.cementKg} kg/cum @ ₹${SOR.cementRate}/kg)`,

                v:
                    cemCost

            },

            {

                code: "CC-P02",

                l:
                    `Sand (${assumptions.sandVol} cum/cum @ ₹${SOR.sandRate}/cum)`,

                v:
                    sandCost

            },

            {

                code: "CC-P03",

                l:
                    `Coarse aggregate (${assumptions.aggVol} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,

                v:
                    aggCost

            },

            {

                code: "CC-P04",

                l:
                    `Water (${assumptions.waterKl} kl/cum @ ₹${SOR.waterRate}/kl)`,

                v:
                    waterCost

            },

            {

                code: "CC-P05",

                l:
                    `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,

                v:
                    labCost

            },

            {

                code: "CC-P06",

                l:
                    `Concrete mixer (@ ₹${SOR.mixerRate}/hr ÷ ${assumptions.mixerOutput} cum/hr)`,

                v:
                    mchCost

            }

        ],

        direct,

        ohp,

        restoration,

        cutRate:
            assumptions.cutRate,

        total

    };

}


// ============================================================
// PATCH WORK - WBM
// ============================================================

export function computeWBM(
    a = defaultAssumptions.wbm
) {

    const assumptions = {

        ...defaultAssumptions.wbm,

        ...(a || {})

    };


    const metalCost =
        assumptions.metalVol *
        SOR.metalRate40mm;


    const gravelCost =
        assumptions.gravelVol *
        SOR.gravelRate;


    const crewDay =
        SOR.labMason +
        2 * SOR.labMazdoorUnskilled;


    const labCost =
        crewDay /
        assumptions.crewOutput;


    const mchCost =
        (1 / assumptions.compactorOutput) *
        SOR.compactorRate;


    const direct =
        metalCost +
        gravelCost +
        labCost +
        mchCost;


    const ohp =
        direct *
        SOR.ohp;


    const restoration =
        direct +
        ohp;


    const total =
        restoration +
        assumptions.cutRate;


    return {

        type: "WBM",

        items: [

            {

                code: "WBM-P01",

                l:
                    `Stone metal, 40mm (${assumptions.metalVol} cum/cum @ ₹${SOR.metalRate40mm}/cum)`,

                v:
                    metalCost

            },

            {

                code: "WBM-P02",

                l:
                    `Screening gravel (${assumptions.gravelVol} cum/cum @ ₹${SOR.gravelRate}/cum)`,

                v:
                    gravelCost

            },

            {

                code: "WBM-P03",

                l:
                    `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,

                v:
                    labCost

            },

            {

                code: "WBM-P04",

                l:
                    `Plate compactor (@ ₹${SOR.compactorRate}/hr ÷ ${assumptions.compactorOutput} cum/hr)`,

                v:
                    mchCost

            }

        ],

        direct,

        ohp,

        restoration,

        cutRate:
            assumptions.cutRate,

        total

    };

}


// ============================================================
// FULL BT ROAD
// ============================================================
//
// selectedItem:
//   BT-01 = Tack Coat 0.35
//   BT-02 = DBM 50mm
//   BT-03 = Tack Coat 0.25
//   BT-04 = SDBC 25mm
//
// selectedItem = ALL calculates complete BT BOQ.
// ============================================================

export function computeBTRoad(
    a = {}
) {

    const assumptions = {

        length: 0,

        width: 0,

        dbmDepth: 0.05,

        sdbcDepth: 0.025,

        vatPct:
            ROAD_SOR.BT_ROAD.vatPct,

        qccPct:
            ROAD_SOR.BT_ROAD.qccPct,

        ls:
            ROAD_SOR.BT_ROAD.ls,

        selectedItem: "ALL",

        ...a

    };


    const length =
        Number(
            assumptions.length
        ) || 0;


    const width =
        Number(
            assumptions.width
        ) || 0;


    const area =
        length *
        width;


    if (
        area <= 0
    ) {

        return {

            type: "BT_ROAD",

            area: 0,

            selectedItem:
                assumptions.selectedItem,

            items: [],

            direct: 0,

            vat: 0,

            qcc: 0,

            ls: 0,

            total: 0

        };

    }


    const items = [];


    // =========================================================
    // BT-01
    // =========================================================

    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "BT-01"
    ) {

        const quantity =
            area;


        const amount =
            quantity *
            ROAD_SOR.BT_ROAD.tackCoat035;


        items.push({

            code: "BT-01",

            description:
                "Tack Coat 0.35 kg/sqm",

            unit:
                "Sqm",

            quantity,

            rate:
                ROAD_SOR.BT_ROAD.tackCoat035,

            l:
                `Tack Coat 0.35 kg/sqm (${quantity.toFixed(2)} sqm @ ₹${ROAD_SOR.BT_ROAD.tackCoat035}/sqm)`,

            v:
                amount

        });

    }


    // =========================================================
    // BT-02
    // =========================================================

    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "BT-02"
    ) {

        const quantity =
            area *
            Number(
                assumptions.dbmDepth
            );


        const amount =
            quantity *
            ROAD_SOR.BT_ROAD.dbm50mm;


        items.push({

            code: "BT-02",

            description:
                "Dense Graded Bituminous Macadam 50mm",

            unit:
                "Cum",

            quantity,

            rate:
                ROAD_SOR.BT_ROAD.dbm50mm,

            l:
                `DBM 50mm (${quantity.toFixed(3)} cum @ ₹${ROAD_SOR.BT_ROAD.dbm50mm}/cum)`,

            v:
                amount

        });

    }


    // =========================================================
    // BT-03
    // =========================================================

    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "BT-03"
    ) {

        const quantity =
            area;


        const amount =
            quantity *
            ROAD_SOR.BT_ROAD.tackCoat025;


        items.push({

            code: "BT-03",

            description:
                "Tack Coat 0.25 kg/10 sqm",

            unit:
                "Sqm",

            quantity,

            rate:
                ROAD_SOR.BT_ROAD.tackCoat025,

            l:
                `Tack Coat 0.25 kg/10 sqm (${quantity.toFixed(2)} sqm @ ₹${ROAD_SOR.BT_ROAD.tackCoat025}/sqm)`,

            v:
                amount

        });

    }


    // =========================================================
    // BT-04
    // =========================================================

    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "BT-04"
    ) {

        const quantity =
            area *
            Number(
                assumptions.sdbcDepth
            );


        const amount =
            quantity *
            ROAD_SOR.BT_ROAD.sdbc25mm;


        items.push({

            code: "BT-04",

            description:
                "Semi Dense Bituminous Concrete 25mm",

            unit:
                "Cum",

            quantity,

            rate:
                ROAD_SOR.BT_ROAD.sdbc25mm,

            l:
                `SDBC 25mm (${quantity.toFixed(3)} cum @ ₹${ROAD_SOR.BT_ROAD.sdbc25mm}/cum)`,

            v:
                amount

        });

    }


    // =========================================================
    // DIRECT COST
    // =========================================================

    const direct =
        items.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(item.v || 0),
            0
        );


    // =========================================================
    // VAT
    // =========================================================

    const vat =
        direct *
        Number(
            assumptions.vatPct
        );


    // =========================================================
    // QCC
    // =========================================================

    const qcc =
        direct *
        Number(
            assumptions.qccPct
        );


    // =========================================================
    // L/S
    // =========================================================
    //
    // L/S is applied only when ALL items are selected.
    // =========================================================

    const ls =
        assumptions.selectedItem === "ALL"
            ? Number(
                assumptions.ls
            )
            : 0;


    // =========================================================
    // TOTAL
    // =========================================================

    const total =
        direct +
        vat +
        qcc +
        ls;


    return {

        type:
            "BT_ROAD",

        area,

        selectedItem:
            assumptions.selectedItem,

        items,

        direct,

        vat,

        qcc,

        ls,

        total

    };

}


// ============================================================
// FULL CC ROAD
// ============================================================
//
// selectedItem:
//   CC-01 = Rock Cutting
//   CC-02 = Earth Excavation
//   CC-03 = Earth Carting
//   CC-04 = PCC
//   CC-05 = VCC
//
// selectedItem = ALL calculates complete CC BOQ.
// ============================================================

export function computeCCRoad(
    a = {}
) {

    const assumptions = {

        length: 0,

        width: 0,

        rockCutDepth: 0.06,

        rockCutPercentage: 0.75,

        earthDepth: 0.05,

        pccDepth: 0.075,

        vccDepth: 0.10,

        vatPct:
            ROAD_SOR.CC_ROAD.vatPct,

        qccPct:
            ROAD_SOR.CC_ROAD.qccPct,

        ls:
            ROAD_SOR.CC_ROAD.ls,

        selectedItem: "ALL",

        ...a

    };


    const length =
        Number(
            assumptions.length
        ) || 0;


    const width =
        Number(
            assumptions.width
        ) || 0;


    const area =
        length *
        width;


    if (
        area <= 0
    ) {

        return {

            type: "CC_ROAD",

            area: 0,

            selectedItem:
                assumptions.selectedItem,

            items: [],

            direct: 0,

            vat: 0,

            qcc: 0,

            ls: 0,

            total: 0

        };

    }


    const items = [];


    // =========================================================
    // CC-01 ROCK CUTTING
    // =========================================================

    const totalRockQty =
        area *
        Number(
            assumptions.rockCutDepth
        );


    const rockQty =
        totalRockQty *
        Number(
            assumptions.rockCutPercentage
        );


    const rockCost =
        rockQty *
        ROAD_SOR.CC_ROAD.rockCutting;


    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "CC-01"
    ) {

        items.push({

            code: "CC-01",

            description:
                "Rock Cutting",

            unit:
                "Cum",

            quantity:
                rockQty,

            rate:
                ROAD_SOR.CC_ROAD.rockCutting,

            l:
                `Rock cutting (${rockQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.rockCutting}/cum)`,

            v:
                rockCost

        });

    }


    // =========================================================
    // CC-02 EARTH EXCAVATION
    // =========================================================

    const earthQty =
        area *
        Number(
            assumptions.earthDepth
        );


    const earthCost =
        earthQty *
        ROAD_SOR.CC_ROAD.earthExcavation;


    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "CC-02"
    ) {

        items.push({

            code: "CC-02",

            description:
                "Earth Work Excavation",

            unit:
                "Cum",

            quantity:
                earthQty,

            rate:
                ROAD_SOR.CC_ROAD.earthExcavation,

            l:
                `Earth excavation (${earthQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.earthExcavation}/cum)`,

            v:
                earthCost

        });

    }


    // =========================================================
    // CC-03 EARTH CARTING
    // =========================================================
    //
    // Supplied BOQ:
    // Carting Qty = Rock Qty + Earth Qty
    // =========================================================

    const cartingQty =
        rockQty +
        earthQty;


    const cartingCost =
        cartingQty *
        ROAD_SOR.CC_ROAD.earthCarting20Km;


    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "CC-03"
    ) {

        items.push({

            code: "CC-03",

            description:
                "Earth Carting 20 KM",

            unit:
                "Cum",

            quantity:
                cartingQty,

            rate:
                ROAD_SOR.CC_ROAD.earthCarting20Km,

            l:
                `Earth carting 20 KM (${cartingQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.earthCarting20Km}/cum)`,

            v:
                cartingCost

        });

    }


    // =========================================================
    // CC-04 PCC
    // =========================================================

    const pccQty =
        area *
        Number(
            assumptions.pccDepth
        );


    const pccCost =
        pccQty *
        ROAD_SOR.CC_ROAD.pcc148;


    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "CC-04"
    ) {

        items.push({

            code: "CC-04",

            description:
                "PCC 1:4:8",

            unit:
                "Cum",

            quantity:
                pccQty,

            rate:
                ROAD_SOR.CC_ROAD.pcc148,

            l:
                `PCC 1:4:8 (${pccQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.pcc148}/cum)`,

            v:
                pccCost

        });

    }


    // =========================================================
    // CC-05 VCC
    // =========================================================

    const vccQty =
        area *
        Number(
            assumptions.vccDepth
        );


    const vccCost =
        vccQty *
        ROAD_SOR.CC_ROAD.vcc124;


    if (
        assumptions.selectedItem === "ALL" ||
        assumptions.selectedItem === "CC-05"
    ) {

        items.push({

            code: "CC-05",

            description:
                "VCC 1:2:4",

            unit:
                "Cum",

            quantity:
                vccQty,

            rate:
                ROAD_SOR.CC_ROAD.vcc124,

            l:
                `VCC 1:2:4 (${vccQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.vcc124}/cum)`,

            v:
                vccCost

        });

    }


    // =========================================================
    // DIRECT
    // =========================================================

    const direct =
        items.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(item.v || 0),
            0
        );


    // =========================================================
    // VAT
    // =========================================================

    const vat =
        direct *
        Number(
            assumptions.vatPct
        );


    // =========================================================
    // QCC
    // =========================================================

    const qcc =
        direct *
        Number(
            assumptions.qccPct
        );


    // =========================================================
    // L/S
    // =========================================================

    const ls =
        assumptions.selectedItem === "ALL"
            ? Number(
                assumptions.ls
            )
            : 0;


    // =========================================================
    // TOTAL
    // =========================================================

    const total =
        direct +
        vat +
        qcc +
        ls;


    return {

        type:
            "CC_ROAD",

        area,

        selectedItem:
            assumptions.selectedItem,

        items,

        direct,

        vat,

        qcc,

        ls,

        total

    };

}


// ============================================================
// COMPATIBILITY FUNCTION
// ============================================================

export function computeWBMRoad(
    a = {}
) {

    return {

        type: "WBM_ROAD",

        area:
            Number(a.length || 0) *
            Number(a.width || 0),

        items: [],

        direct: 0,

        vat: 0,

        qcc: 0,

        ls: 0,

        total: 0

    };

}


// ============================================================
// ALL RATES
// ============================================================

export function computeAllRates(
    assumptions = defaultAssumptions
) {

    const safeAssumptions = {

        ...defaultAssumptions,

        ...(assumptions || {}),

        bt: {

            ...defaultAssumptions.bt,

            ...(assumptions?.bt || {})

        },

        cc: {

            ...defaultAssumptions.cc,

            ...(assumptions?.cc || {})

        },

        wbm: {

            ...defaultAssumptions.wbm,

            ...(assumptions?.wbm || {})

        }

    };


    return {

        BT:
            computeBT(
                safeAssumptions.bt
            ),

        CC:
            computeCC(
                safeAssumptions.cc
            ),

        WBM:
            computeWBM(
                safeAssumptions.wbm
            ),

        BT_ROAD:
            computeBTRoad(),

        CC_ROAD:
            computeCCRoad(),

        WBM_ROAD:
            computeWBMRoad()

    };

}


// ============================================================
// ROAD TYPES
// ============================================================

export const ROAD_TYPES = {

    BT_ROAD: {

        key:
            "BT_ROAD",

        label:
            "BT Road",

        category:
            "FULL_ROAD",

        unit:
            "Sqm"

    },

    CC_ROAD: {

        key:
            "CC_ROAD",

        label:
            "CC Road",

        category:
            "FULL_ROAD",

        unit:
            "Cum"

    }

};


// ============================================================
// RATE FIELDS
// ============================================================

export const RATE_FIELDS = {

    BT: {

        key:
            "bt",

        label:
            "BT — Bituminous Patch",

        fields: [

            [
                "density",
                "Compacted mix density",
                "t/cum",
                0.01
            ],

            [
                "bitumenPct",
                "Bitumen content",
                "% of wt",
                0.001,
                true
            ],

            [
                "aggDensity",
                "Aggregate bulk density",
                "t/cum",
                0.01
            ],

            [
                "wastage",
                "Wastage allowance",
                "%",
                0.01,
                true
            ],

            [
                "machineOutput",
                "Machine output",
                "cum/hr",
                0.1
            ],

            [
                "crewOutput",
                "Crew output",
                "cum/day",
                0.5
            ],

            [
                "cutRate",
                "Cutting rate (SoR)",
                "₹/cum",
                1
            ]

        ]

    },


    CC: {

        key:
            "cc",

        label:
            "CC — Cement Concrete Patch",

        fields: [

            [
                "cementKg",
                "Cement",
                "kg/cum",
                5
            ],

            [
                "sandVol",
                "Sand",
                "cum/cum",
                0.01
            ],

            [
                "aggVol",
                "Coarse aggregate",
                "cum/cum",
                0.01
            ],

            [
                "waterKl",
                "Water",
                "kl/cum",
                0.01
            ],

            [
                "crewOutput",
                "Crew output",
                "cum/day",
                0.5
            ],

            [
                "mixerOutput",
                "Mixer output",
                "cum/hr",
                0.1
            ],

            [
                "cutRate",
                "Cutting rate (SoR)",
                "₹/cum",
                1
            ]

        ]

    }

};


// ============================================================
// FORMATTING
// ============================================================

export function fmt(
    n,
    d = 0
) {

    const number =
        Number(n);


    if (
        !Number.isFinite(number)
    ) {

        return "0";

    }


    return number.toLocaleString(
        "en-IN",
        {

            minimumFractionDigits:
                d,

            maximumFractionDigits:
                d

        }
    );

}


// ============================================================
// RUPEE
// ============================================================

export function rupee(n) {

    return "₹" +
        fmt(
            n,
            0
        );

}


// ============================================================
// DATE
// ============================================================

export function fmtDate(
    iso
) {

    if (!iso) {

        return "—";

    }


    const d =
        new Date(iso);


    if (
        isNaN(
            d.getTime()
        )
    ) {

        return String(iso)
            .slice(
                0,
                10
            );

    }


    return d.toLocaleDateString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}