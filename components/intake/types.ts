import type { IntakeFile } from '@/lib/intake';
import type {
  LegalCategoryKey,
  ExtractedFacts,
  PrivateClientData,
  PrivacyPreferences
} from '@/lib/intake-engine';

export type IntakeStage =
  | 'welcome' // Stage 0: Welcome / trust
  | 'narrative' // Stage 1: Tell us what happened
  | 'summary_review' // Stage 2: AI-assisted summary & correction
  | 'clarification' // Stage 3: Dynamic case-specific questions
  | 'evidence' // Stage 4: Documents / evidence (optional)
  | 'parties' // Stage 5: Private information / parties / conflicts
  | 'review' // Stage 6: Review what will be public vs private
  | 'success'; // Stage 7: Published / next steps

export interface CaseIntakeState {
  stage: IntakeStage;
  narrative: string;
  extractedFacts: ExtractedFacts;
  userOverriddenCategory?: LegalCategoryKey;
  answers: Record<string, any>;
  otherTexts: Record<string, string>;
  files: IntakeFile[];
  privateData: PrivateClientData;
  privacy: PrivacyPreferences;
  title: string;
  city: string;
  urgency: 'normal' | 'soon' | 'urgent';
  caseId?: string;
}

export type ProgressNamedStep =
  | 'Tu situación'
  | 'Detalles'
  | 'Documentos'
  | 'Privacidad'
  | 'Revisión';

export function getNamedStage(stage: IntakeStage): ProgressNamedStep {
  switch (stage) {
    case 'welcome':
    case 'narrative':
    case 'summary_review':
      return 'Tu situación';
    case 'clarification':
      return 'Detalles';
    case 'evidence':
      return 'Documentos';
    case 'parties':
      return 'Privacidad';
    case 'review':
    case 'success':
      return 'Revisión';
  }
}
