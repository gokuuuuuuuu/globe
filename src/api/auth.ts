import request from "./request";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  roles?: ("ADMIN" | "ANALYST" | "RISK_MANAGER")[];
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    status: string;
  };
}

export function login(data: LoginDto): Promise<LoginResult> {
  return request.post("/api/v1/auth/login", data);
}

export function register(data: RegisterDto) {
  return request.post("/api/v1/auth/register", data);
}
