import { ApiError } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export type VehicleCatalogOptions = {
  make: string;
  model: string;
  year: number;
  engines: string[];
  transmissions: string[];
};

async function readResponse(response: Response) {
  const contentType =
    response.headers.get("content-type");

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text = await response.text();

  return {
    detail:
      text ||
      "Unexpected server response.",
  };
}

async function getJson<T>(
  url: string,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data =
    await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? fallbackMessage,
      response.status,
    );
  }

  return data as T;
}

export async function getVehicleMakes(): Promise<
  string[]
> {
  return getJson<string[]>(
    `${API_BASE_URL}/api/vehicle-catalog/makes`,
    "Unable to load vehicle makes.",
  );
}

export async function getVehicleModels(
  make: string,
): Promise<string[]> {
  const params = new URLSearchParams({
    make,
  });

  return getJson<string[]>(
    `${API_BASE_URL}/api/vehicle-catalog/models?${params.toString()}`,
    "Unable to load vehicle models.",
  );
}

export async function getVehicleYears(
  make: string,
  model: string,
): Promise<number[]> {
  const params = new URLSearchParams({
    make,
    model,
  });

  return getJson<number[]>(
    `${API_BASE_URL}/api/vehicle-catalog/years?${params.toString()}`,
    "Unable to load vehicle years.",
  );
}

export async function getVehicleOptions(
  make: string,
  model: string,
  year: number,
): Promise<VehicleCatalogOptions> {
  const params = new URLSearchParams({
    make,
    model,
    year: String(year),
  });

  return getJson<VehicleCatalogOptions>(
    `${API_BASE_URL}/api/vehicle-catalog/options?${params.toString()}`,
    "Unable to load vehicle options.",
  );
}