import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csv-import-service';
import { SqliteContractRepository } from '@/lib/repositories/sqlite-contract-repository';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Starting CSV import...');

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
      'text/tab-separated-values'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Handle large government datasets (no size limit but warn for very large files)
    if (file.size > 500 * 1024 * 1024) { // 500MB warning
      console.warn(`⚠️ Processing very large file: ${(file.size / 1024 / 1024).toFixed(1)}MB - this may take a while`);
    }

    console.log(`📄 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Read file content
    const csvContent = await file.text();
    
    if (!csvContent.trim()) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Initialize CSV import service
    const csvImportService = new CSVImportService();

    // Parse CSV content
    const parseResult = await csvImportService.parseCSVContent(csvContent);
    
    if (parseResult.status === 'error' && parseResult.added === 0) {
      return NextResponse.json(
        { 
          error: 'CSV parsing failed', 
          details: parseResult.errors.join(', '),
          result: parseResult
        },
        { status: 400 }
      );
    }

    // Initialize SQLite repository
    const contractRepository = new SqliteContractRepository();
    
    // Get existing contracts count for reporting
    const existingCount = await contractRepository.getContractCount();
    const csvContracts = (parseResult as any).contracts || [];

    console.log(`💾 Storing ${csvContracts.length} CSV contracts in SQLite database (existing: ${existingCount})`);

    // Store contracts in SQLite using batch insert (handles duplicates)
    const storedContracts = await contractRepository.createMultipleContracts(csvContracts);
    const finalCount = await contractRepository.getContractCount();

    const finalResult = {
      message: '✅ CSV import completed successfully!',
      importId: parseResult.importId,
      source: 'csv',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      parsing: {
        totalRows: parseResult.totalRows,
        processed: parseResult.processed,
        errors: parseResult.errors.length,
        warnings: parseResult.warnings.length
      },
      storage: {
        contractsStored: storedContracts.length,
        previousCount: existingCount,
        finalCount: finalCount,
        newContracts: finalCount - existingCount
      },
      database: {
        type: 'SQLite',
        totalContracts: finalCount,
        persistent: true
      },
      status: parseResult.status,
      importedAt: parseResult.importedAt,
      // Include detailed results for debugging
      details: {
        parseErrors: parseResult.errors,
        parseWarnings: parseResult.warnings
      }
    };

    console.log('📊 CSV Import completed:');
    console.log(`  📄 File: ${file.name}`);
    console.log(`  📋 Rows processed: ${parseResult.processed}`);
    console.log(`  ✨ Stored: ${storedContracts.length}`);
    console.log(`  💾 Previous count: ${existingCount}`);
    console.log(`  💾 Final count: ${finalCount}`);
    console.log(`  💾 New contracts: ${finalCount - existingCount}`);
    console.log(`  💾 Storage: SQLite Database (persistent)`);

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error('❌ CSV import failed:', error);
    
    return NextResponse.json(
      { 
        error: 'CSV import failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle large government datasets - no size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: false, // No size limit for government data
    },
  },
};
