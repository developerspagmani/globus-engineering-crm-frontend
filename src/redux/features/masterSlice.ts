import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  company_id: string;
}

interface Process {
  id: string;
  processName: string;
  company_id: string;
}

interface PriceFixing {
  id: string;
  customerId: string;
  customerName: string;
  itemId: string;
  itemName: string;
  processId: string;
  processName: string;
  price: number;
  company_id: string;
}

interface MasterState {
  items: Item[];
  processes: Process[];
  priceFixings: PriceFixing[];
  loading: boolean;
  error: string | null;
}

const initialState: MasterState = {
  items: [],
  processes: [],
  priceFixings: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk('master/fetchItems', async (company_id: string | undefined) => {
  const url = company_id ? `/items?companyId=${company_id}` : '/items';
  const response = await api.get(url);
  return response.data.data.map((item: any) => ({
    id: item.id,
    itemCode: item.item_code,
    itemName: item.item_name,
    company_id: item.company_id,
  }));
});

export const fetchProcesses = createAsyncThunk('master/fetchProcesses', async (company_id: string | undefined) => {
  const url = company_id ? `/processes?companyId=${company_id}` : '/processes';
  const response = await api.get(url);
  return response.data.data.map((p: any) => ({
    id: p.id,
    processName: p.process_name,
    company_id: p.company_id,
  }));
});

export const fetchPriceFixings = createAsyncThunk('master/fetchPriceFixings', async (company_id: string | undefined) => {
  const url = company_id ? `/price-fixings?companyId=${company_id}` : '/price-fixings';
  const response = await api.get(url);
  return response.data.data.map((pf: any) => ({
    id: pf.id,
    customerId: pf.customer_id,
    customerName: pf.customer_name,
    itemId: pf.item_id,
    itemName: pf.item_name,
    processId: pf.process_id,
    processName: pf.process_name,
    price: pf.price,
    company_id: pf.company_id,
  }));
});

// Create actions
export const createItemThunk = createAsyncThunk('master/createItem', async (data: any) => {
  const response = await api.post('/items', data);
  const item = response.data.data;
  return {
    id: item.id,
    itemCode: item.item_code,
    itemName: item.item_name,
    company_id: item.company_id,
  };
});

export const createProcessThunk = createAsyncThunk('master/createProcess', async (data: any) => {
  const response = await api.post('/processes', data);
  const p = response.data.data;
  return {
    id: p.id,
    processName: p.process_name,
    company_id: p.company_id,
  };
});

export const createPriceFixingThunk = createAsyncThunk('master/createPriceFixing', async (data: any) => {
  const response = await api.post('/price-fixings', data);
  const pf = response.data.data;
  return {
    id: pf.id,
    customerId: pf.customer_id,
    customerName: pf.customer_name,
    itemId: pf.item_id,
    itemName: pf.item_name,
    processId: pf.process_id,
    processName: pf.process_name,
    price: pf.price,
    company_id: pf.company_id,
  };
});

const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => { state.loading = true; })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProcesses.fulfilled, (state, action) => {
        state.processes = action.payload;
      })
      .addCase(fetchPriceFixings.fulfilled, (state, action) => {
        state.priceFixings = action.payload;
      })
      .addCase(createItemThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createProcessThunk.fulfilled, (state, action) => {
        state.processes.unshift(action.payload);
      })
      .addCase(createPriceFixingThunk.fulfilled, (state, action) => {
        state.priceFixings.unshift(action.payload);
      });
  },
});

export default masterSlice.reducer;
