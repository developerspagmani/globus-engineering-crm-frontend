import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Lead } from '@/types/modules';
import api from '@/lib/axios';

export const fetchLeads = createAsyncThunk(
  'leads/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get(company_id ? `/leads?companyId=${company_id}` : '/leads');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch leads');
    }
  }
);

export const createLeadSync = createAsyncThunk(
  'leads/create',
  async (data: Omit<Lead, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      // Manual mapping if necessary - backend expects agent_id, company_id
      const payload = {
        ...data,
        agent_id: (data as any).agentId // Map camelCase to snake_case for backend
      };
      const response = await api.post('/leads', payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create lead');
    }
  }
);

export const updateLeadSync = createAsyncThunk(
  'leads/update',
  async (data: Lead, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leads/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update lead');
    }
  }
);

export const deleteLeadSync = createAsyncThunk(
  'leads/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/leads/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete lead');
    }
  }
);

interface LeadState {
  items: Lead[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: 'all' | 'new' | 'contacted' | 'qualified' | 'converted';
    source: 'all' | 'Web' | 'Referral' | 'Cold Call' | 'Exhibition';
  };
}

const initialState: LeadState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    source: 'all',
  },
};

const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    setLeadFilters: (state, action: PayloadAction<Partial<LeadState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeads.fulfilled, (state, action: PayloadAction<Lead[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createLeadSync.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateLeadSync.fulfilled, (state, action: PayloadAction<Lead>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteLeadSync.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const { setLeadFilters } = leadSlice.actions;

export const addLead = createLeadSync;
export const updateLead = updateLeadSync;
export const deleteLead = deleteLeadSync;

export default leadSlice.reducer;

