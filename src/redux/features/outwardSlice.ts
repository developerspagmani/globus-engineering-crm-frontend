import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { OutwardEntry } from '@/types/modules';
import api from '@/lib/axios';

// Thunks
export const fetchOutwards = createAsyncThunk(
  'outward/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/outward?company_id=${company_id}` : '/outward';
      const response = await api.get(url);
      return response.data.map((item: any) => ({
        id: item.id.toString(),
        outwardNo: item.outward_no || item.dc_no || '',
        partyType: item.party_type || 'customer',
        customerId: item.customer_id?.toString() || '',
        customerName: item.customer_name || '',
        vendorId: item.vendor_id?.toString() || '',
        vendorName: item.vendor_name || '',
        processName: item.process_name || '',
        invoiceReference: item.invoice_reference || item.invoice_no || '',
        challanNo: item.challan_no || '',
        vehicleNo: item.vehicle_no || '',
        driverName: item.driver_name || '',
        notes: item.notes || '',
        inwardId: item.inward_id || item.inwardId || '',
        inwardNo: item.inward_no || item.inwardNo || '',
        company_id: item.company_id?.toString() || '',
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        status: item.status || 'pending',
        items: item.items || [],
        amount: item.amount || 0,
        createdAt: item.created_at
      }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch outward entries');
    }
  }
);

export const createOutward = createAsyncThunk(
  'outward/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/outward', {
        outward_no: data.outwardNo,
        party_type: data.partyType || 'customer',
        customer_id: data.customerId,
        customer_name: data.customerName,
        vendor_id: data.vendorId,
        vendor_name: data.vendorName,
        process_name: data.processName,
        invoice_reference: data.invoiceReference,
        challan_no: data.challanNo,
        vehicle_no: data.vehicleNo,
        driver_name: data.driverName,
        notes: data.notes,
        status: data.status,
        items: data.items,
        company_id: data.company_id,
        inward_id: data.inward_id || data.inwardId,
        inward_no: data.inward_no || data.inwardNo,
        amount: data.amount
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create outward entry');
    }
  }
);

export const updateOutward = createAsyncThunk(
  'outward/update',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.put(`/outward/${data.id}`, {
        outward_no: data.outwardNo,
        party_type: data.partyType,
        customer_id: data.customerId,
        customer_name: data.customerName,
        vendor_id: data.vendorId,
        vendor_name: data.vendorName,
        process_name: data.processName,
        invoice_reference: data.invoiceReference,
        challan_no: data.challanNo,
        vehicle_no: data.vehicleNo,
        driver_name: data.driverName,
        notes: data.notes,
        status: data.status,
        items: data.items,
        company_id: data.company_id,
        inward_id: data.inward_id || data.inwardId,
        inward_no: data.inward_no || data.inwardNo,
        amount: data.amount
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update outward entry');
    }
  }
);

export const deleteOutward = createAsyncThunk(
  'outward/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/outward/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete outward entry');
    }
  }
);

interface OutwardState {
  items: OutwardEntry[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: 'all' | 'pending' | 'completed' | 'cancelled';
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

const initialState: OutwardState = {
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
};

const outwardSlice = createSlice({
  name: 'outward',
  initialState,
  reducers: {
    setOutwardFilters: (state, action: PayloadAction<Partial<OutwardState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setOutwardPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutwards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOutwards.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOutwards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createOutward.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteOutward.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      });
  }
});

export const { setOutwardFilters, setOutwardPage } = outwardSlice.actions;
export default outwardSlice.reducer;
