export interface BusStop {
  id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  /** Distance from the searched origin, in kilometres. */
  distance: number;
}

export interface BusTiming {
  bus_id: number;
  bus_name: string;
  /** HH:mm:ss, as scheduled at the stop. */
  arrival_time: string;
  trip_code: string;
  wheelchair_accessible: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export type TripStatus = "waiting" | "traveling" | "completed";

/** One booking in the passenger's own history. */
export interface Trip {
  id: number;
  bus_id: number;
  bus_name: string | null;
  trip_code: string | null;
  wheelchair_accessible: boolean;
  bus_stop_id: number | null;
  bus_stop_name: string | null;
  timing: string | null;
  status: TripStatus;
  message: string;
  created_at: string;
}
