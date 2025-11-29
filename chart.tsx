'use client'

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

type ChartContainerProps = React.ComponentProps<"div">

const ChartContainer = ({ className, ...props }: ChartContainerProps) => (
  <div
    className={cn("flex items-center justify-center [&>div]:h-full [&>div]:w-full", className)}
    {...props}
  />
)

const Chart = RechartsPrimitive.ResponsiveContainer

const ChartLegend = RechartsPrimitive.Legend

const ChartTooltip = RechartsPrimitive.Tooltip

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: any[]
  label?: string
  indicator?: "dot" | "line" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  labelClassName?: string
  labelFormatter?: (label: string) => React.ReactNode
  formatter?: (value: any, name: any, item: any, index: number) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      ...props
    },
    ref
  ) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const renderLabel = () => {
      if (hideLabel || !label) {
        return null
      }

      if (labelFormatter) {
        return labelFormatter(label)
      }

      return (
        <div className={cn("font-medium", labelClassName)}>{label}</div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200 border-slate-200/50 bg-white px-2.5 py-1.5 text-xs shadow-xl dark:border-slate-800 dark:border-slate-800/50 dark:bg-slate-950",
          className
        )}
        {...props}
      >
        {renderLabel()}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const name = formatter && item.name ? formatter(item.value, item.name, item, index) : item.name

            if (hideIndicator) {
              return (
                <div key={item.dataKey} className="grid grid-cols-2 gap-x-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {name}
                    </div>
                  </div>
                  <div className="text-right font-medium">{item.value}</div>
                </div>
              )
            }
            
            if (indicator === "line") {
              return (
                <div key={item.dataKey} className="grid grid-cols-2 gap-x-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-px w-3"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {name}
                    </div>
                  </div>
                  <div className="text-right font-medium">{item.value}</div>
                </div>
              )
            }

            if (indicator === "dashed") {
              return (
                <div key={item.dataKey} className="grid grid-cols-2 gap-x-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-px w-3 border-t-2 border-dashed"
                      style={{
                        borderColor: item.color,
                      }}
                    />
                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {name}
                    </div>
                  </div>
                  <div className="text-right font-medium">{item.value}</div>
                </div>
              )
            }

            return (
              <div key={item.dataKey} className="grid grid-cols-2 gap-x-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {name}
                  </div>
                </div>
                <div className="text-right font-medium">{item.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  Chart,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
}
