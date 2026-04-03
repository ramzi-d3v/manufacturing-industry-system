"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import React from "react";
import { AnimatePresence, motion } from "framer-motion"; // Changed to framer-motion for standard compatibility
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

const chartData = [
  { month: "Jan", desktop: 342 },
  { month: "Feb", desktop: 876 },
  { month: "Mar", desktop: 512 },
  { month: "Apr", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "Jun", desktop: 781 },
  { month: "Jul", desktop: 394 },
  { month: "Aug", desktop: 925 },
  { month: "Sep", desktop: 647 },
  { month: "Oct", desktop: 532 },
  { month: "Nov", desktop: 803 },
  { month: "Dec", desktop: 271 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--secondary-foreground)",
  },
};

const CustomBar = (props) => {
  const { fill, x, y, width, height, index, activeIndex, value } = props;

  const xPos = Number(x || 0);
  const realWidth = Number(width || 0);
  const isActive = index === activeIndex;
  const collapsedWidth = 2;
  
  // centered bar x-position
  const barX = isActive ? xPos : xPos + (realWidth - collapsedWidth) / 2;
  // centered text x-position
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

  const activeData = React.useMemo(() => {
    if (activeIndex === undefined) return null;
    return chartData[activeIndex];
  }, [activeIndex]);

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