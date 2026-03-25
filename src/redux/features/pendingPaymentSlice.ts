import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Invoice } from '@/types/modules';
import api from '@/lib/axios';

export const fetchPendingPayments = createAsyncThunk(
  'pendingPayments/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/invoices?company_id=${company_id}` : '/invoices';
      const response = await api.get(url);
      // Only show invoices that are NOT fully paid and are of type INVOICE or BOTH
      return response.data
        .map((inv: any) => ({
          id: inv.id.toString(),
          invoiceNumber: String(inv.invoice_no || `INV-${inv.id}`),
          customerId: inv.customer_id?.toString() || '',
          customerName: inv.customer_name || 'N/A',
          company_id: inv.company_id?.toString() || '',
          date: inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : '',
          dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
          grandTotal: parseFloat(inv.grand_total || '0'),
          paidAmount: parseFloat(inv.paid_amount || '0'),
          status: inv.status?.toLowerCase() || 'draft',
          type: inv.type || 'INVOICE',
          inwardId: inv.inward_id?.toString(),
          items: inv.items || [],
          subTotal: parseFloat(inv.total || '0'),
          taxTotal: parseFloat(inv.grand_total || '0') - parseFloat(inv.total || '0'),
          createdAt: inv.app_created_at
        }))
        .filter((inv: any) => inv.grandTotal > inv.paidAmount && (inv.type === 'INVOICE' || inv.type === 'BOTH'));
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
};

const pendingPaymentSlice = createSlice({
  name: 'pendingPayment',
  initialState,
  reducers: {
    setPendingPaymentFilters: (state, action: PayloadAction<Partial<PendingPaymentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    refreshPendingPayments: (state, action: PayloadAction<Invoice[]>) => {
      state.items = action.payload.filter(inv => inv.grandTotal > inv.paidAmount && (inv.type === 'INVOICE' || inv.type === 'BOTH'));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setPendingPaymentFilters, refreshPendingPayments } = pendingPaymentSlice.actions;
export default pendingPaymentSlice.reducer;
