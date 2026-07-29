import client from './client';

export const projectsApi = {
  list: (params) => client.get('/projects', { params }).then((r) => r.data),
  get: (id) => client.get(`/projects/${id}`).then((r) => r.data),
  create: (payload) => client.post('/projects', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/projects/${id}`, { data: { confirmDate } }).then((r) => r.data),
  impact: (id) => client.get(`/projects/${id}/impact`).then((r) => r.data),
  dashboard: (id) => client.get(`/projects/${id}/dashboard`).then((r) => r.data),
};

export const dprApi = {
  list: (params) => client.get('/dpr', { params }).then((r) => r.data),
  create: (payload) => client.post('/dpr', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/dpr/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/dpr/${id}`, { data: { confirmDate } }).then((r) => r.data),
};

export const materialsApi = {
  list: () => client.get('/inventory/materials').then((r) => r.data),
  create: (payload) => client.post('/inventory/materials', payload).then((r) => r.data),
};

export const inventoryApi = {
  list: (params) => client.get('/inventory/transactions', { params }).then((r) => r.data),
  create: (payload) => client.post('/inventory/transactions', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/inventory/transactions/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/inventory/transactions/${id}`, { data: { confirmDate } }).then((r) => r.data),
  balances: () => client.get('/inventory/balances').then((r) => r.data),
};

export const attendanceApi = {
  list: (params) => client.get('/attendance', { params }).then((r) => r.data),
  create: (payload) => client.post('/attendance', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/attendance/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/attendance/${id}`, { data: { confirmDate } }).then((r) => r.data),
  todaySummary: () => client.get('/attendance/summary/today').then((r) => r.data),
};

export const invoicingApi = {
  list: (params) => client.get('/invoicing', { params }).then((r) => r.data),
  create: (payload) => client.post('/invoicing', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/invoicing/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/invoicing/${id}`, { data: { confirmDate } }).then((r) => r.data),
};

export const rolesApi = {
  matrix: () => client.get('/roles/matrix').then((r) => r.data),
  setPermission: (payload) => client.put('/roles/matrix', payload).then((r) => r.data),
  list: () => client.get('/roles').then((r) => r.data),
  create: (payload) => client.post('/roles', payload).then((r) => r.data),
  remove: (id) => client.delete(`/roles/${id}`).then((r) => r.data),
};

export const usersApi = {
  list: (params) => client.get('/users', { params }).then((r) => r.data),
  create: (payload) => client.post('/users', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/users/${id}`, payload).then((r) => r.data),
  remove: (id, confirmDate) => client.delete(`/users/${id}`, { data: { confirmDate } }).then((r) => r.data),
};
