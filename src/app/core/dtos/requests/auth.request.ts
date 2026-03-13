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
  avatar?: string; // public_id from temp-upload
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
