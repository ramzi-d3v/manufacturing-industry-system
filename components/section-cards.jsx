"use client";

import { useState, useEffect } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useFinancials } from "@/hooks/use-financials";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function SectionCards() {
  const { loading, financials } = useFinancials();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(financials.revenue),
      trend: financials.revenue > 0 ? "up" : "neutral",
      description: `${financials.productsManufactured} units sold`,
      status: financials.revenue > 0 ? "Revenue flowing in" : "No sales yet",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(financials.expenses),
      trend: "neutral",
      description: `Materials: ${formatCurrency(financials.rawMaterialCost)} | Energy: ${formatCurrency(financials.energyCost)}`,
      status: financials.expenses > 0 ? "Operational costs" : "No expenses yet",
    },
    {
      title: "Net Profit",
      value: formatCurrency(financials.profit),
      trend: financials.profit > 0 ? "up" : financials.profit < 0 ? "down" : "neutral",
      description: `${financials.profitMargin.toFixed(1)}% margin`,
      status: financials.profit > 0 ? "Profitable" : financials.profit < 0 ? "Operating at loss" : "Break even",
    },
    {
      title: "Profit Margin",
      value: `${financials.profitMargin.toFixed(1)}%`,
      trend: financials.profitMargin > 20 ? "up" : "down",
      description: `Profit per revenue`,
      status: financials.profitMargin > 30 ? "Excellent margin" : financials.profitMargin > 10 ? "Good margin" : "Monitor costs",
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="@container/card">
          <CardHeader>
            <CardDescription className="text-xs">{stat.title}</CardDescription>
            <CardTitle className="text-2xl tabular-nums @[250px]/card:text-xl">
              {loading ? "..." : stat.value}
            </CardTitle>
            <CardAction>
              <Badge 
                variant="outline" 
                className={`text-xs px-1 ${
                  stat.trend === "up" ? "text-green-500" : 
                  stat.trend === "down" ? "text-red-500" : 
                  "text-gray-500"
                }`}
              >
                {stat.trend === "up" && <IconTrendingUp className="size-3 mr-1" />}
                {stat.trend === "down" && <IconTrendingDown className="size-3 mr-1" />}
                {stat.status}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start mt-3 text-xs">
            <div className="line-clamp-1 flex gap-1 font-medium">
              {stat.description}
            </div>
            <div className="text-muted-foreground italic">
              {loading ? "Loading..." : "Updated in real-time"}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
