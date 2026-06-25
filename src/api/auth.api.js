import client from "./client";

export const loginAdmin = (credentials) =>
  client.post("/auth/admin/login", credentials);
export const loginPdc = (credentials) =>
  client.post("/auth/pdc/login", credentials);

export const registerPdc = (formData) =>
  client.post("/auth/pdc/register", formData);
export const logoutPdc = () => client.post("/auth/pdc/logout");
