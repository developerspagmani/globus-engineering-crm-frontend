import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Challan } from '@/types/modules';
import api from '@/lib/axios';

export const fetchChallans = createAsyncThunk(
  'challan/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/challans?company_id=${company_id}` : '/challans';
      const response = await api.get(url);
      return response.data.map((c: any) => ({
        ...c,
        id: c.id.toString(),
        items: c.items || JSON.parse(c.items_json || '[]'),
        createdAt: c.app_created_at
      }));
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
      return response.data;
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
      return response.data;
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
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createChallan.fulfilled, (state, action) => {
        state.items.unshift({
          ...action.payload,
          id: action.payload.id.toString(),
          items: action.payload.items || JSON.parse(action.payload.items_json || '[]')
        });
      })
      .addCase(updateChallan.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id.toString());
        if (index !== -1) {
          state.items[index] = {
            ...action.payload,
            id: action.payload.id.toString(),
            items: action.payload.items || JSON.parse(action.payload.items_json || '[]')
          };
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
