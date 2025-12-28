export const DEFAULT_BANKS = [
  "IDBI", "Bank of Baroda", "Kotak", "Paytm", "Axis", "Standard Chartered", "HDFC"
];

export const DEFAULT_INVESTMENTS = [
  "Kite Shares", "Coin Mutual Funds", "PPF", "FD", "Tyke", "Amplio", "Grip", "Precize", "Vested"
];

export const DEFAULT_DEDUCTIONS = [
  "Credit Card Pending", "Axis Loan", "HDFC Loan", "PhonePe"
];

export const DEFAULT_OTHERS = [
  "EPF", "Stock Options/EquatePlus", "Sodexo", "Miscellaneous", "Liabilities"
];

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'dh', name: 'UAE Dirham' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const EXCEL_ROW_OFFSETS = {
  MONTHS: 2, // Row 3
  BANKS_START: 6, // Row 7
  INVESTMENTS_START: 15, // Row 16
  DEDUCTIONS_START: 32, // Row 33
  OTHERS_START: 39, // Row 40
};
