"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Maximize2 } from "lucide-react"

const departmentSpending = [
  { department: "Education", amount: 387.5, percentage: 28.9 },
  { department: "Public Safety", amount: 245.2, percentage: 18.3 },
  { department: "Healthcare", amount: 210.4, percentage: 15.7 },
  { department: "Infrastructure", amount: 156.8, percentage: 11.7 },
  { department: "Social Services", amount: 134.0, percentage: 10.0 },
  { department: "Administration", amount: 89.3, percentage: 6.7 },
  { department: "Parks & Recreation", amount: 67.2, percentage: 5.0 },
  { department: "Other", amount: 53.6, percentage: 4.0 },
]

const publicSafetyBreakdown = [
  { category: "Police Department", amount: 156.8, color: "#1e3a8a" },
  { category: "Fire Department", amount: 52.4, color: "#3b82f6" },
  { category: "Emergency Services", amount: 21.7, color: "#60a5fa" },
  { category: "Courts & Legal", amount: 14.3, color: "#93c5fd" },
]

const budgetTrend = [
  { year: "2021", total: 1180, education: 320, publicSafety: 210 },
  { year: "2022", total: 1220, education: 340, publicSafety: 225 },
  { year: "2023", total: 1280, education: 365, publicSafety: 235 },
  { year: "2024", total: 1310, education: 375, publicSafety: 240 },
  { year: "2025", total: 1340, education: 387.5, publicSafety: 245.2 },
]

const COLORS = ["#1e3a8a", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff", "#f8fafc"]

export function DepartmentSpendingChart() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Department Spending Breakdown</CardTitle>
          <CardDescription>Milwaukee County 2025 Budget by Department</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentSpending} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} fontSize={12} />
            <YAxis tickFormatter={(value) => `$${value}M`} fontSize={12} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(1)}M`, "Amount"]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="amount" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function PublicSafetyPieChart() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Public Safety Breakdown</CardTitle>
          <CardDescription>$245.2M Total Public Safety Spending</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width="60%" height={250}>
            <PieChart>
              <Pie
                data={publicSafetyBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
                label={({ percentage }) => `${(percentage * 100).toFixed(1)}%`}
              >
                {publicSafetyBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(1)}M`, "Amount"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-3">
            {publicSafetyBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-muted-foreground">${item.amount}M</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetTrendChart() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">5-Year Budget Trend</CardTitle>
          <CardDescription>Total Budget and Major Categories (in millions)</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={budgetTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis tickFormatter={(value) => `$${value}M`} fontSize={12} />
            <Tooltip
              formatter={(value: number, name: string) => {
                const labels: { [key: string]: string } = {
                  total: "Total Budget",
                  education: "Education",
                  publicSafety: "Public Safety",
                }
                return [`$${value}M`, labels[name] || name]
              }}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{ fill: "#1e3a8a", strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="education"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="publicSafety"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: "#60a5fa", strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1e3a8a]" />
            <span className="text-sm">Total Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-sm">Education</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#60a5fa]" />
            <span className="text-sm">Public Safety</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetDataTable() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Detailed Budget Data</CardTitle>
          <CardDescription>Department spending with year-over-year comparison</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Department</th>
                <th className="text-right py-2 font-medium">2025 Budget</th>
                <th className="text-right py-2 font-medium">2024 Budget</th>
                <th className="text-right py-2 font-medium">Change</th>
                <th className="text-right py-2 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {departmentSpending.map((dept, index) => {
                const prevAmount = dept.amount * 0.95 // Simulated previous year
                const change = dept.amount - prevAmount
                const changePercent = (change / prevAmount) * 100

                return (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{dept.department}</td>
                    <td className="text-right py-3">${dept.amount.toFixed(1)}M</td>
                    <td className="text-right py-3">${prevAmount.toFixed(1)}M</td>
                    <td className={`text-right py-3 ${change > 0 ? "text-green-600" : "text-red-600"}`}>
                      {change > 0 ? "+" : ""}${change.toFixed(1)}M ({changePercent.toFixed(1)}%)
                    </td>
                    <td className="text-right py-3">{dept.percentage}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
