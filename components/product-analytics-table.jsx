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
  IconBuildingStore,
  IconCategory,
  IconPercentage,
  IconChartPie,
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
  if (current > previous) return { icon: IconArrowUp, color: "text-green-500", label: "Up", percentage: ((current - previous) / previous * 100).toFixed(0) };
  if (current < previous) return { icon: IconArrowDown, color: "text-red-500", label: "Down", percentage: ((previous - current) / previous * 100).toFixed(0) };
  return { icon: IconMinus, color: "text-gray-500", label: "Stable", percentage: "0" };
};

// Helper function to format currency
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Helper function to format number
const formatNumber = (value) => {
  if (value === undefined || value === null) return "0";
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

// Main Table Component
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
      acc.totalCost += (product.costPrice || 0) * (product.quantity || 0);
      acc.totalMargin += product.margin || 0;
      acc.totalQuantity += product.quantity || 0;
      return acc;
    },
    { totalProducts: 0, totalProfit: 0, totalValue: 0, totalCost: 0, totalMargin: 0, totalQuantity: 0 }
  );

  // Calculate margin distribution counts
  const marginDistribution = {
    excellent: data.filter(p => p.margin > 30).length,
    good: data.filter(p => p.margin > 15 && p.margin <= 30).length,
    fair: data.filter(p => p.margin > 5 && p.margin <= 15).length,
    low: data.filter(p => p.margin > 0 && p.margin <= 5).length,
    loss: data.filter(p => p.margin <= 0).length,
  };

  // Calculate category distribution
  const categoryCount = new Set(data.map(p => p.category).filter(Boolean)).size;
  const topCategory = data.reduce((acc, p) => {
    if (p.category) {
      acc[p.category] = (acc[p.category] || 0) + (p.totalProfit || 0);
    }
    return acc;
  }, {});
  const bestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Calculate best product
  const bestProduct = data.reduce((best, current) => {
    return (current.totalProfit || 0) > (best.totalProfit || 0) ? current : best;
  }, { totalProfit: 0 });

  // Calculate previous totals (for trend comparison)
  const previousTotals = previousData.reduce(
    (acc, product) => {
      acc.totalProducts++;
      acc.totalProfit += product.totalProfit || 0;
      acc.totalValue += (product.sellingPrice || 0) * (product.quantity || 0);
      acc.totalMargin += product.margin || 0;
      acc.totalQuantity += product.quantity || 0;
      return acc;
    },
    { totalProducts: 0, totalProfit: 0, totalValue: 0, totalMargin: 0, totalQuantity: 0 }
  );

  const averageMargin = totals.totalMargin / data.length;
  const previousAverageMargin = previousTotals.totalMargin / (previousTotals.totalProducts || 1);
  const averageValuePerProduct = totals.totalValue / data.length;

  // Get trends for each metric
  const productTrend = getTrend(totals.totalProducts, previousTotals.totalProducts);
  const profitTrend = getTrend(totals.totalProfit, previousTotals.totalProfit);
  const valueTrend = getTrend(totals.totalValue, previousTotals.totalValue);
  const marginTrend = getTrend(averageMargin, previousAverageMargin);
  const quantityTrend = getTrend(totals.totalQuantity, previousTotals.totalQuantity);
  
  const ProductTrendIcon = productTrend.icon;
  const ProfitTrendIcon = profitTrend.icon;
  const ValueTrendIcon = valueTrend.icon;
  const MarginTrendIcon = marginTrend.icon;
  const QuantityTrendIcon = quantityTrend.icon;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-background/40 backdrop-blur-sm">
      {/* Enhanced Summary Header */}
      <div className="p-4 border-b border-border/50 bg-background/30">
        {/* Main Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {/* Total Products */}
          <div className="flex flex-col p-2 bg-background/20 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <IconPackage className="h-3.5 w-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Total Products</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatNumber(totals.totalProducts)}</p>
              <div className={cn("flex items-center gap-0.5 text-xs", productTrend.color)}>
                <ProductTrendIcon className="h-3 w-3" />
                <span>{productTrend.label}</span>
                {productTrend.percentage !== "0" && (
                  <span className="text-[10px]">({productTrend.percentage}%)</span>
                )}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              Across {categoryCount} categories
            </p>
          </div>

          {/* Total Profit */}
          <div className="flex flex-col p-2 bg-background/20 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <IconCurrencyDollar className="h-3.5 w-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Total Profit</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-2xl font-bold", totals.totalProfit > 0 ? "text-green-600" : totals.totalProfit < 0 ? "text-red-600" : "")}>
                {formatCurrency(totals.totalProfit)}
              </p>
              <div className={cn("flex items-center gap-0.5 text-xs", profitTrend.color)}>
                <ProfitTrendIcon className="h-3 w-3" />
                <span>{profitTrend.label}</span>
                {profitTrend.percentage !== "0" && (
                  <span className="text-[10px]">({profitTrend.percentage}%)</span>
                )}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              Margin: {averageMargin.toFixed(1)}%
            </p>
          </div>

          {/* Total Value */}
          <div className="flex flex-col p-2 bg-background/20 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <IconChartBar className="h-3.5 w-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Inventory Value</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatCurrency(totals.totalValue)}</p>
              <div className={cn("flex items-center gap-0.5 text-xs", valueTrend.color)}>
                <ValueTrendIcon className="h-3 w-3" />
                <span>{valueTrend.label}</span>
                {valueTrend.percentage !== "0" && (
                  <span className="text-[10px]">({valueTrend.percentage}%)</span>
                )}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              Cost: {formatCurrency(totals.totalCost)}
            </p>
          </div>

          {/* Total Quantity */}
          <div className="flex flex-col p-2 bg-background/20 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <IconPackage className="h-3.5 w-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Total Stock</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatNumber(totals.totalQuantity)} units</p>
              <div className={cn("flex items-center gap-0.5 text-xs", quantityTrend.color)}>
                <QuantityTrendIcon className="h-3 w-3" />
                <span>{quantityTrend.label}</span>
                {quantityTrend.percentage !== "0" && (
                  <span className="text-[10px]">({quantityTrend.percentage}%)</span>
                )}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              Avg value/product: {formatCurrency(averageValuePerProduct)}
            </p>
          </div>

          {/* Average Margin */}
          <div className="flex flex-col p-2 bg-background/20 rounded-lg">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <IconPercentage className="h-3.5 w-3.5" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Avg Margin</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{averageMargin.toFixed(1)}%</p>
              <div className={cn("flex items-center gap-0.5 text-xs", marginTrend.color)}>
                <MarginTrendIcon className="h-3 w-3" />
                <span>{marginTrend.label}</span>
                {marginTrend.percentage !== "0" && (
                  <span className="text-[10px]">({marginTrend.percentage}%)</span>
                )}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              {averageMargin > 30 ? "Excellent" : averageMargin > 15 ? "Good" : averageMargin > 5 ? "Fair" : "Needs improvement"}
            </p>
          </div>
        </div>

        {/* Performance Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/30">
          {/* Left side - Margin Distribution */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <IconChartPie className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Margin Health Distribution</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-500/10 text-green-600 text-[10px] px-2 py-0.5 gap-1">
                <IconTrendingUp className="h-2.5 w-2.5" />
                Excellent: {marginDistribution.excellent}
                <span className="text-[8px] opacity-70">(&gt;30%)</span>
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-600 text-[10px] px-2 py-0.5 gap-1">
                Good: {marginDistribution.good}
                <span className="text-[8px] opacity-70">(15-30%)</span>
              </Badge>
              <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px] px-2 py-0.5 gap-1">
                Fair: {marginDistribution.fair}
                <span className="text-[8px] opacity-70">(5-15%)</span>
              </Badge>
              <Badge className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-0.5 gap-1">
                Low: {marginDistribution.low}
                <span className="text-[8px] opacity-70">(0-5%)</span>
              </Badge>
              <Badge className="bg-red-500/10 text-red-600 text-[10px] px-2 py-0.5 gap-1">
                <IconTrendingDown className="h-2.5 w-2.5" />
                Loss: {marginDistribution.loss}
                <span className="text-[8px] opacity-70">(&lt;0%)</span>
              </Badge>
            </div>
          </div>

          {/* Right side - Top Performers */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <IconStar className="h-3 w-3 text-yellow-500" />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top Performers</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <IconCategory className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Best Category:</span>
                <span className="text-[10px] font-semibold">{bestCategory}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconPackage className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Top Product:</span>
                <span className="text-[10px] font-semibold truncate max-w-[150px]">{bestProduct.name || "None"}</span>
                <span className="text-[9px] text-green-600">({formatCurrency(bestProduct.totalProfit)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last updated timestamp */}
        <div className="flex justify-end mt-2 pt-1 border-t border-border/30">
          <div className="text-[9px] text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader className="bg-background/60 backdrop-blur-sm sticky top-0">
              <TableRow className="border-b border-border/50">
                <TableHead className="font-semibold text-xs py-2.5">Product</TableHead>
                <TableHead className="font-semibold text-xs py-2.5">Category</TableHead>
                <TableHead className="font-semibold text-xs py-2.5">Grade</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Stock</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Cost</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Price</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Profit/Unit</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Total Profit</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Margin</TableHead>
                <TableHead className="text-right font-semibold text-xs py-2.5">Total Value</TableHead>
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
                    <TableCell className="py-2.5">
                      <div>
                        <div className="font-medium text-sm text-foreground">{product.name || "Unnamed Product"}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {product.sku ? `SKU: ${product.sku}` : product.batchNumber ? `Batch: ${product.batchNumber}` : "No ID"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0.5">
                        {product.category || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge className={cn("text-[10px] font-normal px-1.5 py-0.5", gradeBadge.bg, gradeBadge.color)}>
                        {gradeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <span className="font-medium text-sm">
                        {formatNumber(product.quantity)}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {product.unit || "pcs"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5 text-muted-foreground text-sm">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-medium text-sm">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <span className={cn("text-sm", profitPerUnit > 0 ? "text-green-600" : profitPerUnit < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {formatCurrency(profitPerUnit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <span className={cn("text-sm font-semibold", totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {formatCurrency(totalProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <Badge className={cn("text-[10px] font-normal gap-1 px-1.5 py-0.5", marginBadge.bg, marginBadge.color)}>
                        <MarginIcon className="h-2.5 w-2.5" />
                        {marginBadge.label}
                        <span className="text-[9px] opacity-75">({product.margin?.toFixed(1) || 0}%)</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5 font-medium text-sm">
                      {formatCurrency(totalValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Missing IconStar component
function IconStar(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}