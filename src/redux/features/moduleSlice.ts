import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData } from '@/types/modules';
import { availableModules } from '@/data/mockModules';

interface ModuleState {
  items: ModuleData[];
  loading: boolean;
  error: string | null;
}

const initialState: ModuleState = {
  items: availableModules,
  loading: false,
  error: null,
};

const moduleSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    setModules: (state, action: PayloadAction<ModuleData[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setModules, setLoading, setError } = moduleSlice.actions;
export default moduleSlice.reducer;
