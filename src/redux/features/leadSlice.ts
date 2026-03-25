import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lead } from '@/types/modules';
import { mockLeads } from '@/data/mockModules';

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
  items: mockLeads,
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
    addLead: (state, action: PayloadAction<Omit<Lead, 'id' | 'createdAt'>>) => {
      const newLead: Lead = {
        ...action.payload,
        id: `lead_${state.items.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      state.items.push(newLead);
    },
    updateLead: (state, action: PayloadAction<Lead>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteLead: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setLeadStatus: (state, action: PayloadAction<{ id: string; status: Lead['status'] }>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index].status = action.payload.status;
      }
    },
    setLeadFilters: (state, action: PayloadAction<Partial<LeadState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  addLead,
  updateLead,
  deleteLead,
  setLeadStatus,
  setLeadFilters
} = leadSlice.actions;

export default leadSlice.reducer;
