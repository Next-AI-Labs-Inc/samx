import { NextRequest, NextResponse } from 'next/server';
import { SamApiService } from '@/lib/services/sam-api';
import { SyncService } from '@/lib/services/sync-service';
import { SqliteContractRepository } from '@/lib/repositories/sqlite-contract-repository';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting defensive SAM.gov sync...');
    
    // Initialize defensive sync service
    const syncService = new SyncService();
    
    // Check if sync is already in progress
    if (syncService.isSyncInProgress()) {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      );
    }

    // Get sync recommendations
    const recommendations = syncService.getSyncRecommendations();
    console.log(`📊 Sync recommendations: ${recommendations.reason}`);

    // Perform defensive incremental sync with throttling handling
    const syncResult = await syncService.performIncrementalSync({
      maxRecordsPerCall: 1000, // Optimize for single API call efficiency
      onProgress: (progress) => {
        console.log(`🔄 Progress: ${progress.processed}/${progress.total} - ${progress.message}`);
      },
      onThrottled: (retryAfterMs: number, nextAccessTime?: string) => {
        console.log(`🕐 API throttled. Retry in ${Math.ceil(retryAfterMs / 1000)} seconds`);
        if (nextAccessTime) {
          console.log(`🕛 Next access time: ${nextAccessTime}`);
        }
      },
      onRetrying: () => {
        console.log('🔁 Retrying SAM.gov API call...');
      }
    });

    if (syncResult.status === 'failed') {
      return NextResponse.json(
        { 
          error: 'Sync failed', 
          details: syncResult.errors.join(', '),
          syncResult
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: `✅ ${syncResult.syncType.charAt(0).toUpperCase() + syncResult.syncType.slice(1)} sync completed successfully!`,
      syncId: syncResult.syncId,
      syncType: syncResult.syncType,
      contractsProcessed: syncResult.contractsProcessed,
      contractsAdded: syncResult.contractsAdded,
      contractsUpdated: syncResult.contractsUpdated,
      contractsSkipped: syncResult.contractsSkipped,
      duplicatesFound: syncResult.duplicatesFound,
      totalRecords: syncResult.contractsAdded + syncResult.contractsUpdated,
      isDefensive: true,
      nextSyncRecommended: syncResult.nextSyncRecommended,
      samApiInfo: {
        totalRecordsInDatabase: syncResult.contractsAdded + syncResult.contractsUpdated,
        lastSyncTime: new Date().toISOString(),
        syncEfficiency: `${syncResult.contractsSkipped}/${syncResult.contractsProcessed} duplicates avoided`
      }
    });

  } catch (error: any) {
    console.error('❌ SAM.gov sync failed:', error);
    
    // Handle throttling errors specifically
    if (error.isThrottled) {
      return NextResponse.json(
        { 
          error: 'SAM.gov API throttled', 
          details: error.message,
          isThrottled: true,
          retryAfterMs: error.retryAfterMs,
          nextAccessTime: error.nextAccessTime
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'SAM.gov sync failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use SQLite database to get real status
    const contractRepository = new SqliteContractRepository();
    const contractCount = await contractRepository.getContractCount();
    const allContracts = contractCount > 0 ? await contractRepository.getAllContracts() : [];
    const hasRealData = contractCount > 0;
    
    // Get the most recent sync info from the database
    const latestSyncStatus = await contractRepository.getLatestSyncStatus();
    
    return NextResponse.json({
      latestSync: latestSyncStatus || {
        id: 1,
        syncType: 'full',
        status: hasRealData ? 'completed' : 'pending',
        contractsProcessed: contractCount,
        contractsAdded: contractCount,
        contractsUpdated: 0,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
      },
      totalContracts: contractCount,
      isRealData: hasRealData,
      dataSource: hasRealData ? 'SQLite Database' : 'Mock Data',
      lastSyncTime: hasRealData ? (allContracts[0]?.lastUpdated || allContracts[0]?.createdAt) : null
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status', details: error.message },
      { status: 500 }
    );
  }
}
