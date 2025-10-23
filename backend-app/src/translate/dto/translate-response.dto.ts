export interface TranslationResult {
  metadata: Record<string, any>;
  translations: Record<string, string>;
}

export interface TranslateResponseDTO {
  itemId: string;
  itemPath: string;
  requestedBy: string;
  sourceLanguage: string;
  targetLanguages: string[];
  results: TranslationResult[];
  timestamp: string;
}
