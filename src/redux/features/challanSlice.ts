import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Challan } from '@/types/modules';
import api from '@/lib/axios';

export const fetchChallans = createAsyncThunk(
  'challan/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search } = params;
      let url = `/challans?page=${page}&limit=${limit}`;
      if (company_id) url += `&company_id=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items.map((c: any) => ({
          id: c.id.toString(),
          challanNo: c.challan_no || '',
          partyId: c.party_id || '',
          partyName: c.party_name || '',
          partyType: c.party_type || 'customer',
          company_id: c.company_id || '',
          date: c.date ? new Date(c.date).toISOString().split('T')[0] : '',
          type: c.type || 'delivery',
          status: c.status || 'draft',
          items: Array.isArray(c.items) ? c.items : JSON.parse(c.items_json || '[]'),
          vehicleNo: c.vehicle_no || '',
          driverName: c.driver_name || '',
          notes: c.notes || '',
          createdAt: c.app_created_at || c.createdAt || ''
        })),
        pagination: response.data.pagination
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch challans');
    }
  }
);

export const createChallan = createAsyncThunk(
  'challan/create',
  async (data: Omit<Challan, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/challans', {
        id: (data as any).id,
        challan_no: data.challanNo,
        party_id: data.partyId,
        party_name: data.partyName,
        party_type: data.partyType,
        type: data.type,
        status: data.status,
        items: data.items,
        vehicle_no: data.vehicleNo,
        driver_name: data.driverName,
        company_id: data.company_id
      });
      const c = response.data;
      return {
        id: c.id.toString(),
        challanNo: c.challan_no || data.challanNo,
        partyId: c.party_id || data.partyId,
        partyName: c.party_name || data.partyName,
        partyType: c.party_type || data.partyType,
        company_id: c.company_id || data.company_id,
        date: c.date ? new Date(c.date).toISOString().split('T')[0] : data.date,
        type: c.type || data.type,
        status: c.status || data.status,
        items: c.items || data.items,
        vehicleNo: c.vehicle_no || data.vehicleNo,
        driverName: c.driver_name || data.driverName,
        notes: c.notes || data.notes,
        createdAt: c.app_created_at || c.createdAt || new Date().toISOString()
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create challan');
    }
  }
);

export const updateChallan = createAsyncThunk(
  'challan/update',
  async (data: Challan, { rejectWithValue }) => {
    try {
      const response = await api.put(`/challans/${data.id}`, {
        challan_no: data.challanNo,
        party_id: data.partyId,
        party_name: data.partyName,
        party_type: data.partyType,
        type: data.type,
        status: data.status,
        items: data.items,
        vehicle_no: data.vehicleNo,
        driver_name: data.driverName,
        company_id: data.company_id
      });
      const c = response.data || data;
      return {
        id: c.id?.toString() || data.id,
        challanNo: c.challan_no || data.challanNo,
        partyId: c.party_id || data.partyId,
        partyName: c.party_name || data.partyName,
        partyType: c.party_type || data.partyType,
        company_id: c.company_id || data.company_id,
        date: c.date ? new Date(c.date).toISOString().split('T')[0] : data.date,
        type: c.type || data.type,
        status: c.status || data.status,
        items: c.items || data.items,
        vehicleNo: c.vehicle_no || data.vehicleNo,
        driverName: c.driver_name || data.driverName,
        notes: c.notes || data.notes,
        createdAt: c.app_created_at || c.createdAt || data.createdAt
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update challan');
    }
  }
);

export const deleteChallan = createAsyncThunk(
  'challan/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/challans/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete challan');
    }
  }
);

interface ChallanState {
  items: Challan[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    type: 'all' | 'delivery' | 'returnable' | 'job_work';
    status: 'all' | 'draft' | 'dispatched' | 'received' | 'cancelled';
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const initialState: ChallanState = {
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
    totalItems: 0,
    totalPages: 0,
  },
};

const challanSlice = createSlice({
  name: 'challan',
  initialState,
  reducers: {
    setChallanFilters: (state, action: PayloadAction<Partial<ChallanState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setChallanPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChallans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChallans.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createChallan.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateChallan.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteChallan.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      });
  }
});

export const {
  setChallanFilters,
  setChallanPage
} = challanSlice.actions;

export default challanSlice.reducer;
