'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SyncStatusPanel from '@/components/sync/sync-status-panel';
import { 
  Menu, 
  X, 
  Search, 
  Filter,
  Home,
  Bookmark,
  Settings,
  RefreshCw,
  Database,
  BarChart3,
  Bell,
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const openSyncPanel = () => {
    setSyncPanelOpen(true);
  };

  const closeSyncPanel = () => {
    setSyncPanelOpen(false);
  };

  const openFeedbackModal = () => {
    const event = new CustomEvent('openFeedback');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        'bg-card border-r border-border transition-all duration-300 flex flex-col',
        sidebarExpanded ? 'w-64' : 'w-16'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarExpanded && (
              <h1 className="font-bold text-xl text-foreground">SamX</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto"
            >
              {sidebarExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          <NavItem
            icon={<Home className="h-4 w-4" />}
            label="Home Page"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/'}
          />
          <NavItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Dashboard"
            expanded={sidebarExpanded}
            active={true}
          />
          <NavItem
            icon={<Search className="h-4 w-4" />}
            label="Search"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/search'}
          />
          <NavItem
            icon={<Filter className="h-4 w-4" />}
            label="Filters"
            expanded={sidebarExpanded}
            badge="3"
            onClick={() => window.location.href = '/filters'}
          />
          <NavItem
            icon={<Bookmark className="h-4 w-4" />}
            label="Saved Searches"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/saved-searches'}
          />
          <NavItem
            icon={<RefreshCw className="h-4 w-4" />}
            label="Sync Status"
            expanded={sidebarExpanded}
            onClick={openSyncPanel}
          />
          <NavItem
            icon={<Database className="h-4 w-4" />}
            label="Database"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/database'}
          />
          <NavItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/analytics'}
          />
          <NavItem
            icon={<Bell className="h-4 w-4" />}
            label="Alerts"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/alerts'}
          />
          <NavItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/settings'}
          />
          <NavItem
            icon={<Sparkles className="h-4 w-4" />}
            label="What's New"
            expanded={sidebarExpanded}
            onClick={() => window.location.href = '/changelog'}
          />
          <NavItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="Send Feedback"
            expanded={sidebarExpanded}
            onClick={openFeedbackModal}
          />
        </nav>

        {/* Sync Status Footer */}
        <div className="p-4 border-t border-border">
          {sidebarExpanded ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Last sync: 2 hours ago
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-xs text-foreground">Online</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Sync Status Panel */}
      <SyncStatusPanel 
        isOpen={syncPanelOpen} 
        onClose={closeSyncPanel} 
      />
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  label, 
  expanded, 
  active = false, 
  badge,
  onClick 
}) => {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start",
        !expanded && "px-2 justify-center"
      )}
      onClick={onClick}
    >
      {icon}
      {expanded && (
        <>
          <span className="ml-3">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Button>
  );
};

export default MainLayout;