'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contract } from '@/lib/types/contract';
import { 
  Building2, 
  Calendar, 
  Clock, 
  ExternalLink, 
  MapPin,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { highlightSearchTerms } from '@/lib/utils/search-utils';

interface ContractCardProps {
  contract: Contract;
  onViewDetails?: (contract: Contract) => void;
  highlightKeywords?: string;
}

const ContractCard: React.FC<ContractCardProps> = ({ 
  contract, 
  onViewDetails,
  highlightKeywords 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'archived':
        return 'bg-gray-500';
      case 'awarded':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };


  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDescription = (text: string) => {
    // Split into paragraphs and sentences for better readability
    return text
      // Add line breaks after sentences that end with periods followed by capital letters
      .replace(/\. ([A-Z])/g, '.\n\n$1')
      // Add line breaks after colons when followed by uppercase or "Shall"
      .replace(/: ([A-Z]|Shall)/g, ':\n\n$1')
      // Add breaks before common section starters
      .replace(/(Product Characteristics:|Technical Services|Security|Assigned Customer)/g, '\n\n$1')
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const formatCurrency = (amount?: string) => {
    if (!amount) return 'N/A';
    
    // Handle different input formats
    const numericValue = parseFloat(amount.toString().replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return amount;
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <h3 className="font-semibold text-lg leading-tight">
              {highlightSearchTerms(contract.title, highlightKeywords || '')}
            </h3>
          </div>
          {contract.samUrl && (
            <Button variant="ghost" size="icon" asChild>
              <a href={contract.samUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {contract.description && (
          <div className="rounded-md p-3 -m-1 mb-4 border-l-2 border-muted">
            <div 
              className={`text-sm text-slate-700 dark:text-slate-200 leading-relaxed ${!isExpanded ? 'cursor-pointer hover:bg-muted/20 rounded p-2 -m-2 transition-colors' : ''}`}
              onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
              title={!isExpanded ? "Click to expand full description" : undefined}
            >
              {formatDescription(
                isExpanded ? contract.description : truncateText(contract.description, 300)
              ).split('\n').map((paragraph, index) => (
                <p key={index} className={`${paragraph.trim() ? 'mb-2' : 'mb-1'}`}>
                  {highlightSearchTerms(paragraph, highlightKeywords || '')}
                </p>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted/50">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{contract.description.length} characters</span>
                {!isExpanded && contract.description.length > 300 && (
                  <span>• {Math.round((contract.description.length - 300) / 100) * 100}+ more</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!isExpanded && contract.description.length > 300 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="h-6 px-2 text-xs"
                  >
                    ▼ Expand
                  </Button>
                )}
                {isExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-6 px-2 text-xs"
                  >
                    ▲ Collapse
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {contract.agency && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{contract.agency}</span>
            </div>
          )}

          {contract.postedDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Posted {formatDate(contract.postedDate)}</span>
            </div>
          )}

          {contract.responseDueDate && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due {formatDate(contract.responseDueDate)}</span>
            </div>
          )}

          {contract.placeOfPerformance && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{contract.placeOfPerformance}</span>
            </div>
          )}

          {contract.awardAmount && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-green-600">{formatCurrency(contract.awardAmount)}</span>
            </div>
          )}
        </div>

        {/* NAICS and Set Aside Info */}
        <div className="flex flex-wrap gap-2 mt-4">
          {contract.naicsCode && (
            <Badge variant="secondary" className="text-xs">
              NAICS: {contract.naicsCode}
            </Badge>
          )}
          {contract.setAsideDescription && (
            <Badge variant="outline" className="text-xs">
              {contract.setAsideDescription}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>{contract.solicitationNumber}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`h-2 w-2 rounded-full ${getStatusColor(contract.status)}`} />
              <span className="capitalize">{contract.status}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Last updated {formatDate(contract.updatedAt)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ContractCard;