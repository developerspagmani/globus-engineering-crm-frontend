import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PurchaseBill } from '@/types/modules';
import api from '@/lib/axios';

export const fetchPurchaseBills = createAsyncThunk(
  'purchaseBills/fetchAll',
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
      let url = `/purchase-bills?page=${page}&limit=${limit}`;
      if (company_id) url += `&company_id=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items,
        pagination: response.data.pagination
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch purchase bills');
    }
  }
);

export const createPurchaseBill = createAsyncThunk(
  'purchaseBills/create',
  async (data: Omit<PurchaseBill, 'id' | 'grandTotal' | 'company_id'> & { company_id?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/purchase-bills', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create purchase bill');
    }
  }
);

export const updatePurchaseBill = createAsyncThunk(
  'purchaseBills/update',
  async (data: PurchaseBill, { rejectWithValue }) => {
    try {
      const response = await api.put(`/purchase-bills/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update purchase bill');
    }
  }
);

export const deletePurchaseBill = createAsyncThunk(
  'purchaseBills/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/purchase-bills/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete purchase bill');
    }
  }
);

interface PurchaseState {
  items: PurchaseBill[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
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

const initialState: PurchaseState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
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

const purchaseSlice = createSlice({
  name: 'purchaseBills',
  initialState,
  reducers: {
    setPurchasePage(state, action: PayloadAction<number>) {
      state.pagination.currentPage = action.payload;
    },
    setPurchaseFilters(state, action: PayloadAction<Partial<PurchaseState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset page on filter change
    },
    resetPurchaseState(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.filters = {
        search: '',
        fromDate: '',
        toDate: '',
      };
      state.pagination = {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPurchaseBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseBills.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPurchaseBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createPurchaseBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseBill.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.totalItems += 1;
      })
      .addCase(createPurchaseBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updatePurchaseBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseBill.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updatePurchaseBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deletePurchaseBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseBill.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.pagination.totalItems -= 1;
      })
      .addCase(deletePurchaseBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPurchasePage, setPurchaseFilters, resetPurchaseState } = purchaseSlice.actions;
export default purchaseSlice.reducer;
