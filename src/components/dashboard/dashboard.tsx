'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContractCard from '@/components/contracts/contract-card';
import SyncStatusPanel from '@/components/sync/sync-status-panel';
import FilterBar from '@/components/filters/filter-bar';
import { 
  fetchRecentContracts, 
  selectRecentContracts, 
  selectIsLoadingRecent,
  selectError,
  selectTotalFilteredContracts,
  selectTotalUnfilteredContracts
} from '@/lib/store';
import { Contract, ContractFilters } from '@/lib/types/contract';
import {
  selectCurrentFilters,
  selectActiveSearch,
  selectAvailableAgencies,
  setAvailableAgencies
} from '@/lib/store/search-slice';
import {
  selectDefaultContractStatus,
  selectContractsPerPage
} from '@/lib/store/settings-slice';
import { 
  RefreshCw, 
  Database, 
  AlertCircle, 
  CheckCircle,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const recentContracts = useSelector(selectRecentContracts);
  const isLoading = useSelector(selectIsLoadingRecent);
  const error = useSelector(selectError);
  const totalFilteredContracts = useSelector(selectTotalFilteredContracts);
  const totalUnfilteredContracts = useSelector(selectTotalUnfilteredContracts);
  
  // Search and filter state
  const currentFilters = useSelector(selectCurrentFilters);
  const activeSearch = useSelector(selectActiveSearch);
  const availableAgencies = useSelector(selectAvailableAgencies);
  
  // Settings
  const defaultStatus = useSelector(selectDefaultContractStatus);
  const contractsPerPage = useSelector(selectContractsPerPage);
  
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);

  useEffect(() => {
    // Fetch initial data with settings-based defaults
    const initialFilters = {
      status: defaultStatus === 'all' ? undefined : defaultStatus
    };
    dispatch(fetchRecentContracts({ limit: contractsPerPage, filters: initialFilters }) as any);
    checkSyncStatus();
  }, [dispatch, defaultStatus, contractsPerPage]);
  
  // Fetch contracts when filters change (server-side filtering)
  useEffect(() => {
    const filters = {
      keywords: activeSearch || undefined,
      agencies: currentFilters.agencies?.length ? currentFilters.agencies : undefined,
      minAwardAmount: currentFilters.minAwardAmount,
      maxAwardAmount: currentFilters.maxAwardAmount,
      status: currentFilters.status || (defaultStatus === 'all' ? undefined : defaultStatus)
    };
    
    // Only fetch if there are any filters applied or initial load
    dispatch(fetchRecentContracts({ limit: contractsPerPage, filters }) as any);
  }, [dispatch, activeSearch, currentFilters, defaultStatus, contractsPerPage]);
  
  // Populate available agencies for filtering
  useEffect(() => {
    const agenciesSet = new Set<string>();
    let hasNoAgency = false;
    
    recentContracts.forEach(contract => {
      if (contract.agency && contract.agency.trim()) {
        agenciesSet.add(contract.agency);
      } else {
        hasNoAgency = true;
      }
    });
    
    const agencies = Array.from(agenciesSet).sort();
    
    // Add "(No Agency)" option if there are contracts without agencies
    if (hasNoAgency) {
      agencies.unshift('(No Agency)');
    }
    
    if (agencies.length > 0 && agencies.length !== availableAgencies.length) {
      dispatch(setAvailableAgencies(agencies));
    }
  }, [recentContracts, availableAgencies.length, dispatch]);

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const result = await response.json();
      
      if (response.ok) {
        console.log('🎉 Real SAM.gov sync completed:', result);
        
        // Show success message with real data info
        if (result.contracts && result.contracts.length > 0) {
          alert(`🚀 SUCCESS! Fetched ${result.contractsAdded} REAL contracts from SAM.gov!\n\nTotal records available: ${result.samApiInfo?.totalRecordsAvailable || 'Unknown'}`);
        }
        
        // Refresh contracts after sync to show real data
        dispatch(fetchRecentContracts({ limit: contractsPerPage }) as any);
        await checkSyncStatus();
      } else {
        console.error('Sync failed:', result);
        alert(`Sync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed: Network error');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (contract: Contract) => {
    console.log('View details for:', contract);
    // TODO: Navigate to detail view or open modal
  };

  const handleDataUpdated = async () => {
    console.log('🔄 Refreshing contracts after data update...');
    // Refresh both contracts and sync status
    dispatch(fetchRecentContracts({ limit: contractsPerPage }) as any);
    await checkSyncStatus();
    
    // Optional: Show a brief success message
    console.log('✅ Dashboard refreshed with latest data');
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Federal Contract Dashboard
              {syncStatus?.isRealData && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm font-medium min-w-[80px] flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {syncStatus?.isRealData 
                ? `Live federal contracting data from ${syncStatus.dataSource}`
                : 'Federal contract discovery and monitoring platform'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleDataUpdated}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh contract display and sync status</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => setSyncPanelOpen(true)}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open sync status panel and import options</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleSync} 
                  disabled={syncing}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{syncing ? 'Syncing with SAM.gov API...' : 'Fetch latest contracts from SAM.gov API'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

      {/* Simple Stats - Real Data Only */}
      {syncStatus?.totalContracts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Contracts"
            value={syncStatus.totalContracts.toLocaleString()}
            icon={<Database className="h-5 w-5 text-blue-600" />}
            trend={syncStatus.isRealData ? 'Live SAM.gov data' : 'Test data'}
          />
          <StatsCard
            title="Contracts Shown"
            value={recentContracts.length.toString()}
            icon={<Activity className="h-5 w-5 text-green-600" />}
            trend="Currently displayed"
          />
          <StatsCard
            title="Data Source"
            value={syncStatus.isRealData ? 'Live' : 'Demo'}
            icon={syncStatus.isRealData 
              ? <CheckCircle className="h-5 w-5 text-green-600" />
              : <AlertCircle className="h-5 w-5 text-orange-600" />
            }
            trend={syncStatus.dataSource || 'Unknown'}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collapsible Sync Information - Only if there's real data */}
      {syncStatus?.latestSync && syncStatus?.isRealData && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group-open:rounded-b-none hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4" />
                        <span className="group-open:hidden">Sync Details</span>
                        <span className="hidden group-open:inline">Last Sync Details</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-open:hidden">Click to expand</span>
                      <span className="text-xs text-muted-foreground hidden group-open:inline">Click to collapse</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>View detailed information about the most recent data sync</p>
              </TooltipContent>
            </Tooltip>
          </summary>
          <Card className="rounded-t-none border-t-0">
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={syncStatus.latestSync.status === 'completed' ? 'default' : 'destructive'}>
                      {syncStatus.latestSync.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Processed:</span>
                  <div className="font-medium">{syncStatus.latestSync.contractsProcessed || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Added:</span>
                  <div className="font-medium text-green-600">{syncStatus.latestSync.contractsAdded || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>
                  <div className="font-medium text-blue-600">{syncStatus.latestSync.contractsUpdated || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </details>
      )}

      {/* Filter Bar */}
      {syncStatus?.isRealData && (
        <FilterBar
          totalResults={totalFilteredContracts}
          totalUnfilteredResults={totalUnfilteredContracts}
        />
      )}

      {/* Contracts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {syncStatus?.isRealData ? 'Federal Contracts' : 'No Data Available'}
          </h2>
          {syncStatus?.isRealData && (
            <Badge variant="secondary">
              {recentContracts.length} of {totalFilteredContracts} contracts shown
            </Badge>
          )}
          {syncStatus?.isRealData && totalUnfilteredContracts > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalFilteredContracts} of {totalUnfilteredContracts} total ({Math.round((totalFilteredContracts/totalUnfilteredContracts)*100)}%)
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !syncStatus?.isRealData ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contract data available</h3>
              <p className="text-muted-foreground mb-4">
                Import a SAM.gov CSV file or sync with the API to view federal contracts
              </p>
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setSyncPanelOpen(true)}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button onClick={handleSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {syncing ? 'Syncing...' : 'Sync API'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : recentContracts.length === 0 && totalFilteredContracts === 0 && (activeSearch || Object.keys(currentFilters).length > 0) ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contracts match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to see more results.
              </p>
            </CardContent>
          </Card>
        ) : recentContracts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contracts found</h3>
              <p className="text-muted-foreground mb-4">
                Your database is empty. Try importing more data or adjusting filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onViewDetails={handleViewDetails}
                highlightKeywords={activeSearch}
              />
            ))}
            {totalFilteredContracts > recentContracts.length && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Showing {recentContracts.length} of {totalFilteredContracts} matching contracts.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => dispatch(fetchRecentContracts({ limit: contractsPerPage * 2, filters: {
                      keywords: activeSearch || undefined,
                      agencies: currentFilters.agencies?.length ? currentFilters.agencies : undefined,
                      minAwardAmount: currentFilters.minAwardAmount,
                      maxAwardAmount: currentFilters.maxAwardAmount,
                      status: currentFilters.status || (defaultStatus === 'all' ? undefined : defaultStatus)
                    } }) as any)}
                  >
                    Load More
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      
      {/* Sync Status Panel */}
      <SyncStatusPanel 
        isOpen={syncPanelOpen} 
        onClose={() => setSyncPanelOpen(false)}
        onDataUpdated={handleDataUpdated}
      />
      </div>
    </TooltipProvider>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;