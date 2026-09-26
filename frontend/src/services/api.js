const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Add Authorization Bearer header if token is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sih_land_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  }
};

export const documentService = {
  getSamples: async () => {
    const res = await api.get('/documents/samples');
    return res.data;
  },
  upload: async (file, language = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  list: async () => {
    const res = await api.get('/documents');
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },
  process: async (id) => {
    const res = await api.post(`/documents/${id}/process`);
    return res.data;
  }
};

export const recordService = {
  list: async (params = {}) => {
    const res = await api.get('/records', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/records/${id}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/records/${id}`, data);
    return res.data;
  },
  getValidation: async (id) => {
    const res = await api.get(`/records/${id}/validation`);
    return res.data;
  },
  gisSearch: async (params = {}) => {
    const res = await api.get('/records/gis/all', { params });
    return res.data;
  },
  getGis: async (id) => {
    const res = await api.get(`/records/${id}/gis`);
    return res.data;
  }
};

export const duplicateService = {
  list: async (status = null) => {
    const res = await api.get('/duplicates', { params: status ? { status } : {} });
    return res.data;
  },
  review: async (id, action, comment = '') => {
    const res = await api.post(`/duplicates/${id}/review`, { action, comment });
    return res.data;
  }
};

export const reviewService = {
  getQueue: async () => {
    const res = await api.get('/review/queue');
    return res.data;
  },
  approve: async (id, comment = '') => {
    const res = await api.post(`/review/${id}/approve`, { comment });
    return res.data;
  },
  reject: async (id, reason = '') => {
    const res = await api.post(`/review/${id}/reject`, { reason });
    return res.data;
  },
  markDuplicate: async (id, comment = '') => {
    const res = await api.post(`/review/${id}/mark-duplicate`, { comment });
    return res.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  }
};

export const auditService = {
  list: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  }
};

export const adminService = {
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  createUser: async (data) => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  getFailures: async () => {
    const res = await api.get('/admin/failures');
    return res.data;
  }
};

export const certificateService = {
  generate: async (recordId, notes = '') => {
    const res = await api.post(`/certificates/generate/${recordId}`, { notes });
    return res.data;
  },
  get: async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}`);
    return res.data;
  },
  verify: async (certificateId) => {
    const res = await api.get(`/certificates/verify/${certificateId}`);
    return res.data;
  },
  listForRecord: async (recordId) => {
    const res = await api.get(`/certificates/record/${recordId}`);
    return res.data;
  },
  list: async (limit = 50) => {
    const res = await api.get('/certificates', { params: { limit } });
    return res.data;
  }
};

export default api;
