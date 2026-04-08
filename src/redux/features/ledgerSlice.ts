import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LedgerEntry } from '@/types/modules';
import api from '@/lib/axios';

export const fetchLedgerEntries = createAsyncThunk(
  'ledger/fetchAll',
  async (filters: { partyId?: string; company_id?: string; companyId?: string } | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.partyId) params.append('partyId', filters.partyId);
      if (filters?.company_id) params.append('company_id', filters.company_id);
      if (filters?.companyId) params.append('companyId', filters.companyId);

      const response = await api.get(`/ledger?${params.toString()}`);
      return response.data.map((entry: any) => ({
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
      }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch ledger entries');
    }
  }
);

interface LedgerState {
  items: LedgerEntry[];
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
  };
}

const initialState: LedgerState = {
  items: [],
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedgerEntries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLedgerEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchLedgerEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setLedgerFilters, setLedgerPage } = ledgerSlice.actions;

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
export default ledgerSlice.reducer;
