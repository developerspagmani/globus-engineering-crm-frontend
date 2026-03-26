import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Employee } from '@/types/modules';
import api from '@/lib/axios';

const mapEmployee = (emp: any): Employee => ({
  id: emp.id.toString(),
  employeeId: `EMP-${emp.id.toString().padStart(4, '0')}`,
  name: emp.ename || 'N/A',
  email: emp.email || '',
  phone: emp.phone_number || '',
  designation: emp.designation || 'Staff',
  department: 'Production', // Default since not in legacy schema
  salary: emp.salary || 0,
  joiningDate: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  status: (emp.app_status || 'active').toLowerCase() as any,
  company_id: emp.company_id?.toString(),
  createdAt: emp.app_created_at || new Date().toISOString(),
});

export const fetchEmployees = createAsyncThunk(
  'employee/fetchAll',
  async (companyId: string | undefined, { rejectWithValue }) => {
    try {
      const url = companyId ? `/employees?companyId=${companyId}` : '/employees';
      const response = await api.get(url);
      return response.data.map(mapEmployee);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch employees');
    }
  }
);

export const addEmployeeThunk = createAsyncThunk(
  'employee/add',
  async (data: Omit<Employee, 'id'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/employees', data);
      return mapEmployee(response.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create employee');
    }
  }
);

export const updateEmployeeThunk = createAsyncThunk(
  'employee/update',
  async (data: Employee, { rejectWithValue }) => {
    try {
      const response = await api.put(`/employees/${data.id}`, data);
      return mapEmployee(response.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update employee');
    }
  }
);

export const deleteEmployeeThunk = createAsyncThunk(
  'employee/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete employee');
    }
  }
);

interface EmployeeState {
  items: Employee[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    department: string;
    status: string;
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

const initialState: EmployeeState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    department: 'all',
    status: 'all',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setEmployeeFilters: (state, action: PayloadAction<Partial<EmployeeState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setEmployeePage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addEmployeeThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateEmployeeThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteEmployeeThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const { setEmployeeFilters, setEmployeePage } = employeeSlice.actions;
export const addEmployee = addEmployeeThunk;
export const updateEmployee = updateEmployeeThunk;
export const deleteEmployee = deleteEmployeeThunk;

export default employeeSlice.reducer;

