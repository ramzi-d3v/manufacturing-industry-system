"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const chartConfig = {
  desktop: {
    label: "Production",
    color: "var(--secondary-foreground)",
  },
};

// Helper to get month name
const getMonthName = (date) => {
  return new Date(date).toLocaleDateString("en-US", { month: "short" });
};

// Helper to get month-year key
const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const CustomBar = (props) => {
  const { fill, x, y, width, height, index, activeIndex, value } = props;

  const xPos = Number(x || 0);
  const realWidth = Number(width || 0);
  const isActive = index === activeIndex;
  const collapsedWidth = 2;
  
  const barX = isActive ? xPos : xPos + (realWidth - collapsedWidth) / 2;
  const textX = xPos + realWidth / 2;

  return (
    <g onMouseEnter={() => props.setActiveIndex(index)}>
      <motion.rect
        style={{
          willChange: "transform, width",
        }}
        y={y}
        initial={{ width: collapsedWidth, x: barX }}
        animate={{ width: isActive ? realWidth : collapsedWidth, x: barX }}
        transition={{
          duration: activeIndex === index ? 0.5 : 1,
          type: "spring",
        }}
        height={height}
        fill={fill}
      />
      {isActive && (
        <motion.text
          style={{
            willChange: "transform, opacity",
          }}
          key={index}
          initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
          transition={{ duration: 0.1 }}
          x={textX}
          y={Number(y) - 5}
          textAnchor="middle"
          fill={fill}
          fontSize={12}
        >
          {value}
        </motion.text>
      )}
    </g>
  );
};

export function MonochromeBarChart() {
  const [activeIndex, setActiveIndex] = React.useState(undefined);
  const [chartData, setChartData] = useState([
    { month: "Jan", desktop: 0 },
    { month: "Feb", desktop: 0 },
    { month: "Mar", desktop: 0 },
    { month: "Apr", desktop: 0 },
    { month: "May", desktop: 0 },
    { month: "Jun", desktop: 0 },
    { month: "Jul", desktop: 0 },
    { month: "Aug", desktop: 0 },
    { month: "Sep", desktop: 0 },
    { month: "Oct", desktop: 0 },
    { month: "Nov", desktop: 0 },
    { month: "Dec", desktop: 0 },
  ]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const productsRef = collection(db, "finishedProducts", user.uid, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Group production by month
        const monthlyData = {};
        
        snapshot.docs.forEach((doc) => {
          const product = doc.data();
          const date = product.createdAt?.toDate?.() || new Date(product.createdAt);
          const monthKey = getMonthKey(date);
          const quantity = product.quantity || 0;
          
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + quantity;
        });

        // Build chart data for all 12 months
        const now = new Date();
        const currentYear = now.getFullYear();
        const newChartData = [];

        for (let i = 0; i < 12; i++) {
          const date = new Date(currentYear, i, 1);
          const monthKey = getMonthKey(date);
          const monthName = date.toLocaleDateString("en-US", { month: "short" });
          
          newChartData.push({
            month: monthName,
            desktop: monthlyData[monthKey] || 0,
          });
        }

        setChartData(newChartData);
      },
      (err) => {
        console.error("Error fetching production data:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const activeData = React.useMemo(() => {
    if (activeIndex === undefined) return null;
    return chartData[activeIndex];
  }, [activeIndex, chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl tracking-tighter">
            ${activeData ? activeData.desktop : "123"}
          </span>
          <Badge variant="secondary">
            <TrendingUp className="h-4 w-4" />
            <span>5.2%</span>
          </Badge>
        </CardTitle>
        <CardDescription>vs. last quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Bar
                dataKey="desktop"
                fill="var(--secondary-foreground)"
                shape={
                  <CustomBar
                    setActiveIndex={setActiveIndex}
                    activeIndex={activeIndex}
                  />
                }
              />
            </BarChart>
          </ChartContainer>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}