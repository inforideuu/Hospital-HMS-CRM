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

  async updateAppointmentStatus(id: string, status: string, extraData?: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(extraData || {}) }),
      });
      if (!res.ok) throw new Error('Status update failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteAppointment(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn('Backend appointment delete failed:', err);
      return false;
    }
  },

  async checkInAppointment(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/check_in/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Check in failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async startConsultation(appointmentId: string, doctorId?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/start_consultation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId }),
      });
      if (!res.ok) throw new Error('Failed to start consultation');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getConsultations(hospitalId?: string, doctorId?: string, appointmentId?: string) {
    try {
      let url = `${API_BASE_URL}/consultations/`;
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (doctorId) params.append('doctor_id', doctorId);
      if (appointmentId) params.append('appointment_id', appointmentId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch consultations');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getConsultationById(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/`);
      if (!res.ok) throw new Error('Consultation not found');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createConsultation(consultationData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationData),
      });
      if (!res.ok) throw new Error('Failed to create consultation');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveConsultationDraft(id: string, consultationData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/save_draft/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationData),
      });
      if (!res.ok) throw new Error('Failed to save draft');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async finalizeConsultation(id: string, consultationData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/finalize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to finalize consultation');
      }
      return await res.json();
    } catch (err) {
      throw err;
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

  async deleteDoctorSchedule(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor-schedules/${id}/`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      return false;
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

  async saveEmergencyRequest(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save emergency request');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async dispatchEmergency(id: string, driverId: string, vehicleNumber?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency-requests/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Dispatched',
          assigned_driver_id: driverId,
          ...(vehicleNumber ? { vehicle_number: vehicleNumber } : {}),
        }),
      });
      if (!res.ok) throw new Error('Failed to dispatch emergency');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getAmbulanceDrivers(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/drivers/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/drivers/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch ambulance drivers');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveAmbulanceDriver(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save ambulance driver');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteAmbulanceDriver(id: string) {
    try {
      await fetch(`${API_BASE_URL}/drivers/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
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

  // Support Tickets & Tenant Escalations
  async getSupportTickets(params?: { hospital_id?: string; status?: string; priority?: string; search?: string }) {
    try {
      let url = `${API_BASE_URL}/support-tickets/`;
      if (params) {
        const q = new URLSearchParams();
        if (params.hospital_id) q.append('hospital_id', params.hospital_id);
        if (params.status && params.status !== 'all') q.append('status', params.status);
        if (params.priority && params.priority !== 'all') q.append('priority', params.priority);
        if (params.search) q.append('search', params.search);
        if (q.toString()) url += `?${q.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch support tickets');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getSupportTicketById(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/`);
      if (!res.ok) throw new Error('Support ticket not found');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createSupportTicket(ticketData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (!res.ok) throw new Error('Failed to create support ticket');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateSupportTicket(id: string, data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update support ticket');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async addTicketReply(id: string, message: string, sender: string, senderRole: string = 'platform_support') {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/add_reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sender, sender_role: senderRole }),
      });
      if (!res.ok) throw new Error('Failed to add ticket reply');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateTicketStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/update_status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update ticket status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getSupportTicketMetrics() {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/metrics/`);
      if (!res.ok) throw new Error('Failed to fetch ticket metrics');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Departments
  async getDepartments(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/departments/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/departments/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch departments');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveDepartment(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save department');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteDepartment(id: string) {
    try {
      await fetch(`${API_BASE_URL}/departments/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
    }
  },

  // OPD Rooms
  async getOPDRooms(hospitalId?: string, departmentId?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (departmentId) params.append('department_id', departmentId);
      const url = `${API_BASE_URL}/opd-rooms/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch OPD rooms');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveOPDRoom(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/opd-rooms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save OPD room');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteOPDRoom(id: string) {
    try {
      await fetch(`${API_BASE_URL}/opd-rooms/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
    }
  },

  // Wards & Beds
  async getWards(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/wards/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/wards/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch wards');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveWard(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/wards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save ward');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getBeds(hospitalId?: string, wardId?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (wardId) params.append('ward_id', wardId);
      const url = `${API_BASE_URL}/beds/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch beds');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveBed(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save bed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Staff
  async getStaff(hospitalId?: string, role?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (role) params.append('role', role);
      const url = `${API_BASE_URL}/staff/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch staff');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveStaff(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save staff');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteStaff(id: string) {
    try {
      await fetch(`${API_BASE_URL}/staff/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
    }
  },

  // Activity Logs
  async getActivityLogs(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/activity-logs/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/activity-logs/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveActivityLog(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/activity-logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save activity log');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Sales Leads
  async getSalesLeads(status?: string) {
    try {
      const url = status && status !== 'all' ? `${API_BASE_URL}/sales-leads/?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/sales-leads/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch sales leads');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveSalesLead(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/sales-leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save sales lead');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteSalesLead(id: string) {
    try {
      await fetch(`${API_BASE_URL}/sales-leads/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
    }
  },

  async updateSalesLeadStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/sales-leads/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update sales lead status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Inpatient Admissions
  async getAdmissions(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/admissions/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/admissions/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch admissions');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveAdmission(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save admission');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async dischargeAdmission(id: string, dischargeDate?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/admissions/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Discharged',
          discharge_date: dischargeDate || new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error('Failed to discharge admission');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Invoices & Billing
  async getInvoices(hospitalId?: string, patientId?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (patientId) params.append('patient_id', patientId);
      const url = `${API_BASE_URL}/invoices/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveInvoice(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save invoice');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async recordPayment(id: string, paidAmount: number, status: string = 'Paid') {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_amount: paidAmount, status }),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Pharmacy Medicines
  async getMedicines(hospitalId?: string) {
    try {
      const url = hospitalId ? `${API_BASE_URL}/medicines/?hospital_id=${encodeURIComponent(hospitalId)}` : `${API_BASE_URL}/medicines/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch medicines');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveMedicine(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save medicine');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async deleteMedicine(id: string) {
    try {
      await fetch(`${API_BASE_URL}/medicines/${id}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return false;
    }
  },

  // Prescriptions
  async getPrescriptions(hospitalId?: string, patientId?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (patientId) params.append('patient_id', patientId);
      const url = `${API_BASE_URL}/prescriptions/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async savePrescription(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save prescription');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Lab Orders
  async getLabOrders(hospitalId?: string, patientId?: string) {
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId);
      if (patientId) params.append('patient_id', patientId);
      const url = `${API_BASE_URL}/lab-orders/?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch lab orders');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveLabOrder(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save lab order');
      return await res.json();
    } catch (err) {
      return null;
    }
  },
};

