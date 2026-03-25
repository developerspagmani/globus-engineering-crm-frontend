import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Deal } from '@/types/modules';
import { mockDeals } from '@/data/mockModules';

interface SalesState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  filters: {
    status: 'all' | 'open' | 'negotiation' | 'won' | 'lost';
    priority: 'all' | 'low' | 'medium' | 'high';
  };
}

const initialState: SalesState = {
  deals: mockDeals,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    priority: 'all',
  },
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    addDeal: (state, action: PayloadAction<Omit<Deal, 'id' | 'createdAt'>>) => {
      const newDeal: Deal = {
        ...action.payload,
        id: `deal_${state.deals.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      state.deals.push(newDeal);
    },
    updateDeal: (state, action: PayloadAction<Deal>) => {
      const index = state.deals.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.deals[index] = action.payload;
      }
    },
    deleteDeal: (state, action: PayloadAction<string>) => {
      state.deals = state.deals.filter(item => item.id !== action.payload);
    },
    setDealFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { addDeal, updateDeal, deleteDeal, setDealFilters } = salesSlice.actions;
export default salesSlice.reducer;
