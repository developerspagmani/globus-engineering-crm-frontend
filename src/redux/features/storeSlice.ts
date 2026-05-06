import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Store, StoreVisit } from '@/types/modules';
import api from '@/lib/axios';

export const fetchStores = createAsyncThunk(
  'stores/fetchAll',
  async (params: { 
    company_id?: string;
    page?: number; 
    limit?: number; 
    search?: string; 
  } = {}, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search } = params;
      let url = `/stores?page=${page}&limit=${limit}`;
      if (company_id) url += `&company_id=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items,
        pagination: response.data.pagination
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch stores');
    }
  }
);

export const addStore = createAsyncThunk(
  'stores/create',
  async (data: Partial<Store>, { rejectWithValue }) => {
    try {
      const response = await api.post('/stores', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create store');
    }
  }
);

export const updateStore = createAsyncThunk(
  'stores/update',
  async (data: Store, { rejectWithValue }) => {
    try {
      const response = await api.put(`/stores/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update store');
    }
  }
);

export const deleteStore = createAsyncThunk(
  'stores/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/stores/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete store');
    }
  }
);

export const logVisit = createAsyncThunk(
  'stores/logVisit',
  async (data: Partial<StoreVisit>, { rejectWithValue }) => {
    try {
      const response = await api.post('/stores/visit', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to log visit');
    }
  }
);

export const updateVisit = createAsyncThunk(
  'stores/updateVisit',
  async (data: { id: string } & Partial<StoreVisit>, { rejectWithValue }) => {
    try {
      const response = await api.put(`/stores/visit/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update visit');
    }
  }
);

export const deleteVisit = createAsyncThunk(
  'stores/deleteVisit',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/stores/visit/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete visit');
    }
  }
);

interface StoreState {
  items: Store[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    area: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

const initialState: StoreState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    area: 'all',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
};

const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    setStoreFilters: (state, action: PayloadAction<Partial<StoreState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setStorePage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addStore.fulfilled, (state, action: PayloadAction<Store>) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteStore.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(updateStore.fulfilled, (state, action: PayloadAction<Store>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(logVisit.fulfilled, (state, action: PayloadAction<StoreVisit>) => {
        const index = state.items.findIndex(item => item.id === action.payload.storeId);
        if (index !== -1) {
          state.items[index].latestVisit = action.payload;
        }
      });
  }
});

export const { setStoreFilters, setStorePage } = storeSlice.actions;
export default storeSlice.reducer;
