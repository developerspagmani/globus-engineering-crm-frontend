import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Company } from '@/types/modules';
import api from '@/lib/axios';

export const fetchCompanies = createAsyncThunk(
  'companies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/companies');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch companies');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/create',
  async (data: Omit<Company, 'id'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/companies', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/update',
  async (data: Company, { rejectWithValue }) => {
    try {
      const response = await api.put(`/companies/${data.id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/companies/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete company');
    }
  }
);

interface CompanyState {
  items: Company[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  items: [],
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const addCompany = createCompany;
export default companySlice.reducer;
