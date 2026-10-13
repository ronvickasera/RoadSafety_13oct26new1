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

export const defaultAssumptions = {
  bt: {
    density: 2.3,
    bitumenPct: 0.05,
    aggDensity: 1.55,
    wastage: 0.1,
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

export function computeBT(a = defaultAssumptions.bt) {
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
    items: [
      {
        l: `Bitumen (${bitKg.toFixed(1)} kg/cum @ ₹${SOR.bitumenRate}/kg)`,
        v: bitCost
      },
      {
        l: `Aggregate (${aggVol.toFixed(2)} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,
        v: aggCost
      },
      {
        l: `Pot-hole repair machine (@ ₹${SOR.potholeMachineRate}/hr ÷ ${assumptions.machineOutput} cum/hr)`,
        v: mchCost
      },
      {
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

export function computeCC(a = defaultAssumptions.cc) {
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
    items: [
      {
        l: `Cement (${assumptions.cementKg} kg/cum @ ₹${SOR.cementRate}/kg)`,
        v: cemCost
      },
      {
        l: `Sand (${assumptions.sandVol} cum/cum @ ₹${SOR.sandRate}/cum)`,
        v: sandCost
      },
      {
        l: `Coarse aggregate (${assumptions.aggVol} cum/cum @ ₹${SOR.aggRate20mm}/cum)`,
        v: aggCost
      },
      {
        l: `Water (${assumptions.waterKl} kl/cum @ ₹${SOR.waterRate}/kl)`,
        v: waterCost
      },
      {
        l: `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,
        v: labCost
      },
      {
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

export function computeWBM(a = defaultAssumptions.wbm) {
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
    items: [
      {
        l: `Stone metal, 40mm (${assumptions.metalVol} cum/cum @ ₹${SOR.metalRate40mm}/cum)`,
        v: metalCost
      },
      {
        l: `Screening gravel (${assumptions.gravelVol} cum/cum @ ₹${SOR.gravelRate}/cum)`,
        v: gravelCost
      },
      {
        l: `Labour crew (₹${crewDay}/day ÷ ${assumptions.crewOutput} cum/day)`,
        v: labCost
      },
      {
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

export function computeAllRates(assumptions = defaultAssumptions) {
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
    BT: computeBT(safeAssumptions.bt),
    CC: computeCC(safeAssumptions.cc),
    WBM: computeWBM(safeAssumptions.wbm)
  };
}

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

export function fmt(n, d = 0) {
  const number = Number(n);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });
}

export function rupee(n) {
  return "₹" + fmt(n, 0);
}

export function fmtDate(iso) {
  if (!iso) {
    return "—";
  }

  const d = new Date(iso);

  if (isNaN(d.getTime())) {
    return String(iso).slice(0, 10);
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}