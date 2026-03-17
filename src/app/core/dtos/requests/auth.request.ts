export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
  backupCode?: string;
}

export interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
