import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/types/modules';
import api from '@/lib/axios';

export const fetchUsers = createAsyncThunk(
  'companyUsers/fetchAll',
  async (company_id: string | undefined, { rejectWithValue }) => {
    try {
      const url = company_id ? `/users?company_id=${company_id}` : '/users';
      const response = await api.get(url);
      // Map backend snake_case to frontend camelCase
      return response.data.map((u: any) => ({
        ...u,
        company_id: u.company_id,
        modulePermissions: typeof u.module_permissions === 'string' 
            ? JSON.parse(u.module_permissions) 
            : (u.module_permissions || []),
        permissions: typeof u.permissions === 'string'
            ? JSON.parse(u.permissions)
            : (u.permissions || [])
      }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch users');
    }
  }
);

export const addUserAsync = createAsyncThunk(
  'companyUsers/add',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/users', userData);
      // Robust mapping: Check for .user OR root
      const u = response.data.user || response.data;
      
      return {
        ...u,
        company_id: u.company_id,
        modulePermissions: u.modulePermissions || u.module_permissions 
            ? (typeof (u.modulePermissions || u.module_permissions) === 'string' 
                ? JSON.parse(u.modulePermissions || u.module_permissions) 
                : (u.modulePermissions || u.module_permissions))
            : [],
        permissions: u.permissions 
            ? (typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions)
            : []
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create user');
    }
  }
);

export const updateUserAsync = createAsyncThunk(
  'companyUsers/update',
  async (userData: any, { rejectWithValue }) => {
    try {
      const { id, ...data } = userData;
      const response = await api.put(`/users/${id}`, data);
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update user');
    }
  }
);

export const deleteUserAsync = createAsyncThunk(
  'companyUsers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete user');
    }
  }
);

export const resetUserPasswordAsync = createAsyncThunk(
  'companyUsers/resetPassword',
  async ({ id, password }: { id: string, password: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}/reset-password`, { password });
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to reset password');
    }
  }
);

interface UserFilters {
  search: string;
  role: string | 'all';
}

interface UserState {
  items: User[];
  filters: UserFilters;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  items: [],
  filters: {
    search: '',
    role: 'all',
  },
  loading: false,
  error: null,
};

const companyUserSlice = createSlice({
  name: 'companyUsers',
  initialState,
  reducers: {
    setUserFilters: (state, action: PayloadAction<Partial<UserFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(addUserAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const { setUserFilters } = companyUserSlice.actions;
export const addUser = addUserAsync; 
export const updateUser = updateUserAsync;
export default companyUserSlice.reducer;
