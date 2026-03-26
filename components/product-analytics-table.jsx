"use client";

import * as React from "react";
import {
  IconPackage,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Helper function to get margin badge color and label
const getMarginBadge = (margin) => {
  if (margin > 30) {
    return { 
      color: "text-green-600", 
      bg: "bg-green-500/10", 
      label: "Excellent",
      icon: IconTrendingUp 
    };
  }
  if (margin > 15) {
    return { 
      color: "text-blue-600", 
      bg: "bg-blue-500/10", 
      label: "Good",
      icon: IconTrendingUp 
    };
  }
  if (margin > 5) {
    return { 
      color: "text-yellow-600", 
      bg: "bg-yellow-500/10", 
      label: "Fair",
      icon: IconTrendingUp 
    };
  }
  if (margin > 0) {
    return { 
      color: "text-orange-600", 
      bg: "bg-orange-500/10", 
      label: "Low",
      icon: IconTrendingDown 
    };
  }
  return { 
    color: "text-red-600", 
    bg: "bg-red-500/10", 
    label: "Loss",
    icon: IconTrendingDown 
  };
};

// Helper function to get trend for footer metrics
const getTrend = (current, previous) => {
  if (current > previous) return { icon: IconArrowUp, color: "text-green-500", label: "Up" };
  if (current < previous) return { icon: IconArrowDown, color: "text-red-500", label: "Down" };
  return { icon: IconMinus, color: "text-gray-500", label: "Stable" };
};

// Helper function to format currency
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0.00";
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper function to format number
const formatNumber = (value) => {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString();
};

// Main Table Component - Make sure this is exported
export function ProductAnalyticsTable({ data, previousData = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
        <IconPackage className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm mt-1">Try adjusting your filters or add some products to get started</p>
      </div>
    );
  }

  // Calculate totals for the summary
  const totals = data.reduce(
    (acc, product) => {
      acc.totalProducts++;
      acc.totalProfit += product.totalProfit || 0;
      acc.totalValue += (product.sellingPrice || 0) * (product.quantity || 0);
      acc.totalMargin += product.margin || 0;
      return acc;
    },
    { totalProducts: 0, totalProfit: 0, totalValue: 0, totalMargin: 0 }
  );

  // Calculate previous totals (for trend comparison)
  const previousTotals = previousData.reduce(
    (acc, product) => {
      acc.totalProducts++;
      acc.totalProfit += product.totalProfit || 0;
      acc.totalValue += (product.sellingPrice || 0) * (product.quantity || 0);
      acc.totalMargin += product.margin || 0;
      return acc;
    },
    { totalProducts: 0, totalProfit: 0, totalValue: 0, totalMargin: 0 }
  );

  const averageMargin = totals.totalMargin / data.length;
  const previousAverageMargin = previousTotals.totalMargin / (previousTotals.totalProducts || 1);

  // Get trends for each metric
  const profitTrend = getTrend(totals.totalProfit, previousTotals.totalProfit);
  const valueTrend = getTrend(totals.totalValue, previousTotals.totalValue);
  const marginTrend = getTrend(averageMargin, previousAverageMargin);
  const productTrend = getTrend(totals.totalProducts, previousTotals.totalProducts);
  
  const ProfitTrendIcon = profitTrend.icon;
  const ValueTrendIcon = valueTrend.icon;
  const MarginTrendIcon = marginTrend.icon;
  const ProductTrendIcon = productTrend.icon;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-background/40 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-background/60 backdrop-blur-sm sticky top-0">
            <TableRow className="border-b border-border/50">
              <TableHead className="font-semibold text-sm py-3">Product</TableHead>
              <TableHead className="font-semibold text-sm py-3">Category</TableHead>
              <TableHead className="font-semibold text-sm py-3">Grade</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Stock</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Cost</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Price</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Profit/Unit</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Total Profit</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Margin</TableHead>
              <TableHead className="text-right font-semibold text-sm py-3">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => {
              const marginBadge = getMarginBadge(product.margin);
              const MarginIcon = marginBadge.icon;
              const profitPerUnit = (product.sellingPrice || 0) - (product.costPrice || 0);
              const totalProfit = profitPerUnit * (product.quantity || 0);
              const totalValue = (product.sellingPrice || 0) * (product.quantity || 0);
              
              // Get quality grade styling
              const getGradeBadge = (grade) => {
                if (!grade) return { color: "text-gray-500", bg: "bg-gray-500/10", label: "Not Set" };
                switch (grade.toLowerCase()) {
                  case "premium":
                    return { color: "text-purple-600", bg: "bg-purple-500/10", label: "Premium" };
                  case "flagship":
                    return { color: "text-amber-600", bg: "bg-amber-500/10", label: "Flagship" };
                  case "standard":
                    return { color: "text-blue-600", bg: "bg-blue-500/10", label: "Standard" };
                  case "economy":
                    return { color: "text-green-600", bg: "bg-green-500/10", label: "Economy" };
                  default:
                    return { color: "text-gray-500", bg: "bg-gray-500/10", label: grade };
                }
              };
              
              const gradeBadge = getGradeBadge(product.qualityGrade);
              
              return (
                <TableRow key={product.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="py-3">
                    <div>
                      <div className="font-medium text-foreground">{product.name || "Unnamed Product"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {product.sku ? `SKU: ${product.sku}` : product.batchNumber ? `Batch: ${product.batchNumber}` : "No ID"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {product.category || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={cn("text-xs font-normal", gradeBadge.bg, gradeBadge.color)}>
                      {gradeBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className="font-medium">
                      {formatNumber(product.quantity)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {product.unit || "pcs"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3 text-muted-foreground">
                    {formatCurrency(product.costPrice)}
                  </TableCell>
                  <TableCell className="text-right py-3 font-medium">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={profitPerUnit > 0 ? "text-green-600" : profitPerUnit < 0 ? "text-red-600" : "text-muted-foreground"}>
                      {formatCurrency(profitPerUnit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={totalProfit > 0 ? "text-green-600 font-semibold" : totalProfit < 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                      {formatCurrency(totalProfit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Badge className={cn("text-xs font-normal gap-1", marginBadge.bg, marginBadge.color)}>
                      <MarginIcon className="h-3 w-3" />
                      {marginBadge.label}
                      <span className="text-[10px] opacity-75">({product.margin?.toFixed(1) || 0}%)</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 font-medium">
                    {formatCurrency(totalValue)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Summary Footer with Trends */}
      <div className="px-4 py-4 border-t border-border/50 bg-background/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Products */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Products
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{formatNumber(totals.totalProducts)}</p>
              <div className={cn("flex items-center gap-0.5 text-xs", productTrend.color)}>
                <ProductTrendIcon className="h-3.5 w-3.5" />
                <span>{productTrend.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active products in inventory
            </p>
          </div>

          {/* Total Profit */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Profit
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn("text-2xl font-bold", totals.totalProfit > 0 ? "text-green-600" : totals.totalProfit < 0 ? "text-red-600" : "")}>
                {formatCurrency(totals.totalProfit)}
              </p>
              <div className={cn("flex items-center gap-0.5 text-xs", profitTrend.color)}>
                <ProfitTrendIcon className="h-3.5 w-3.5" />
                <span>{profitTrend.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total earnings after costs
            </p>
          </div>

          {/* Average Margin */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Average Margin
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{averageMargin.toFixed(1)}%</p>
              <div className={cn("flex items-center gap-0.5 text-xs", marginTrend.color)}>
                <MarginTrendIcon className="h-3.5 w-3.5" />
                <span>{marginTrend.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Average profit margin across all products
            </p>
          </div>

          {/* Total Value */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Value
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{formatCurrency(totals.totalValue)}</p>
              <div className={cn("flex items-center gap-0.5 text-xs", valueTrend.color)}>
                <ValueTrendIcon className="h-3.5 w-3.5" />
                <span>{valueTrend.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total inventory value at selling price
            </p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <IconTrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground">High Profit</span>
                <Badge className="bg-green-500/10 text-green-600 text-[10px] px-1.5">
                  {data.filter(p => p.margin > 30).length} products
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <IconTrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Low/Loss</span>
                <Badge className="bg-red-500/10 text-red-600 text-[10px] px-1.5">
                  {data.filter(p => p.margin <= 5).length} products
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <IconMinus className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-muted-foreground">Fair</span>
                <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px] px-1.5">
                  {data.filter(p => p.margin > 5 && p.margin <= 15).length} products
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}