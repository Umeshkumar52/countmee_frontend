import client from './client';

export const fetchNotifications = () => client.get('/pdc/notifications/unread');
export const markNotificationRead = (id) => client.post('/pdc/read-notification', { id });
