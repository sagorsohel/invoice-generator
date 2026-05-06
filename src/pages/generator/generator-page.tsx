'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, ChevronRight, Upload, X, Download, Printer, DollarSign, Coins, Phone, Mail, MapPin } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Link } from 'react-router'

interface InvoiceItem {
  id: string
  name: string
  description: string
  quantity: any
  rate: any
  discount: any
}

type Currency = 'USD' | 'BDT'

interface InvoiceData {
  invoiceNumber: string
  currentDate: string
  dueDate: string
  billTo: {
    name: string
    email: string
    address: string
  }
  billFrom: {
    name: string
    email: string
    address: string
    logo?: string
    tagline?: string
  }
  items: InvoiceItem[]
  currency: Currency
  taxRate: number
  discountRate: number
  accountNumber?: string
  receivedAmount?: number
  notes?: string
  terms?: string
  signatureName?: string
  signatureRole?: string
  phoneNumber?: string
  location?: string
  reference?: string
}

export default function GeneratorPage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: '',
    currentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billTo: {
      name: '',
      email: '',
      address: '',
    },
    billFrom: {
      name: '',
      email: '',
      address: '',
      logo: undefined,
    },
    items: [
      {
        id: '1',
        name: '',
        description: '',
        quantity: 1,
        rate: 0,
        discount: 0,
      },
    ],
    currency: 'USD',
    taxRate: 0,
    discountRate: 0,
    accountNumber: '',
    receivedAmount: 0,
    terms: '',
    signatureName: '',
    signatureRole: '',
    phoneNumber: '',
    location: '',
  })

  const [showReview, setShowReview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const updateInvoiceData = (path: string, value: string | number | undefined) => {
    setInvoiceData((prev) => {
      const keys = path.split('.')
      const newData = { ...prev } as any
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData as InvoiceData
    })
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      rate: 0,
      discount: 0,
    }
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  const removeItem = (id: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateInvoiceData('billFrom.logo', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    updateInvoiceData('billFrom.logo', undefined)
  }

  const handlePrint = () => {
    if (printRef.current) {
      const content = printRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${invoiceData.invoiceNumber}</title>
              <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: auto; margin: 0mm; }
                body { margin: 0; padding: 20px; }
                .print-container { width: 100%; max-width: 800px; margin: 0 auto; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              </style>
            </head>
            <body>
              <div class="print-container">
                ${content}
              </div>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const { toPng } = await import('html-to-image')
      const { jsPDF } = await import('jspdf')

      if (printRef.current) {
        const element = printRef.current

        // Clone for clean capture
        const clone = element.cloneNode(true) as HTMLElement
        clone.style.width = '800px'
        clone.style.padding = '40px'
        clone.style.background = 'white'
        clone.classList.remove('dark')

        // Add a style block to override oklch variables with hex for html2canvas compatibility
        const styleOverride = document.createElement('style')
        styleOverride.innerHTML = `
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
          * { 
            color-scheme: light !important;
            --background: #ffffff !important;
            --foreground: #020617 !important;
            --primary: #06b6d4 !important;
            --border: #e2e8f0 !important;
          }
          .signature-font {
            font-family: 'Dancing Script', cursive !important;
          }
        `
        clone.prepend(styleOverride)

        document.body.appendChild(clone)

        // Capture as PNG
        const dataUrl = await toPng(clone, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        })

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [800, 1131], // A4 aspect ratio for 800px width
        })

        const imgProps = pdf.getImageProperties(dataUrl)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`invoice-${invoiceData.invoiceNumber || 'draft'}.pdf`)

        // Clean up
        document.body.removeChild(clone)
      }
    } catch (error) {
      console.error('Detailed PDF generation error:', error)
      alert('Failed to generate PDF. Please try again or use the Print button.')
    }
  }

  const subtotal = invoiceData.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.rate
    const itemDiscount = (itemTotal * item.discount) / 100
    return sum + (itemTotal - itemDiscount)
  }, 0)
  const discount = (subtotal * invoiceData.discountRate) / 100
  const tax = ((subtotal - discount) * invoiceData.taxRate) / 100
  const total = subtotal - discount + tax
  const dueAmount = total - (invoiceData.receivedAmount || 0)

  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    BDT: '৳',
  }

  const symbol = currencySymbols[invoiceData.currency] || '$'

  const CurrencyIcon = invoiceData.currency === 'USD' ? DollarSign : Coins

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">Invoice Generator</h1>
            <p className="text-slate-500 font-medium">Create professional invoices in minutes</p>
          </div>

          <div className="flex items-center gap-4 bg-white/50 px-6 py-3 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-sm">

            <img
              src="/Level_6_IT-CKFkUPiu.webp"
              alt="Level 6 IT Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-left">
              <p className="text-xs font-black text-[#06b6d4] uppercase tracking-widest leading-none mb-1">Level Up Your Business With Us</p>
              <Link to={'https://level6it.com'} className="text-[10px] font-bold text-slate-400">level6it.com</Link>
            </div>

          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Main Form Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bill To / Bill From */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Bill To */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                    Bill To
                  </CardTitle>
                  <CardDescription>Client information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bill-to-name" className="text-sm font-medium">
                      Name
                    </Label>
                    <Input
                      id="bill-to-name"
                      placeholder="Client name"
                      value={invoiceData.billTo.name}
                      onChange={(e) => updateInvoiceData('billTo.name', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill-to-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="bill-to-email"
                      placeholder="client@example.com"
                      value={invoiceData.billTo.email}
                      onChange={(e) => updateInvoiceData('billTo.email', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill-to-address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Input
                      id="bill-to-address"
                      placeholder="Billing address"
                      value={invoiceData.billTo.address}
                      onChange={(e) => updateInvoiceData('billTo.address', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bill From */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                    Bill From
                  </CardTitle>
                  <CardDescription>Your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bill-from-name" className="text-sm font-medium">
                      Company / Your Name
                    </Label>
                    <Input
                      id="bill-from-name"
                      placeholder="e.g. Studio Shodwe"
                      value={invoiceData.billFrom.name}
                      onChange={(e) => updateInvoiceData('billFrom.name', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill-from-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="bill-from-email"
                      placeholder="your@example.com"
                      value={invoiceData.billFrom.email}
                      onChange={(e) => updateInvoiceData('billFrom.email', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill-from-address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Input
                      id="bill-from-address"
                      placeholder="Your address"
                      value={invoiceData.billFrom.address}
                      onChange={(e) => updateInvoiceData('billFrom.address', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill-from-tagline" className="text-sm font-medium">
                      Company Tagline / Specialty
                    </Label>
                    <Input
                      id="bill-from-tagline"
                      placeholder="e.g. Creative Agency"
                      value={invoiceData.billFrom.tagline}
                      onChange={(e) => updateInvoiceData('billFrom.tagline', e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-2 border-t border-slate-200 pt-4">
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <div className="flex flex-col gap-3">
                      {invoiceData.billFrom.logo ? (
                        <div className="relative w-full">
                          <div className="w-full bg-slate-100 rounded-lg p-4 flex items-center justify-center">
                            <img
                              src={invoiceData.billFrom.logo}
                              alt="Company logo"
                              className="max-h-24 max-w-full object-contain"
                            />
                          </div>
                          <Button
                            onClick={removeLogo}
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-red-50 hover:bg-red-100 text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="w-full cursor-pointer">
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2">
                            <Upload className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              Click to upload logo
                            </span>
                            <span className="text-xs text-slate-500">
                              PNG, JPG or GIF (Max 5MB)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>Add products or services to your invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {invoiceData.items.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                      {/* Top Section: Item Identity & Total */}
                      <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="bg-white font-bold text-slate-900 border-slate-200 h-10"
                          />
                          <Textarea
                            placeholder="Detailed description"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="bg-white text-xs min-h-[60px] resize-none border-slate-200"
                          />
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 min-w-[140px]">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Total</p>
                            <p className="text-xl font-black text-[#06b6d4]">
                              {symbol}
                              {(
                                (parseFloat(item.quantity?.toString() || '0') *
                                  parseFloat(item.rate?.toString() || '0')) *
                                (1 - parseFloat(item.discount?.toString() || '0') / 100)
                              ).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 gap-2 font-bold text-[10px] uppercase tracking-widest h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Bottom Section: Inputs Grid */}
                      <div className="p-4 grid grid-cols-3 gap-6 bg-white">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</Label>
                          <Input
                            type="text"
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-200 text-sm h-10 font-bold text-slate-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate</Label>
                          <div className="relative">
                            <CurrencyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-200 text-sm h-10 pl-9 font-bold text-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount %</Label>
                          <Input
                            type="text"
                            placeholder="0"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-200 text-sm h-10 text-right font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addItem}
                  variant="outline"
                  className="w-full gap-2 border-dashed border-slate-300 hover:bg-blue-50 hover:text-[#06b6d4] hover:border-blue-200 py-8 text-sm font-black uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5" />
                  Add New Item
                </Button>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <CardDescription>Add terms, conditions and signature info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-sm font-medium">
                    Terms and Conditions
                  </Label>
                  <Textarea
                    id="terms"
                    placeholder="e.g. Please send payment within 30 days"
                    value={invoiceData.terms}
                    onChange={(e) => updateInvoiceData('terms', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sig-name" className="text-sm font-medium">
                      Authorized Person Name
                    </Label>
                    <Input
                      id="sig-name"
                      placeholder="e.g. Henrietta Mitchell"
                      value={invoiceData.signatureName}
                      onChange={(e) => updateInvoiceData('signatureName', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sig-role" className="text-sm font-medium">
                      Designation / Role
                    </Label>
                    <Input
                      id="sig-role"
                      placeholder="e.g. Administrator"
                      value={invoiceData.signatureRole}
                      onChange={(e) => updateInvoiceData('signatureRole', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Your Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="e.g. +880 123-456789"
                      value={invoiceData.phoneNumber}
                      onChange={(e) => updateInvoiceData('phoneNumber', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Business Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. Dhaka, Bangladesh"
                      value={invoiceData.location}
                      onChange={(e) => updateInvoiceData('location', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6 sticky top-6 self-start">
            {/* Settings Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>Currency and references</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select
                    value={invoiceData.currency}
                    onValueChange={(value) => updateInvoiceData('currency', value as Currency)}
                  >
                    <SelectTrigger id="currency" className="bg-white">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-500" />
                          <span>USD (United States Dollar)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BDT">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-slate-500" />
                          <span>BDT (Bangladeshi Taka)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference" className="text-sm font-medium">
                    Project / Reference
                  </Label>
                  <Input
                    id="reference"
                    placeholder="e.g. Website Redesign"
                    value={invoiceData.reference || ''}
                    onChange={(e) => updateInvoiceData('reference', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received-amount" className="text-sm font-medium">
                    Amount Received
                  </Label>
                  <div className="relative">
                    <CurrencyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="received-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={invoiceData.receivedAmount}
                      onChange={(e) => updateInvoiceData('receivedAmount', parseFloat(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      className="bg-white pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-cyan-50 to-indigo-50 border-cyan-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-cyan-100">
                  <div className="flex justify-between text-sm w-full">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-900">{symbol}{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 bg-cyan-100 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-[#06b6d4] flex items-center gap-1">
                    <CurrencyIcon className="w-5 h-5" />
                    {total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => setShowReview(true)}
                className="w-full bg-[#06b6d4] hover:bg-cyan-600 text-white gap-2 h-10 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                Review Invoice
              </Button>

            </div>
          </div>
        </div>
      </div>

      {/* Invoice Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  size="sm"
                  className="gap-2 bg-[#06b6d4] hover:bg-cyan-600"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setShowReview(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Invoice Content */}
            <div className="p-0 bg-slate-100/50" ref={printRef}>
              <div className="bg-white mx-auto w-[800px] min-h-[1130px] p-12 shadow-sm text-slate-900 relative flex flex-col">
                {/* 1. Brand Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-start gap-4">
                    {invoiceData.billFrom.logo && (
                      <img src={invoiceData.billFrom.logo} alt="Logo" className="w-16 h-16 object-contain" />
                    )}
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                        {invoiceData.billFrom.name || ''}
                      </h1>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">
                        {invoiceData.billFrom.tagline || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-[#06b6d4] uppercase tracking-tighter leading-none mb-4">INVOICE</h2>
                    <p className="text-sm font-bold text-slate-400  tracking-widest">{invoiceData.billFrom.email || 'REALLYGREATSITE.COM'}</p>
                  </div>
                </div>

                {/* 2. Metadata Section */}
                <div className="grid grid-cols-2 gap-12 mb-10 border-t border-slate-200 pt-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Invoice to :</h3>
                    <p className="text-xl font-black text-slate-900 mb-1">{invoiceData.billTo.name || ''}</p>
                    <div className="text-sm text-slate-500 space-y-0.5 font-medium">
                      <p>{invoiceData.phoneNumber || ''}</p>
                      <p>{invoiceData.billTo.email || ''}</p>
                      <p>{invoiceData.billTo.address || ''}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <div className="space-y-1">
                      <p className="text-xl font-black text-slate-900">
                        <span className="text-slate-400 mr-2">Invoice no :</span>
                        {invoiceData.invoiceNumber || '12345'}
                      </p>
                      <p className="text-sm font-bold text-slate-500">{invoiceData.currentDate}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table */}
                <div className="flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="py-2 px-4 text-left text-xs font-black uppercase tracking-widest w-12">NO</th>
                        <th className="py-2 px-4 text-left text-xs font-black uppercase tracking-widest">DESCRIPTION</th>
                        <th className="py-2 px-4 text-center text-xs font-black uppercase tracking-widest w-16">QTY</th>
                        <th className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest w-24">PRICE</th>
                        <th className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest w-32">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`${idx % 2 === 1 ? 'bg-blue-50/50' : 'bg-white'} border-b border-blue-50`}
                        >
                          <td className="py-3 px-4 text-sm font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-bold text-slate-700">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-slate-700">{symbol}{parseFloat(item.rate?.toString() || '0').toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-sm font-black text-slate-900">
                            {symbol}{(
                              (parseFloat(item.quantity?.toString() || '0') *
                                parseFloat(item.rate?.toString() || '0')) *
                              (1 - parseFloat(item.discount?.toString() || '0') / 100)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Subtotal & Tax Rows */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-end gap-12 px-4">
                      <span className="text-sm font-bold text-slate-400 uppercase">Sub Total :</span>
                      <span className="text-sm font-black text-slate-700 w-32 text-right">{symbol}{subtotal.toFixed(2)}</span>
                    </div>
                    {invoiceData.taxRate > 0 && (
                      <div className="flex justify-end gap-12 px-4">
                        <span className="text-sm font-bold text-slate-400 uppercase">Tax {invoiceData.taxRate}% :</span>
                        <span className="text-sm font-black text-slate-700 w-32 text-right">{symbol}{tax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Grand Total Section */}
                <div className="flex justify-end mt-8 mb-12">
                  <div className="w-1/2 flex flex-col items-end justify-center">
                    <div className="bg-[#06b6d4] text-white w-full flex justify-between items-center px-6 py-3 rounded-sm shadow-md">
                      <span className="text-sm font-black uppercase tracking-widest">GRAND TOTAL :</span>
                      <span className="text-2xl font-black">{symbol}{total.toFixed(2)}</span>
                    </div>
                    {dueAmount > 0 && (
                      <div className="mt-2 text-right">
                        <span className="text-xs font-black text-red-500 uppercase tracking-widest mr-4">BALANCE DUE :</span>
                        <span className="text-lg font-black text-red-600">{symbol}{dueAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Footer Section */}
                <div className="space-y-8 mt-auto">
                  <div className="flex justify-between items-end border-t-2 border-slate-100 pt-8">
                    <div className="max-w-[60%]">
                      <p className="text-sm font-black text-slate-900 mb-2 uppercase italic tracking-tight">Thank you for business with us!</p>
                      {
                        invoiceData.terms && (
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Term and Conditions :</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                              {invoiceData.terms}
                            </p>
                          </div>
                        )
                      }
                    </div>
                    <div className="text-center min-w-[200px]">
                      {invoiceData.signatureName && (
                        <>
                          <p className="signature-font text-3xl text-slate-400 mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>
                            {invoiceData.signatureName}
                          </p>
                          <p className="text-lg font-black text-slate-900 uppercase leading-none mb-1">{invoiceData.signatureName}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{invoiceData.signatureRole || 'Administrator'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Contact Bar */}
                  <div className="border-t border-blue-200 pt-4 pb-2">
                    <div className="flex justify-around items-center px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-blue-100 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#06b6d4]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{invoiceData.phoneNumber || '123-456-7890'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-blue-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#06b6d4]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{invoiceData.billFrom.email || 'hello@reallygreatsite.com'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-blue-100 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#06b6d4]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{invoiceData.location || '123 Anywhere St., Any City'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='text-center py-10'>
        <p className="text-slate-600 text-xs font-medium">This site made and maintain by <Link to="https://level6it.com" target="_blank" rel="noopener noreferrer" className='text-[#06b6d4] hover:underline'>Level6it.com</Link> </p>
      </div>

    </div>
  )
}
