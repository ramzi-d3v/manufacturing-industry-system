"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, ReferenceLine } from "recharts";
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMotionValueEvent, useSpring } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const CHART_MARGIN = 35;

const chartConfig = {
  desktop: {
    label: "Energy (kWh)",
    color: "var(--secondary-foreground)",
  },
};

// Helper to get month-year key
const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const CustomReferenceLabel = (props) => {
  const { viewBox, value } = props;
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;

  const width = React.useMemo(() => {
    const characterWidth = 8;
    const padding = 10;
    return value.toString().length * characterWidth + padding;
  }, [value]);

  return (
    <>
      <rect
        x={x - CHART_MARGIN}
        y={y - 9}
        width={width}
        height={18}
        fill="var(--secondary-foreground)"
        rx={4}
      />
      <text
        fontWeight={600}
        fontSize={11}
        x={x - CHART_MARGIN + 6}
        y={y + 4}
        fill="var(--primary-foreground)"
      >
        {value}
      </text>
    </>
  );
};

export function ValueLineBarChart() {
  const [activeIndex, setActiveIndex] = React.useState(undefined);
  const [chartData, setChartData] = useState([
    { month: "January", desktop: 0 },
    { month: "February", desktop: 0 },
    { month: "March", desktop: 0 },
    { month: "April", desktop: 0 },
    { month: "May", desktop: 0 },
    { month: "June", desktop: 0 },
    { month: "July", desktop: 0 },
    { month: "August", desktop: 0 },
    { month: "September", desktop: 0 },
    { month: "October", desktop: 0 },
    { month: "November", desktop: 0 },
    { month: "December", desktop: 0 },
  ]);

  useEffect(() => {
    const energyRef = collection(db, "energyConsumption");
    const q = query(energyRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Group energy consumption AND costs by month
        const monthlyData = {};
        
        snapshot.docs.forEach((doc) => {
          const energy = doc.data();
          const date = energy.timestamp?.toDate?.() || new Date(energy.timestamp);
          const monthKey = getMonthKey(date);
          const consumption = energy.consumption || 0;
          // Use cost field if available, otherwise calculate from consumption and costPerUnit
          const energyCost = energy.cost || ((consumption) * (energy.costPerUnit || 0));
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { consumption: 0, cost: 0 };
          }
          monthlyData[monthKey].consumption += consumption;
          monthlyData[monthKey].cost += energyCost;
        });

        // Build chart data for all 12 months (consumption for display, cost for tooltip)
        const now = new Date();
        const currentYear = now.getFullYear();
        const newChartData = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];

        for (let i = 0; i < 12; i++) {
          const monthKey = `${currentYear}-${i}`;
          const monthData = monthlyData[monthKey] || { consumption: 0, cost: 0 };
          
          newChartData.push({
            month: monthNames[i],
            desktop: monthData.consumption,
            cost: monthData.cost,
          });
        }

        setChartData(newChartData);
      },
      (err) => {
        console.error("Error fetching energy data:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const maxValueIndex = React.useMemo(() => {
    if (activeIndex !== undefined) {
      return { index: activeIndex, value: chartData[activeIndex].desktop };
    }
    return chartData.reduce(
      (max, data, index) => {
        return data.desktop > max.value ? { index, value: data.desktop } : max;
      },
      { index: 0, value: 0 }
    );
  }, [activeIndex, chartData]);

  const maxValueIndexSpring = useSpring(maxValueIndex.value, {
    stiffness: 100,
    damping: 20,
  });

  const [springyValue, setSpringyValue] = React.useState(maxValueIndex.value);

  useMotionValueEvent(maxValueIndexSpring, "change", (latest) => {
    setSpringyValue(Number(latest.toFixed(0)));
  });

  React.useEffect(() => {
    maxValueIndexSpring.set(maxValueIndex.value);
  }, [maxValueIndex.value, maxValueIndexSpring]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Consumption:</span>
          <span className="text-2xl tracking-tighter">
            {maxValueIndex.value} kWh
          </span>
          <Badge variant="secondary" className="ml-auto">
            <TrendingUp className="h-4 w-4" />
            <span>Energy</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Monthly energy consumption & costs (${
            chartData[maxValueIndex.index]?.cost?.toLocaleString('en-US', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 2 
            }) || '0'
          })
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(undefined)}
              margin={{
                left: CHART_MARGIN,
              }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
                {chartData.map((entry, index) => (
                  <Cell
                    className="duration-200 transition-opacity cursor-pointer"
                    opacity={index === maxValueIndex.index ? 1 : 0.2}
                    key={entry.month} // Stable key using month name
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
              <ReferenceLine
                opacity={0.4}
                y={springyValue}
                stroke="var(--secondary-foreground)"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={<CustomReferenceLabel value={maxValueIndex.value} />}
              />
            </BarChart>
          </ChartContainer>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}