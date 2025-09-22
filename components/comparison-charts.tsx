"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Document = {
  id: string
  title: string
  jurisdiction: "City" | "County" | "State" | "Federal"
  year: number
  totalBudget: number
  departments: {
    education: number
    publicSafety: number
    healthcare: number
    infrastructure: number
    socialServices: number
    administration: number
  }
}

type ComparisonChartsProps = {
  documents: Document[]
  compareBy: "department" | "function" | "revenue"
  showDifferencesOnly: boolean
}

const COLORS = ["#1e3a8a", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]

export function ComparisonCharts({ documents, compareBy, showDifferencesOnly }: ComparisonChartsProps) {
  const formatBudget = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}B`
    }
    return `$${amount.toFixed(1)}M`
  }

  const getJurisdictionColor = (jurisdiction: string) => {
    switch (jurisdiction) {
      case "County":
        return "bg-blue-100 text-blue-800"
      case "State":
        return "bg-green-100 text-green-800"
      case "City":
        return "bg-purple-100 text-purple-800"
      case "Federal":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Prepare data for side-by-side comparison
  const comparisonData = Object.keys(documents[0].departments).map((dept) => {
    const dataPoint: any = { department: dept.charAt(0).toUpperCase() + dept.slice(1) }
    documents.forEach((doc) => {
      dataPoint[doc.title] = doc.departments[dept as keyof typeof doc.departments]
    })
    return dataPoint
  })

  // Prepare data for percentage comparison
  const percentageData = Object.keys(documents[0].departments).map((dept) => {
    const dataPoint: any = { department: dept.charAt(0).toUpperCase() + dept.slice(1) }
    documents.forEach((doc) => {
      const percentage = (doc.departments[dept as keyof typeof doc.departments] / doc.totalBudget) * 100
      dataPoint[doc.title] = percentage
    })
    return dataPoint
  })

  // Calculate differences between first two documents
  const differences = Object.keys(documents[0].departments).map((dept) => {
    const deptKey = dept as keyof Document['departments']
    const doc1Value = documents[0].departments[deptKey]
    const doc2Value = documents[1] ? documents[1].departments[deptKey] : 0
    const difference = doc2Value - doc1Value
    const percentChange = doc1Value > 0 ? (difference / doc1Value) * 100 : 0

    return {
      department: dept.charAt(0).toUpperCase() + dept.slice(1),
      difference,
      percentChange,
      doc1Value,
      doc2Value,
    }
  })

  return (
    <div className="space-y-6">
      {/* Document Headers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comparison Results</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getJurisdictionColor(doc.jurisdiction)} variant="secondary">
                      {doc.jurisdiction}
                    </Badge>
                    <Badge variant="outline">{doc.year}</Badge>
                  </div>
                  <h3 className="font-medium text-sm">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground">{formatBudget(doc.totalBudget)} Total</p>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department Spending Comparison</CardTitle>
          <CardDescription>Absolute spending amounts by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis tickFormatter={(value) => formatBudget(value)} fontSize={12} />
              <Tooltip
                formatter={(value: number) => [formatBudget(value), "Amount"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {documents.map((doc, index) => (
                <Bar key={doc.id} dataKey={doc.title} fill={COLORS[index % COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Percentage Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Percentage of Total Budget</CardTitle>
          <CardDescription>Department spending as percentage of total budget</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={percentageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} fontSize={12} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Percentage"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {documents.map((doc, index) => (
                <Line
                  key={doc.id}
                  type="monotone"
                  dataKey={doc.title}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Differences Table */}
      {documents.length === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
            <CardDescription>
              Comparing {documents[0].title} vs {documents[1].title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Department</th>
                    <th className="text-right py-2 font-medium">{documents[0].title}</th>
                    <th className="text-right py-2 font-medium">{documents[1].title}</th>
                    <th className="text-right py-2 font-medium">Difference</th>
                    <th className="text-right py-2 font-medium">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.map((diff, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-medium">{diff.department}</td>
                      <td className="text-right py-3">{formatBudget(diff.doc1Value)}</td>
                      <td className="text-right py-3">{formatBudget(diff.doc2Value)}</td>
                      <td className={`text-right py-3 ${diff.difference > 0 ? "text-green-600" : "text-red-600"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {diff.difference > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : diff.difference < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {diff.difference > 0 ? "+" : ""}
                          {formatBudget(Math.abs(diff.difference))}
                        </div>
                      </td>
                      <td className={`text-right py-3 ${diff.percentChange > 0 ? "text-green-600" : "text-red-600"}`}>
                        {diff.percentChange > 0 ? "+" : ""}
                        {diff.percentChange.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
