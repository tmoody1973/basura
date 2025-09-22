"use client"

import type React from "react"

import { useState } from "react"
import { Send, Loader2, Copy, Bookmark, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DepartmentSpendingChart, PublicSafetyPieChart, BudgetTrendChart, BudgetDataTable } from "./budget-charts"

type Message = {
  id: number
  type: "user" | "ai"
  content: string
  timestamp: string
  charts?: React.ReactNode[]
  sources?: string[]
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "user",
    content: "How much does Milwaukee County spend on public safety?",
    timestamp: "2:30 PM",
  },
  {
    id: 2,
    type: "ai",
    content:
      "Milwaukee County allocated $245.2 million for public safety in 2025, representing 18.3% of the total budget. This includes:\n\n• Police Department: $156.8 million\n• Fire Department: $52.4 million\n• Emergency Services: $21.7 million\n• Courts and Legal: $14.3 million",
    timestamp: "2:31 PM",
    sources: ["Milwaukee County 2025 Adopted Budget, pages 45-47"],
    charts: [<PublicSafetyPieChart key="public-safety-pie" />],
  },
  {
    id: 3,
    type: "user",
    content: "How does this compare to education spending?",
    timestamp: "2:32 PM",
  },
  {
    id: 4,
    type: "ai",
    content:
      "Education spending is significantly higher at $387.5 million (28.9% of total budget) compared to public safety at $245.2 million (18.3%). The education budget includes:\n\n• K-12 School Districts: $298.2 million\n• Community College: $45.8 million\n• Libraries: $28.7 million\n• Educational Programs: $14.8 million\n\nHere's the complete departmental breakdown:",
    timestamp: "2:33 PM",
    sources: ["Milwaukee County 2025 Adopted Budget, pages 23-28, 45-47"],
    charts: [<DepartmentSpendingChart key="dept-spending" />],
  },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response with different charts based on question
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content: "I'm analyzing the budget data to answer your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: ["Budget Document, pages 12-15"],
      }

      if (currentInput.toLowerCase().includes("trend") || currentInput.toLowerCase().includes("over time")) {
        aiResponse.content =
          "Here's the 5-year budget trend showing how spending has evolved over time. The total budget has grown from $1.18 billion in 2021 to $1.34 billion in 2025, with education and public safety maintaining consistent growth patterns."
        aiResponse.charts = [<BudgetTrendChart key="trend-chart" />]
      } else if (currentInput.toLowerCase().includes("table") || currentInput.toLowerCase().includes("detailed")) {
        aiResponse.content =
          "Here's a detailed breakdown of all department spending with year-over-year comparisons. You can see the exact amounts, changes from the previous year, and percentage of total budget for each department."
        aiResponse.charts = [<BudgetDataTable key="data-table" />]
      } else {
        aiResponse.content =
          "Based on your question, here's the relevant budget analysis with detailed breakdowns and visualizations."
        aiResponse.charts = [<DepartmentSpendingChart key="default-chart" />]
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] ${message.type === "user" ? "order-2" : "order-1"}`}>
                <Card
                  className={`${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                    {message.charts && message.charts.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {message.charts.map((chart, index) => (
                          <div key={index} className="bg-background rounded-lg p-1">
                            {chart}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.sources && (
                      <div className="mt-3 pt-3 border-t border-border/20">
                        <p className="text-xs font-medium mb-1">Sources:</p>
                        {message.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-2 mb-1">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs opacity-70">{message.timestamp}</span>
                      {message.type === "ai" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Bookmark className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <Card className="bg-muted text-muted-foreground max-w-[80%]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is analyzing...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            placeholder="Ask a question about the budget..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 max-w-4xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue("Show me the 5-year budget trend")}
            className="text-xs"
          >
            Show budget trends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue("Give me a detailed table of all departments")}
            className="text-xs"
          >
            Detailed table
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputValue("What's the revenue breakdown?")}
            className="text-xs"
          >
            Revenue breakdown
          </Button>
        </div>
      </div>
    </div>
  )
}
