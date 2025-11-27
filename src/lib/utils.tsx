import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RouterOutputs } from "./trpc"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { JSX } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Grade = RouterOutputs["class"]["getGrades"]["grades"][number];

/**
 * Calculates the trend of grades using linear regression
 * Returns "up", "down", or "neutral" based on the slope of the regression line
 */
export function calculateTrend(
  grades: Grade[]
): "up" | "down" | "neutral" {
  // Filter grades that have both a grade received and submission date
  const validGrades = grades
    .filter(
      (g) =>
        g.gradeReceived != null &&
        g.submittedAt != null &&
        g.assignment.maxGrade != null &&
        g.assignment.maxGrade > 0
    )
    .map((g) => ({
      date: new Date(g.submittedAt!).getTime(),
      percentage: (g.gradeReceived! / g.assignment.maxGrade!) * 100,
    }))
    .sort((a, b) => a.date - b.date); // Sort by date ascending

  // Need at least 2 data points to calculate a trend
  if (validGrades.length < 2) {
    return "neutral";
  }

  const n = validGrades.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  // Calculate linear regression: y = mx + b
  // where x is the index (0, 1, 2, ...) and y is the percentage
  validGrades.forEach((grade, index) => {
    const x = index;
    const y = grade.percentage;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  // Calculate slope: m = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
  const denominator = n * sumX2 - sumX * sumX;
  
  // Avoid division by zero
  if (Math.abs(denominator) < 1e-10) {
    return "neutral";
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Threshold for determining trend (0.5% per assignment)
  // This means the grade needs to improve/decrease by at least 0.5% per assignment
  const threshold = 0.5;

  if (slope > threshold) {
    return "up";
  } else if (slope < -threshold) {
    return "down";
  } else {
    return "neutral";
  }
}

/**
 * Returns the appropriate trend icon component based on the trend value
 */
export function getTrendIcon(trend: "up" | "down" | "neutral"): JSX.Element {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}
