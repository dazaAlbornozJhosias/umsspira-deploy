export interface ExtractedKeyword {
  term: string;
  count: number;
}

export interface ExtractionResult {
  keywords: ExtractedKeyword[];
  unmapped: ExtractedKeyword[];
}
