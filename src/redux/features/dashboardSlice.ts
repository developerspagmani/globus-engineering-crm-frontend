import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardStats, AuditLog } from '@/types/modules';
import api from '@/lib/axios';

interface DashboardState {
  stats: DashboardStats | null;
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  logs: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/stats');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch statistics');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'dashboard/fetchLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/audit-logs');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch activity history');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.stats = null;
      state.logs = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        // Optionally clear stats on start of fetch to avoid stale data
        // state.stats = null; 
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.stats = null; // Clear stale data on failure (e.g., 403 Forbidden)
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state) => {
        state.logs = []; // Clear stale logs on failure
      })
      // Listen for global logout
      .addMatcher(
        (action) => action.type === 'auth/logout',
        (state) => {
          state.stats = null;
          state.logs = [];
          state.error = null;
        }
      );
  },
});

export const { clearDashboardData } = dashboardSlice.actions;

export default dashboardSlice.reducer;
