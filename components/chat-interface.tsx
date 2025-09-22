"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, Loader2, Copy, Bookmark, Download, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DepartmentSpendingChart, PublicSafetyPieChart, BudgetTrendChart, BudgetDataTable } from "./budget-charts"

type Message = {
  id: number
  type: "user" | "ai"
  content: string
  timestamp: string
  charts?: React.ReactNode[]
  sources?: string[]
  confidence?: number
  threadId?: string
}

type UserType = "citizen" | "student" | "journalist"

type DocumentContext = {
  id: string
  name: string
  jurisdiction: string
} | null

// Remove hardcoded messages - will load from document context

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userType, setUserType] = useState<UserType>("citizen")
  const [documentContext, setDocumentContext] = useState<DocumentContext>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  // Load document context from URL params
  useEffect(() => {
    const loadDocumentContext = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const documentId = urlParams.get('document')

        if (documentId) {
          // Load document info from existing API
          const response = await fetch(`/api/documents/${documentId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.document) {
              setDocumentContext({
                id: documentId,
                name: result.document.name || 'Budget Document',
                jurisdiction: result.document.jurisdiction_name || 'Unknown'
              })
            } else {
              setError('Document not found')
            }
          } else {
            setError('Document not found or access denied')
          }
        } else {
          setError('No document selected')
        }
      } catch (err) {
        setError('Failed to load document')
      } finally {
        setIsLoading(false)
      }
    }

    loadDocumentContext()
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !documentContext) return

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
    setError(null)

    try {
      // Call Genkit API
      const response = await fetch('/api/chat-genkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          documentId: documentContext.id,
          userType: userType,
          jurisdiction: documentContext.jurisdiction,
          threadId: currentThreadId
        }),
      })

      const result = await response.json()

      if (result.success) {
        const aiResponse: Message = {
          id: messages.length + 2,
          type: "ai",
          content: result.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: result.citations?.map((citation: any) =>
            `Page ${citation.pageNumber}: ${citation.section}`
          ) || [],
          confidence: result.confidence,
          threadId: result.threadId
        }

        // Update thread ID for conversation continuity
        if (result.threadId && !currentThreadId) {
          setCurrentThreadId(result.threadId)
        }

        // Add charts based on visualization suggestions
        if (result.visualizationSuggestion) {
          if (currentInput.toLowerCase().includes("trend") || currentInput.toLowerCase().includes("over time")) {
            aiResponse.charts = [<BudgetTrendChart key="trend-chart" />]
          } else if (currentInput.toLowerCase().includes("table") || currentInput.toLowerCase().includes("detailed")) {
            aiResponse.charts = [<BudgetDataTable key="data-table" />]
          } else {
            aiResponse.charts = [<DepartmentSpendingChart key="default-chart" />]
          }
        }

        setMessages((prev) => [...prev, aiResponse])
      } else {
        setError(result.error || 'Failed to get AI response')
      }
    } catch (err) {
      setError('Network error - please try again')
      console.error('Chat API error:', err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    )
  }

  if (error && !documentContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            {error}. Please select a document to start chatting.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document and User Type Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{documentContext?.name}</h3>
            <Badge variant="outline">{documentContext?.jurisdiction}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <Select value={userType} onValueChange={(value: UserType) => setUserType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="journalist">Journalist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <div className="mt-2 max-w-4xl mx-auto p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

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
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">{message.timestamp}</span>
                        {message.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {message.confidence}% confident
                          </Badge>
                        )}
                      </div>
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
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 max-w-4xl mx-auto">
          {userType === "citizen" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("How does this budget affect my community services?")}
                className="text-xs"
              >
                Community impact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("What are the largest spending categories?")}
                className="text-xs"
              >
                Major spending
              </Button>
            </>
          )}
          {userType === "student" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Can you explain how budgets work and why departments get different amounts?")}
                className="text-xs"
              >
                How budgets work
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Show me the education budget breakdown")}
                className="text-xs"
              >
                Education spending
              </Button>
            </>
          )}
          {userType === "journalist" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Show me any unusual spending patterns or significant budget changes")}
                className="text-xs"
              >
                Investigate changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Provide exact numbers and sources for the largest budget items")}
                className="text-xs"
              >
                Detailed sources
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
