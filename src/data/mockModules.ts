export type { 
  Invoice, 
  InvoiceItem,
  InwardEntry, 
  OutwardEntry, 
  Challan, 
  Voucher, 
  LedgerEntry, 
  ModuleData, 
  Company, 
  ModulePermission,
  User, 
  Customer, 
  Lead, 
  Deal, 
  Employee, 
  Vendor 
} from '@/types/modules';

import { 
  Invoice, 
  InwardEntry, 
  OutwardEntry, 
  Challan, 
  Voucher, 
  LedgerEntry, 
  ModuleData, 
  Company, 
  User, 
  Customer, 
  Lead, 
  Deal, 
  Employee, 
  Vendor 
} from '@/types/modules';

export const availableModules: ModuleData[] = [
  {
    id: 'mod_invoice',
    name: 'Invoice Management',
    description: 'Create, track and manage manufacturing invoices and payment status.',
    status: 'active',
    icon: 'bi-file-earmark-spreadsheet'
  },
  {
    id: 'mod_customer',
    name: 'Customer Hub',
    description: 'Manage client relationships, industrial contacts, and sales pipelines.',
    status: 'active',
    icon: 'bi-people'
  },
  {
    id: 'mod_inward',
    name: 'Inward Logistics',
    description: 'Track and manage incoming materials and vendor gate entries.',
    status: 'active',
    icon: 'bi-box-arrow-in-right'
  },
  {
    id: 'mod_outward',
    name: 'Outward Logistics',
    description: 'Track and manage outgoing finished goods and customer dispatches.',
    status: 'active',
    icon: 'bi-box-arrow-up-right'
  },
  {
    id: 'mod_ledger',
    name: 'Financial Ledger',
    description: 'Track debits, credits, and account statements for all parties.',
    status: 'active',
    icon: 'bi-journal-check'
  },
  {
    id: 'mod_challan',
    name: 'Challan System',
    description: 'Manage delivery challans, gate passes, and material movement.',
    status: 'active',
    icon: 'bi-file-earmark-check'
  },
  {
    id: 'mod_voucher',
    name: 'Voucher System',
    description: 'Manage receipts, payments, and financial transactions.',
    status: 'active',
    icon: 'bi-receipt'
  },
  {
    id: 'mod_employee',
    name: 'Employee Hub',
    description: 'Manage workforce details, payroll profiles, and departures.',
    status: 'active',
    icon: 'bi-person-badge'
  },
  {
    id: 'mod_sales_hub',
    name: 'Sales & Deal Hub',
    description: 'Personalized workspace for sales agents to manage leads and deals.',
    status: 'active',
    icon: 'bi-graph-up-arrow'
  },
  {
    id: 'mod_lead',
    name: 'Lead Management',
    description: 'Track potential prospects and conversion funnels.',
    status: 'active',
    icon: 'bi-funnel'
  },
  {
    id: 'mod_pending_payment',
    name: 'Pending Payments',
    description: 'Track outstanding balances, ageing reports, and collection targets.',
    status: 'active',
    icon: 'bi-clock-history'
  },
  {
    id: 'mod_vendor',
    name: 'Vendor Management',
    description: 'Manage industrial suppliers, raw material partners, and logistics vendors.',
    status: 'active',
    icon: 'bi-truck'
  },
  {
    id: 'mod_sales_map',
    name: 'Sales Map',
    description: 'Geographic sales intelligence and customer distribution visualizer.',
    status: 'active',
    icon: 'bi-geo-alt'
  },
  {
    id: 'mod_items',
    name: 'Item Details',
    description: 'Manage product items, descriptions, and master codes.',
    status: 'active',
    icon: 'bi-box-seam'
  },
  {
    id: 'mod_processes',
    name: 'Process Details',
    description: 'Define manufacturing and business processes for operations.',
    status: 'active',
    icon: 'bi-gear'
  },
  {
    id: 'mod_price_fixing',
    name: 'Price Fixing',
    description: 'Set customer-specific rates for items and processes.',
    status: 'active',
    icon: 'bi-currency-rupee'
  }
];

export const mockCompanies: Company[] = [
  {
    id: 'comp_globus',
    name: 'Globus Engineering Main',
    slug: 'globus-eng',
    plan: 'enterprise',
    activeModules: ['mod_invoice', 'mod_customer', 'mod_inward', 'mod_outward', 'mod_ledger', 'mod_challan', 'mod_voucher', 'mod_employee', 'mod_sales_hub', 'mod_lead', 'mod_pending_payment', 'mod_vendor', 'mod_sales_map', 'mod_user_management', 'mod_items', 'mod_processes', 'mod_price_fixing']
  },
  {
    id: 'comp_apex',
    name: 'Apex Manufacturing',
    slug: 'apex-mfg',
    plan: 'basic',
    activeModules: ['mod_invoice']
  },
  {
    id: 'comp_pranesh_tech',
    name: 'Pranesh Tech Solution',
    slug: 'pranesh-tech',
    plan: 'enterprise',
    activeModules: ['mod_invoice', 'mod_customer', 'mod_inward', 'mod_outward', 'mod_ledger', 'mod_challan', 'mod_voucher', 'mod_employee', 'mod_sales_hub', 'mod_lead', 'mod_pending_payment', 'mod_vendor', 'mod_sales_map']
  }
];

export const mockUsers: User[] = [
  {
    id: 'u_pranesh',
    name: 'Pranesh',
    email: 'pranesh@globus.com',
    password: 'password123',
    role: 'super_admin',
    company_id: null,
    permissions: ['all'],
    modulePermissions: [{ moduleId: 'all', canRead: true, canCreate: true, canEdit: true, canDelete: true }]
  },
  {
    id: 'u_super',
    name: 'Antigravity Super Admin',
    email: 'super@globus.com',
    password: 'password123',
    role: 'super_admin',
    company_id: null,
    permissions: ['all'],
    modulePermissions: [{ moduleId: 'all', canRead: true, canCreate: true, canEdit: true, canDelete: true }]
  },
  {
    id: 'u_globus_admin',
    name: 'Globus Admin',
    email: 'admin@globus.com',
    password: 'password123',
    role: 'company_admin',
    company_id: 'comp_globus',
    permissions: ['manage_users', 'view_reports', 'edit_modules'],
    modulePermissions: [
      { moduleId: 'mod_invoice', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_customer', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_inward', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_outward', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_ledger', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_challan', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_voucher', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_employee', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_lead', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_pending_payment', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_sales_hub', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_vendor', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_sales_map', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_user_management', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_items', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_processes', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_price_fixing', canRead: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    id: 'u_apex_manager',
    name: 'Apex Manager',
    email: 'manager@apex.com',
    password: 'password123',
    role: 'manager',
    company_id: 'comp_apex',
    permissions: ['view_reports', 'manage_inventory'],
    modulePermissions: [
      { moduleId: 'mod_invoice', canRead: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'mod_inward', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_outward', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_challan', canRead: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    id: 'u_sales_1',
    name: 'Alex Rivera',
    email: 'alex.sales@globus.com',
    password: 'password123',
    role: 'sales_agent',
    company_id: 'comp_globus',
    permissions: ['view_deals', 'manage_leads'],
    modulePermissions: [
      { moduleId: 'mod_lead', canRead: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'mod_sales_hub', canRead: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'mod_voucher', canRead: true, canCreate: true, canEdit: false, canDelete: false },
      { moduleId: 'mod_pending_payment', canRead: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'mod_invoice', canRead: true, canCreate: true, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'u_dhanush',
    name: 'Dhanush',
    email: 'dhanush@praneshtech.com',
    password: 'password123',
    role: 'staff',
    company_id: 'comp_pranesh_tech',
    permissions: ['view_tasks'],
    modulePermissions: [
      { moduleId: 'mod_invoice', canRead: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'mod_customer', canRead: true, canCreate: false, canEdit: true, canDelete: false },
      { moduleId: 'mod_lead', canRead: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'mod_sales_map', canRead: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'mod_ledger', canRead: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  }
];

export const mockCustomers: Customer[] = [
  { 
    id: '1', 
    name: 'John Doe', 
    customerType: 'Customer',
    email: 'john@techcorp.com', 
    phone: '+1234567890', 
    company: 'Tech Corp', 
    industry: 'Automotive', 
    status: 'active', 
    state: 'KARNATAKA', 
    stateCode: 'KA',
    district: 'Bangalore Urban',
    street1: '123 Tech Lane',
    street2: 'Phase 1',
    city: 'Bangalore',
    area: 'Indiranagar',
    pinCode: '560038',
    contactPerson1: 'John Doe',
    designation1: 'CEO',
    emailId1: 'john@techcorp.com',
    phoneNumber1: '+1234567890',
    contactPerson2: 'Jane Smith',
    designation2: 'Purchasing Manager',
    emailId2: 'jane@techcorp.com',
    phoneNumber2: '+1234567891',
    contactPerson3: 'Mike Johnson',
    designation3: 'Technical Lead',
    emailId3: 'mike@techcorp.com',
    phoneNumber3: '+1234567892',
    landline: '080-12345678',
    fax: '080-12345679',
    gst: '29ABCDE1234F1Z5',
    tin: 'TIN123456789',
    cst: 'CST987654321',
    tc: 'TC-Model A',
    vmc: 'VMC-Model B',
    hmc: 'HMC-Model C',
    paymentTerms: 'Net 30 Days',
    agentId: 'u_sales_1', 
    company_id: 'comp_globus', 
    createdAt: '2024-03-01' 
  },
  { id: 'cust_pt_1', name: 'Alpha Industries', email: 'contact@alphaind.com', phone: '+91 9988776655', company: 'Alpha Industries', industry: 'Manufacturing', status: 'active', state: 'TAMIL NADU', stateCode: '33', district: 'Chennai', street1: 'Phase 2, Guindy', street2: 'Industrial Estate', city: 'Chennai', area: 'Guindy', pinCode: '600032', contactPerson1: 'Arjun Das', designation1: 'Director', emailId1: 'arjun@alphaind.com', phoneNumber1: '+91 8877665544', contactPerson2: 'Kavita Iyer', designation2: 'Manager', emailId2: 'kavita@alphaind.com', phoneNumber2: '+91 8877665533', landline: '044-22334455', gst: '33AABCU9603R1ZN', tin: 'TIN-33-9182', cst: 'CST-33-9182', tc: 'TC-Alpha', vmc: 'VMC-Alpha', hmc: 'HMC-Alpha', customerType: 'Retailer', company_id: 'comp_pranesh_tech', createdAt: '2024-03-15' },
  { id: '2', name: 'Robert Brown', email: 'robert@heavyind.com', phone: '+1122334455', company: 'Heavy Industries', industry: 'Construction', status: 'active', state: 'MAHARASHTRA', stateCode: 'MH', district: 'Pune', street1: 'Block C, Hinjewadi', street2: 'IT Park Phase 3', city: 'Pune', area: 'Hinjewadi', pinCode: '411057', contactPerson1: 'Robert Brown', designation1: 'CEO', emailId1: 'robert@heavyind.com', phoneNumber1: '+1122334455', landline: '020-12345678', gst: '27AABCU1234C1ZN', tin: 'TIN-27-1122', cst: 'CST-27-1122', tc: 'TC-Heavy', vmc: 'VMC-Heavy', hmc: 'HMC-Heavy', customerType: 'Wholesale', agentId: 'u_sales_1', company_id: 'comp_globus', createdAt: '2024-03-10' },
  { id: '3', name: 'Emily Davis', email: 'emily@precisiontool.com', phone: '+5566778899', company: 'Precision Tools', industry: 'Machinery', status: 'active', state: 'TAMIL NADU', stateCode: '33', district: 'Chennai', street1: 'No 7, Ambattur', street2: 'Industrial Estate', city: 'Chennai', area: 'Ambattur', pinCode: '600058', contactPerson1: 'Emily Davis', designation1: 'Sales Head', emailId1: 'emily@precisiontool.com', phoneNumber1: '+5566778899', landline: '044-11223344', gst: '33AABCU5566R1ZN', tin: 'TIN-33-4455', cst: 'CST-33-4455', tc: 'TC-Tools', vmc: 'VMC-Tools', hmc: 'HMC-Tools', customerType: 'Customer', company_id: 'comp_globus', createdAt: '2024-02-15' },
  { id: '4', name: 'Michael Wilson', email: 'michael@automotiveparts.com', phone: '+9988776655', company: 'Auto Parts Inc', industry: 'Automotive', status: 'active', state: 'TELANGANA', stateCode: 'TS', district: 'Hyderabad', street1: 'Plot 15, IDA', street2: 'Bolarum', city: 'Hyderabad', area: 'Bolarum', pinCode: '500014', contactPerson1: 'Michael Wilson', designation1: 'Owner', emailId1: 'michael@automotiveparts.com', phoneNumber1: '+9988776655', landline: '040-99887766', gst: '36AABCU7788R1ZN', tin: 'TIN-36-8899', cst: 'CST-36-8899', tc: 'TC-Auto', vmc: 'VMC-Auto', hmc: 'HMC-Auto', customerType: 'Retailer', company_id: 'comp_globus', createdAt: '2024-03-12' },
  { id: '5', name: 'Sarah Miller', email: 'sarah@globaltech.com', phone: '+1445566778', company: 'Global Tech', industry: 'Electronics', status: 'active', state: 'ANDHRA PRADESH', stateCode: 'AP', district: 'Vishakhapatnam', street1: 'Auto Nagar', street2: 'Industrial Area', city: 'Vishakhapatnam', area: 'Auto Nagar', pinCode: '530012', contactPerson1: 'Sarah Miller', designation1: 'Manager', emailId1: 'sarah@globaltech.com', phoneNumber1: '+1445566778', landline: '0891-223344', gst: '37AABCU1122R1ZN', tin: 'TIN-37-2233', cst: 'CST-37-2233', tc: 'TC-Global', vmc: 'VMC-Global', hmc: 'HMC-Global', customerType: 'Wholesale', company_id: 'comp_globus', createdAt: '2024-03-13' },
  { id: '6', name: 'Jessica Taylor', email: 'jessica@fasteners.com', phone: '+7788990011', company: 'Accurate Fasteners', industry: 'Machinery', status: 'active', state: 'KARNATAKA', stateCode: 'KA', district: 'Mysore', street1: 'Plot 4, Hebbal', street2: 'Industrial Area', city: 'Mysore', area: 'Hebbal', pinCode: '570016', contactPerson1: 'Jessica Taylor', designation1: 'Proprietor', emailId1: 'jessica@fasteners.com', phoneNumber1: '+7788990011', landline: '0821-334455', gst: '29AABCU9900R1ZN', tin: 'TIN-29-0011', cst: 'CST-29-0011', tc: 'TC-Fast', vmc: 'VMC-Fast', hmc: 'HMC-Fast', customerType: 'Customer', company_id: 'comp_globus', createdAt: '2024-03-15' },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead_1',
    name: 'Jane Smith',
    email: 'jane@manufacturing.co',
    phone: '+0987654321',
    company: 'Manufacturing Co',
    industry: 'Electronics',
    source: 'Referral',
    status: 'qualified',
    agentId: 'u_sales_1',
    company_id: 'comp_globus',
    notes: 'Very interested in precision gears.',
    createdAt: '2024-03-05'
  },
  {
    id: 'lead_pt_1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.net',
    phone: '+91 8877665544',
    company: 'Cyberdyne Systems',
    industry: 'Robotics',
    source: 'Web',
    status: 'new',
    agentId: 'u_dhanush',
    company_id: 'comp_pranesh_tech',
    notes: 'Inquiry for factory automation components.',
    createdAt: '2024-03-16'
  },
  {
    id: 'lead_2',
    name: 'David Lee',
    email: 'david@steelworks.net',
    phone: '+2233445566',
    company: 'Steel Works',
    industry: 'Construction',
    source: 'Exhibition',
    status: 'new',
    agentId: 'u_sales_1',
    company_id: 'comp_globus',
    notes: 'Met at Eng Expo 2024.',
    createdAt: '2024-03-14'
  },
  {
    id: 'lead_3',
    name: 'Paul Adams',
    email: 'paul@turbines.com',
    phone: '+1122334499',
    company: 'Adams Turbines',
    industry: 'Machinery',
    source: 'Cold Call',
    status: 'contacted',
    agentId: 'u_sales_1',
    company_id: 'comp_apex',
    notes: 'Inquiry about hydraulic upgrades.',
    createdAt: '2024-03-18'
  }
];

export const mockVendors: Vendor[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    vendorType: 'Supplier',
    email: 'alice@steelmaster.com', 
    phone: '+1122334455', 
    company: 'Steel Master Inc', 
    category: 'Raw Materials', 
    company_id: 'comp_globus', 
    status: 'active',
    street1: '45 Industrial Park',
    street2: 'Block E',
    city: 'Pune',
    area: 'MIDC',
    state: 'Maharashtra',
    stateCode: 'MH',
    pinCode: '411019',
    contactPerson1: 'Rajesh Patil',
    designation1: 'Sales Manager',
    emailId1: 'rajesh.p@steelmaster.com',
    phoneNumber1: '+91 9876543211',
    contactPerson2: 'Suresh Kumar',
    designation2: 'Operations Head',
    emailId2: 'suresh.k@steelmaster.com',
    phoneNumber2: '+91 9876543212',
    contactPerson3: 'Neha Gupta',
    designation3: 'Support',
    emailId3: 'support@steelmaster.com',
    phoneNumber3: '+91 9876543213',
    landline: '020-27412345',
    fax: '020-27412346',
    gst: '27AABCU9603R1ZN',
    tin: 'TIN-MH-9921',
    cst: 'CST-MH-8821', 
    createdAt: '2024-01-15' 
  },
  { id: '2', name: 'Bob Smith', email: 'bob@logisticsplus.com', phone: '+2233445566', company: 'Logistics Plus', category: 'Logistics', vendorType: 'Service', street1: 'Plot 10, Cargo Road', city: 'Mumbai', state: 'MAHARASHTRA', stateCode: '27', pinCode: '400099', contactPerson1: 'Bob Smith', designation1: 'Fleet Manager', emailId1: 'bob@logisticsplus.com', phoneNumber1: '+2233445566', landline: '022-22334455', gst: '27AADCB1234E1Z5', tin: 'TIN-27-2233', company_id: 'comp_globus', status: 'active', createdAt: '2024-02-10' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@industrialtools.com', phone: '+3344556677', company: 'Industrial Tools Co', category: 'Machinery', vendorType: 'Supplier', street1: 'Shed 4, Guindy Ind', city: 'Chennai', state: 'TAMIL NADU', stateCode: '33', pinCode: '600032', contactPerson1: 'Charlie Brown', designation1: 'Sales Head', emailId1: 'charlie@industrialtools.com', phoneNumber1: '+3344556677', landline: '044-33445566', gst: '33AADCB3344E1Z5', tin: 'TIN-33-3344', company_id: 'comp_apex', status: 'pending', createdAt: '2024-03-05' },
  { id: '4', name: 'Diana Ross', email: 'diana@electrosupply.com', phone: '+4455667788', company: 'Electro Supply', category: 'Electrical', vendorType: 'Retailer', street1: 'Shop 8, Auto Nagar', city: 'Hyderabad', state: 'TELANGANA', stateCode: '36', pinCode: '500014', contactPerson1: 'Diana Ross', designation1: 'Owner', emailId1: 'diana@electrosupply.com', phoneNumber1: '+4455667788', landline: '040-44556677', gst: '36AADCB4455E1Z5', tin: 'TIN-36-4455', company_id: 'comp_apex', status: 'active', createdAt: '2024-03-12' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-8816',
    customerId: '1',
    customerName: 'TATA ADVANCED SYSTEMS LIMITED (SEZ UNIT II)',
    company_id: 'comp_globus',
    date: '2026-03-16',
    dueDate: '2026-04-16',
    status: 'sent',
    items: [],
    subTotal: 50000,
    taxTotal: 10000,
    discount: 0,
    grandTotal: 60000.00,
    paidAmount: 60000.00,
    createdAt: '2026-03-16'
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-8815',
    customerId: '2',
    customerName: 'SNF COMPONENTS PRIVATE LIMITED',
    company_id: 'comp_globus',
    date: '2026-03-16',
    dueDate: '2026-04-16',
    status: 'sent',
    items: [],
    subTotal: 10000,
    taxTotal: 1564,
    discount: 0,
    grandTotal: 11564.00,
    paidAmount: 11564.00,
    createdAt: '2026-03-16'
  },
  {
    id: 'inv_3',
    invoiceNumber: 'INV-8813',
    customerId: '3',
    customerName: 'J S AUTO CAST FOUNDRY INDIA PRIVATE LIMITED',
    company_id: 'comp_globus',
    date: '2026-03-14',
    dueDate: '2026-04-14',
    status: 'sent',
    items: [],
    subTotal: 14000,
    taxTotal: 2520,
    discount: 0,
    grandTotal: 16520.00,
    paidAmount: 16520.00,
    createdAt: '2026-03-14'
  },
  {
    id: 'inv_4',
    invoiceNumber: 'INV-8812',
    customerId: '4',
    customerName: 'VERTEX ENGINEERING',
    company_id: 'comp_globus',
    date: '2026-03-14',
    dueDate: '2026-04-14',
    status: 'sent',
    items: [],
    subTotal: 2500,
    taxTotal: 668,
    discount: 0,
    grandTotal: 3168.00,
    paidAmount: 3168.00,
    createdAt: '2026-03-14'
  },
  {
    id: 'inv_5',
    invoiceNumber: 'INV-8808',
    customerId: '5',
    customerName: 'AGAR ENGINEERING',
    company_id: 'comp_globus',
    date: '2026-03-13',
    dueDate: '2026-04-13',
    status: 'sent',
    items: [],
    subTotal: 7000,
    taxTotal: 930,
    discount: 0,
    grandTotal: 7930.00,
    paidAmount: 7930.00,
    createdAt: '2026-03-13'
  },
  {
    id: 'inv_w1',
    invoiceNumber: 'INV-4486',
    customerId: '6',
    customerName: 'SREE LAKSHMI AGENCIES',
    company_id: 'comp_globus',
    date: '2026-03-13',
    dueDate: '2026-04-13',
    status: 'sent',
    items: [],
    subTotal: 0,
    taxTotal: 0,
    discount: 0,
    grandTotal: 0,
    paidAmount: 0,
    createdAt: '2026-03-13'
  },
  {
    id: 'inv_w2',
    invoiceNumber: 'INV-4485',
    customerId: '6',
    customerName: 'SREE LAKSHMI AGENCIES',
    company_id: 'comp_globus',
    date: '2026-03-13',
    dueDate: '2026-04-13',
    status: 'sent',
    items: [],
    subTotal: 0,
    taxTotal: 0,
    discount: 0,
    grandTotal: 0,
    paidAmount: 0,
    createdAt: '2026-03-13'
  },
  {
    id: 'inv_w3',
    invoiceNumber: 'INV-4484',
    customerId: '6',
    customerName: 'SREE LAKSHMI AGENCIES',
    company_id: 'comp_globus',
    date: '2026-03-13',
    dueDate: '2026-04-13',
    status: 'sent',
    items: [],
    subTotal: 0,
    taxTotal: 0,
    discount: 0,
    grandTotal: 0,
    paidAmount: 0,
    createdAt: '2026-03-13'
  },
  {
    id: 'inv_p1',
    invoiceNumber: '5290',
    customerId: '7',
    customerName: 'JAYEM AUTOMOTIVES (P) LTD',
    address: 'No.2,Ondipudur Road,\nCoimbatore-641005',
    dcNo: 'SDC22-\n23/7473',
    poReference: '-',
    company_id: 'comp_globus',
    date: '2023-02-04',
    dueDate: '2023-02-04',
    status: 'overdue',
    items: [],
    subTotal: 3000,
    taxTotal: 1070,
    discount: 0,
    grandTotal: 4070,
    paidAmount: 0,
    createdAt: '2023-02-04'
  },
  {
    id: 'inv_p2',
    invoiceNumber: '5445',
    customerId: '8',
    customerName: 'PROCOS MECHATRONICS PVT.LTD',
    address: '5/153/07,POOLAKKADU\nTHOTTAM,ARASUR, COIMBATORE-07',
    dcNo: '1806/22-23',
    poReference: '-',
    company_id: 'comp_globus',
    date: '2023-03-24',
    dueDate: '2023-03-24',
    status: 'overdue',
    items: [],
    subTotal: 6000,
    taxTotal: 1440,
    discount: 0,
    grandTotal: 7440,
    paidAmount: 0,
    createdAt: '2023-03-24'
  }
];

export const mockInwardEntries: InwardEntry[] = [
  {
    id: 'in_1',
    inwardNo: 'INW-001',
    customerId: 'cust_ph',
    customerName: 'PHANTOM HANDS VINTAGE COLLECTIBLES LLP',
    address: 'A5, LAKSHMIPURA MAIN ROAD, BENGALURU',
    dcNo: 'DC/M-515-25-26',
    dcDate: '2026-03-16',
    poReference: '-',
    poDate: '',
    date: '2026-03-16',
    company_id: 'comp_globus',
    status: 'pending',
    items: [{ description: 'Material 1', process: 'Machining', quantity: 10, unit: 'pcs' }],
    createdAt: '2026-03-16'
  },
  {
    id: 'in_2',
    inwardNo: 'INW-002',
    customerId: 'cust_ca',
    customerName: 'Craftsman Automation Limited.,Jamshedpur UNIT',
    address: 'PLOT NO: M-3(P)Large Sector,Adityapur IndustrialArea, Jamshedpur-832108,Jharkhand, India,',
    poReference: '40125263002803',
    poDate: '2026-03-10',
    dcNo: '4126700808',
    dcDate: '2026-03-15',
    date: '2026-03-16',
    company_id: 'comp_globus',
    status: 'pending',
    items: [{ description: 'Material 2', process: 'Assembly', quantity: 15, unit: 'pcs' }],
    createdAt: '2026-03-16'
  },
  {
    id: 'in_3',
    inwardNo: 'INW-003',
    customerId: 'cust_or',
    customerName: 'Oriental Plants & Equipments (p) Ltd',
    address: 'S.F. No. 663, Ravathur Main Road, Coimbatore - 641 103',
    poReference: '22012473',
    poDate: '2026-03-12',
    dcNo: '9047535099',
    dcDate: '2026-03-14',
    date: '2026-03-16',
    company_id: 'comp_globus',
    status: 'pending',
    items: [{ description: 'Material 3', process: 'Welding', quantity: 5, unit: 'pcs' }],
    createdAt: '2026-03-16'
  }
];

export const mockOutwardEntries: OutwardEntry[] = [
  {
    id: 'out_1',
    outwardNo: 'OUT-2024-001',
    customerId: '1',
    customerName: 'Tech Corp',
    invoiceReference: 'INV-2024-001',
    challanNo: 'DC-5521',
    vehicleNo: 'MH-14-BT-9902',
    company_id: 'comp_globus',
    date: '2024-03-14',
    status: 'pending',
    items: [{ description: 'Industrial Gear Pump', quantity: 2, unit: 'pcs' }],
    createdAt: '2024-03-14'
  }
];

export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: 'leg_1',
    partyId: '1',
    partyName: 'Tech Corp',
    partyType: 'customer',
    company_id: 'comp_globus',
    date: '2024-03-01',
    type: 'debit',
    amount: 1253.5,
    balance: 1253.5,
    description: 'Invoice INV-2024-001',
    referenceNo: 'INV-2024-001',
    createdAt: '2024-03-01'
  },
  {
    id: 'leg_pt_1',
    partyId: 'cust_pt_1',
    partyName: 'Alpha Industries',
    partyType: 'customer',
    company_id: 'comp_pranesh_tech',
    date: '2024-03-15',
    type: 'debit',
    amount: 5000,
    balance: 5000,
    description: 'Invoice INV-PT-001 Raised',
    referenceNo: 'INV-PT-001',
    createdAt: '2024-03-15'
  },
  {
    id: 'leg_pt_2',
    partyId: 'cust_pt_1',
    partyName: 'Alpha Industries',
    partyType: 'customer',
    company_id: 'comp_pranesh_tech',
    date: '2024-03-16',
    type: 'credit',
    amount: 2000,
    balance: 3000,
    description: 'Bank Transfer Payment',
    referenceNo: 'PAY-PT-001',
    createdAt: '2024-03-16'
  },
  {
    id: 'leg_2',
    partyId: '1',
    partyName: 'Tech Corp',
    partyType: 'customer',
    company_id: 'comp_globus',
    date: '2024-03-05',
    type: 'credit',
    amount: 1000,
    balance: 253.5,
    description: 'Bank Transfer Payment',
    referenceNo: 'PAY-8821',
    createdAt: '2024-03-05'
  },
  {
    id: 'leg_3',
    partyId: '1',
    partyName: 'Steel Master Inc',
    partyType: 'vendor',
    company_id: 'comp_globus',
    date: '2024-03-12',
    type: 'credit',
    amount: 5000,
    balance: 5000,
    description: 'Material Receipt CH-8821',
    referenceNo: 'INW-2024-001',
    createdAt: '2024-03-12'
  }
];

export const mockChallans: Challan[] = [
  {
    id: 'ch_1',
    challanNo: 'DC-2024-101',
    partyId: '1',
    partyName: 'Tech Corp',
    partyType: 'customer',
    company_id: 'comp_globus',
    date: '2024-03-14',
    type: 'delivery',
    status: 'dispatched',
    items: [{ description: 'Industrial Pump Assembly', quantity: 5, unit: 'pcs', hsnCode: '8413' }],
    vehicleNo: 'MH-12-PQ-1234',
    driverName: 'Ramesh Kumar',
    createdAt: '2024-03-14'
  },
  {
    id: 'ch_2',
    challanNo: 'RC-2024-042',
    partyId: '3',
    partyName: 'Heavy Industries',
    partyType: 'vendor',
    company_id: 'comp_apex',
    date: '2024-03-15',
    type: 'returnable',
    status: 'draft',
    items: [{ description: 'Oxygen Cylinder (Empty)', quantity: 10, unit: 'nos' }],
    vehicleNo: 'MH-14-GH-5562',
    createdAt: '2024-03-15'
  }
];

export const mockVouchers: Voucher[] = [
  {
    id: 'v_1',
    voucherNo: 'RCPT-2024-001',
    date: '2024-03-15',
    type: 'receipt',
    partyId: '1',
    partyName: 'Tech Corp',
    partyType: 'customer',
    company_id: 'comp_globus',
    amount: 5000,
    paymentMode: 'bank',
    referenceNo: 'FT-123456',
    description: 'Advance payment for project X',
    status: 'posted',
    createdAt: '2024-03-15'
  },
  {
    id: 'v_2',
    voucherNo: 'PMT-2024-042',
    date: '2024-03-16',
    type: 'payment',
    partyId: '1',
    partyName: 'Steel Master Inc',
    partyType: 'vendor',
    company_id: 'comp_globus',
    amount: 1200,
    paymentMode: 'cash',
    description: 'Utility payment',
    status: 'draft',
    createdAt: '2024-03-16'
  }
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    employeeId: 'GLOB-2024-001',
    name: 'Robert Miller',
    email: 'robert.m@globus.com',
    phone: '+91 9876543210',
    department: 'Engineering',
    designation: 'Senior Design Engineer',
    company_id: 'comp_globus',
    salary: 85000,
    joiningDate: '2023-01-15',
    status: 'active',
    createdAt: '2023-01-15'
  },
  {
    id: 'emp_2',
    employeeId: 'GLOB-2024-002',
    name: 'Sarah Jenkins',
    email: 'sarah.j@globus.com',
    phone: '+91 9876543211',
    department: 'Production',
    designation: 'Floor Supervisor',
    company_id: 'comp_globus',
    salary: 45000,
    joiningDate: '2023-06-20',
    status: 'active',
    createdAt: '2023-06-20'
  },
  {
    id: 'emp_3',
    employeeId: 'GLOB-2024-003',
    name: 'Karan Sharma',
    email: 'karan.s@globus.com',
    phone: '+91 9876543212',
    department: 'Logistics',
    designation: 'Warehouse Manager',
    company_id: 'comp_apex',
    salary: 38000,
    joiningDate: '2024-02-10',
    status: 'active',
    createdAt: '2024-02-10'
  }
];

export const mockDeals: Deal[] = [
  {
    id: 'deal_1',
    title: 'Hydraulic Press Upgrade',
    leadId: 'lead_3',
    agentId: 'u_sales_1',
    company_id: 'comp_apex',
    value: 450000,
    status: 'negotiation',
    priority: 'high',
    expectedClosingDate: '2024-04-15',
    notes: 'Client looking for faster cycle times.',
    createdAt: '2024-03-01'
  },
  {
    id: 'deal_2',
    title: 'Supply of Precision Gears',
    leadId: 'lead_1',
    agentId: 'u_sales_1',
    company_id: 'comp_globus',
    value: 125000,
    status: 'open',
    priority: 'medium',
    expectedClosingDate: '2024-05-20',
    notes: 'Initial requirement gathering under process.',
    createdAt: '2024-03-10'
  }
];
