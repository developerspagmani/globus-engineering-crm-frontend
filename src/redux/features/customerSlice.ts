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
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search } = params;
      let url = `/customers?page=${page}&limit=${limit}`;
      if (company_id) url += `&companyId=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
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

const initialState: CustomerState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
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
        state.items = action.payload.items.map((c: any) => ({
          id: c.id?.toString() || '',
          name: c.name || c.customer_name || '',
          email: c.email || '',
          phone: c.phone || '',
          company: c.company || c.name || c.customer_name || '',
          industry: c.industry || '',
          status: c.status || 'active',
          street1: c.street1,
          street2: c.street2,
          city: c.city,
          state: c.state,
          stateCode: c.stateCode || c.state_code,
          pinCode: c.pinCode || c.pin_code,
          contactPerson1: c.contactPerson1 || c.contact_person1,
          designation1: c.designation1 || c.designation1,
          emailId1: c.emailId1 || c.email_id1,
          phoneNumber1: c.phoneNumber1 || c.phone_number1,
          contactPerson2: c.contactPerson2 || c.contact_person2,
          designation2: c.designation2 || c.designation2,
          emailId2: c.emailId2 || c.email_id2,
          phoneNumber2: c.phoneNumber2 || c.phone_number2,
          contactPerson3: c.contactPerson3 || c.contact_person3,
          designation3: c.designation3 || c.designation3,
          emailId3: c.emailId3 || c.email_id3,
          phoneNumber3: c.phoneNumber3 || c.phone_number3,
          landline: c.landline || c.land_line,
          fax: c.fax,
          gst: c.gst,
          tin: c.tin,
          cst: c.cst,
          tc: c.tc,
          vmc: c.vmc,
          hmc: c.hmc,
          paymentTerms: c.paymentTerms || c.payment_terms,
          company_id: c.company_id,
          createdAt: c.createdAt || c.app_created_at
        }));
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createCustomer.fulfilled, (state, action: PayloadAction<any>) => {
        const c = action.payload;
        state.items.unshift({
          id: c.id?.toString() || '',
          name: c.name || c.customer_name || '',
          email: c.email || '',
          phone: c.phone || '',
          company: c.company || c.name || c.customer_name || '',
          industry: c.industry || '',
          status: c.status || 'active',
          street1: c.street1,
          street2: c.street2,
          city: c.city,
          state: c.state,
          stateCode: c.stateCode || c.state_code,
          pinCode: c.pinCode || c.pin_code,
          contactPerson1: c.contactPerson1 || c.contact_person1,
          designation1: c.designation1 || c.designation1,
          emailId1: c.emailId1 || c.email_id1,
          phoneNumber1: c.phoneNumber1 || c.phone_number1,
          contactPerson2: c.contactPerson2 || c.contact_person2,
          designation2: c.designation2 || c.designation2,
          emailId2: c.emailId2 || c.email_id2,
          phoneNumber2: c.phoneNumber2 || c.phone_number2,
          contactPerson3: c.contactPerson3 || c.contact_person3,
          designation3: c.designation3 || c.designation3,
          emailId3: c.emailId3 || c.email_id3,
          phoneNumber3: c.phoneNumber3 || c.phone_number3,
          landline: c.landline || c.land_line,
          fax: c.fax,
          gst: c.gst,
          tin: c.tin,
          cst: c.cst,
          tc: c.tc,
          vmc: c.vmc,
          hmc: c.hmc,
          paymentTerms: c.paymentTerms || c.payment_terms,
          company_id: c.company_id,
          createdAt: c.createdAt || c.app_created_at
        });
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const c = action.payload;
        const index = state.items.findIndex(item => item.id === c.id.toString());
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            id: c.id?.toString() || '',
            name: c.name || c.customer_name || '',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || c.name || c.customer_name || '',
            industry: c.industry || '',
            status: c.status || 'active',
            street1: c.street1,
            street2: c.street2,
            city: c.city,
            state: c.state,
            stateCode: c.stateCode || c.state_code,
            pinCode: c.pinCode || c.pin_code,
            contactPerson1: c.contactPerson1 || c.contact_person1,
            designation1: c.designation1 || c.designation1,
            emailId1: c.emailId1 || c.email_id1,
            phoneNumber1: c.phoneNumber1 || c.phone_number1,
            contactPerson2: c.contactPerson2 || c.contact_person2,
            designation2: c.designation2 || c.designation2,
            emailId2: c.emailId2 || c.email_id2,
            phoneNumber2: c.phoneNumber2 || c.phone_number2,
            contactPerson3: c.contactPerson3 || c.contact_person3,
            designation3: c.designation3 || c.designation3,
            emailId3: c.emailId3 || c.email_id3,
            phoneNumber3: c.phoneNumber3 || c.phone_number3,
            landline: c.landline || c.land_line,
            fax: c.fax,
            gst: c.gst,
            tin: c.tin,
            cst: c.cst,
            tc: c.tc,
            vmc: c.vmc,
            hmc: c.hmc,
            paymentTerms: c.paymentTerms || c.payment_terms,
            company_id: c.company_id,
            createdAt: c.createdAt || c.app_created_at
          };
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  }
});

export const { setFilters, setPage } = customerSlice.actions;

export const addCustomer = createCustomer;
export default customerSlice.reducer;
