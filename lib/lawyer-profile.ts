export interface LawyerProfileData {
  name?: string;
  city?: string;
  bio?: string;
  education?: string;
  years_of_experience?: number;
  experience_years?: number;
  specialties?: string[];
  rate_hourly?: string | number;
  hourly_rate?: string | number;
  consultation_fee?: string | number;
  modality?: string;
  license?: string;
  lawyer_card_number?: string;
  lawyer_card_csj?: string;
  verification?: string;
  verification_submitted?: boolean;
  avatar_url?: string;
  linkedin_url?: string;
  admin?: boolean;
  role?: string;
}

export const LAWYER_STEPS = [
  { num: 1, id: 'basic', label: 'Datos básicos', short: 'Datos básicos' },
  { num: 2, id: 'bio', label: 'Biografía y experiencia', short: 'Experiencia' },
  { num: 3, id: 'specialties', label: 'Áreas de práctica', short: 'Áreas de práctica' },
  { num: 4, id: 'rates', label: 'Honorarios y modalidad', short: 'Honorarios' },
  { num: 5, id: 'license', label: 'Tarjeta profesional CSJ', short: 'Tarjeta profesional' },
  { num: 6, id: 'verification', label: 'Verificación', short: 'Verificación' },
] as const;

export function isLawyerStepComplete(stepNum: number, profile: LawyerProfileData | null | undefined): boolean {
  if (!profile) return false;
  switch (stepNum) {
    case 1:
      return Boolean(
        profile.name &&
        profile.name.trim().length > 0 &&
        profile.name !== 'Abogado' &&
        profile.name !== 'Juan Pérez' &&
        profile.city &&
        profile.city.trim().length > 0
      );
    case 2:
      return Boolean(
        (typeof profile.years_of_experience === 'number' && profile.years_of_experience > 0) ||
        (typeof profile.experience_years === 'number' && profile.experience_years > 0) ||
        (profile.education && profile.education.trim().length > 0) ||
        (profile.bio && profile.bio.trim().length > 5)
      );
    case 3:
      return Boolean(Array.isArray(profile.specialties) && profile.specialties.length > 0);
    case 4:
      return Boolean(
        (profile.rate_hourly && String(profile.rate_hourly).trim().length > 0) ||
        (profile.hourly_rate && String(profile.hourly_rate).trim().length > 0) ||
        (profile.consultation_fee && String(profile.consultation_fee).trim().length > 0) ||
        (profile.modality && profile.modality.trim().length > 0)
      );
    case 5: {
      const card = profile.license || profile.lawyer_card_number || profile.lawyer_card_csj;
      return Boolean(card && card.trim().length >= 4);
    }
    case 6:
      return (
        profile.verification === 'verified' ||
        profile.verification === 'pending' ||
        profile.verification_submitted === true
      );
    default:
      return false;
  }
}

export function calculateProfileProgress(profile: LawyerProfileData | null | undefined): number {
  if (!profile) return 0;
  if (profile.verification === 'verified') return 100;

  let completedCount = 0;
  if (isLawyerStepComplete(1, profile)) completedCount++;
  if (isLawyerStepComplete(2, profile)) completedCount++;
  if (isLawyerStepComplete(3, profile)) completedCount++;
  if (isLawyerStepComplete(4, profile)) completedCount++;
  if (isLawyerStepComplete(5, profile)) completedCount++;
  if (isLawyerStepComplete(6, profile)) completedCount++;

  switch (completedCount) {
    case 0:
      return 0;
    case 1:
      return 15;
    case 2:
      return 30;
    case 3:
      return 45;
    case 4:
      return 60;
    case 5:
      return 80;
    case 6:
      return 100;
    default:
      return Math.min(100, Math.round((completedCount / 6) * 100));
  }
}

export function getFirstIncompleteStep(profile: LawyerProfileData | null | undefined): number {
  for (let i = 1; i <= 6; i++) {
    if (!isLawyerStepComplete(i, profile)) {
      return i;
    }
  }
  return 6;
}

export function getPendingSteps(profile: LawyerProfileData | null | undefined): Array<{ num: number; label: string; short: string }> {
  return LAWYER_STEPS.filter(s => !isLawyerStepComplete(s.num, profile));
}

export type LawyerProfileState =
  | 'PROFILE_NOT_STARTED'
  | 'PROFILE_IN_PROGRESS'
  | 'PROFILE_SUBMITTED'
  | 'PROFILE_VERIFIED'
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'verified';

export function getLawyerProfileState(profile: LawyerProfileData | null | undefined): LawyerProfileState {
  if (!profile) return 'PROFILE_NOT_STARTED';
  if (profile.verification === 'verified') return 'PROFILE_VERIFIED';
  const progress = calculateProfileProgress(profile);
  const isStep6Done = isLawyerStepComplete(6, profile);
  if (progress === 100 || (progress >= 80 && isStep6Done)) {
    return 'PROFILE_SUBMITTED';
  }
  if (progress === 0) {
    return 'PROFILE_NOT_STARTED';
  }
  return 'PROFILE_IN_PROGRESS';
}
