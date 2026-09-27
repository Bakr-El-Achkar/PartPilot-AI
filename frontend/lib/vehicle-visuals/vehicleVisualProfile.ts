import type {
  Vehicle,
} from "@/lib/vehicles";


export type VehicleBodyStyle =
  | "sedan"
  | "suv"
  | "pickup"
  | "hatchback"
  | "coupe"
  | "van"
  | "generic";


export type VehicleVisualProfile = {
  bodyStyle: VehicleBodyStyle;

  /*
   * Exterior model used to visually resemble
   * the customer's active vehicle.
   *
   * These still fall back to the diagnostic
   * model until dedicated body-style assets
   * are added.
   */
  visualModelUrl: string;

  /*
   * Known diagnostic-compatible model.
   *
   * This stays stable because the AI mechanic
   * depends on its internal node names.
   */
  diagnosticModelUrl: string;

  label: string;
};


const DIAGNOSTIC_MODEL_URL =
  "/models/vehnexa-car.glb";


const VISUAL_MODEL_BY_BODY_STYLE:
  Record<
    VehicleBodyStyle,
    string
  > = {
    sedan:
      DIAGNOSTIC_MODEL_URL,

    suv:
      DIAGNOSTIC_MODEL_URL,

    pickup:
      DIAGNOSTIC_MODEL_URL,

    hatchback:
      DIAGNOSTIC_MODEL_URL,

    coupe:
      DIAGNOSTIC_MODEL_URL,

    van:
      DIAGNOSTIC_MODEL_URL,

    generic:
      DIAGNOSTIC_MODEL_URL,
  };


function normalizeVehicleText(
  vehicle: Vehicle,
) {
  return [
    vehicle.make,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


export function inferVehicleBodyStyle(
  vehicle: Vehicle,
): VehicleBodyStyle {
  const text =
    normalizeVehicleText(
      vehicle,
    );


  const suvTerms = [
    "cr-v",
    "crv",
    "rav4",
    "highlander",
    "pilot",
    "cx-5",
    "cx-9",
    "x3",
    "x5",
    "q5",
    "q7",
    "glc",
    "gle",
    "tucson",
    "santa fe",
    "sportage",
    "sorento",
    "rogue",
    "pathfinder",
    "explorer",
    "escape",
    "suburban",
    "tahoe",
    "wrangler",
    "cherokee",
  ];


  if (
    suvTerms.some(
      (term) =>
        text.includes(term),
    )
  ) {
    return "suv";
  }


  const pickupTerms = [
    "f-150",
    "f150",
    "ranger",
    "silverado",
    "colorado",
    "ram",
    "tacoma",
    "tundra",
    "hilux",
    "navara",
    "frontier",
  ];


  if (
    pickupTerms.some(
      (term) =>
        text.includes(term),
    )
  ) {
    return "pickup";
  }


  const hatchbackTerms = [
    "golf",
    "polo",
    "focus",
    "fiesta",
    "yaris",
    "fit",
    "jazz",
    "mazda3 hatch",
  ];


  if (
    hatchbackTerms.some(
      (term) =>
        text.includes(term),
    )
  ) {
    return "hatchback";
  }


  const coupeTerms = [
    "mustang",
    "camaro",
    "challenger",
    "brz",
    "supra",
    "cayman",
  ];


  if (
    coupeTerms.some(
      (term) =>
        text.includes(term),
    )
  ) {
    return "coupe";
  }


  const vanTerms = [
    "transit",
    "sprinter",
    "odyssey",
    "sienna",
    "caravan",
    "vito",
  ];


  if (
    vanTerms.some(
      (term) =>
        text.includes(term),
    )
  ) {
    return "van";
  }


  if (text.trim()) {
    return "sedan";
  }


  return "generic";
}


export function getVehicleVisualProfile(
  vehicle:
    | Vehicle
    | null
    | undefined,
): VehicleVisualProfile {
  if (!vehicle) {
    return {
      bodyStyle:
        "generic",

      visualModelUrl:
        VISUAL_MODEL_BY_BODY_STYLE.generic,

      diagnosticModelUrl:
        DIAGNOSTIC_MODEL_URL,

      label:
        "Generic diagnostic vehicle",
    };
  }


  const bodyStyle =
    inferVehicleBodyStyle(
      vehicle,
    );


  return {
    bodyStyle,

    visualModelUrl:
      VISUAL_MODEL_BY_BODY_STYLE[
        bodyStyle
      ],

    diagnosticModelUrl:
      DIAGNOSTIC_MODEL_URL,

    label:
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
  };
}


