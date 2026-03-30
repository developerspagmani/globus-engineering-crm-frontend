import { configureStore } from '@reduxjs/toolkit';
import moduleReducer from './features/moduleSlice';
import authReducer from './features/authSlice';
import customerReducer from './features/customerSlice';
import vendorReducer from './features/vendorSlice';
import invoiceReducer from './features/invoiceSlice';
import inwardReducer from './features/inwardSlice';
import outwardReducer from './features/outwardSlice';
import ledgerReducer from './features/ledgerSlice';
import challanReducer from './features/challanSlice';
import voucherReducer from './features/voucherSlice';
import employeeReducer from './features/employeeSlice';
import salesReducer from './features/salesSlice';
import leadReducer from './features/leadSlice';
import pendingPaymentReducer from './features/pendingPaymentSlice';
import companyUserReducer from './features/companyUserSlice';
import companyReducer from './features/companySlice';

import masterReducer from './features/masterSlice';
import dashboardReducer from './features/dashboardSlice';

export const store = configureStore({
  reducer: {
    modules: moduleReducer,
    auth: authReducer,
    customers: customerReducer,
    vendors: vendorReducer,
    invoices: invoiceReducer,
    inward: inwardReducer,
    outward: outwardReducer,
    ledger: ledgerReducer,
    challan: challanReducer,
    voucher: voucherReducer,
    employee: employeeReducer,
    sales: salesReducer,
    leads: leadReducer,
    pendingPayments: pendingPaymentReducer,
    companyUsers: companyUserReducer,
    companies: companyReducer,
    master: masterReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
