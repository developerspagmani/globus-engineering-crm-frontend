import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { InwardEntry } from '@/types/modules';
import api from '@/lib/axios';

// Thunks
export const fetchInwards = createAsyncThunk(
  'inward/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/inward?company_id=${company_id}` : '/inward';
      const response = await api.get(url);
      return response.data.map((item: any) => ({
        id: item.id.toString(),
        inwardNo: String(item.inward_no || ''),
        customerId: item.customer_id?.toString() || '',
        customerName: String(item.customer_name || 'N/A'),
        address: item.address || '',
        vendorId: item.vendor_id?.toString() || '',
        vendorName: item.vendor_name || '',
        poReference: item.po_reference || '',
        poDate: item.po_date ? new Date(item.po_date).toISOString().split('T')[0] : '',
        challanNo: item.challan_no || '',
        dcNo: item.dc_no || '',
        dcDate: item.dc_date ? new Date(item.dc_date).toISOString().split('T')[0] : '',
        vehicleNo: item.vehicle_no || '',
        company_id: item.company_id?.toString() || '',
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        status: item.status || 'pending',
        items: item.items || [],
        createdAt: item.created_at
      }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch inward entries');
    }
  }
);

export const createInward = createAsyncThunk(
  'inward/create',
  async (data: Omit<InwardEntry, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/inward', {
        inward_no: data.inwardNo,
        customer_id: data.customerId,
        customer_name: data.customerName,
        address: data.address,
        vendor_id: data.vendorId,
        vendor_name: data.vendorName,
        po_reference: data.poReference,
        po_date: data.poDate,
        challan_no: data.challanNo,
        dc_no: data.dcNo,
        dc_date: data.dcDate,
        vehicle_no: data.vehicleNo,
        status: data.status,
        items: data.items,
        company_id: data.company_id
      });
      const c = response.data;
      return {
        id: c.id.toString(),
        inwardNo: String(c.inward_no || data.inwardNo || ''),
        customerId: c.customer_id?.toString() || data.customerId || '',
        customerName: String(c.customer_name || data.customerName || 'N/A'),
        address: c.address || data.address || '',
        vendorId: c.vendor_id?.toString() || data.vendorId || '',
        vendorName: c.vendor_name || data.vendorName || '',
        poReference: c.po_reference || data.poReference || '',
        poDate: c.po_date ? new Date(c.po_date).toISOString().split('T')[0] : data.poDate,
        challanNo: c.challan_no || data.challanNo || '',
        dcNo: c.dc_no || data.dcNo || '',
        dcDate: c.dc_date ? new Date(c.dc_date).toISOString().split('T')[0] : data.dcDate,
        vehicleNo: c.vehicle_no || data.vehicleNo || '',
        company_id: c.company_id?.toString() || data.company_id || '',
        date: c.date ? new Date(c.date).toISOString().split('T')[0] : data.date,
        status: c.status || data.status || 'pending',
        items: c.items || data.items || [],
        createdAt: c.app_created_at || c.created_at || c.createdAt || new Date().toISOString()
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create inward entry');
    }
  }
);

export const updateInward = createAsyncThunk(
  'inward/update',
  async (data: InwardEntry, { rejectWithValue }) => {
    try {
      const response = await api.put(`/inward/${data.id}`, {
        inward_no: data.inwardNo,
        customer_id: data.customerId,
        customer_name: data.customerName,
        address: data.address,
        vendor_id: data.vendorId,
        vendor_name: data.vendorName,
        po_reference: data.poReference,
        po_date: data.poDate,
        challan_no: data.challanNo,
        dc_no: data.dcNo,
        dc_date: data.dcDate,
        vehicle_no: data.vehicleNo,
        status: data.status,
        items: data.items,
        company_id: data.company_id
      });
      const c = response.data || data;
      return {
        id: c.id?.toString() || data.id,
        inwardNo: String(c.inward_no || data.inwardNo || ''),
        customerId: c.customer_id?.toString() || data.customerId || '',
        customerName: String(c.customer_name || data.customerName || 'N/A'),
        address: c.address || data.address || '',
        vendorId: c.vendor_id?.toString() || data.vendorId || '',
        vendorName: c.vendor_name || data.vendorName || '',
        poReference: c.po_reference || data.poReference || '',
        poDate: c.po_date ? new Date(c.po_date).toISOString().split('T')[0] : data.poDate,
        challanNo: c.challan_no || data.challanNo || '',
        dcNo: c.dc_no || data.dcNo || '',
        dcDate: c.dc_date ? new Date(c.dc_date).toISOString().split('T')[0] : data.dcDate,
        vehicleNo: c.vehicle_no || data.vehicleNo || '',
        company_id: c.company_id?.toString() || data.company_id || '',
        date: c.date ? new Date(c.date).toISOString().split('T')[0] : data.date,
        status: c.status || data.status || 'pending',
        items: c.items || data.items || [],
        createdAt: c.app_created_at || c.created_at || c.createdAt || data.createdAt
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update inward entry');
    }
  }
);

export const deleteInward = createAsyncThunk(
  'inward/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/inward/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete inward entry');
    }
  }
);

interface InwardState {
  items: InwardEntry[];
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

const initialState: InwardState = {
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

const inwardSlice = createSlice({
  name: 'inward',
  initialState,
  reducers: {
    setInwardFilters: (state, action: PayloadAction<Partial<InwardState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setInwardPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInwards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInwards.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInwards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createInward.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteInward.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      });
  }
});

export const { setInwardFilters, setInwardPage } = inwardSlice.actions;
export default inwardSlice.reducer;
