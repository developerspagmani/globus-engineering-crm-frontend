import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Invoice } from '@/types/modules';
import api from '@/lib/axios';

const mapInvoice = (inv: any): Invoice => {
  const items = Array.isArray(inv.items_json) 
    ? inv.items_json 
    : JSON.parse(inv.items_json || '[]');

  return {
    id: inv.id.toString(),
    invoiceNumber: inv.invoice_no ? String(inv.invoice_no).padStart(4, '0') : inv.invoiceNumber ? String(inv.invoiceNumber).padStart(4, '0') : `INV-${inv.id}`,
    customerId: inv.customer_id?.toString() || inv.customerId?.toString() || '',
    customerName: inv.customer_name || inv.customerName || 'N/A',
    address: inv.address || '',
    company_id: inv.company_id?.toString() || inv.companyId?.toString() || '',
    date: inv.invoice_date || inv.date ? new Date(inv.invoice_date || inv.date).toISOString().split('T')[0] : '',
    dueDate: inv.due_date || inv.dueDate ? new Date(inv.due_date || inv.dueDate).toISOString().split('T')[0] : '',
    poNo: inv.po_no || inv.poNo || '',
    poDate: inv.po_date || inv.poDate ? new Date(inv.po_date || inv.poDate).toISOString().split('T')[0] : '',
    dcNo: inv.dc_no ? String(inv.dc_no).padStart(4, '0') : (inv.dcNo ? String(inv.dcNo).padStart(4, '0') : ''),
    dcDate: inv.dc_date || inv.dcDate ? new Date(inv.dc_date || inv.dcDate).toISOString().split('T')[0] : '',
    grandTotal: parseFloat(inv.grand_total || inv.grandTotal || '0'),
    status: inv.status?.toLowerCase() || 'draft',
    items: items.map((it: any) => ({
      id: it.id || Math.random().toString(36).substr(2, 9),
      description: it.description || '',
      process: it.process || '',
      quantity: parseFloat(it.quantity || '0'),
      unitPrice: parseFloat(it.unitPrice || it.unit_price || it.price || '0'),
      amount: parseFloat(it.amount || '0'),
      tax: parseFloat(it.tax || '0'),
      total: parseFloat(it.total || '0')
    })),
    subTotal: parseFloat(inv.total || inv.subTotal || '0'),
    taxTotal: (parseFloat(inv.grand_total || inv.grandTotal || '0')) - (parseFloat(inv.total || inv.subTotal || '0')),
    discount: parseFloat(inv.discount || '0'), 
    type: inv.type || (
      (inv.billType || inv.bill_type) === 'Without Process' || (inv.billType || inv.bill_type) === 'without_process' ? 'WOP' :
      (inv.billType || inv.bill_type) === 'Both' || (inv.billType || inv.bill_type) === 'both' ? 'BOTH' : 'INVOICE'
    ),
    billType: inv.billType || (
      inv.bill_type === 'with_process' ? 'With Process' :
      inv.bill_type === 'without_process' ? 'Without Process' :
      inv.bill_type === 'both' ? 'Both' : (inv.bill_type || 'With Process')
    ),
    inwardId: inv.inward_id?.toString() || inv.inwardId?.toString(),
    createdAt: inv.app_created_at || inv.created_at || inv.createdAt,
    notes: inv.notes || '',
    gstin: inv.gstin || '',
    state: inv.state || '',
    paidAmount: parseFloat(inv.paid_amount || inv.paidAmount || '0'),
    otherCharges: parseFloat(inv.other_charges || inv.otherCharges || '0'),
    taxRate: parseFloat(inv.tax_rate || inv.taxRate || '12')
  };
};

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
        state: (data as any).state,
        other_charges: data.otherCharges,
        tax_rate: data.taxRate
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
        state: (data as any).state,
        other_charges: data.otherCharges,
        tax_rate: data.taxRate
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

export const saveInvoiceSettings = createAsyncThunk(
  'invoices/saveSettings',
  async ({ companyId, settings }: { companyId: string, settings: any }, { rejectWithValue }) => {
    try {
      // The backend stores invoice settings in the Company model
      // We extract the logo fields for top-level company storage and put the rest in invoice_settings JSON
      const { logo, logoSecondary, ...otherSettings } = settings;
      const response = await api.put(`/companies/${companyId}`, {
        logo: logo,
        logoSecondary: logoSecondary,
        invoiceSettings: otherSettings
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to save settings');
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
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
    settings: {
      logo: string | null;
      logoSecondary: string | null;
      termsAndConditions: string;
      footerText: string;
      prefix: string;
      nextNumber: number;
      showLogo: boolean;
      accentColor: string;
      nextInvoice: string | null;
      nextChallan: string | null;
      showDeclaration: boolean;
      vatTin?: string;
      cstNo?: string;
      panNo?: string;
      bankName?: string;
      bankAcc?: string;
      bankBranchIfsc?: string;
      companyName?: string;
      companySubHeader?: string;
      companyAddress?: string;
      gstNo?: string;
      stateDetails?: string;
      declarationText?: string;
    };
}

const initialState: InvoiceState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    fromDate: '',
    toDate: '',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
  settings: {
    logo: null,
    logoSecondary: null,
    termsAndConditions: '1. Please pay within 15 days from the date of invoice.\n2. Late payment is subject to interest of 2% per month.\n3. Goods once sold will not be taken back.',
    footerText: 'Thank you for your business!',
    prefix: 'INV',
    nextNumber: 1,
    showLogo: true,
    accentColor: '#ea580c',
    nextInvoice: null,
    nextChallan: null,
    showDeclaration: true,
    vatTin: '',
    cstNo: '',
    panNo: '',
    bankName: '',
    bankAcc: '',
    bankBranchIfsc: '',
    companyName: '',
    companySubHeader: '',
    companyAddress: '',
    gstNo: '',
    stateDetails: '',
    declarationText: 'Supplied to Special Economic Zone-Duties & Taxes Are Exempted\n(Folio-No.8/3/2007 Suzlon ON INFRA SEZ DT.24.9.2007)\n\nUNDER EPCG LICENCE NO\n\n"Supply Meant For export/supply yo SEZ Unit or Sez developer for authorised Operations under Bond or Letter of Undertaking without Payment of Integrated Tax"\n(Export Covered Under LUT NO AD330625078562X v Dated 25/06/2025)\n\nDeclartion: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct'
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
    initializeInvoiceSettings: (state, action: PayloadAction<Partial<InvoiceState['settings']>>) => {
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
      })
      .addCase(saveInvoiceSettings.fulfilled, (state, action) => {
        const company = action.payload;
        // Process snake_case from backend if present
        const invoiceSettings = company.invoiceSettings || (company.invoice_settings ? JSON.parse(company.invoice_settings) : {});
        const logo = (company as any).logo || (company as any).logo;
        const logoSecondary = (company as any).logoSecondary || (company as any).logo_secondary;
        
        state.settings = {
          ...state.settings,
          ...invoiceSettings,
          logo,
          logoSecondary
        };
      });
  }
});

export const { 
  setInvoiceFilters, 
  setInvoicePage,
  updateInvoiceSettings,
  initializeInvoiceSettings
} = invoiceSlice.actions;

export const addInvoice = createInvoice;
export default invoiceSlice.reducer;
