import client from './client';

export const loginAdmin = (credentials) => client.post('/admin/login', credentials);
export const loginPdc = (credentials) => client.post('/pdc/login', credentials);

export const registerPdc = (formData) => client.post('/pdc/register', formData);
export const logoutPdc = () => client.post('/pdc/logout');
