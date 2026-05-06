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
  async (params: { 
    company_id?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
  }, { rejectWithValue }) => {
    try {
      const { company_id, page = 1, limit = 10, search } = params;
      let url = `/employees?page=${page}&limit=${limit}`;
      if (company_id) url += `&companyId=${company_id}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      return {
        items: response.data.items.map((emp: any) => ({
          id: emp.id.toString(),
          name: emp.ename || '',
          employeeId: emp.id.toString(),
          designation: emp.designation || '',
          department: emp.department || 'Engineering',
          email: emp.email || '',
          phone: emp.phone_number || '',
          salary: emp.salary || 0,
          joiningDate: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : '',
          status: emp.app_status || 'active',
          company_id: emp.company_id || ''
        })),
        pagination: response.data.pagination
      };
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

const initialState: EmployeeState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    department: 'all',
    status: 'all',
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
        state.items = action.payload.items;
        state.pagination.totalItems = action.payload.pagination.total;
        state.pagination.totalPages = action.payload.pagination.totalPages;
        state.pagination.currentPage = action.payload.pagination.page;
        state.error = null;
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

