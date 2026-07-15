import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear session and redirect to login
// Skip redirect if we're already on the login page or if the request is to the login endpoint
// (so that wrong-credential errors can be shown as toasts instead of causing a page refresh)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginRequest = err.config?.url?.includes('/auth/login');
      const isOnLoginPage  = window.location.pathname === '/login';
      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('hub_token');
        localStorage.removeItem('hub_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  verifyOtp:      (data) => api.post('/auth/verify-otp', data),
  resendOtp:      (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
  forceChangePassword: (data) => api.post('/auth/force-change-password', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  createUser:     (data) => api.post('/auth/create-user', data),
  getUsers:       ()     => api.get('/auth/users'),
  deleteUser:     (id)   => api.delete(`/auth/users/${id}`),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:          () => api.get('/dashboard/stats'),
  getWardenStats:    () => api.get('/dashboard/warden-stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getMonthlyRevenue: () => api.get('/dashboard/monthly-revenue'),
};

// ── Audit ────────────────────────────────────────────────────────────────────
export const auditAPI = {
  getLogs:    (params) => api.get('/audit', { params }),
  getFilters: ()       => api.get('/audit/filters'),
};

// ── Students ─────────────────────────────────────────────────────────────────
export const studentsAPI = {
  getAll:         (params) => api.get('/students', { params }),
  getById:        (id)     => api.get(`/students/${id}`),
  create:         (data)   => api.post('/students', data),
  update:         (id, data) => api.put(`/students/${id}`, data),
  delete:         (id)     => api.delete(`/students/${id}`),
  getFilters:     ()       => api.get('/students/meta/filters'),
  uploadPhoto:    (id, formData) => api.post(`/students/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const roomsAPI = {
  getAll:       (params) => api.get('/rooms', { params }),
  getById:      (id)     => api.get(`/rooms/${id}`),
  create:       (data)   => api.post('/rooms', data),
  update:       (id, data) => api.put(`/rooms/${id}`, data),
  delete:       (id)     => api.delete(`/rooms/${id}`),
  autoAllocate: (data)   => api.post('/rooms/auto-allocate', data),
  getBlocks:    ()       => api.get('/rooms/meta/blocks'),
};

// ── Fees ──────────────────────────────────────────────────────────────────────
export const feesAPI = {
  getAll:         (params) => api.get('/fees', { params }),
  getById:        (id)     => api.get(`/fees/${id}`),
  create:         (data)   => api.post('/fees', data),
  update:         (id, data) => api.put(`/fees/${id}`, data),
  markAsPaid:     (id, data) => api.put(`/fees/${id}/pay`, data),
  delete:         (id)     => api.delete(`/fees/${id}`),
  downloadReceipt:(id)     => api.get(`/fees/${id}/receipt`, { responseType: 'blob' }),
  getMonthlyReport:(params)=> api.get('/fees/report/monthly', { params }),
};

// ── Complaints ────────────────────────────────────────────────────────────────
export const complaintsAPI = {
  getAll:   (params) => api.get('/complaints', { params }),
  create:   (data)   => api.post('/complaints', data),
  update:   (id, data) => api.put(`/complaints/${id}`, data),
  delete:   (id)     => api.delete(`/complaints/${id}`),
};

// ── Visitors ──────────────────────────────────────────────────────────────────
export const visitorsAPI = {
  getAll:   (params) => api.get('/visitors', { params }),
  create:   (data)   => api.post('/visitors', data),
  checkout: (id)     => api.put(`/visitors/${id}/checkout`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  get:    (params) => api.get('/attendance', { params }),
  mark:   (data)   => api.post('/attendance/mark', data),
  report: (params) => api.get('/attendance/report', { params }),
};

// ── Leave ─────────────────────────────────────────────────────────────────────
export const leaveAPI = {
  getAll:  (params) => api.get('/leave', { params }),
  create:  (data)   => api.post('/leave', data),
  review:  (id, data) => api.put(`/leave/${id}/review`, data),
  delete:  (id)     => api.delete(`/leave/${id}`),
};

// ── Notices ───────────────────────────────────────────────────────────────────
export const noticesAPI = {
  getAll:  (params) => api.get('/notices', { params }),
  create:  (data)   => api.post('/notices', data),
  update:  (id, data) => api.put(`/notices/${id}`, data),
  delete:  (id)     => api.delete(`/notices/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:     () => api.get('/notifications'),
  markRead:   (id) => api.put(`/notifications/${id}/read`),
  markAllRead:()  => api.put('/notifications/read-all'),
  clearAll:   ()  => api.delete('/notifications/clear-all'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsAPI = {
  students:  (params) => api.get('/reports/students', { params, responseType: 'blob' }),
  fees:      (params) => api.get('/reports/fees',     { params, responseType: 'blob' }),
  occupancy: ()       => api.get('/reports/occupancy'),
};

// ── Student Portal ────────────────────────────────────────────────────────────
export const studentPortalAPI = {
  getDashboard:    ()       => api.get('/student-portal/dashboard'),
  getFees:         ()       => api.get('/student-portal/fees'),
  getComplaints:   ()       => api.get('/student-portal/complaints'),
  createComplaint: (data)   => api.post('/student-portal/complaints', data),
  getLeaves:       ()       => api.get('/student-portal/leaves'),
  createLeave:     (data)   => api.post('/student-portal/leaves', data),
  updateProfile:   (data)   => api.put('/student-portal/profile', data),
};

export default api;
