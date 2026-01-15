export interface User {
  id: number;
  name: string;
  email: string;
  latitude?: string;
  longitude?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NearbyUser {
  id: number;
  name: string;
  email: string;
  latitude: string;
  longitude: string;
  distance_km: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface LocationRequest {
  latitude: number;
  longitude: number;
}

export interface NearbyUsersResponse {
  users: NearbyUser[];
  count: number;
}

