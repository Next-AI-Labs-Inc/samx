import { Contract } from '../types/contract';
import { v4 as uuidv4 } from 'uuid';

export interface CSVImportResult {
  importId: string;
  status: 'success' | 'error' | 'warning';
  totalRows: number;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  importedAt: Date;
  source: 'csv';
}

export interface SAMGovCSVRow {
  NoticeId: string;
  Title: string;
  'Sol#': string;
  'Department/Ind.Agency': string;
  CGAC: string;
  'Sub-Tier': string;
  'FPDS Code': string;
  Office: string;
  'AAC Code': string;
  PostedDate: string;
  Type: string;
  BaseType: string;
  ArchiveType: string;
  ArchiveDate: string;
  SetASideCode: string;
  SetASide: string;
  ResponseDeadLine: string;
  NaicsCode: string;
  ClassificationCode: string;
  PopStreetAddress: string;
  PopCity: string;
  PopState: string;
  PopZip: string;
  PopCountry: string;
  Active: string;
  AwardNumber: string;
  AwardDate: string;
  'Award$': string;
  Awardee: string;
  PrimaryContactTitle: string;
  PrimaryContactFullname: string;
  PrimaryContactEmail: string;
  PrimaryContactPhone: string;
  PrimaryContactFax: string;
  SecondaryContactTitle: string;
  SecondaryContactFullname: string;
  SecondaryContactEmail: string;
  SecondaryContactPhone: string;
  SecondaryContactFax: string;
  OrganizationType: string;
  State: string;
  City: string;
  ZipCode: string;
  CountryCode: string;
  AdditionalInfoLink: string;
  Link: string;
  Description: string;
}

export class CSVImportService {
  /**
   * Parse CSV content and convert to Contract objects
   */
  async parseCSVContent(csvContent: string): Promise<CSVImportResult> {
    const importId = `csv_import_${Date.now()}`;
    const importedAt = new Date();
    
    const result: CSVImportResult = {
      importId,
      status: 'success',
      totalRows: 0,
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      importedAt,
      source: 'csv'
    };

    try {
      // Parse CSV - handle both \n and \r\n line endings
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        result.status = 'error';
        result.errors.push('CSV file must contain at least a header row and one data row');
        return result;
      }

      // Parse header row
      const headerLine = lines[0];
      const headers = this.parseCSVRow(headerLine);
      
      console.log(`📋 CSV Import: Found ${headers.length} columns`);
      console.log(`🔍 Headers: ${headers.slice(0, 5).join(', ')}...`);

      // Validate required columns
      const requiredColumns = ['NoticeId', 'Title', 'Sol#'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        result.status = 'error';
        result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        return result;
      }

      result.totalRows = lines.length - 1; // Exclude header

      // Process data rows with memory optimization for large files
      const contracts: Contract[] = [];
      const isLargeFile = lines.length > 50000; // 50k+ rows
      
      if (isLargeFile) {
        console.log(`📦 Large dataset detected: ${lines.length} rows - processing in chunks`);
      }
      
      for (let i = 1; i < lines.length; i++) {
        // Memory management for very large files
        if (isLargeFile && i % 10000 === 0) {
          console.log(`🗗️ Progress: ${i}/${lines.length - 1} rows (${Math.round((i / (lines.length - 1)) * 100)}%)`);
          // Force garbage collection hint
          if (global.gc) {
            global.gc();
          }
        }
        const lineNumber = i + 1;
        
        try {
          const values = this.parseCSVRow(lines[i]);
          
          if (values.length === 0) {
            result.skipped++;
            continue; // Skip empty rows
          }
          
          if (values.length !== headers.length) {
            result.warnings.push(`Row ${lineNumber}: Column count mismatch (${values.length} vs ${headers.length})`);
          }

          // Create row object
          const rowData: Partial<SAMGovCSVRow> = {};
          headers.forEach((header, index) => {
            rowData[header as keyof SAMGovCSVRow] = values[index] || '';
          });

          // Transform to Contract format
          const contract = this.transformCSVRowToContract(rowData as SAMGovCSVRow);
          contracts.push(contract);
          
          result.processed++;
          console.log(`✅ Processed row ${lineNumber}: ${contract.title}`);
          
        } catch (error: any) {
          result.errors.push(`Row ${lineNumber}: ${error.message}`);
          console.error(`❌ Error processing row ${lineNumber}:`, error.message);
        }
      }

      result.added = contracts.length;
      
      if (result.errors.length > 0) {
        result.status = result.added > 0 ? 'warning' : 'error';
      }

      // Store results in the result object for the API to handle
      (result as any).contracts = contracts;

      console.log(`📊 CSV Import Summary:`);
      console.log(`  📄 Total rows: ${result.totalRows}`);
      console.log(`  ✅ Processed: ${result.processed}`);
      console.log(`  ✨ Contracts created: ${result.added}`);
      console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
      console.log(`  ❌ Errors: ${result.errors.length}`);

      return result;
      
    } catch (error: any) {
      console.error('❌ CSV Import failed:', error);
      result.status = 'error';
      result.errors.push(`CSV parsing failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Parse a CSV row handling quoted fields and commas
   */
  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      const nextChar = row[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === '\t' && !inQuotes) {
        // Tab separator (SAM.gov exports use tabs)
        result.push(current.trim());
        current = '';
        i++;
      } else if (char === ',' && !inQuotes) {
        // Comma separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  }

  /**
   * Transform SAM.gov CSV row to our Contract format
   */
  private transformCSVRowToContract(row: SAMGovCSVRow): Contract {
    const now = new Date().toISOString();
    
    // Handle contact information
    const contactParts: string[] = [];
    if (row.PrimaryContactFullname) {
      const contact = [
        row.PrimaryContactFullname,
        row.PrimaryContactTitle ? `(${row.PrimaryContactTitle})` : '',
        row.PrimaryContactEmail ? `${row.PrimaryContactEmail}` : '',
        row.PrimaryContactPhone ? `${row.PrimaryContactPhone}` : ''
      ].filter(Boolean).join(' ');
      contactParts.push(`Primary: ${contact}`);
    }
    
    if (row.SecondaryContactFullname) {
      const contact = [
        row.SecondaryContactFullname,
        row.SecondaryContactTitle ? `(${row.SecondaryContactTitle})` : '',
        row.SecondaryContactEmail ? `${row.SecondaryContactEmail}` : '',
        row.SecondaryContactPhone ? `${row.SecondaryContactPhone}` : ''
      ].filter(Boolean).join(' ');
      contactParts.push(`Secondary: ${contact}`);
    }

    // Handle place of performance
    const popParts = [row.PopCity, row.PopState, row.PopCountry].filter(Boolean);
    const placeOfPerformance = popParts.length > 0 ? popParts.join(', ') : undefined;

    // Parse dates
    const parseDate = (dateStr: string): string | undefined => {
      if (!dateStr) return undefined;
      try {
        // Handle Excel date formats
        if (dateStr.includes('/')) {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : date.toISOString();
        }
        return dateStr;
      } catch {
        return undefined;
      }
    };

    // Parse award amount
    const parseAwardAmount = (amountStr: string): string | undefined => {
      if (!amountStr) return undefined;
      const cleanAmount = amountStr.replace(/[,$]/g, '');
      const amount = parseFloat(cleanAmount);
      return isNaN(amount) ? undefined : amount.toString();
    };

    return {
      id: row.NoticeId || uuidv4(),
      solicitationNumber: row['Sol#'] || row.NoticeId || uuidv4(),
      title: row.Title || 'Untitled Opportunity',
      description: row.Description,
      agency: row['Department/Ind.Agency'],
      office: row.Office,
      naicsCode: row.NaicsCode,
      naicsDescription: undefined, // Not provided in CSV
      postedDate: parseDate(row.PostedDate),
      responseDueDate: parseDate(row.ResponseDeadLine),
      archiveDate: parseDate(row.ArchiveDate),
      contractAwardDate: parseDate(row.AwardDate),
      awardAmount: parseAwardAmount(row['Award$']),
      setAsideCode: row.SetASideCode,
      setAsideDescription: row.SetASide,
      placeOfPerformance,
      contactInfo: contactParts.length > 0 ? contactParts.join('; ') : undefined,
      samUrl: row.Link,
      status: row.Active === 'Yes' ? 'active' : 'archived',
      lastUpdated: now,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Merge CSV contracts with existing contracts defensively
   */
  mergeWithExisting(
    csvContracts: Contract[], 
    existingContracts: Contract[]
  ): {
    merged: Contract[];
    stats: {
      added: number;
      updated: number;
      unchanged: number;
      duplicates: number;
    }
  } {
    const stats = { added: 0, updated: 0, unchanged: 0, duplicates: 0 };
    
    // Create lookup map for existing contracts
    const existingMap = new Map<string, Contract>();
    existingContracts.forEach(contract => {
      existingMap.set(contract.id, contract);
      existingMap.set(contract.solicitationNumber, contract);
    });

    const mergedContracts: Contract[] = [...existingContracts];
    
    csvContracts.forEach(csvContract => {
      const existingById = existingMap.get(csvContract.id);
      const existingBySol = existingMap.get(csvContract.solicitationNumber);
      const existing = existingById || existingBySol;

      if (existing) {
        stats.duplicates++;
        
        // Check if update needed (simple field comparison)
        const needsUpdate = [
          'title', 'description', 'responseDueDate', 'archiveDate',
          'contractAwardDate', 'awardAmount', 'status'
        ].some(field => 
          existing[field as keyof Contract] !== csvContract[field as keyof Contract]
        );

        if (needsUpdate) {
          // Update existing contract but preserve original timestamps
          const updatedContract = {
            ...csvContract,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          const existingIndex = mergedContracts.findIndex(c => 
            c.id === existing.id || c.solicitationNumber === existing.solicitationNumber
          );
          
          if (existingIndex >= 0) {
            mergedContracts[existingIndex] = updatedContract;
            stats.updated++;
          }
        } else {
          stats.unchanged++;
        }
      } else {
        // New contract
        mergedContracts.push(csvContract);
        stats.added++;
      }
    });

    return { merged: mergedContracts, stats };
  }
}