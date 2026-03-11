export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
}

export interface RenderResult {
  id: string;
  originalImageId: string;
  imageUrls: string[];
  prompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  EDITING = 'EDITING'
}

export interface EditingState {
  originalUrl: string;
  maskBase64?: string;
  editPrompt: string;
}

export type CreativityLevel = 'strict' | 'balanced' | 'creative';

export type Season = 'winter' | 'summer' | 'autumn' | 'spring';

export type RenderingStyle = 'photorealistic' | 'sketch' | 'abstract' | 'watercolor' | 'minimalist' | 'blueprint';

export interface BackgroundSuggestion {
  id: string;
  label: string;
  prompt: string;
}
