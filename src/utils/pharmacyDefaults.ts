import { Medicine } from '../types';

export const DEFAULT_HOSPITAL_MEDICINES: Omit<Medicine, 'id' | 'hospitalId'>[] = [];
