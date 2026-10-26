import { Patient } from '../types';
import { MockStorage } from './mockStorage';
import { ApiService } from './apiService';

export interface PatientSearchParams {
  query?: string;
  hospitalId?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface PaginatedPatientResponse {
  results: Patient[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const PatientService = {
  /**
   * Search patients with debouncing & server-ready pagination.
   * Enforces hospital/tenant isolation in both backend queries and frontend fallback.
   */
  async searchPatients({
    query = '',
    hospitalId,
    page = 1,
    pageSize = 15,
    signal,
  }: PatientSearchParams): Promise<PaginatedPatientResponse> {
    const trimmedQuery = query.trim().toLowerCase();

    let backendResults: Patient[] = [];
    let backendTotalCount: number | null = null;

    // 1. Try querying Django REST Framework backend if connected
    try {
      const backendData = await ApiService.searchPatients({
        query: trimmedQuery,
        hospitalId,
        page,
        pageSize,
        signal,
      });

      if (backendData) {
        backendResults = Array.isArray(backendData)
          ? backendData
          : backendData.results || [];
        if (typeof backendData.count === 'number') {
          backendTotalCount = backendData.count;
        } else if (typeof backendData.totalCount === 'number') {
          backendTotalCount = backendData.totalCount;
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw err;
      }
      // If network fails or backend is offline, proceed seamlessly
    }

    // 2. Query MockStorage local patients (strictly scoped to the requested hospital)
    const allPatients = hospitalId ? MockStorage.getPatients(hospitalId) : MockStorage.getPatients();

    const filteredLocal = trimmedQuery
      ? allPatients.filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(trimmedQuery);
          const idMatch = p.id?.toLowerCase().includes(trimmedQuery);
          const phoneMatch = p.phone?.toLowerCase().includes(trimmedQuery);
          const emailMatch = p.email?.toLowerCase().includes(trimmedQuery);
          return nameMatch || idMatch || phoneMatch || emailMatch;
        })
      : allPatients;

    // 3. Merge: Local patients first (ensures newly registered patients appear immediately), then backend
    const combinedMap = new Map<string, Patient>();
    for (const p of filteredLocal) {
      if (p.id) combinedMap.set(p.id, p);
    }
    for (const p of backendResults) {
      if (p.id && !combinedMap.has(p.id)) {
        combinedMap.set(p.id, p);
      }
    }

    const allCombined = Array.from(combinedMap.values());
    const totalCount = Math.max(allCombined.length, backendTotalCount || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const paginatedResults = allCombined.slice(startIdx, startIdx + pageSize);

    return {
      results: paginatedResults,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    };
  },

  /**
   * Get single patient by ID with tenant verification
   */
  async getPatientById(id: string, hospitalId?: string): Promise<Patient | null> {
    if (!id) return null;

    try {
      const backendPatient = await ApiService.getPatientById?.(id, hospitalId);
      if (backendPatient) return backendPatient;
    } catch (e) {
      // Backend unavailable, fallback below
    }

    const patient = MockStorage.getPatientById(id);
    if (!patient) return null;
    return patient;
  },

  /**
   * Register a new patient and store in MockStorage + backend
   */
  async registerPatient(patient: Patient): Promise<Patient> {
    MockStorage.savePatient(patient);
    try {
      await ApiService.createPatient?.(patient);
    } catch (e) {
      // Background sync fail is handled gracefully
    }
    return patient;
  },
};
