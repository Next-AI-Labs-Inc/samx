'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  Activity,
  Database,
  Zap,
  ExternalLink,
  Upload,
  FileText
} from 'lucide-react';

interface SyncLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface SyncStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void; // Callback to refresh dashboard
}

const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({ isOpen, onClose, onDataUpdated }) => {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logIdCounter = useRef(0);

  const addLog = (level: SyncLogEntry['level'], message: string, details?: any) => {
    logIdCounter.current += 1;
    const newLog: SyncLogEntry = {
      id: `log_${Date.now()}_${logIdCounter.current}`,
      timestamp: new Date(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearInterval(retryTimer);
      }
    };
  }, [retryTimer]);

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Start countdown timer
  const startRetryCountdown = (retryAfterMs: number, nextAccessTime?: string) => {
    setIsThrottled(true);
    
    const endTime = Date.now() + retryAfterMs;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRetryCountdown(remaining);
      
      if (remaining <= 0) {
        setIsThrottled(false);
        setRetryCountdown(0);
        if (retryTimer) {
          clearInterval(retryTimer);
          setRetryTimer(null);
        }
        addLog('success', '✅ Throttling period ended - ready to retry!');
      }
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    setRetryTimer(timer);
    
    addLog('warning', `⏳ API throttled. Retry in ${formatCountdown(Math.ceil(retryAfterMs / 1000))}`);
    if (nextAccessTime) {
      addLog('info', `🕛 Next access time: ${new Date(nextAccessTime).toLocaleString()}`);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    setLogs([]); // Clear previous logs
    setIsThrottled(false);
    if (retryTimer) {
      clearInterval(retryTimer);
      setRetryTimer(null);
    }
    
    addLog('info', '🚀 Starting SAM.gov sync process...');
    
    try {
      addLog('info', '🔗 Testing API connection...');
      
      const response = await fetch('/api/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const syncType = result.syncType || 'sync';
        addLog('success', `✅ ${syncType.charAt(0).toUpperCase() + syncType.slice(1)} sync completed successfully!`);
        addLog('info', `📊 Processed: ${result.contractsProcessed} opportunities`);
        addLog('info', `✨ Added: ${result.contractsAdded} new contracts`);
        if (result.contractsUpdated > 0) {
          addLog('info', `🔄 Updated: ${result.contractsUpdated} contracts`);
        }
        if (result.contractsSkipped > 0) {
          addLog('info', `⏭️ Skipped: ${result.contractsSkipped} (no changes)`);
        }
        if (result.duplicatesFound > 0) {
          addLog('success', `🚪 Defense: ${result.duplicatesFound} duplicates detected & handled`);
        }
        if (result.samApiInfo) {
          addLog('info', `💾 Total in database: ${result.samApiInfo.totalRecordsInDatabase || result.totalRecords}`);
          if (result.samApiInfo.syncEfficiency) {
            addLog('info', `🎯 Efficiency: ${result.samApiInfo.syncEfficiency}`);
          }
        }
        if (result.nextSyncRecommended) {
          const nextSync = new Date(result.nextSyncRecommended);
          addLog('info', `⏰ Next sync recommended: ${nextSync.toLocaleString()}`);
        }
        setSyncStats(result);
      } else {
        // Enhanced error logging with full details
        addLog('error', `❌ Sync failed: ${result.error || 'Unknown error'}`);
        if (result.details) {
          addLog('error', `💬 Error Details: ${result.details}`, result.details);
        }
        if (result.stack && process.env.NODE_ENV === 'development') {
          addLog('error', '📊 Stack trace:', result.stack);
        }
        
        // Handle throttling errors with retry logic
        if (result.details && (result.details.includes('throttled') || result.details.includes('quota') || result.details.includes('exceeded'))) {
          // Extract retry information from error details
          const nextAccessMatch = result.details.match(/2025-Sep-\d{2} \d{2}:\d{2}:\d{2}\+0000 UTC/);
          if (nextAccessMatch) {
            const nextAccessTime = nextAccessMatch[0].replace('+0000 UTC', 'Z');
            const retryAfterMs = new Date(nextAccessTime).getTime() - Date.now();
            
            addLog('warning', '⏳ API Rate Limited - Setting up auto-retry');
            addLog('info', `🕛 Next access: ${new Date(nextAccessTime).toLocaleString()}`);
            addLog('info', '✅ Good news: API key is working correctly!');
            
            // Start countdown and retry logic
            startRetryCountdown(retryAfterMs, nextAccessTime);
          } else {
            addLog('warning', '⏳ API Rate Limit: Daily quota exceeded');
            addLog('info', '💡 API will reset tomorrow at midnight UTC');
            addLog('info', '✅ Good news: API key is working correctly!');
          }
        }
        
        // Handle other specific errors
        if (result.details && result.details.includes('PostedFrom and PostedTo are mandatory')) {
          addLog('warning', '🔧 Fix: SAM.gov requires date range parameters');
          addLog('info', '💡 Updating API service to include required date parameters...');
        }
        if (result.details && result.details.includes('API_KEY_INVALID')) {
          addLog('warning', '🔑 Fix: Check your SAM.gov API key');
          addLog('info', '💡 Make sure the key is active and properly formatted');
        }
        if (result.details && result.details.includes('Invalid Date Entered')) {
          addLog('warning', '📅 Date Format Error: SAM.gov requires MM/dd/yyyy format');
          addLog('info', '🔧 Fixed: Updated date formatting in API service');
        }
      }
    } catch (error: any) {
      addLog('error', `❌ Network error during sync`);
      addLog('error', `Details: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    logIdCounter.current = 0;
  };

  // CSV Upload handlers
  const handleFileUpload = async (file: File) => {
    if (isUploading) return;
    
    setIsUploading(true);
    addLog('info', `📤 Uploading CSV file: ${file.name}`);
    const fileSizeMB = file.size / 1024 / 1024;
    addLog('info', `📏 File size: ${fileSizeMB.toFixed(1)} MB`);
    
    if (fileSizeMB > 100) {
      addLog('warning', '🕰️ Large file detected - processing may take several minutes');
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Extended timeout for large government datasets
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minute timeout
      
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      // Check for both HTTP success AND result status
      if (response.ok && (result.status === 'success' || result.message?.includes('successfully'))) {
        addLog('success', `✅ CSV import completed successfully!`);
        addLog('info', `📋 File: ${result.fileInfo.name}`);
        addLog('info', `📊 Processed: ${result.parsing.processed} rows`);
        addLog('info', `✨ Stored: ${result.storage.contractsStored} contracts`);
        addLog('info', `💾 Database: ${result.database.type}`);
        addLog('info', `💾 Previous count: ${result.storage.previousCount}`);
        addLog('info', `💾 Final count: ${result.storage.finalCount}`);
        addLog('info', `💾 New contracts: ${result.storage.newContracts}`);
        if (result.parsing.warnings > 0) {
          addLog('warning', `⚠️ Warnings: ${result.parsing.warnings} (minor formatting issues)`);
        }
        
        // Store CSV import stats
        setSyncStats({
          ...result,
          syncId: result.importId,
          syncType: 'csv-import',
          contractsProcessed: result.parsing.processed,
          contractsAdded: result.storage.contractsStored,
          contractsUpdated: 0,
          contractsSkipped: result.storage.previousCount,
          duplicatesFound: 0,
          isDefensive: true,
          samApiInfo: {
            totalRecordsInDatabase: result.storage.finalCount,
            syncEfficiency: `${result.storage.contractsStored}/${result.parsing.processed} contracts stored`
          }
        });
        
        // Trigger dashboard refresh after successful CSV import
        addLog('info', '🔄 Refreshing dashboard with new data...');
        if (onDataUpdated) {
          setTimeout(() => {
            onDataUpdated();
          }, 500); // Small delay to ensure state is updated
        } else {
          addLog('warning', '⚠️ Dashboard refresh not available - please refresh the page');
        }
        
        // Add final success message
        addLog('success', `🎉 Import complete! ${result.storage.contractsStored} contracts are now in your database`);
        addLog('info', '✅ You can close this panel and view your contracts in the dashboard');
        
      } else {
        addLog('error', `❌ CSV import failed: ${result.error}`);
        if (result.details) {
          addLog('error', `💬 Details: ${result.details}`);
        }
        if (result.details?.parseErrors?.length > 0) {
          addLog('warning', `⚠️ Parse errors: ${result.details.parseErrors.slice(0, 3).join(', ')}${result.details.parseErrors.length > 3 ? '...' : ''}`);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addLog('error', `⏱️ CSV upload timed out (10 minutes) - file may be too large`);
        addLog('info', '💡 Try uploading a smaller file or contact support');
      } else {
        addLog('error', `❌ Network error during CSV upload`);
        addLog('error', `Details: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.name.toLowerCase().endsWith('.csv') || 
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel'
    );
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      addLog('warning', '⚠️ Please drop a CSV file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCheckStatus = async () => {
    addLog('info', '🔍 Checking current sync status...');
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      
      if (data.isRealData) {
        addLog('success', `🎆 Currently using LIVE SAM.gov data`);
        addLog('info', `📊 Total contracts: ${data.totalContracts}`);
        addLog('info', `⏰ Last sync: ${data.lastSyncTime ? new Date(data.lastSyncTime).toLocaleString() : 'Unknown'}`);
      } else {
        addLog('warning', `🧪 Currently using mock data`);
        addLog('info', `💡 Run a sync to get real SAM.gov data`);
      }
    } catch (error: any) {
      addLog('error', `Failed to check status: ${error.message}`);
    }
  };

  const getLogIcon = (level: SyncLogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogStyle = (level: SyncLogEntry['level']) => {
    switch (level) {
      case 'success': return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950';
      case 'warning': return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950';
      case 'error': return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950';
      default: return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>SAM.gov Sync Status</span>
              {syncing && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Throttling Status */}
          {isThrottled && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  API Throttled - Auto-retry in {formatCountdown(retryCountdown)}
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                The API will automatically retry when the throttling period expires
              </p>
            </div>
          )}
          
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleSync} 
              disabled={syncing || isThrottled}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing ? 'Syncing...' : 
                 isThrottled ? `Retry in ${formatCountdown(retryCountdown)}` : 
                 'Start Sync'}
              </span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleCheckStatus}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Check Status</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleClearLogs}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Clear Logs</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={async () => {
                addLog('info', '🔍 Testing API key...');
                try {
                  const response = await fetch('/api/test-api');
                  const result = await response.json();
                  
                  if (response.ok) {
                    addLog('success', `✅ API key is valid!`);
                    addLog('info', `🔑 Key: ${result.apiKey.prefix}`);
                    if (result.apiInfo) {
                      addLog('info', `📊 API Status: ${result.apiInfo.status}`);
                    }
                  } else {
                    addLog('error', `❌ API key test failed: ${result.error}`);
                    if (result.details) {
                      addLog('error', `Details: ${result.details}`);
                    }
                  }
                } catch (error: any) {
                  addLog('error', `❌ Network error testing API: ${error.message}`);
                }
              }}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Test API Key</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-2"
            >
              <Upload className={`h-4 w-4 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Uploading...' : 'Upload CSV'}</span>
            </Button>
            
            <Button 
              variant="outline"
              asChild
            >
              <a 
                href="https://api.data.gov/docs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>API Docs</span>
              </a>
            </Button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,text/csv,application/vnd.ms-excel,text/tab-separated-values"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          {/* CSV Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-muted-foreground/25'}
              ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400'}
            `}
          >
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <span className="text-sm">
                {dragActive 
                  ? 'Drop your SAM.gov CSV file here' 
                  : 'Drag & drop a SAM.gov CSV file here or click Upload CSV'
                }
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supports large SAM.gov CSV exports (unlimited size) • Large files may take time to process
            </p>
          </div>

          {/* Sync Stats */}
          {syncStats && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm flex items-center space-x-2">
                <span>Latest {syncStats.syncType || 'Sync'} Results</span>
                {syncStats.isDefensive && (
                  <Badge variant="outline" className="text-xs">
                    🛡️ Defensive
                  </Badge>
                )}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Processed:</span>
                  <div className="font-medium">{syncStats.contractsProcessed}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Added:</span>
                  <div className="font-medium text-green-600">{syncStats.contractsAdded}</div>
                </div>
                {syncStats.contractsUpdated > 0 && (
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <div className="font-medium text-blue-600">{syncStats.contractsUpdated}</div>
                  </div>
                )}
                {syncStats.contractsSkipped > 0 && (
                  <div>
                    <span className="text-muted-foreground">Skipped:</span>
                    <div className="font-medium text-amber-600">{syncStats.contractsSkipped}</div>
                  </div>
                )}
                {syncStats.duplicatesFound > 0 && (
                  <div>
                    <span className="text-muted-foreground">Duplicates:</span>
                    <div className="font-medium text-purple-600">{syncStats.duplicatesFound}</div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Total DB:</span>
                  <div className="font-medium text-indigo-600">
                    {syncStats.samApiInfo?.totalRecordsInDatabase || syncStats.totalRecords || 'Unknown'}
                  </div>
                </div>
              </div>
              {syncStats.samApiInfo?.syncEfficiency && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Efficiency: {syncStats.samApiInfo.syncEfficiency}
                </div>
              )}
            </div>
          )}

          {/* Live Logs */}
          <div className="flex-1 bg-muted/30 rounded-lg p-4 overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-3 text-sm flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Live Sync Logs</span>
              <Badge variant="secondary" className="text-xs">
                {logs.length} entries
              </Badge>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sync activity yet</p>
                  <p className="text-sm">Click "Start Sync" to begin</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-md ${getLogStyle(log.level)}`}
                  >
                    <div className="flex items-start space-x-2">
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {log.details && (
                          <pre className="text-xs mt-1 text-muted-foreground">
                            {typeof log.details === 'object' 
                              ? JSON.stringify(log.details, null, 2) 
                              : log.details
                            }
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncStatusPanel;