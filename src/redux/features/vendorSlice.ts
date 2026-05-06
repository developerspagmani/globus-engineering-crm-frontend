import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Vendor } from '@/types/modules';
import api from '@/lib/axios';

export const fetchVendors = createAsyncThunk(
  'vendors/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search } = params;
      let url = `/vendors?page=${page}&limit=${limit}`;
      if (company_id) url += `&companyId=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items,
        pagination: response.data.pagination
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch vendors');
    }
  }
);

export const createVendor = createAsyncThunk(
  'vendors/create',
  async (data: Omit<Vendor, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/vendors', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create vendor');
    }
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/update',
  async (data: Vendor, { rejectWithValue }) => {
    try {
      const response = await api.put(`/vendors/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update vendor');
    }
  }
);

export const deleteVendor = createAsyncThunk(
  'vendors/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/vendors/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete vendor');
    }
  }
);

interface VendorState {
  items: Vendor[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    category: string;
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

const initialState: VendorState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    category: 'all',
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

const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendorFilters: (state, action: PayloadAction<Partial<VendorState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setVendorPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        const index = state.items.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.items = state.items.filter(v => v.id !== action.payload);
      });
  }
});

export const { setVendorFilters, setVendorPage } = vendorSlice.actions;
export default vendorSlice.reducer;
