export enum InputMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface ComparisonPoint {
  aspect: string;
  brandValue: string;
  genericValue: string;
  verdict: string;
}

export interface MedicineDetails {
  name: string;
  manufacturer?: string;
  typicalPrice?: string;
  activeIngredients: string[];
  dosage?: string;
  frequency?: string;
}

export interface JanAushadhiDetails {
  available: boolean;
  name: string;
  priceEstimate: string;
  savingsPercentage: string;
}

export interface AnalysisResult {
  id?: string; // Unique identifier for saved history
  timestamp?: number; // Time of analysis
  identifiedName: string;
  isGeneric: boolean;
  brandProfile: MedicineDetails;
  genericProfile: MedicineDetails;
  janAushadhi: JanAushadhiDetails;
  primaryUses: string[];
  sideEffects: string[];
  comparisonPoints: ComparisonPoint[];
  clinicalSummary: string;
}

export interface GeminiError {
  message: string;
}