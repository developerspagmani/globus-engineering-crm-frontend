import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LedgerEntry } from '@/types/modules';
import api from '@/lib/axios';

export const fetchLedgerEntries = createAsyncThunk(
  'ledger/fetchAll',
  async (params: { 
    partyId?: string; 
    companyId?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    dateFrom?: string;
    dateTo?: string;
  }, { rejectWithValue }) => {
    try {
      const { partyId, companyId, page = 1, limit = 10, search, dateFrom, dateTo } = params;
      let url = `/ledger?page=${page}&limit=${limit}`;
      if (partyId) url += `&partyId=${partyId}`;
      if (companyId) url += `&companyId=${companyId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items.map((entry: any) => ({
          id: entry.id.toString(),
          date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
          partyId: (entry.party_id || entry.partyId)?.toString(),
          partyName: entry.party_name || entry.partyName,
          partyType: (entry.party_type || entry.partyType || 'customer').toLowerCase(),
          vchType: entry.vch_type || entry.vchType || '',
          vchNo: entry.vch_no || entry.vchNo || '',
          description: entry.description_ || entry.description || '',
          referenceNo: entry.reference_id || entry.reference_no,
          type: (entry.type || 'debit').toLowerCase(),
          amount: parseFloat(String(entry.amount || '0')),
          balance: parseFloat(String(entry.balance || '0')),
          company_id: entry.company_id || entry.companyId,
          createdAt: entry.created_at || entry.createdAt
        })),
        pagination: response.data.pagination,
        openingBalance: response.data.openingBalance || 0
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch ledger');
    }
  }
);

export const addLedgerEntry = createAsyncThunk(
  'ledger/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/ledger', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add ledger entry');
    }
  }
);

export const deleteLedgerEntry = createAsyncThunk(
  'ledger/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/ledger/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete ledger entry');
    }
  }
);

interface LedgerState {
  items: LedgerEntry[];
  openingBalance: number;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    partyType: 'all' | 'customer' | 'vendor';
    type: 'all' | 'debit' | 'credit';
    dateFrom: string;
    dateTo: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const initialState: LedgerState = {
  items: [],
  openingBalance: 0,
  loading: false,
  error: null,
  filters: {
    search: '',
    partyType: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setLedgerFilters: (state, action: PayloadAction<Partial<LedgerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setLedgerPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    resetLedgerState: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedgerEntries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLedgerEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.openingBalance = action.payload.openingBalance;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
      })
      .addCase(fetchLedgerEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addLedgerEntry.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteLedgerEntry.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      });
  }
});

export const { setLedgerFilters, setLedgerPage, resetLedgerState } = ledgerSlice.actions;
export default ledgerSlice.reducer;
