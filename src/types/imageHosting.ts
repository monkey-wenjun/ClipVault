export type ImageHostingProvider =
  | "aliyun"
  | "tencent"
  | "qiniu"
  | "upyun"
  | "aws"
  | "github";

export interface ImageHostingConfig {
  id: string;
  name: string;
  provider: ImageHostingProvider;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  customDomain?: string;
  pathPrefix?: string;
  endpoint?: string;
  pathStyle?: boolean;
  enabled?: boolean;
  createdAt: number;
}

export interface ImageHostingStore {
  enabled: boolean;
  autoUpload: boolean;
  generateMarkdown: boolean;
  configs: ImageHostingConfig[];
  defaultId: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  markdownUrl?: string;
  error?: string;
}
