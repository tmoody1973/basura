'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Building2, Calendar, User, Search } from 'lucide-react'
import { getAllProcessedDocuments } from '@/lib/supabase/database'

interface Document {
  id: string
  name: string
  original_filename: string
  file_size: number
  jurisdiction_type: string
  jurisdiction_name: string
  processing_status: string
  metadata: any
  created_at: string
  profiles: {
    full_name: string
    role: string
  }
}

interface DocumentLibraryProps {
  onSelectDocument: (documentId: string) => void
}

export function DocumentLibrary({ onSelectDocument }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const data = await getAllProcessedDocuments()
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.jurisdiction_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJurisdiction = selectedJurisdiction === 'all' || doc.jurisdiction_type === selectedJurisdiction
    return matchesSearch && matchesJurisdiction
  })

  const jurisdictionTypes = [...new Set(documents.map(doc => doc.jurisdiction_type).filter(Boolean))]

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading budget documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Budget Document Library</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Explore government budget documents and ask AI-powered questions to understand public spending.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search by document name or jurisdiction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedJurisdiction}
          onChange={(e) => setSelectedJurisdiction(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Jurisdictions</option>
          {jurisdictionTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
          <p className="text-slate-600">
            {searchTerm || selectedJurisdiction !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No budget documents have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{document.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {document.jurisdiction_name && (
                        <div className="flex items-center text-sm text-slate-600 mb-1">
                          <Building2 className="h-4 w-4 mr-1" />
                          {document.jurisdiction_name}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {document.jurisdiction_type && (
                    <Badge variant="secondary">
                      {document.jurisdiction_type}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {formatFileSize(document.file_size)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(document.created_at)}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {document.profiles.full_name || 'Admin'}
                  </div>
                </div>

                <Button
                  onClick={() => onSelectDocument(document.id)}
                  className="w-full"
                >
                  Analyze This Budget
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}