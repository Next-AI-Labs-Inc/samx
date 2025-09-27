'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { DollarSign, RotateCcw } from 'lucide-react';

interface DollarAmountFilterProps {
  minValue?: number;
  maxValue?: number;
  value: [number, number];
  enabled?: boolean;
  onValueChange: (value: [number, number]) => void;
  onEnabledChange?: (enabled: boolean) => void;
  className?: string;
}

const DollarAmountFilter: React.FC<DollarAmountFilterProps> = ({
  minValue = 0,
  maxValue = 100000000, // Default max: $100M
  value,
  enabled = false,
  onValueChange,
  onEnabledChange,
  className = ""
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [minInput, setMinInput] = useState(value[0].toString());
  const [maxInput, setMaxInput] = useState(value[1].toString());

  useEffect(() => {
    setLocalValue(value);
    setMinInput(formatInputValue(value[0]));
    setMaxInput(formatInputValue(value[1]));
  }, [value]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatInputValue = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const parseInputValue = (input: string): number => {
    const cleanInput = input.replace(/[^0-9.kmKM]/g, '');
    const value = parseFloat(cleanInput);
    
    if (isNaN(value)) return 0;
    
    if (input.toLowerCase().includes('m')) {
      return value * 1000000;
    } else if (input.toLowerCase().includes('k')) {
      return value * 1000;
    }
    
    return value;
  };

  const handleSliderChange = (newValue: number[]) => {
    if (!enabled) return;
    
    const clampedValue: [number, number] = [
      Math.max(minValue, Math.min(maxValue, newValue[0])),
      Math.max(minValue, Math.min(maxValue, newValue[1]))
    ];
    
    // Ensure min <= max
    if (clampedValue[0] > clampedValue[1]) {
      clampedValue[1] = clampedValue[0];
    }
    
    setLocalValue(clampedValue);
    onValueChange(clampedValue);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinInput(inputValue);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxInput(inputValue);
  };

  const handleMinInputBlur = () => {
    const parsedValue = parseInputValue(minInput);
    const clampedValue = Math.max(minValue, Math.min(localValue[1], parsedValue));
    const newValue: [number, number] = [clampedValue, localValue[1]];
    
    setLocalValue(newValue);
    setMinInput(formatInputValue(clampedValue));
    onValueChange(newValue);
  };

  const handleMaxInputBlur = () => {
    const parsedValue = parseInputValue(maxInput);
    const clampedValue = Math.min(maxValue, Math.max(localValue[0], parsedValue));
    const newValue: [number, number] = [localValue[0], clampedValue];
    
    setLocalValue(newValue);
    setMaxInput(formatInputValue(clampedValue));
    onValueChange(newValue);
  };

  const handleReset = () => {
    const resetValue: [number, number] = [minValue, maxValue];
    setLocalValue(resetValue);
    onValueChange(resetValue);
  };

  const isFiltered = localValue[0] > minValue || localValue[1] < maxValue;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Award Amount</span>
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              className="ml-2"
            />
          </div>
          {enabled && isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${!enabled ? 'opacity-50' : ''}`}>
        {!enabled && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              Enable filter to set award amount range
            </div>
          </div>
        )}
        
        {enabled && (
          <>
            {/* Range Display */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {formatCurrency(localValue[0])} - {formatCurrency(localValue[1])}
              </div>
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                min={minValue}
                max={maxValue}
                step={10000} // $10K steps
                value={localValue}
                onValueChange={handleSliderChange}
                className="w-full"
              />
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Minimum</label>
                <Input
                  type="text"
                  value={minInput}
                  onChange={handleMinInputChange}
                  onBlur={handleMinInputBlur}
                  placeholder="0K"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Maximum</label>
                <Input
                  type="text"
                  value={maxInput}
                  onChange={handleMaxInputChange}
                  onBlur={handleMaxInputBlur}
                  placeholder="100M"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Helper Text */}
            <div className="text-xs text-muted-foreground">
              Use 'K' for thousands, 'M' for millions (e.g., 1.5M = $1,500,000)
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DollarAmountFilter;