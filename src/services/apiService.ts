const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const ApiService = {
  async getHospitals() {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/`);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend offline, using fallback:', err);
      return null;
    }
  },

  async getPatients(hospitalId?: string) {
    try {
      const url = hospitalId
        ? `${API_BASE_URL}/patients/?hospital_id=${encodeURIComponent(hospitalId)}`
        : `${API_BASE_URL}/patients/`;
      const res = await fetch(url, {
        headers: hospitalId ? { 'X-Hospital-Id': hospitalId } : {},
      });
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async searchPatients(params: {
    query?: string;
    hospitalId?: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.append('search', params.query);
      if (params.hospitalId) searchParams.append('hospital_id', params.hospitalId);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.pageSize) searchParams.append('page_size', params.pageSize.toString());

      const url = `${API_BASE_URL}/patients/?${searchParams.toString()}`;
      const res = await fetch(url, {
        signal: params.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(params.hospitalId ? { 'X-Hospital-Id': params.hospitalId } : {}),
        },
      });
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getPatientById(id: string, hospitalId?: string) {
    try {
      const url = hospitalId
        ? `${API_BASE_URL}/patients/${encodeURIComponent(id)}/?hospital_id=${encodeURIComponent(hospitalId)}`
        : `${API_BASE_URL}/patients/${encodeURIComponent(id)}/`;
      const res = await fetch(url, {
        headers: hospitalId ? { 'X-Hospital-Id': hospitalId } : {},
      });
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createPatient(patientData: any) {
    try {
      const hospitalKey =
        patientData.hospital ||
        (patientData.hospitalId === 'HOSP-001' ? 'hosp-1' : patientData.hospitalId) ||
        'hosp-1';

      const payload = {
        id: patientData.id,
        hospital: hospitalKey,
        name: patientData.name,
        age: Number(patientData.age) || 30,
        gender: patientData.gender || 'Other',
        phone: patientData.phone,
        email: patientData.email || '',
        blood_group: patientData.blood_group || patientData.bloodGroup || 'O+',
        address: patientData.address || 'N/A',
        medical_history: patientData.medical_history || patientData.medicalHistory || [],
        vitals: patientData.vitals || {},
        status: patientData.status || 'Outpatient',
      };

      const res = await fetch(`${API_BASE_URL}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hospital-Id': hospitalKey,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create patient');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getDoctors(hospitalId?: string) {
    try {
      const url = hospitalId
        ? `${API_BASE_URL}/doctors/?hospital_id=${hospitalId}`
        : `${API_BASE_URL}/doctors/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getAppointments(hospitalId?: string, patientId?: string) {
    try {
      let url = `${API_BASE_URL}/appointments/`;
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (patientId) params.append('patient_id', patientId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createAppointment(appointmentData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create appointment');
      }
      return await res.json();
    } catch (err: any) {
      console.warn('Backend appointment booking failed:', err);
      throw err;
    }
  },

  async updateAppointmentStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Status update failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getDoctorSchedules(hospitalId?: string, doctorId?: string) {
    try {
      let url = `${API_BASE_URL}/doctor-schedules/`;
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (doctorId) params.append('doctor_id', doctorId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveDoctorSchedule(scheduleData: any) {
    try {
      const isUpdate = !!scheduleData.id;
      const url = isUpdate
        ? `${API_BASE_URL}/doctor-schedules/${scheduleData.id}/`
        : `${API_BASE_URL}/doctor-schedules/`;
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (!res.ok) throw new Error('Failed to save schedule');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getDoctorUnavailability(hospitalId?: string, doctorId?: string) {
    try {
      let url = `${API_BASE_URL}/doctor-unavailability/`;
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (doctorId) params.append('doctor_id', doctorId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveDoctorUnavailability(periodData: any) {
    try {
      const isUpdate = !!periodData.id;
      const url = isUpdate
        ? `${API_BASE_URL}/doctor-unavailability/${periodData.id}/`
        : `${API_BASE_URL}/doctor-unavailability/`;
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodData),
      });
      if (!res.ok) throw new Error('Failed to save unavailability');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteDoctorUnavailability(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor-unavailability/${id}/`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  async getAppointmentSettings(hospitalId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointment-settings/?hospital_id=${hospitalId}`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      return null;
    }
  },

  async saveAppointmentSettings(settingsData: any) {
    try {
      const isUpdate = !!settingsData.id;
      const url = isUpdate
        ? `${API_BASE_URL}/appointment-settings/${settingsData.id}/`
        : `${API_BASE_URL}/appointment-settings/`;
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getEmergencyRequests(hospitalId?: string, driverId?: string) {
    try {
      let url = `${API_BASE_URL}/emergency-requests/`;
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (driverId) params.append('driver_id', driverId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async login(email: string, password?: string, role?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) throw new Error('Login failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },
};

