import { TempUploadResult } from '../../models/common.model';
import { ApiResponse } from './base.response';

export interface TempUploadResponse extends ApiResponse<TempUploadResult[]> {}
