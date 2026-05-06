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
  pagination: {
    itemsPerPage: number;
    itemPage: number;
    totalItems: number;
    totalItemPages: number;
    processPage: number;
    totalProcesses: number;
    totalProcessPages: number;
    priceFixingPage: number;
  };
  filters: {
    itemSearch: string;
    processSearch: string;
  };
}

const initialState: MasterState = {
  items: [],
  processes: [],
  priceFixings: [],
  loading: false,
  error: null,
  pagination: {
    itemsPerPage: 10,
    itemPage: 1,
    totalItems: 0,
    totalItemPages: 0,
    processPage: 1,
    totalProcesses: 0,
    totalProcessPages: 0,
    priceFixingPage: 1,
  },
  filters: {
    itemSearch: '',
    processSearch: '',
  }
};

export const fetchItems = createAsyncThunk('master/fetchItems', async (params: { company_id?: string; page?: number; limit?: number; search?: string }) => {
  const { company_id, page = 1, limit = 10, search } = params;
  let url = `/items?page=${page}&limit=${limit}`;
  if (company_id) url += `&companyId=${company_id}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const response = await api.get(url);
  return {
    items: response.data.data.map((item: any) => ({
      id: String(item.id),
      itemCode: String(item.item_code || ''),
      itemName: String(item.item_name || ''),
      company_id: String(item.company_id || ''),
    })),
    pagination: response.data.pagination
  };
});

export const fetchProcesses = createAsyncThunk('master/fetchProcesses', async (params: { company_id?: string; page?: number; limit?: number; search?: string }) => {
  const { company_id, page = 1, limit = 10, search } = params;
  let url = `/processes?page=${page}&limit=${limit}`;
  if (company_id) url += `&companyId=${company_id}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const response = await api.get(url);
  return {
    processes: response.data.data.map((p: any) => ({
      id: String(p.id),
      processName: String(p.process_name || ''),
      company_id: String(p.company_id || ''),
    })),
    pagination: response.data.pagination
  };
});

export const fetchPriceFixings = createAsyncThunk('master/fetchPriceFixings', async (params: { company_id?: string; page?: number; limit?: number }) => {
  const { company_id, page = 1, limit = 10 } = params;
  let url = `/price-fixings?page=${page}&limit=${limit}`;
  if (company_id) url += `&companyId=${company_id}`;
  
  const response = await api.get(url);
  return {
    priceFixings: response.data.data.map((pf: any) => ({
      id: String(pf.id),
      customerId: String(pf.customer_id || ''),
      customerName: String(pf.customer_name || ''),
      itemId: String(pf.item_id || ''),
      itemName: String(pf.item_name || ''),
      processId: String(pf.process_id || ''),
      processName: String(pf.process_name || ''),
      price: Number(pf.price || 0),
      company_id: String(pf.company_id || ''),
    })),
    pagination: response.data.pagination
  };
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

// Update actions
export const updateItemThunk = createAsyncThunk('master/updateItem', async ({ id, ...data }: any) => {
  const response = await api.put(`/items/${id}`, data);
  const item = response.data.data;
  return {
    id: item.id,
    itemCode: item.item_code,
    itemName: item.item_name,
    company_id: item.company_id,
  };
});

export const updateProcessThunk = createAsyncThunk('master/updateProcess', async ({ id, ...data }: any) => {
  const response = await api.put(`/processes/${id}`, data);
  const p = response.data.data;
  return {
    id: p.id,
    processName: p.process_name,
    company_id: p.company_id,
  };
});

export const updatePriceFixingThunk = createAsyncThunk('master/updatePriceFixing', async ({ id, ...data }: any) => {
  const response = await api.put(`/price-fixings/${id}`, data);
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

// Delete actions
export const deleteItemThunk = createAsyncThunk('master/deleteItem', async (id: string) => {
  await api.delete(`/items/${id}`);
  return id;
});

export const deleteProcessThunk = createAsyncThunk('master/deleteProcess', async (id: string) => {
  await api.delete(`/processes/${id}`);
  return id;
});

export const deletePriceFixingThunk = createAsyncThunk('master/deletePriceFixing', async (id: string) => {
  await api.delete(`/price-fixings/${id}`);
  return id;
});

const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {
    setItemPage: (state, action: PayloadAction<number>) => {
      state.pagination.itemPage = action.payload;
    },
    setProcessPage: (state, action: PayloadAction<number>) => {
      state.pagination.processPage = action.payload;
    },
    setPriceFixingPage: (state, action: PayloadAction<number>) => {
      state.pagination.priceFixingPage = action.payload;
    },
    setItemSearch: (state, action: PayloadAction<string>) => {
      state.filters.itemSearch = action.payload;
      state.pagination.itemPage = 1;
    },
    setProcessSearch: (state, action: PayloadAction<string>) => {
      state.filters.processSearch = action.payload;
      state.pagination.processPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => { state.loading = true; })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalItemPages = action.payload.pagination.totalPages;
        state.pagination.itemPage = action.payload.pagination.page;
      })
      .addCase(fetchProcesses.pending, (state) => { state.loading = true; })
      .addCase(fetchProcesses.fulfilled, (state, action) => {
        state.loading = false;
        state.processes = action.payload.processes;
        state.pagination.totalProcesses = action.payload.pagination.total;
        state.pagination.totalProcessPages = action.payload.pagination.totalPages;
        state.pagination.processPage = action.payload.pagination.page;
      })
      .addCase(fetchPriceFixings.pending, (state) => { state.loading = true; })
      .addCase(fetchPriceFixings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceFixings = action.payload.priceFixings.sort((a: any, b: any) => b.id.localeCompare(a.id, undefined, { numeric: true }));
        // Update pagination if the backend returns it for price fixings
        if (action.payload.pagination) {
          state.pagination.priceFixingPage = action.payload.pagination.page;
        }
      })
      .addCase(createItemThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createProcessThunk.fulfilled, (state, action) => {
        state.processes.unshift(action.payload);
      })
      .addCase(createPriceFixingThunk.fulfilled, (state, action) => {
        state.priceFixings.unshift(action.payload);
      })
      .addCase(updateItemThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateProcessThunk.fulfilled, (state, action) => {
        const index = state.processes.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.processes[index] = action.payload;
      })
      .addCase(updatePriceFixingThunk.fulfilled, (state, action) => {
        const index = state.priceFixings.findIndex(pf => pf.id === action.payload.id);
        if (index !== -1) state.priceFixings[index] = action.payload;
      })
      .addCase(deleteItemThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      })
      .addCase(deleteProcessThunk.fulfilled, (state, action) => {
        state.processes = state.processes.filter(p => p.id !== action.payload);
      })
      .addCase(deletePriceFixingThunk.fulfilled, (state, action) => {
        state.priceFixings = state.priceFixings.filter(pf => pf.id !== action.payload);
      });
  },
});

export const { setItemPage, setProcessPage, setPriceFixingPage, setItemSearch, setProcessSearch } = masterSlice.actions;
export default masterSlice.reducer;
