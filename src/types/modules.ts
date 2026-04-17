export interface InvoiceItem {
  id: string;
  description: string;
  process?: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  address?: string; 
  company_id: string;
  poNo?: string;        
  po_no?: string;       
  poDate?: string;      
  po_date?: string;     
  dcNo?: string;        
  dc_no?: string;       
  dcDate?: string;      
  dc_date?: string;     
  date: string;
  invoice_date?: string;
  dueDate: string;
  due_date?: string;
  type: 'INVOICE' | 'WOP' | 'BOTH';
  billType?: 'Regular' | 'With Process' | 'Without Process' | 'Both' | 'with_process' | 'without_process' | 'both';
  bill_type?: string;
  inwardId?: string;
  inward_id?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'BILLED';
  items: InvoiceItem[];
  subTotal: number;
  sub_total?: number;
  taxTotal: number;
  tax_total?: number;
  grandTotal: number;
  grand_total?: string;
  discount: number;
  paidAmount: number;
  gstin?: string;
  state?: string;
  notes?: string;
  otherCharges?: number;
  taxRate?: number;
  createdAt: string;
  app_created_at?: string;
}

export interface InwardEntry {
  id: string;
  inwardNo: string;
  customerId?: string;
  customerName?: string;
  address?: string; // added to match mock UI
  vendorId?: string;
  vendorName?: string;
  poReference?: string;
  poDate?: string;
  challanNo?: string;
  dcNo?: string;
  dcDate?: string;
  dueDate?: string; // NEW: Manual due date field
  vehicleNo?: string;
  company_id: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  items: { description: string; process?: string; quantity: number; unit?: string }[];
  totalRemaining?: number;
  createdAt: string;
}

export interface OutwardEntry {
  id: string;
  outwardNo: string;
  partyType?: 'customer' | 'vendor';
  customerId?: string;
  customerName?: string;
  vendorId?: string;
  vendorName?: string;
  processName?: string;
  invoiceReference: string;
  challanNo: string;
  vehicleNo: string;
  driverName?: string;
  notes?: string;
  company_id: string;
  inwardId?: string;
  inwardNo?: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount?: number;
  items: { description: string; quantity: number; unit: string }[];
  createdAt: string;
}

export interface Challan {
  id: string;
  challanNo: string;
  partyId: string;
  partyName: string;
  partyType: 'customer' | 'vendor'; // Delivery or Returnable
  company_id: string;
  date: string;
  type: 'delivery' | 'returnable' | 'job_work';
  status: 'draft' | 'dispatched' | 'received' | 'cancelled';
  items: { description: string; quantity: number; unit: string; hsnCode?: string }[];
  vehicleNo?: string;
  driverName?: string;
  notes?: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherNo: string;
  date: string;
  type: 'payment' | 'receipt' | 'journal' | 'contra';
  partyId?: string;
  partyName: string;
  partyType?: 'customer' | 'vendor' | 'other';
  company_id: string;
  amount: number;
  paymentMode: 'cash' | 'bank' | 'online';
  referenceNo?: string;
  chequeNo?: string;
  description: string;
  status: 'draft' | 'posted' | 'cancelled';
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  partyName: string;
  partyType: 'customer' | 'vendor';
  company_id: string;
  date: string;
  vchType?: string;
  vchNo?: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number;
  description: string;
  referenceNo: string; // Invoice number, PO number, or Payment ID
  createdAt: string;
}

export interface ModuleData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  icon: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  plan: 'basic' | 'premium' | 'enterprise';
  activeModules: string[];
  logo?: string | null;
  logoSecondary?: string | null;
}

export interface ModulePermission {
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'staff' | 'sales_agent' | 'sales';
  company_id: string | null;
  assignedArea?: string; // New field for Sprint 2
  permissions: string[];
  modulePermissions: ModulePermission[]; // Granular CRUD permissions
}

export interface Customer {
  id: string;
  name: string;
  customerType?: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  status: 'active' | 'inactive';
  state?: string;
  stateCode?: string;
  district?: string;
  street1?: string;
  street2?: string;
  city?: string;
  area?: string;
  pinCode?: string;
  contactPerson1?: string;
  designation1?: string;
  emailId1?: string;
  phoneNumber1?: string;
  contactPerson2?: string;
  designation2?: string;
  emailId2?: string;
  phoneNumber2?: string;
  contactPerson3?: string;
  designation3?: string;
  emailId3?: string;
  phoneNumber3?: string;
  landline?: string;
  fax?: string;
  gst?: string;
  tin?: string;
  cst?: string;
  tc?: string;
  vmc?: string;
  hmc?: string;
  paymentTerms?: string;
  agentId?: string;
  company_id: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  source: 'Web' | 'Referral' | 'Cold Call' | 'Exhibition';
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  agentId: string;
  company_id: string;
  assignedArea?: string; // New field for Sprint 2
  notes?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  leadId: string; // Links to a Lead
  agentId: string;
  company_id: string;
  value: number;
  status: 'open' | 'negotiation' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  expectedClosingDate: string;
  notes: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: 'Engineering' | 'Sales' | 'HR' | 'Finance' | 'Production' | 'Logistics';
  designation: string;
  company_id: string;
  salary: number;
  joiningDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  vendorType?: string;
  email: string;
  phone: string;
  company: string;
  category: string;
  company_id: string;
  companyId?: string;
  status: 'active' | 'inactive' | 'pending';
  street1?: string;
  street2?: string;
  city?: string;
  area?: string;
  state?: string;
  stateCode?: string;
  pinCode?: string;
  contactPerson1?: string;
  designation1?: string;
  emailId1?: string;
  phoneNumber1?: string;
  contactPerson2?: string;
  designation2?: string;
  emailId2?: string;
  phoneNumber2?: string;
  contactPerson3?: string;
  designation3?: string;
  emailId3?: string;
  phoneNumber3?: string;
  landline?: string;
  fax?: string;
  gst?: string;
  tin?: string;
  cst?: string;
  tc?: string;
  vmc?: string;
  hmc?: string;
  createdAt: string;
}
export interface DashboardStats {
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    pendingAmount: number;
    customerCount: number;
    vendorCount: number;
    overdueCount: number;
  };
  overdueInvoices: {
    id: string;
    invoice_no: number;
    customer: string;
    amount: number;
    pending: number;
    due_date: string;
  }[];
  latestInvoices?: {
    id: number;
    invoice_no: number;
    invoice_date: string;
    customer_name: string;
    grand_total: string;
    status: string;
  }[];
  latestInwards?: {
    id: string;
    inward_no: string;
    date: string;
    vendor_name?: string;
    customer_name?: string;
    status: string;
  }[];
}

export interface Store {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  area?: string;
  city?: string;
  assignedAgentId?: string;
  company_id: string;
  createdAt: string;
  latestVisit?: StoreVisit; // Virtual field for UI
}

export interface StoreVisit {
  id: string;
  storeId: string;
  agentId: string;
  visitDate: string;
  notes?: string;
  productInterest?: string;
  nextVisitDate?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  details?: string;
  user_id: string;
  user_name: string;
  company_id: string;
  created_at: string;
}
