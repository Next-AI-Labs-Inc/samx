import { NextRequest, NextResponse } from 'next/server';
import { SqliteContractRepository } from '@/lib/repositories/sqlite-contract-repository';

export async function GET(request: NextRequest) {
  try {
    const contractRepository = new SqliteContractRepository();
    
    const contractCount = await contractRepository.getContractCount();
    const recentContracts = await contractRepository.getRecentContracts(5);
    const latestSync = await contractRepository.getLatestSyncStatus();
    
    console.log('🔍 Debug SQLite Database Status:', {
      contractCount,
      lastSync: latestSync?.startedAt || 'Never',
      sampleTitles: recentContracts.slice(0, 3).map(c => c.title)
    });
    
    return NextResponse.json({
      status: 'success',
      database: {
        type: 'SQLite',
        contractCount,
        lastSyncTime: latestSync?.startedAt || null,
        sampleContracts: recentContracts.map(c => ({
          id: c.id,
          title: c.title,
          agency: c.agency,
          postedDate: c.postedDate
        }))
      },
      debug: {
        storageType: 'SQLite Database',
        persistent: true,
        inMemory: false
      }
    });
  } catch (error: any) {
    console.error('Error checking store status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check store status', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}