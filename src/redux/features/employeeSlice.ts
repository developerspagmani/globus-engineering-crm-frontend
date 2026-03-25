import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Employee } from '@/types/modules';
import { mockEmployees } from '@/data/mockModules';

interface EmployeeState {
  items: Employee[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    department: 'all' | 'Engineering' | 'Sales' | 'HR' | 'Finance' | 'Production' | 'Logistics';
    status: 'all' | 'active' | 'on_leave' | 'terminated';
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}

const initialState: EmployeeState = {
  items: mockEmployees,
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
    addEmployee: (state, action: PayloadAction<Omit<Employee, 'id' | 'createdAt'>>) => {
      const newEmployee: Employee = {
        ...action.payload,
        id: `emp_${state.items.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      state.items.push(newEmployee);
    },
    updateEmployee: (state, action: PayloadAction<Employee>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteEmployee: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setEmployeeFilters: (state, action: PayloadAction<Partial<EmployeeState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    setEmployeePage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
  },
});

export const {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeFilters,
  setEmployeePage
} = employeeSlice.actions;

export default employeeSlice.reducer;
