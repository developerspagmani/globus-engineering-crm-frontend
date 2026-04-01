import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Voucher } from '@/types/modules';
import api from '@/lib/axios';

export const fetchVouchers = createAsyncThunk(
  'voucher/fetchAll',
  async (companyId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get(`/vouchers${companyId ? `?companyId=${companyId}` : ''}`);
      return response.data.map((v: any) => ({
        id: v.id.toString(),
        voucherNo: v.voucher_no,
        date: v.date ? new Date(v.date).toISOString().split('T')[0] : '',
        type: v.type?.toLowerCase() || 'payment',
        partyId: v.party_id?.toString(),
        partyName: v.party_name,
        partyType: v.party_type?.toLowerCase() || 'other',
        amount: parseFloat(v.amount || '0'),
        paymentMode: v.payment_mode?.toLowerCase() || 'cash',
        referenceNo: v.reference_no,
        chequeNo: v.cheque_no,
        description: v.description_ || v.description || '',
        status: v.status?.toLowerCase() || 'posted',
        company_id: v.company_id?.toString() || (v as any).companyId?.toString() || '',
        createdAt: v.app_created_at
      }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch vouchers');
    }
  }
);

export const createVoucher = createAsyncThunk(
  'voucher/create',
  async (data: Omit<Voucher, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const payload = {
        voucher_no: data.voucherNo,
        date: data.date,
        type: data.type,
        party_id: data.partyId,
        party_name: data.partyName,
        party_type: data.partyType,
        amount: data.amount,
        payment_mode: data.paymentMode,
        reference_no: data.referenceNo,
        cheque_no: data.chequeNo,
        description: data.description,
        status: data.status,
        company_id: (data as any).company_id || (data as any).company_id
      };
      
      console.log('Sending Voucher Payload:', payload);
      const response = await api.post('/vouchers', payload);
      return response.data;
    } catch (err: any) {
      console.error('[Voucher Create Error]:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create voucher';
      return rejectWithValue(errorMessage);
    }
  }
);
export const updateVoucher = createAsyncThunk(
  'voucher/update',
  async (data: Voucher, { rejectWithValue }) => {
    try {
      const payload = {
        voucher_no: data.voucherNo,
        date: data.date,
        type: data.type,
        party_id: data.partyId,
        party_name: data.partyName,
        party_type: data.partyType,
        amount: data.amount,
        payment_mode: data.paymentMode,
        reference_no: data.referenceNo,
        cheque_no: data.chequeNo,
        description: data.description,
        status: data.status,
        company_id: (data as any).company_id
      };
      
      console.log('Updating Voucher Payload:', payload);
      const response = await api.put(`/vouchers/${data.id}`, payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update voucher');
    }
  }
);

export const deleteVoucher = createAsyncThunk(
  'voucher/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/vouchers/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete voucher');
    }
  }
);

interface VoucherState {
  items: Voucher[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    type: 'all' | 'payment' | 'receipt' | 'journal' | 'contra';
    status: 'all' | 'draft' | 'posted' | 'cancelled';
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

const initialState: VoucherState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    type: 'all',
    status: 'all',
    fromDate: '',
    toDate: '',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const voucherSlice = createSlice({
  name: 'voucher',
  initialState,
  reducers: {
    setVoucherFilters: (state, action: PayloadAction<Partial<VoucherState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setVoucherPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVouchers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVoucher.fulfilled, (state, action) => {
        state.items.unshift({
          ...action.payload,
          id: action.payload.id.toString(),
          description: action.payload.description_ || action.payload.description || ''
        });
      })
      .addCase(updateVoucher.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id.toString());
        if (index !== -1) {
          state.items[index] = {
            ...action.payload,
            id: action.payload.id.toString(),
            description: action.payload.description_ || action.payload.description || ''
          };
        }
      })
      .addCase(deleteVoucher.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const {
  setVoucherFilters,
  setVoucherPage
} = voucherSlice.actions;

export default voucherSlice.reducer;
