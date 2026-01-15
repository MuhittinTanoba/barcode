// src/app/config.jsx - Next.js App Router Configuration
const   appConfig = {
  title: "Boss POS",
  productApiUrl: '/api/products',
  categoryApiUrl: '/api/categories', // Might not exist yet, but better than undefined
  employeeApiUrl: '/api/employees',
  orderApiUrl: '/api/orders',
  tableApiUrl: '/api/tables', // Unused
  workHoursApiUrl: '/api/workhours',
  printReceiptApiUrl: '/api/printer/print',
  kitchenPrinterApiUrl: '/api/printer/kitchen',
  
  // Customer loyalty system APIs
  customerApiUrl: '/api/customers',
  campaignApiUrl: '/api/campaigns',
  
  // DCAP (EMV) public config for direct client call
  emvApiUrl: process.env.NEXT_PUBLIC_DCAP_BASE_URL,
  emvMerchantId: process.env.NEXT_PUBLIC_DCAP_MERCHANT_ID,
  emvOperatorId: process.env.NEXT_PUBLIC_DCAP_OPERATOR_ID,
  emvTranDeviceId: process.env.NEXT_PUBLIC_DCAP_TRAN_DEVICE_ID,
  emvUsername: process.env.NEXT_PUBLIC_DCAP_USERNAME,
  emvPassword: process.env.NEXT_PUBLIC_DCAP_PASSWORD,
  authApiUrl: '/api/auth',
  
  // Points configuration
  pointsConfig: {
    amountPerPoint: 10, 
    pointsExpireDays: 365
  },
  
  // Currency and locale configuration
  currency: {
    symbol: '$',
    code: 'USD',
    locale: 'en-US'
  },
  
  // Date format configuration
  dateFormat: {
    locale: 'en-US',
    format: 'MM/DD/YYYY',
    timeFormat: 'MM/DD/YYYY h:mm A'
  }
};

  
  export default appConfig;
  