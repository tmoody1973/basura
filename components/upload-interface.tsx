"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { DocumentLibrary } from "./document-library"

type ProcessingStage = "idle" | "uploading" | "extracting" | "analyzing" | "indexing" | "complete"

const processingStages = {
  uploading: "Uploading document...",
  extracting: "Extracting text and tables...",
  analyzing: "Analyzing document structure...",
  indexing: "Creating searchable index...",
  complete: "Ready for analysis!",
}

export function UploadInterface() {
  const { user } = useUser()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jurisdiction, setJurisdiction] = useState("auto")
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle")
  const [progress, setProgress] = useState(0)
  const [userRole, setUserRole] = useState<string>('user')
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.id) {
        try {
          const response = await fetch('/api/user/role')
          if (response.ok) {
            const data = await response.json()
            setUserRole(data.role)
          } else {
            // If API fails, default to 'user' role
            setUserRole('user')
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          setUserRole('user')
        }
      } else {
        // If not logged in, default to 'user' role
        setUserRole('user')
      }
      setRoleLoading(false)
    }

    checkUserRole()
  }, [user?.id])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setProcessingStage("uploading");
      setProgress(20);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', 'budget');
      formData.append('jurisdiction', jurisdiction === 'auto' ? '' : jurisdiction);
      formData.append('fiscalYear', new Date().getFullYear().toString());
      formData.append('description', `Uploaded ${selectedFile.name}`);

      // Upload document
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      setProgress(60);
      setProcessingStage("extracting");

      // Process document with Genkit
      const processResponse = await fetch(`/api/documents/${uploadResult.document.id}/process-genkit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setProgress(80);
      setProcessingStage("analyzing");

      if (processResponse.ok) {
        setProgress(100);
        setProcessingStage("complete");

        // Navigate to dashboard after successful upload and processing
        setTimeout(() => {
          window.location.href = `/dashboard?document=${uploadResult.document.id}`;
        }, 2000);
      } else {
        // If processing fails, still show the document was uploaded
        setProgress(100);
        setProcessingStage("complete");
        console.warn('Document uploaded but processing failed');

        setTimeout(() => {
          window.location.href = `/dashboard?document=${uploadResult.document.id}`;
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStage("idle");
      setProgress(0);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const handleDocumentSelect = (documentId: string) => {
    // Navigate to dashboard with selected document
    window.location.href = `/dashboard?document=${documentId}`
  }

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show document library for regular users
  if (userRole !== 'admin') {
    return <DocumentLibrary onSelectDocument={handleDocumentSelect} />
  }

  const sampleDocuments = [
    {
      title: "Milwaukee County 2025 Budget",
      jurisdiction: "County",
      size: "12.4 MB",
      type: "Operating Budget",
    },
    {
      title: "California State Budget 2024",
      jurisdiction: "State",
      size: "8.7 MB",
      type: "Comprehensive Budget",
    },
    {
      title: "Federal Department of Education Budget",
      jurisdiction: "Federal",
      size: "15.2 MB",
      type: "Agency Budget",
    },
  ]

  if (processingStage !== "idle") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {processingStage === "complete" ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin" />
            )}
            Processing Document
          </CardTitle>
          <CardDescription>{selectedFile?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{processingStages[processingStage as keyof typeof processingStages]}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {processingStage === "complete" && (
            <div className="text-center">
              <Button size="lg" className="w-full">
                Start Analysis
              </Button>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">What's happening:</p>
            <ul className="space-y-1">
              <li>• Extracting text content from PDF pages</li>
              <li>• Identifying tables and financial data</li>
              <li>• Creating searchable index for AI analysis</li>
              <li>• Preparing interactive visualizations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Budget Document</CardTitle>
          <CardDescription>Upload a government budget document to start your analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drag budget document here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">PDF files up to 50MB</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Supported document types:</p>
                <p>Operating budgets • Capital budgets • CAFRs • Appropriations</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                Remove
              </Button>
            </div>
          )}

          {/* Jurisdiction Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Jurisdiction Type</Label>
            <RadioGroup value={jurisdiction} onValueChange={setJurisdiction}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto">Auto-detect</Label>
                <Badge variant="secondary" className="ml-2">
                  Recommended
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="city" id="city" />
                <Label htmlFor="city">City/Municipal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="county" id="county" />
                <Label htmlFor="county">County</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="state" id="state" />
                <Label htmlFor="state">State</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="federal" id="federal" />
                <Label htmlFor="federal">Federal</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile} size="lg" className="w-full">
            Upload and Analyze
          </Button>
        </CardContent>
      </Card>

      {/* Sample Documents */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Try with Sample Documents</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {sampleDocuments.map((doc, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline">{doc.jurisdiction}</Badge>
                  <span className="text-xs text-muted-foreground">{doc.size}</span>
                </div>
                <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                <CardDescription>{doc.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Analyze Sample
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
