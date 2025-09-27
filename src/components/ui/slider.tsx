"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  min?: number
  max?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, value = [0], onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value)

    React.useEffect(() => {
      setInternalValue(value)
    }, [value])

    const handleChange = (index: number, newValue: number) => {
      const newInternalValue = [...internalValue]
      newInternalValue[index] = newValue
      setInternalValue(newInternalValue)
      onValueChange?.(newInternalValue)
    }

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        {...props}
      >
        {/* Track */}
        <div className="relative h-2 w-full rounded-full bg-secondary">
          {/* Filled track for range */}
          {internalValue.length === 2 && (
            <div
              className="absolute h-2 rounded-full bg-primary"
              style={{
                left: `${getPercentage(internalValue[0])}%`,
                width: `${getPercentage(internalValue[1]) - getPercentage(internalValue[0])}%`,
              }}
            />
          )}
          {/* Single value track */}
          {internalValue.length === 1 && (
            <div
              className="absolute h-2 rounded-full bg-primary"
              style={{
                width: `${getPercentage(internalValue[0])}%`,
              }}
            />
          )}
        </div>

        {/* Thumbs */}
        {internalValue.map((val, index) => (
          <input
            key={index}
            type="range"
            min={min}
            max={max}
            step={step}
            value={val}
            onChange={(e) => handleChange(index, Number(e.target.value))}
            className="absolute top-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:ring-offset-background [&::-webkit-slider-thumb]:transition-colors focus-visible:[&::-webkit-slider-thumb]:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring focus-visible:[&::-webkit-slider-thumb]:ring-offset-2 disabled:[&::-webkit-slider-thumb]:pointer-events-none disabled:[&::-webkit-slider-thumb]:opacity-50"
            style={{
              background: 'transparent',
              zIndex: internalValue.length - index,
            }}
          />
        ))}
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }