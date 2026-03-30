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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
