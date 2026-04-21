import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, Company } from '@/types/modules';
import { setCookie, deleteCookie } from '@/lib/cookies';
import api from '@/lib/axios';

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ id, password }: any, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}/reset-password`, { password });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update password');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${userData.id}`, userData);
      return response.data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update profile');
    }
  }
);

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Load initial state from localStorage if available (Client-side only)
const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const savedAuth = localStorage.getItem('globus_auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        // Migration/Sanity Check: Ensure the loaded user has the new modulePermissions field
        if (parsed.user && !parsed.user.modulePermissions) {
           localStorage.removeItem('globus_auth');
           return { user: null, company: null, token: null, isAuthenticated: false, loading: false, error: null };
        }
        return {
          ...parsed,
          loading: false,
          error: null,
        };
      } catch (e) {
        console.error('Failed to parse saved auth', e);
      }
    }
  }
  return {
    user: null,
    company: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: any; company: Company | null; token: string }>) => {
      const { user } = action.payload;
      // Handle potential snake_case from DB
      const processedUser: User = {
        ...user,
        company_id: user.company_id,
        modulePermissions: user.modulePermissions || (typeof user.module_permissions === 'string' ? JSON.parse(user.module_permissions) : user.module_permissions) || []
      };

      const rawCompany = action.payload.company || user.company;
      const processedCompany: Company | null = rawCompany ? {
        ...rawCompany,
        id: rawCompany.id || (rawCompany as any).id,
        activeModules: rawCompany.activeModules || (typeof (rawCompany as any).active_modules === 'string' ? JSON.parse((rawCompany as any).active_modules) : (rawCompany as any).active_modules) || [],
        logo: rawCompany.logo || (rawCompany as any).logo,
        logoSecondary: rawCompany.logoSecondary || (rawCompany as any).logo_secondary,
        invoiceSettings: rawCompany.invoiceSettings || (typeof (rawCompany as any).invoice_settings === 'string' ? JSON.parse((rawCompany as any).invoice_settings) : (rawCompany as any).invoice_settings) || null
      } as any : null;

      state.loading = false;
      state.user = processedUser;
      state.company = processedCompany;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('globus_auth', JSON.stringify({
          user: processedUser,
          company: processedCompany,
          token: action.payload.token,
          isAuthenticated: true
        }));
        // Set cookie for middleware
        setCookie('token', action.payload.token);
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.company = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear persistence
      if (typeof window !== 'undefined') {
        localStorage.removeItem('globus_auth');
        deleteCookie('token');
      }
    },
    setCompanyContext: (state, action: PayloadAction<Company | null>) => {
      state.company = action.payload;
      if (typeof window !== 'undefined') {
        const savedAuth = localStorage.getItem('globus_auth');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            localStorage.setItem('globus_auth', JSON.stringify({
              ...parsed,
              company: action.payload
            }));
          } catch (e) {
            console.error('Failed to update persisted company context', e);
          }
        }
      }
    },
    updateUser: (state, action: PayloadAction<any>) => {
      const user = action.payload;
      const processedUser: User = {
        ...user,
        company_id: user.company_id || user.company_id,
        modulePermissions: user.modulePermissions || (typeof user.module_permissions === 'string' ? JSON.parse(user.module_permissions) : user.module_permissions) || []
      };
      
      state.user = processedUser;
      if (typeof window !== 'undefined') {
        const savedAuth = localStorage.getItem('globus_auth');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            localStorage.setItem('globus_auth', JSON.stringify({
              ...parsed,
              user: processedUser
            }));
          } catch (e) {
            console.error('Failed to update persisted user profile', e);
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        const user = action.payload;
        const processedUser: User = {
          ...user,
          company_id: user.company_id,
          modulePermissions: user.modulePermissions || (typeof user.module_permissions === 'string' ? JSON.parse(user.module_permissions) : user.module_permissions) || []
        };
        
        state.loading = false;
        state.user = processedUser;
        if (typeof window !== 'undefined') {
          const savedAuth = localStorage.getItem('globus_auth');
          if (savedAuth) {
            try {
              const parsed = JSON.parse(savedAuth);
              localStorage.setItem('globus_auth', JSON.stringify({
                ...parsed,
                user: processedUser
              }));
            } catch (e) {
              console.error('Failed to update persisted user profile', e);
            }
          }
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setCompanyContext, updateUser } = authSlice.actions;
export default authSlice.reducer;
