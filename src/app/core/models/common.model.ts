export interface FileUploadResult {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format?: string;
  resource_type?: string;
  storageType: 'CLOUDINARY' | 'LOCAL';
}

export interface TempUploadResult {
  public_id: string;
  url: string;
  width: number;
  height: number;
  storageType: 'CLOUDINARY';
  originalName: string;
}
