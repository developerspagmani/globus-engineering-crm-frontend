import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Invoice } from '@/types/modules';
import api from '@/lib/axios';

export const fetchPendingPayments = createAsyncThunk(
  'pendingPayments/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    fromDate?: string; 
    toDate?: string;
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search, fromDate, toDate } = params;
      let url = `/invoices?page=${page}&limit=${limit}&status=pending`;
      if (company_id) url += `&company_id=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items.map((inv: any) => {
          const grandTotal = parseFloat(String(inv.grand_total || inv.grandTotal || '0').replace(/[^\d.]/g, '')) || 0;
          const paidAmount = parseFloat(String(inv.paid_amount || inv.paidAmount || '0').replace(/[^\d.]/g, '')) || 0;
          
          return {
            id: inv.id.toString(),
            invoiceNumber: inv.invoice_no ? String(inv.invoice_no).padStart(4, '0') : (inv.invoiceNumber || `INV-${inv.id}`),
            customerId: inv.customer_id?.toString() || inv.customerId?.toString() || '',
            customerName: inv.customer_name || inv.customerName || 'N/A',
            company_id: inv.company_id?.toString() || inv.companyId?.toString() || '',
            date: inv.invoice_date || inv.date ? new Date(inv.invoice_date || inv.date).toISOString().split('T')[0] : '',
            dueDate: inv.due_date || inv.dueDate ? new Date(inv.due_date || inv.dueDate).toISOString().split('T')[0] : '',
            grandTotal,
            paidAmount,
            status: inv.status?.toLowerCase() || 'draft',
            type: inv.type || 'INVOICE',
            inwardId: inv.inward_id?.toString(),
            items: inv.items || [],
            subTotal: parseFloat(String(inv.total || inv.subTotal || '0').replace(/[^\d.]/g, '')) || 0,
            taxTotal: grandTotal - (parseFloat(String(inv.total || inv.subTotal || '0').replace(/[^\d.]/g, '')) || 0),
            createdAt: inv.app_created_at || inv.created_at || inv.createdAt
          };
        }),
        pagination: response.data.pagination,
        aggregates: response.data.aggregates || { totalOutstanding: 0, criticalOverdue: 0 }
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch pending payments');
    }
  }
);

interface PendingPaymentState {
  items: Invoice[];
  loading: boolean;
  error: string | null;
  filters: {
    customerName: string;
    ageingRange: 'all' | '0-30' | '31-60' | '61-90' | '90+';
    minAmount: number;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  aggregates: {
    totalOutstanding: number;
    criticalOverdue: number;
  };
}

const initialState: PendingPaymentState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    customerName: '',
    ageingRange: 'all',
    minAmount: 0,
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
  aggregates: {
    totalOutstanding: 0,
    criticalOverdue: 0,
  },
};

const pendingPaymentSlice = createSlice({
  name: 'pendingPayment',
  initialState,
  reducers: {
    setPendingPaymentFilters: (state, action: PayloadAction<Partial<PendingPaymentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setPendingPaymentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    refreshPendingPayments: (state, action: PayloadAction<Invoice[]>) => {
      state.items = action.payload.filter(inv => (inv.grandTotal - (inv.paidAmount || 0)) > 0);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.aggregates = action.payload.aggregates || { totalOutstanding: 0, criticalOverdue: 0 };
        state.error = null;
      })
      .addCase(fetchPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setPendingPaymentFilters, refreshPendingPayments, setPendingPaymentPage } = pendingPaymentSlice.actions;
export default pendingPaymentSlice.reducer;
