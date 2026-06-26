import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAdmin, loginPdc, registerPdc as registerPdcApi, logoutPdc } from '../../api/auth.api';
import { toggleOnline } from '../../api/pdc.api';
import { getFcmToken } from '../../firebase/firebaseConfig';

// Load initial session if exists
const getLocalSession = () => {
  const sessionStr = localStorage.getItem('countme_session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session && session.user && !session.user.role && session.user.user_type) {
        session.user.role = session.user.user_type;
      }
      return session;
    } catch (e) {
      console.error('Failed to parse local session', e);
    }
  }
  return null;
};

const initialSession = getLocalSession();

const initialState = {
  token: initialSession ? initialSession.token : null,
  refreshToken: initialSession ? initialSession.refreshToken : null,
  user: initialSession ? initialSession.user : null,
  pdcDocument: initialSession ? initialSession.pdcDocument : null,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const fcmToken = await getFcmToken();
      const payload = { ...credentials, fcmToken };

      let response;
      if (credentials.email) {
        response = await loginAdmin(payload);
      } else if (credentials.phone) {
        response = await loginPdc(payload);
      } else {
        throw new Error('Email or phone is required');
      }
      return response.data.data || response.data; // Handle both wrapped and unwrapped shapes
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Authentication failed';
      return rejectWithValue(message);
    }
  }
);

export const registerPdc = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const fcmToken = await getFcmToken();
      
      // formData might be FormData object or plain object
      let payload = formData;
      if (formData instanceof FormData) {
        formData.append('fcmToken', fcmToken || '');
      } else {
        payload = { ...formData, fcmToken };
      }

      const response = await registerPdcApi(payload);
      return response.data.data || response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const fcmToken = await getFcmToken();
      // Best-effort logout to backend
      const sessionStr = localStorage.getItem('countme_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session?.user?.user_type === 'PDC' || session?.user?.role === 'PDC') {
            await logoutPdc({ fcmToken });
          }
        } catch (e) {}
      }
      return null;
    } catch (err) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const toggleOnlineStatus = createAsyncThunk(
  'auth/toggleOnline',
  async ({ id, online }, { rejectWithValue }) => {
    try {
      const response = await toggleOnline(id, online);
      // Wait, in real backend: response.data is { success, message, data: ... } or raw?
      // Let's check toggleOnline backend: returning result of updatePdcDocument which is { success, message, ... }
      return response.data.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle status');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updatePdcDocumentState: (state, action) => {
      state.pdcDocument = { ...state.pdcDocument, ...action.payload };
      
      // Keep local session storage in sync
      const sessionStr = localStorage.getItem('countme_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          session.pdcDocument = state.pdcDocument;
          localStorage.setItem('countme_session', JSON.stringify(session));
        } catch (e) {
          console.error('Failed to sync updated PDC document state', e);
        }
      }
    },
    updateTokenState: (state, action) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        
        const user = action.payload.user ? { ...action.payload.user } : null;
        if (user && !user.role && user.user_type) {
          user.role = user.user_type;
        }
        
        state.user = user;
        state.pdcDocument = action.payload.pdcDocument || null;

        localStorage.setItem('countme_session', JSON.stringify({
          token: action.payload.token,
          refreshToken: action.payload.refreshToken,
          user: user,
          pdcDocument: action.payload.pdcDocument || null
        }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerPdc.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerPdc.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        
        const user = action.payload.user ? { ...action.payload.user } : null;
        if (user && !user.role && user.user_type) {
          user.role = user.user_type;
        }

        state.user = user;
        state.pdcDocument = action.payload.pdcDocument || null;

        localStorage.setItem('countme_session', JSON.stringify({
          token: action.payload.token,
          refreshToken: action.payload.refreshToken,
          user: user,
          pdcDocument: action.payload.pdcDocument || null
        }));
      })
      .addCase(registerPdc.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.pdcDocument = null;
        state.isLoading = false;
        state.error = null;
        localStorage.removeItem('countme_session');
      })
      // Toggle Online Status
      .addCase(toggleOnlineStatus.fulfilled, (state, action) => {
        const onlineVal = action.payload.online !== undefined ? action.payload.online : action.payload;
        if (state.pdcDocument) {
          state.pdcDocument.online = onlineVal;
          // Keep local session storage in sync
          const sessionStr = localStorage.getItem('countme_session');
          if (sessionStr) {
            try {
              const session = JSON.parse(sessionStr);
              if (session.pdcDocument) {
                session.pdcDocument.online = onlineVal;
                localStorage.setItem('countme_session', JSON.stringify(session));
              }
            } catch (e) {}
          }
        }
      });
  },
});

export const { clearAuthError, updatePdcDocumentState, updateTokenState } = authSlice.actions;
export default authSlice.reducer;
