import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Invoice } from '@/types/modules';
import api from '@/lib/axios';

const mapInvoice = (inv: any): Invoice => ({
  id: inv.id.toString(),
  invoiceNumber: String(inv.invoice_no || `INV-${inv.id}`),
  customerId: inv.customer_id?.toString() || '',
  customerName: inv.customer_name || 'N/A',
  address: inv.address || '',
  company_id: inv.company_id?.toString() || '',
  date: inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : '',
  dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
  poNo: inv.po_no || inv.poNo || '',
  poDate: inv.po_date || inv.poDate ? new Date(inv.po_date || inv.poDate).toISOString().split('T')[0] : '',
  dcNo: inv.dc_no || inv.dcNo || '',
  dcDate: inv.dc_date || inv.dcDate ? new Date(inv.dc_date || inv.dcDate).toISOString().split('T')[0] : '',
  grandTotal: parseFloat(inv.grand_total || '0'),
  status: inv.status?.toLowerCase() || 'draft',
  items: Array.isArray(inv.items_json) ? inv.items_json : JSON.parse(inv.items_json || '[]'),
  subTotal: parseFloat(inv.total || '0'),
  taxTotal: (parseFloat(inv.grand_total || '0')) - (parseFloat(inv.total || '0')),
  discount: parseFloat(inv.discount || '0'), 
  type: inv.type || 'INVOICE',
  billType: inv.bill_type || 'Regular',
  inwardId: inv.inward_id?.toString(),
  createdAt: inv.app_created_at || inv.created_at,
  notes: inv.notes || '',
  gstin: inv.gstin || '',
  state: inv.state || '',
  paidAmount: parseFloat(inv.paid_amount || '0')
});

// Thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/invoices?company_id=${company_id}` : '/invoices';
      const response = await api.get(url);
      return response.data.map(mapInvoice);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch invoices');
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (data: Omit<Invoice, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/invoices', {
        invoiceNumber: data.invoiceNumber,
        date: data.date,
        dueDate: data.dueDate,
        customerId: data.customerId,
        customerName: data.customerName,
        subTotal: data.subTotal,
        grandTotal: data.grandTotal,
        discount: data.discount,
        items: data.items,
        status: data.status.toUpperCase(),
        type: data.type,
        billType: data.billType,
        inwardId: data.inwardId,
        company_id: data.company_id,
        notes: data.notes,
        poNo: (data as any).poNo,
        poDate: (data as any).poDate,
        dcNo: (data as any).dcNo,
        dcDate: (data as any).dcDate,
        address: (data as any).address,
        gstin: (data as any).gstin,
        state: (data as any).state
      });
      return mapInvoice(response.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/update',
  async (data: Invoice, { rejectWithValue }) => {
    try {
      const response = await api.put(`/invoices/${data.id}`, {
        date: data.date,
        dueDate: data.dueDate,
        customerId: data.customerId,
        customerName: data.customerName,
        subTotal: data.subTotal,
        grandTotal: data.grandTotal,
        discount: data.discount,
        items: data.items,
        status: data.status.toUpperCase(),
        type: data.type,
        billType: data.billType,
        inwardId: data.inwardId,
        notes: data.notes,
        poNo: data.poNo,
        poDate: data.poDate,
        dcNo: data.dcNo,
        dcDate: data.dcDate,
        address: (data as any).address,
        gstin: (data as any).gstin,
        state: (data as any).state
      });
      return mapInvoice(response.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update invoice');
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/invoices/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete invoice');
    }
  }
);

export const fetchNextNumbers = createAsyncThunk(
  'invoices/fetchNextNumbers',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/invoices/next-numbers?companyId=${companyId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch next numbers');
    }
  }
);

interface InvoiceState {
  items: Invoice[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
  settings: {
    logo: string | null;
    termsAndConditions: string;
    footerText: string;
    prefix: string;
    nextNumber: number;
    showLogo: boolean;
    accentColor: string;
    nextInvoice: string | null;
    nextChallan: string | null;
  };
}

const initialState: InvoiceState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
  settings: {
    logo: null,
    termsAndConditions: '1. Please pay within 15 days from the date of invoice.\n2. Late payment is subject to interest of 2% per month.\n3. Goods once sold will not be taken back.',
    footerText: 'Thank you for your business!',
    prefix: 'INV',
    nextNumber: 1,
    showLogo: true,
    accentColor: '#0d6efd',
    nextInvoice: null,
    nextChallan: null,
  },
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoiceFilters: (state, action: PayloadAction<Partial<InvoiceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setInvoicePage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    updateInvoiceSettings: (state, action: PayloadAction<Partial<InvoiceState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.items = state.items.filter(inv => inv.id !== action.payload);
      })
      .addCase(fetchNextNumbers.fulfilled, (state, action) => {
        state.settings.nextInvoice = String(action.payload.nextInvoice || '').padStart(4, '0');
        state.settings.nextChallan = String(action.payload.nextChallan || '').padStart(4, '0');
      });
  }
});

export const { 
  setInvoiceFilters, 
  setInvoicePage,
  updateInvoiceSettings 
} = invoiceSlice.actions;

export const addInvoice = createInvoice;
export default invoiceSlice.reducer;
