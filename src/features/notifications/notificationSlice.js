import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNotifications as apiFetchNotifications, markNotificationRead } from '../../api/notifications.api';

const initialState = {
  notifications: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiFetchNotifications();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotif = action.payload;
      // Prevent duplicates from FCM and Socket firing simultaneously
      const exists = state.notifications.find(n => 
        (n.id && n.id === newNotif.id) || 
        (n._id && n._id === newNotif.id) ||
        (newNotif._id && n.id === newNotif._id)
      );
      
      if (!exists) {
        // Append new real-time notification to the beginning of the list
        state.notifications.unshift(newNotif);
        state.lastUpdated = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const payloadData = action.payload;
        if (payloadData && payloadData.success && payloadData.data) {
          state.notifications = payloadData.data.notifications || [];
        } else if (Array.isArray(payloadData)) {
          state.notifications = payloadData;
        } else {
          state.notifications = [];
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex(n => n.id === id || n._id === id);
        if (index !== -1) {
          state.notifications[index].read_at = new Date().toISOString();
        }
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
