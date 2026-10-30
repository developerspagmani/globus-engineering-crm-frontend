import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Customer } from '@/types/modules';
import api from '@/lib/axios';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    id?: string;
    status?: string;
    industry?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search, id, status, industry, fromDate, toDate, sortBy, sortOrder } = params;
      let url = `/customers?page=${page}&limit=${limit}`;
      if (company_id) url += `&companyId=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (id && id !== 'all') url += `&id=${id}`;
      if (status && status !== 'all') url += `&status=${status}`;
      if (industry && industry !== 'all') url += `&industry=${encodeURIComponent(industry)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      if (sortBy) url += `&sortBy=${sortBy}`;
      if (sortOrder) url += `&sortOrder=${sortOrder}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items,
        pagination: response.data.pagination
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch customers');
    }
  }
);

export const fetchDropdownCustomers = createAsyncThunk(
  'customers/fetchDropdown',
  async (params: { company_id?: string } | undefined, { rejectWithValue }) => {
    try {
      let url = `/customers?page=1&limit=5000`;
      if (params?.company_id) url += `&companyId=${params.company_id}`;
      const response = await api.get(url);
      return response.data.items || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch dropdown customers');
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
  async (data: Partial<Customer> & { id: string }, { rejectWithValue }) => {
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
  dropdownCustomers: Customer[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    customerId?: string;
    status: string;
    industry: string;
    fromDate: string;
    toDate: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  sorting: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

const initialState: CustomerState = {
  items: [],
  dropdownCustomers: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    customerId: 'all',
    status: 'all',
    industry: 'all',
    fromDate: '',
    toDate: '',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
  sorting: {
    sortBy: 'customer_name',
    sortOrder: 'desc',
  },
};

const mapCustomer = (c: any): Customer => ({
  id: c.id?.toString() || '',
  name: c.name || c.customer_name || '',
  email: c.email || c.email_id1 || c.emailId1 || '',
  phone: c.phone || c.phone_number1 || c.phoneNumber1 || '',
  company: c.company || c.customer_name || c.name || '',
  industry: c.industry || '',
  status: c.status || 'active',
  street1: c.street1 || '',
  street2: c.street2 || '',
  city: c.city || '',
  area: c.area || '',
  state: c.state || '',
  stateCode: c.stateCode || c.state_code || '',
  pinCode: c.pinCode != null ? String(c.pinCode) : (c.pin_code != null ? String(c.pin_code) : ''),
  contactPerson1: c.contactPerson1 || c.contact_person1 || '',
  designation1: c.designation1 || '',
  emailId1: c.emailId1 || c.email_id1 || '',
  phoneNumber1: c.phoneNumber1 || c.phone_number1 || '',
  contactPerson2: c.contactPerson2 || c.contact_person2 || '',
  designation2: c.designation2 || '',
  emailId2: c.emailId2 || c.email_id2 || '',
  phoneNumber2: c.phoneNumber2 || c.phone_number2 || '',
  contactPerson3: c.contactPerson3 || c.contact_person3 || '',
  designation3: c.designation3 || '',
  emailId3: c.emailId3 || c.email_id3 || '',
  phoneNumber3: c.phoneNumber3 || c.phone_number3 || '',
  landline: c.landline != null ? String(c.landline) : (c.land_line != null ? String(c.land_line) : ''),
  fax: c.fax || '',
  gst: c.gst || '',
  tin: c.tin || '',
  cst: c.cst || '',
  tc: c.tc != null ? String(c.tc) : '',
  vmc: c.vmc != null ? String(c.vmc) : '',
  hmc: c.hmc != null ? String(c.hmc) : '',
  paymentTerms: c.paymentTerms || c.payment_terms || '',
  customerType: c.customerType || c.customer_type || 'Customer',
  agentId: c.agentId || c.agent_id || '',
  company_id: c.company_id || '',
  createdAt: c.createdAt || c.app_created_at || ''
});

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
    setSorting: (state, action: PayloadAction<{ sortBy: string, sortOrder: 'asc' | 'desc' }>) => {
      state.sorting = action.payload;
      state.pagination.currentPage = 1;
    },
    resetCustomerState: (state) => {
      state.filters = initialState.filters;
      state.pagination = initialState.pagination;
      state.sorting = initialState.sorting;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        const mappedItems = (action.payload.items || []).map(mapCustomer);
        state.items = mappedItems;
        if (action.payload.pagination) {
          state.pagination.totalItems = action.payload.pagination.total;
          state.pagination.totalPages = action.payload.pagination.totalPages;
          state.pagination.currentPage = action.payload.pagination.page;
        }
        state.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDropdownCustomers.fulfilled, (state, action) => {
        state.dropdownCustomers = (action.payload || []).map(mapCustomer);
      })
      .addCase(createCustomer.fulfilled, (state, action: PayloadAction<any>) => {
        const newCustomer = mapCustomer(action.payload);
        state.items.unshift(newCustomer);
        state.dropdownCustomers.unshift(newCustomer);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const updated = mapCustomer(action.payload);
        const index = state.items.findIndex(item => item.id === updated.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updated };
        } else {
          state.items.push(updated);
        }
        const dropdownIndex = state.dropdownCustomers.findIndex(item => item.id === updated.id);
        if (dropdownIndex !== -1) {
          state.dropdownCustomers[dropdownIndex] = { ...state.dropdownCustomers[dropdownIndex], ...updated };
        } else {
          state.dropdownCustomers.push(updated);
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
        state.dropdownCustomers = state.dropdownCustomers.filter(c => c.id !== action.payload);
      });
  }
});

export const { setFilters, setPage, setSorting, resetCustomerState } = customerSlice.actions;

export const addCustomer = createCustomer;
export default customerSlice.reducer;
