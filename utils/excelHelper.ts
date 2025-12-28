import * as XLSX from 'xlsx';
import { MonthlyRecord, FinancialItem } from '../types';
import { DEFAULT_BANKS, DEFAULT_INVESTMENTS, DEFAULT_DEDUCTIONS, DEFAULT_OTHERS, EXCEL_ROW_OFFSETS } from '../constants';

const getCellValue = (worksheet: XLSX.WorkSheet, row: number, col: number): any => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  return worksheet[cellAddress] ? worksheet[cellAddress].v : undefined;
};

const createDefaultItem = (id: string, name: string, value: number, investedValue: number = 0): FinancialItem => ({
  id,
  name,
  value,
  investedValue,
  currency: 'INR',
  exchangeRate: 1,
  originalValue: value,
  originalInvestedValue: investedValue,
  subItems: [],
  isCustom: false
});

// Helper to create initial empty record structure
const createEmptyRecord = (monthLabel: string, year: number, id: string): MonthlyRecord => ({
  id,
  monthLabel,
  year,
  banks: [],
  investments: [],
  deductions: [],
  others: [],
  timestamp: Date.now()
});

export const parseExcel = async (file: File): Promise<MonthlyRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use 'array' type for ArrayBuffer (more robust than binary string)
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const records: MonthlyRecord[] = [];
        
        let colIndex = 3;
        while (true) {
          const monthVal = getCellValue(sheet, EXCEL_ROW_OFFSETS.MONTHS, colIndex);
          if (!monthVal) break;

          const recordId = `record-${colIndex}`;
          let monthLabel = String(monthVal); 
          let year = new Date().getFullYear(); 
          
          if (typeof monthVal === 'number') {
             const date = XLSX.SSF.parse_date_code(monthVal);
             const dateObj = new Date(date.y, date.m - 1, date.d);
             // Use en-US to ensure "MMM YY" format consistency with app logic
             monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: '2-digit' });
             year = dateObj.getFullYear();
          }

          const record = createEmptyRecord(monthLabel, year, recordId);

          const parseCategory = (startRow: number, endRow: number, categoryList: FinancialItem[], isInv = false) => {
            for (let r = startRow; r < endRow; r++) {
              const name = getCellValue(sheet, r, 1) || getCellValue(sheet, r, 0);
              const val = Number(getCellValue(sheet, r, colIndex)) || 0;
              
              if (name) {
                 const existingIndex = categoryList.findIndex(b => b.name.toLowerCase() === String(name).toLowerCase());
                 
                 if (existingIndex >= 0) {
                   categoryList[existingIndex].value = val;
                   categoryList[existingIndex].originalValue = val;
                   if (isInv) {
                     categoryList[existingIndex].investedValue = val;
                     categoryList[existingIndex].originalInvestedValue = val;
                   }
                 } else {
                   categoryList.push({
                     ...createDefaultItem(`${recordId}-row-${r}`, String(name), val, isInv ? val : 0),
                     isCustom: true
                   });
                 }
              }
            }
          };

          parseCategory(EXCEL_ROW_OFFSETS.BANKS_START, EXCEL_ROW_OFFSETS.INVESTMENTS_START - 1, record.banks);
          parseCategory(EXCEL_ROW_OFFSETS.INVESTMENTS_START, EXCEL_ROW_OFFSETS.DEDUCTIONS_START - 1, record.investments, true);
          parseCategory(EXCEL_ROW_OFFSETS.DEDUCTIONS_START, EXCEL_ROW_OFFSETS.OTHERS_START - 1, record.deductions);
          parseCategory(EXCEL_ROW_OFFSETS.OTHERS_START, EXCEL_ROW_OFFSETS.OTHERS_START + 10, record.others);

          records.push(record);
          colIndex++;
        }

        if (records.length === 0) {
           throw new Error("No records found in Excel. Please check the template format.");
        }

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    // Use readAsArrayBuffer for better compatibility
    reader.readAsArrayBuffer(file);
  });
};

export const exportExcel = (records: MonthlyRecord[]) => {
  const ws = XLSX.utils.aoa_to_sheet([["Financial Health Tracker"]]);
  
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", ...records.map(r => r.monthLabel)]], { origin: "A3" });

  const writeCategory = (title: string, startRow: number, getItems: (r: MonthlyRecord) => FinancialItem[], defaultItems: string[]) => {
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: { r: startRow - 2, c: 1 } });
    
    const allNames = new Set(defaultItems);
    records.forEach(r => getItems(r).forEach(i => allNames.add(i.name)));
    const sortedNames = Array.from(allNames);

    sortedNames.forEach((name, idx) => {
      const rowNum = startRow + idx;
      const rowData = [
        "", 
        name, 
        "", 
        ...records.map(r => {
          const item = getItems(r).find(i => i.name === name);
          return item ? item.value : 0; // Exporting the Calculated INR Value
        })
      ];
      XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: { r: rowNum, c: 0 } });
    });
  };

  writeCategory("Bank Accounts", EXCEL_ROW_OFFSETS.BANKS_START, r => r.banks, DEFAULT_BANKS);
  writeCategory("Investments", EXCEL_ROW_OFFSETS.INVESTMENTS_START, r => r.investments, DEFAULT_INVESTMENTS);
  writeCategory("Deductions", EXCEL_ROW_OFFSETS.DEDUCTIONS_START, r => r.deductions, DEFAULT_DEDUCTIONS);
  writeCategory("Other Assets/Liabilities", EXCEL_ROW_OFFSETS.OTHERS_START, r => r.others, DEFAULT_OTHERS);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tracker");
  XLSX.writeFile(wb, "financial_tracker.xlsx");
};