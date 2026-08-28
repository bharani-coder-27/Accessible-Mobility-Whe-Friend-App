export interface BusStop {
  id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface BusTiming {
  bus_id: number;
  bus_name: string;
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

export interface AuthUser {
  id: number;
  name?: string;
}

export interface AuthContextType {
  logout: () => void;
  user: AuthUser | null;
}
