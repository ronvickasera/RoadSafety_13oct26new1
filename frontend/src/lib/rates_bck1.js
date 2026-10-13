// ============================================================
// rates.js
// Road Works Estimator
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
// Based on the supplied CC Road and BT Road BOQ
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

  },


  // ==========================================================
  // WBM ROAD
  //
  // These are kept separately because the supplied BOQ did
  // not contain a complete WBM road SOR.
  //
  // Replace these values with the applicable GHMC/SOR values.
  // ==========================================================

  WBM_ROAD: {

    metal40mm: 1000,

    gravel: 109,

    labour: 795,

    compactor: 60,

    vatPct: 0,

    qccPct: 0,

    ls: 0

  }

};


// ============================================================
// PATCH WORK ASSUMPTIONS
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
        l: `Bitumen (${bitKg.toFixed(1)} kg/cum @ ₹${SOR.bitumenRate}/kg)`,
        v: bitCost
      },

      {
        code: "BT-P02",
        l: `Aggregate (${aggVol.toFixed(2)} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,
        v: aggCost
      },

      {
        code: "BT-P03",
        l: `Pot-hole repair machine (@ ₹${SOR.potholeMachineRate}/hr ÷ ${assumptions.machineOutput} cum/hr)`,
        v: mchCost
      },

      {
        code: "BT-P04",
        l: `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,
        v: labCost
      }

    ],

    direct,

    ohp,

    restoration,

    cutRate: assumptions.cutRate,

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
        l: `Cement (${assumptions.cementKg} kg/cum @ ₹${SOR.cementRate}/kg)`,
        v: cemCost
      },

      {
        code: "CC-P02",
        l: `Sand (${assumptions.sandVol} cum/cum @ ₹${SOR.sandRate}/cum)`,
        v: sandCost
      },

      {
        code: "CC-P03",
        l: `Coarse aggregate (${assumptions.aggVol} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,
        v: aggCost
      },

      {
        code: "CC-P04",
        l: `Water (${assumptions.waterKl} kl/cum @ ₹${SOR.waterRate}/kl)`,
        v: waterCost
      },

      {
        code: "CC-P05",
        l: `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,
        v: labCost
      },

      {
        code: "CC-P06",
        l: `Concrete mixer (@ ₹${SOR.mixerRate}/hr ÷ ${assumptions.mixerOutput} cum/hr)`,
        v: mchCost
      }

    ],

    direct,

    ohp,

    restoration,

    cutRate: assumptions.cutRate,

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
        l: `Stone metal, 40mm (${assumptions.metalVol} cum/cum @ ₹${SOR.metalRate40mm}/cum)`,
        v: metalCost
      },

      {
        code: "WBM-P02",
        l: `Screening gravel (${assumptions.gravelVol} cum/cum @ ₹${SOR.gravelRate}/cum)`,
        v: gravelCost
      },

      {
        code: "WBM-P03",
        l: `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,
        v: labCost
      },

      {
        code: "WBM-P04",
        l: `Plate compactor (@ ₹${SOR.compactorRate}/hr ÷ ${assumptions.compactorOutput} cum/hr)`,
        v: mchCost
      }

    ],

    direct,

    ohp,

    restoration,

    cutRate: assumptions.cutRate,

    total

  };

}


// ============================================================
// FULL BT ROAD
// ============================================================

export function computeBTRoad(a = {}) {

  const assumptions = {

    length: 0,

    width: 0,

    dbmDepth: 0.05,

    sdbcDepth: 0.025,

    vatPct: ROAD_SOR.BT_ROAD.vatPct,

    qccPct: ROAD_SOR.BT_ROAD.qccPct,

    ls: ROAD_SOR.BT_ROAD.ls,

    ...a

  };


  const area =
    assumptions.length *
    assumptions.width;


  // ----------------------------------------------------------
  // Tack Coat 0.35 kg/sqm
  // ----------------------------------------------------------

  const tackCoat1Qty =
    area;


  const tackCoat1Cost =
    tackCoat1Qty *
    ROAD_SOR.BT_ROAD.tackCoat035;


  // ----------------------------------------------------------
  // DBM 50 mm
  // ----------------------------------------------------------

  const dbmQty =
    area *
    assumptions.dbmDepth;


  const dbmCost =
    dbmQty *
    ROAD_SOR.BT_ROAD.dbm50mm;


  // ----------------------------------------------------------
  // Tack Coat 0.25 kg/sqm
  // ----------------------------------------------------------

  const tackCoat2Qty =
    area;


  const tackCoat2Cost =
    tackCoat2Qty *
    ROAD_SOR.BT_ROAD.tackCoat025;


  // ----------------------------------------------------------
  // SDBC 25 mm
  // ----------------------------------------------------------

  const sdbcQty =
    area *
    assumptions.sdbcDepth;


  const sdbcCost =
    sdbcQty *
    ROAD_SOR.BT_ROAD.sdbc25mm;


  // ----------------------------------------------------------
  // DIRECT COST
  // ----------------------------------------------------------

  const direct =
    tackCoat1Cost +
    dbmCost +
    tackCoat2Cost +
    sdbcCost;


  // ----------------------------------------------------------
  // VAT
  // ----------------------------------------------------------

  const vat =
    direct *
    assumptions.vatPct;


  // ----------------------------------------------------------
  // QCC
  // ----------------------------------------------------------

  const qcc =
    direct *
    assumptions.qccPct;


  // ----------------------------------------------------------
  // TOTAL
  // ----------------------------------------------------------

  const total =
    direct +
    vat +
    qcc +
    assumptions.ls;


  return {

    type: "BT_ROAD",

    area,

    items: [

      {
        code: "BT-01",
        description: "Tack Coat 0.35 kg/sqm",
        unit: "Sqm",
        quantity: tackCoat1Qty,
        rate: ROAD_SOR.BT_ROAD.tackCoat035,
        l: `Tack Coat 0.35 kg/sqm (${tackCoat1Qty.toFixed(2)} sqm @ ₹${ROAD_SOR.BT_ROAD.tackCoat035}/sqm)`,
        v: tackCoat1Cost
      },

      {
        code: "BT-02",
        description: "Dense Graded Bituminous Macadam 50mm",
        unit: "Cum",
        quantity: dbmQty,
        rate: ROAD_SOR.BT_ROAD.dbm50mm,
        l: `DBM 50mm (${dbmQty.toFixed(3)} cum @ ₹${ROAD_SOR.BT_ROAD.dbm50mm}/cum)`,
        v: dbmCost
      },

      {
        code: "BT-03",
        description: "Tack Coat 0.25 kg/sqm",
        unit: "Sqm",
        quantity: tackCoat2Qty,
        rate: ROAD_SOR.BT_ROAD.tackCoat025,
        l: `Tack Coat 0.25 kg/sqm (${tackCoat2Qty.toFixed(2)} sqm @ ₹${ROAD_SOR.BT_ROAD.tackCoat025}/sqm)`,
        v: tackCoat2Cost
      },

      {
        code: "BT-04",
        description: "Semi Dense Bituminous Concrete 25mm",
        unit: "Cum",
        quantity: sdbcQty,
        rate: ROAD_SOR.BT_ROAD.sdbc25mm,
        l: `SDBC 25mm (${sdbcQty.toFixed(3)} cum @ ₹${ROAD_SOR.BT_ROAD.sdbc25mm}/cum)`,
        v: sdbcCost
      },

      {
        code: "BT-05",
        description: "VAT",
        unit: "%",
        quantity: assumptions.vatPct * 100,
        rate: "",
        l: `VAT ${(assumptions.vatPct * 100).toFixed(2)}%`,
        v: vat
      },

      {
        code: "BT-06",
        description: "QCC",
        unit: "%",
        quantity: assumptions.qccPct * 100,
        rate: "",
        l: `QCC ${(assumptions.qccPct * 100).toFixed(2)}%`,
        v: qcc
      },

      {
        code: "BT-07",
        description: "L/S",
        unit: "L/S",
        quantity: 1,
        rate: assumptions.ls,
        l: "L/S",
        v: assumptions.ls
      }

    ],

    direct,

    vat,

    qcc,

    ls: assumptions.ls,

    total

  };

}


// ============================================================
// FULL CC ROAD
// ============================================================

export function computeCCRoad(a = {}) {

  const assumptions = {

    length: 0,

    width: 0,

    rockCutDepth: 0.06,

    rockCutPercentage: 0.75,

    earthDepth: 0.05,

    pccDepth: 0.075,

    vccDepth: 0.10,

    vatPct: ROAD_SOR.CC_ROAD.vatPct,

    qccPct: ROAD_SOR.CC_ROAD.qccPct,

    ls: ROAD_SOR.CC_ROAD.ls,

    ...a

  };


  // ----------------------------------------------------------
  // Rock cutting
  // ----------------------------------------------------------

  const totalRockQty =
    assumptions.length *
    assumptions.width *
    assumptions.rockCutDepth;


  const rockQty =
    totalRockQty *
    assumptions.rockCutPercentage;


  const rockCost =
    rockQty *
    ROAD_SOR.CC_ROAD.rockCutting;


  // ----------------------------------------------------------
  // Earth excavation
  // ----------------------------------------------------------

  const earthQty =
    assumptions.length *
    assumptions.width *
    assumptions.earthDepth;


  const earthCost =
    earthQty *
    ROAD_SOR.CC_ROAD.earthExcavation;


  // ----------------------------------------------------------
  // Carting
  //
  // Based on the supplied BOQ:
  // Qty = Rock Cutting Qty + Earth Excavation Qty
  // ----------------------------------------------------------

  const cartingQty =
    rockQty +
    earthQty;


  const cartingCost =
    cartingQty *
    ROAD_SOR.CC_ROAD.earthCarting20Km;


  // ----------------------------------------------------------
  // PCC 1:4:8
  // ----------------------------------------------------------

  const pccQty =
    assumptions.length *
    assumptions.width *
    assumptions.pccDepth;


  const pccCost =
    pccQty *
    ROAD_SOR.CC_ROAD.pcc148;


  // ----------------------------------------------------------
  // VCC 1:2:4
  // ----------------------------------------------------------

  const vccQty =
    assumptions.length *
    assumptions.width *
    assumptions.vccDepth;


  const vccCost =
    vccQty *
    ROAD_SOR.CC_ROAD.vcc124;


  // ----------------------------------------------------------
  // Direct Cost
  // ----------------------------------------------------------

  const direct =
    rockCost +
    earthCost +
    cartingCost +
    pccCost +
    vccCost;


  // ----------------------------------------------------------
  // VAT
  // ----------------------------------------------------------

  const vat =
    direct *
    assumptions.vatPct;


  // ----------------------------------------------------------
  // QCC
  // ----------------------------------------------------------

  const qcc =
    direct *
    assumptions.qccPct;


  // ----------------------------------------------------------
  // Total
  // ----------------------------------------------------------

  const total =
    direct +
    vat +
    qcc +
    assumptions.ls;


  return {

    type: "CC_ROAD",

    area:
      assumptions.length *
      assumptions.width,

    items: [

      {
        code: "CC-01",
        description: "Rock Cutting",
        unit: "Cum",
        quantity: rockQty,
        rate: ROAD_SOR.CC_ROAD.rockCutting,
        l: `Rock cutting (${rockQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.rockCutting}/cum)`,
        v: rockCost
      },

      {
        code: "CC-02",
        description: "Earth Excavation",
        unit: "Cum",
        quantity: earthQty,
        rate: ROAD_SOR.CC_ROAD.earthExcavation,
        l: `Earth excavation (${earthQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.earthExcavation}/cum)`,
        v: earthCost
      },

      {
        code: "CC-03",
        description: "Earth Carting 20 KM",
        unit: "Cum",
        quantity: cartingQty,
        rate: ROAD_SOR.CC_ROAD.earthCarting20Km,
        l: `Earth carting 20 KM (${cartingQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.earthCarting20Km}/cum)`,
        v: cartingCost
      },

      {
        code: "CC-04",
        description: "PCC 1:4:8",
        unit: "Cum",
        quantity: pccQty,
        rate: ROAD_SOR.CC_ROAD.pcc148,
        l: `PCC 1:4:8 (${pccQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.pcc148}/cum)`,
        v: pccCost
      },

      {
        code: "CC-05",
        description: "VCC 1:2:4",
        unit: "Cum",
        quantity: vccQty,
        rate: ROAD_SOR.CC_ROAD.vcc124,
        l: `VCC 1:2:4 (${vccQty.toFixed(3)} cum @ ₹${ROAD_SOR.CC_ROAD.vcc124}/cum)`,
        v: vccCost
      },

      {
        code: "CC-06",
        description: "VAT",
        unit: "%",
        quantity: assumptions.vatPct * 100,
        rate: "",
        l: `VAT ${(assumptions.vatPct * 100).toFixed(2)}%`,
        v: vat
      },

      {
        code: "CC-07",
        description: "QCC",
        unit: "%",
        quantity: assumptions.qccPct * 100,
        rate: "",
        l: `QCC ${(assumptions.qccPct * 100).toFixed(2)}%`,
        v: qcc
      },

      {
        code: "CC-08",
        description: "L/S",
        unit: "L/S",
        quantity: 1,
        rate: assumptions.ls,
        l: "L/S",
        v: assumptions.ls
      }

    ],

    direct,

    vat,

    qcc,

    ls: assumptions.ls,

    total

  };

}


// ============================================================
// FULL WBM ROAD
// ============================================================

export function computeWBMRoad(a = {}) {

  const assumptions = {

    length: 0,

    width: 0,

    metalDepth: 0.125,

    gravelDepth: 0.025,

    wastage: 0.10,

    vatPct: ROAD_SOR.WBM_ROAD.vatPct,

    qccPct: ROAD_SOR.WBM_ROAD.qccPct,

    ls: ROAD_SOR.WBM_ROAD.ls,

    ...a

  };


  const area =
    assumptions.length *
    assumptions.width;


  // ----------------------------------------------------------
  // Stone metal
  // ----------------------------------------------------------

  const metalBaseQty =
    area *
    assumptions.metalDepth;


  const metalQty =
    metalBaseQty *
    (1 + assumptions.wastage);


  const metalCost =
    metalQty *
    ROAD_SOR.WBM_ROAD.metal40mm;


  // ----------------------------------------------------------
  // Screening gravel
  // ----------------------------------------------------------

  const gravelBaseQty =
    area *
    assumptions.gravelDepth;


  const gravelQty =
    gravelBaseQty *
    (1 + assumptions.wastage);


  const gravelCost =
    gravelQty *
    ROAD_SOR.WBM_ROAD.gravel;


  // ----------------------------------------------------------
  // Labour
  // ----------------------------------------------------------

  const labourCost =
    area *
    ROAD_SOR.WBM_ROAD.labour;


  // ----------------------------------------------------------
  // Compaction
  // ----------------------------------------------------------

  const compactionCost =
    area *
    ROAD_SOR.WBM_ROAD.compactor;


  // ----------------------------------------------------------
  // Direct
  // ----------------------------------------------------------

  const direct =
    metalCost +
    gravelCost +
    labourCost +
    compactionCost;


  const vat =
    direct *
    assumptions.vatPct;


  const qcc =
    direct *
    assumptions.qccPct;


  const total =
    direct +
    vat +
    qcc +
    assumptions.ls;


  return {

    type: "WBM_ROAD",

    area,

    items: [

      {
        code: "WBM-01",
        description: "Stone Metal 40mm",
        unit: "Cum",
        quantity: metalQty,
        rate: ROAD_SOR.WBM_ROAD.metal40mm,
        l: `Stone metal 40mm (${metalQty.toFixed(3)} cum @ ₹${ROAD_SOR.WBM_ROAD.metal40mm}/cum)`,
        v: metalCost
      },

      {
        code: "WBM-02",
        description: "Screening Gravel",
        unit: "Cum",
        quantity: gravelQty,
        rate: ROAD_SOR.WBM_ROAD.gravel,
        l: `Screening gravel (${gravelQty.toFixed(3)} cum @ ₹${ROAD_SOR.WBM_ROAD.gravel}/cum)`,
        v: gravelCost
      },

      {
        code: "WBM-03",
        description: "Labour",
        unit: "Sqm",
        quantity: area,
        rate: ROAD_SOR.WBM_ROAD.labour,
        l: `Labour (${area.toFixed(2)} sqm)`,
        v: labourCost
      },

      {
        code: "WBM-04",
        description: "Compaction",
        unit: "Sqm",
        quantity: area,
        rate: ROAD_SOR.WBM_ROAD.compactor,
        l: `Compaction (${area.toFixed(2)} sqm)`,
        v: compactionCost
      },

      {
        code: "WBM-05",
        description: "VAT",
        unit: "%",
        quantity: assumptions.vatPct * 100,
        rate: "",
        l: `VAT ${(assumptions.vatPct * 100).toFixed(2)}%`,
        v: vat
      },

      {
        code: "WBM-06",
        description: "QCC",
        unit: "%",
        quantity: assumptions.qccPct * 100,
        rate: "",
        l: `QCC ${(assumptions.qccPct * 100).toFixed(2)}%`,
        v: qcc
      },

      {
        code: "WBM-07",
        description: "L/S",
        unit: "L/S",
        quantity: 1,
        rate: assumptions.ls,
        l: "L/S",
        v: assumptions.ls
      }

    ],

    direct,

    vat,

    qcc,

    ls: assumptions.ls,

    total

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

    BT: computeBT(
      safeAssumptions.bt
    ),

    CC: computeCC(
      safeAssumptions.cc
    ),

    WBM: computeWBM(
      safeAssumptions.wbm
    ),

    BT_ROAD: computeBTRoad(),

    CC_ROAD: computeCCRoad(),

    WBM_ROAD: computeWBMRoad()

  };

}


// ============================================================
// ROAD TYPE CONFIGURATION
// ============================================================

export const ROAD_TYPES = {

  BT_ROAD: {

    key: "BT_ROAD",

    label: "BT Road",

    category: "FULL_ROAD",

    unit: "Cum"

  },

  CC_ROAD: {

    key: "CC_ROAD",

    label: "CC Road",

    category: "FULL_ROAD",

    unit: "Cum"

  },

  WBM_ROAD: {

    key: "WBM_ROAD",

    label: "WBM Road",

    category: "FULL_ROAD",

    unit: "Cum"

  },

  BT: {

    key: "BT",

    label: "BT Patch Work",

    category: "PATCH_WORK",

    unit: "Cum"

  },

  CC: {

    key: "CC",

    label: "CC Patch Work",

    category: "PATCH_WORK",

    unit: "Cum"

  },

  WBM: {

    key: "WBM",

    label: "WBM / Gravel Patch Work",

    category: "PATCH_WORK",

    unit: "Cum"

  }

};


// ============================================================
// RATE FIELDS
// ============================================================

export const RATE_FIELDS = {

  BT: {

    key: "bt",

    label: "BT — Bituminous Patch",

    fields: [

      ["density", "Compacted mix density", "t/cum", 0.01],

      ["bitumenPct", "Bitumen content", "% of wt", 0.001, true],

      ["aggDensity", "Aggregate bulk density", "t/cum", 0.01],

      ["wastage", "Wastage allowance", "%", 0.01, true],

      ["machineOutput", "Machine output", "cum/hr", 0.1],

      ["crewOutput", "Crew output", "cum/day", 0.5],

      ["cutRate", "Cutting rate (SoR)", "₹/cum", 1]

    ]

  },


  CC: {

    key: "cc",

    label: "CC — Cement Concrete Patch",

    fields: [

      ["cementKg", "Cement", "kg/cum", 5],

      ["sandVol", "Sand", "cum/cum", 0.01],

      ["aggVol", "Coarse aggregate", "cum/cum", 0.01],

      ["waterKl", "Water", "kl/cum", 0.01],

      ["crewOutput", "Crew output", "cum/day", 0.5],

      ["mixerOutput", "Mixer output", "cum/hr", 0.1],

      ["cutRate", "Cutting rate (SoR)", "₹/cum", 1]

    ]

  },


  WBM: {

    key: "wbm",

    label: "WBM — Gravel Patch",

    fields: [

      ["metalVol", "Stone metal", "cum/cum", 0.01],

      ["gravelVol", "Screening gravel", "cum/cum", 0.01],

      ["crewOutput", "Crew output", "cum/day", 0.5],

      ["compactorOutput", "Compactor output", "cum/hr", 0.1],

      ["cutRate", "Cutting rate (SoR)", "₹/cum", 1]

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

      minimumFractionDigits: d,

      maximumFractionDigits: d

    }
  );

}


export function rupee(n) {

  return "₹" + fmt(
    n,
    0
  );

}


export function fmtDate(iso) {

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
      .slice(0, 10);

  }


  return d.toLocaleDateString(
    "en-IN",
    {

      day: "2-digit",

      month: "short",

      year: "numeric"

    }
  );

}