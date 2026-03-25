import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Customer } from '@/types/modules';
import api from '@/lib/axios';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get(company_id ? `/customers?company_id=${company_id}` : '/customers');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch customers');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (data: Omit<Customer, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async (data: Customer, { rejectWithValue }) => {
    try {
      const response = await api.put(`/customers/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update customer');
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete customer');
    }
  }
);

interface CustomerState {
  items: Customer[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    industry: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

const initialState: CustomerState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    industry: 'all',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<CustomerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action: PayloadAction<any>) => {
        const c = action.payload;
        state.items.unshift({
          id: c.id?.toString() || '',
          name: c.name || c.customer_name || '',
          email: c.email || '',
          phone: c.phone || '',
          company: c.customer_name || c.name || '',
          industry: c.industry || '',
          status: c.status || 'active',
          street1: c.street1,
          street2: c.street2,
          city: c.city,
          state: c.state,
          stateCode: c.state_code,
          pinCode: c.pin_code,
          company_id: c.company_id,
          createdAt: c.createdAt || c.app_created_at
        });
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  }
});

export const { setFilters, setPage } = customerSlice.actions;

export const addCustomer = createCustomer;
export default customerSlice.reducer;
