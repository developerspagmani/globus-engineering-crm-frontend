import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { InwardEntry } from '@/types/modules';
import api from '@/lib/axios';

// Thunks
export const fetchInwards = createAsyncThunk(
  'inwards/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    fromDate?: string;
    toDate?: string;
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search, status, fromDate, toDate } = params;
      let url = `/inward?page=${page}&limit=${limit}`;
      if (company_id) url += `&companyId=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&status=${status}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items,
        pagination: response.data.pagination,
        statusCounts: response.data.statusCounts   // ← completed / pending / activeParties
      };
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
        due_date: data.dueDate,
        date: data.date,
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
        dueDate: c.due_date ? new Date(c.due_date).toISOString().split('T')[0] : data.dueDate,
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
        due_date: data.dueDate,
        date: data.date,
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
        dueDate: c.due_date ? new Date(c.due_date).toISOString().split('T')[0] : data.dueDate,
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
    totalItems: number;
    totalPages: number;
  };
  statusCounts: {
    completed: number;
    pending: number;
    activeParties: number;
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
    totalItems: 0,
    totalPages: 0,
  },
  statusCounts: {
    completed: 0,
    pending: 0,
    activeParties: 0,
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
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        if (action.payload.statusCounts) {
          state.statusCounts = action.payload.statusCounts;
        }
        state.error = null;
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
