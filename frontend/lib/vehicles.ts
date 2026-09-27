import { ApiError } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export type Vehicle = {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  engine: string;
  transmission: string;
  nickname?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleCreatePayload = {
  year: number;
  make: string;
  model: string;
  engine: string;
  transmission: string;
  nickname?: string;
  image_url?: string;
};


export type VehiclePreview = {
  found: boolean;
  image_url: string | null;
  thumbnail_url: string | null;
  source_url: string | null;
  message: string | null;
};

export type VehicleUpdatePayload = Partial<VehicleCreatePayload>;

async function readResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    detail:
      text ||
      "Unexpected response from PartPilot.",
  };
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getVehicles(
  token: string,
): Promise<Vehicle[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles`,
    {
      headers: authHeaders(token),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to load vehicles.",
      response.status,
    );
  }

  return data;
}

export async function getVehicle(
  token: string,
  vehicleId: string,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/${vehicleId}`,
    {
      headers: authHeaders(token),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to load vehicle.",
      response.status,
    );
  }

  return data;
}

export async function createVehicle(
  token: string,
  payload: VehicleCreatePayload,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to add vehicle.",
      response.status,
    );
  }

  return data;
}

export async function updateVehicle(
  token: string,
  vehicleId: string,
  payload: VehicleUpdatePayload,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/${vehicleId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? "Unable to update vehicle.",
      response.status,
    );
  }

  return data;
}

export async function setActiveVehicle(
  token: string,
  vehicleId: string,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/${vehicleId}/active`,
    {
      method: "PATCH",
      headers: authHeaders(token),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ??
        "Unable to activate vehicle.",
      response.status,
    );
  }

  return data;
}

export async function deleteVehicle(
  token: string,
  vehicleId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/${vehicleId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    const data = await readResponse(response);

    throw new ApiError(
      data?.detail ?? "Unable to delete vehicle.",
      response.status,
    );
  }
}



export async function getVehiclePreview(
  token: string,
  year: number,
  make: string,
  model: string,
): Promise<VehiclePreview> {
  const params = new URLSearchParams({
    year: String(year),
    make,
    model,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/preview/image?${params.toString()}`,
    {
      headers: authHeaders(token),
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ??
        "Unable to load vehicle preview.",
      response.status,
    );
  }

  return data;
}