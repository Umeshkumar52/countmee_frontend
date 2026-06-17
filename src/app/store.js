import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serializable check for clean socket/complex object handling
    }),
});

export default store;
