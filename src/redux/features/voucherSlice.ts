import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Voucher } from '@/types/modules';
import api from '@/lib/axios';

export const fetchVouchers = createAsyncThunk(
  'voucher/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    partyId?: string;
    partyType?: string;
    id?: string;
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search, type, status, fromDate, toDate, partyId, id } = params;
      let url = `/vouchers?page=${page}&limit=${limit}`;
      if (company_id) url += `&company_id=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (type && type !== 'all') url += `&type=${type}`;
      if (params.partyType && params.partyType !== 'all') url += `&partyType=${params.partyType}`;
      if (status && status !== 'all') url += `&status=${status}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      if (partyId) url += `&partyId=${partyId}`;
      if (id) url += `&id=${id}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items.map((v: any) => ({
          id: v.id.toString(),
          voucherNo: v.voucher_no,
          date: (() => {
            if (!v.date) return '';
            const d = new Date(v.date);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
          })(),
          type: v.type?.toLowerCase() || 'payment',
          partyId: v.party_id?.toString(),
          partyName: v.party_name,
          partyType: v.party_type?.toLowerCase() || 'other',
          amount: parseFloat(String(v.amount || '0').replace(/[^\d.]/g, '')) || 0,
          paymentMode: v.payment_mode?.toLowerCase() || 'cash',
          referenceNo: v.reference_no,
          chequeNo: v.cheque_no,
          description: v.description_ || v.description || '',
          status: v.status?.toLowerCase() || 'posted',
          tdsAmount: parseFloat(String(v.tds_amount || '0')) || 0,
          othersAmount: parseFloat(String(v.others_amount || '0')) || 0,
          company_id: v.company_id?.toString() || (v as any).companyId?.toString() || '',
          createdAt: v.app_created_at,
          // Map internal items to camelCase for the form to recognize them
          items: (v.items || []).map((it: any) => ({
            ...it,
            id: it.id || it.invoiceNo || it.invoice_no,
            invoiceNo: it.invoiceNo || it.invoice_no,
            adjustmentType: it.adjustmentType || it.adjustment_type || 'TDS',
            adjustmentValue: parseFloat(String(it.adjustmentValue || it.adjustment_value || '0')) || 0
          }))
        })),
        pagination: response.data.pagination,
        aggregates: {
          totalCollected: parseFloat(String(response.data.aggregates?.total_collected || response.data.aggregates?.totalCollected || '0')),
          totalTDS: parseFloat(String(response.data.aggregates?.total_tds || response.data.aggregates?.totalTDS || '0')),
          totalOthers: parseFloat(String(response.data.aggregates?.total_others || response.data.aggregates?.totalOthers || '0'))
        }
      };
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
        company_id: (data as any).company_id,
        tds_amount: data.tdsAmount,
        others_amount: data.othersAmount,
        inward_id: (data as any).inward_id,
        inward_no: (data as any).inward_no,
        items: (data as any).items
      };
      
      const response = await api.post('/vouchers', payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create voucher');
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
        company_id: (data as any).company_id,
        tds_amount: data.tdsAmount,
        others_amount: data.othersAmount,
        inward_id: (data as any).inward_id,
        inward_no: (data as any).inward_no,
        items: (data as any).items
      };
      
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
    partyType: 'all' | 'customer' | 'vendor';
    status: 'all' | 'draft' | 'posted' | 'cancelled';
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  aggregates: {
    totalCollected: number;
    totalTDS: number;
    totalOthers: number;
  };
}

const initialState: VoucherState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    type: 'all',
    partyType: 'customer',
    status: 'all',
    fromDate: '',
    toDate: '',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
  aggregates: {
    totalCollected: 0,
    totalTDS: 0,
    totalOthers: 0,
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
    resetVoucherState: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVouchers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        if (!action.meta.arg?.id) {
          state.pagination.totalItems = action.payload.pagination.total;
          state.pagination.totalPages = action.payload.pagination.totalPages;
          state.pagination.currentPage = action.payload.pagination.page;
        }
        state.aggregates = action.payload.aggregates || { totalCollected: 0, totalTDS: 0, totalOthers: 0 };
        state.error = null;
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVoucher.fulfilled, (state, action) => {
        const v = action.payload;
        state.items.unshift({
          ...v,
          id: v.id.toString(),
          voucherNo: v.voucher_no || v.voucherNo,
          description: v.description_ || v.description || '',
          tdsAmount: parseFloat(String(v.tds_amount || v.tdsAmount || '0')) || 0,
          othersAmount: parseFloat(String(v.others_amount || v.othersAmount || '0')) || 0,
          inwardId: v.inward_id,
          inwardNo: v.inward_no,
          items: (v.items || []).map((it: any) => ({
            ...it,
            id: it.id || it.invoiceNo || it.invoice_no,
            invoiceNo: it.invoiceNo || it.invoice_no,
            adjustmentType: it.adjustmentType || it.adjustment_type || 'TDS',
            adjustmentValue: parseFloat(String(it.adjustmentValue || it.adjustment_value || '0')) || 0
          }))
        });
      })
      .addCase(updateVoucher.fulfilled, (state, action) => {
        const v = action.payload;
        const index = state.items.findIndex(item => item.id === v.id.toString());
        if (index !== -1) {
          state.items[index] = {
            ...v,
            id: v.id.toString(),
            voucherNo: v.voucher_no || v.voucherNo,
            description: v.description_ || v.description || '',
            tdsAmount: parseFloat(String(v.tds_amount || v.tdsAmount || '0')) || 0,
            othersAmount: parseFloat(String(v.others_amount || v.othersAmount || '0')) || 0,
            inwardId: v.inward_id,
            inwardNo: v.inward_no,
            items: (v.items || []).map((it: any) => ({
              ...it,
              id: it.id || it.invoiceNo || it.invoice_no,
              invoiceNo: it.invoiceNo || it.invoice_no,
              adjustmentType: it.adjustmentType || it.adjustment_type || 'TDS',
              adjustmentValue: parseFloat(String(it.adjustmentValue || it.adjustment_value || '0')) || 0
            }))
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
  setVoucherPage,
  resetVoucherState
} = voucherSlice.actions;

export default voucherSlice.reducer;
