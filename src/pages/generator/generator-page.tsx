'use client'

import { useState, useRef } from 'react'
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
  quantity: number
  rate: number
  discount: number
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
      name: 'Sohel Hossain',
      email: 'sohel19sagor@gmail.com',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Invoice Generator</h1>
          <p className="text-slate-600 dark:text-slate-400">Create professional invoices in minutes</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description / Note Section (Based on Image) */}


            {/* Invoice Header */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Invoice Details</CardTitle>
                <CardDescription>Basic invoice information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number" className="text-sm font-medium">
                      Invoice Number
                    </Label>
                    <Input
                      id="invoice-number"
                      placeholder="INV-001"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-date" className="text-sm font-medium">
                      Current Date
                    </Label>
                    <Input
                      id="current-date"
                      type="date"
                      value={invoiceData.currentDate}
                      onChange={(e) => updateInvoiceData('currentDate', e.target.value)}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date" className="text-sm font-medium">
                      Due Date
                    </Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => updateInvoiceData('dueDate', e.target.value)}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill To / Bill From */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Bill To */}
              <Card className="shadow-sm border-slate-200 dark:border-slate-800">
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bill From */}
              <Card className="shadow-sm border-slate-200 dark:border-slate-800">
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
                      Name
                    </Label>
                    <Input
                      id="bill-from-name"
                      placeholder="Your name"
                      value={invoiceData.billFrom.name}
                      onChange={(e) => updateInvoiceData('billFrom.name', e.target.value)}
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <div className="flex flex-col gap-3">
                      {invoiceData.billFrom.logo ? (
                        <div className="relative w-full">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-center">
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
                            className="absolute top-2 right-2 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="w-full cursor-pointer">
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex flex-col items-center justify-center gap-2">
                            <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Click to upload logo
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
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

            {/* Payment Details Section (Based on Image) */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      INV Number
                    </Label>
                    <Input
                      placeholder="Invoice #"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                      className="bg-white dark:bg-slate-900 h-11 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      INV Date
                    </Label>
                    <Input
                      type="date"
                      value={invoiceData.currentDate}
                      onChange={(e) => updateInvoiceData('currentDate', e.target.value)}
                      className="bg-white dark:bg-slate-900 h-11 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Account #
                    </Label>
                    <Input
                      placeholder="A/C Number"
                      value={invoiceData.accountNumber}
                      onChange={(e) => updateInvoiceData('accountNumber', e.target.value)}
                      className="bg-white dark:bg-slate-900 h-11 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Invoice Total
                    </Label>
                    <div className="h-11 flex items-center px-4 rounded-md border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-white">
                      {symbol}{total.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Received Amount
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={invoiceData.receivedAmount}
                      onChange={(e) => updateInvoiceData('receivedAmount', parseFloat(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      className="bg-white dark:bg-slate-900 h-11 border-blue-200 focus-visible:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                      Due Amount
                    </Label>
                    <div className="h-11 flex items-center px-4 rounded-md border border-red-100 bg-red-50/30 dark:bg-red-900/10 font-bold text-red-600">
                      {symbol}{dueAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>Add products or services to your invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Item / Description
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          QTY
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Rate
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Disc %
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-4 px-4 min-w-[300px]">
                            <div className="space-y-2">
                              <Input
                                placeholder="Item name"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                className="bg-white dark:bg-slate-900 text-sm font-medium"
                              />
                              <textarea
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="w-full min-h-[60px] p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 resize-none transition-all"
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onFocus={(e) => e.target.select()}
                              className="bg-white dark:bg-slate-900 text-sm text-center"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <CurrencyIcon className="w-4 h-4 text-slate-400" />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                className="bg-white dark:bg-slate-900 text-sm"
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              onFocus={(e) => e.target.select()}
                              className="bg-white dark:bg-slate-900 text-sm text-right"
                            />
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-slate-900 dark:text-white">
                            {symbol}
                            {((item.quantity * item.rate) * (1 - item.discount / 100)).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  onClick={addItem}
                  variant="outline"
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
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
                    className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
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
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6 sticky top-6 self-start">
            {/* Settings Card */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>Currency and rates</CardDescription>
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
                    <SelectTrigger id="currency" className="bg-white dark:bg-slate-900">
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
                  <Label htmlFor="tax-rate" className="text-sm font-medium">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoiceData.taxRate}
                    onChange={(e) => updateInvoiceData('taxRate', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-rate" className="text-sm font-medium">
                    Discount Rate (%)
                  </Label>
                  <Input
                    id="discount-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={invoiceData.discountRate}
                    onChange={(e) => updateInvoiceData('discountRate', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-cyan-100 dark:border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-cyan-100 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {symbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-cyan-100 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Discount ({invoiceData.discountRate}%)
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{symbol}
                    {discount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-cyan-100 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Tax ({invoiceData.taxRate}%)
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {symbol}
                    {tax.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 bg-cyan-100 dark:bg-slate-700 rounded-lg px-3 mt-4">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-[#06b6d4] dark:text-cyan-400 flex items-center gap-1">
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
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice Preview</h2>
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
            <div className="p-8 bg-white dark:bg-slate-900" ref={printRef}>
              <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#06b6d4]">
                  <div className="flex items-start gap-4">
                    {/* Bill From Info Removed */}
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-bold text-[#06b6d4] mb-4">INVOICE</h2>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Invoice No:</span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">
                          {invoiceData.invoiceNumber || 'N/A'}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Date:</span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{invoiceData.currentDate}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Due Date:</span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{invoiceData.dueDate || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="mb-8">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">BILL TO:</h3>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {invoiceData.billTo.name || 'Client Name'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billTo.email}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billTo.address}</p>
                  </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="text-left py-3 px-4 font-semibold">ITEM / DESCRIPTION</th>
                        <th className="text-center py-3 px-4 font-semibold">QTY</th>
                        <th className="text-right py-3 px-4 font-semibold">RATE</th>
                        <th className="text-right py-3 px-4 font-semibold">DISC %</th>
                        <th className="text-right py-3 px-4 font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-200 dark:border-slate-700 ${idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'
                            }`}
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                          </td>
                          <td className="text-center py-3 px-4 text-slate-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="text-right py-3 px-4 text-slate-900 dark:text-white">
                            {symbol}
                            {item.rate.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">
                            {item.discount}%
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {symbol}
                            {((item.quantity * item.rate) * (1 - item.discount / 100)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end mb-12">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {symbol}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    {invoiceData.discountRate > 0 && (
                      <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Discount ({invoiceData.discountRate}%):
                        </span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{symbol}
                          {discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoiceData.taxRate > 0 && (
                      <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Tax ({invoiceData.taxRate}%):
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {symbol}
                          {tax.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 bg-[#06b6d4] text-white rounded px-4 font-bold text-lg">
                      <span>TOTAL:</span>
                      <span>
                        {symbol}
                        {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      <span>Received:</span>
                      <span>{symbol}{(invoiceData.receivedAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-4 bg-red-50 dark:bg-red-900/10 text-red-600 font-bold border-t border-red-100 dark:border-red-900/20">
                      <span>DUE AMOUNT:</span>
                      <span>{symbol}{dueAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="mt-12">
                  <div className="flex justify-between items-start mb-8">
                    {/* Terms and Conditions */}
                    <div className="max-w-[50%]">
                      {invoiceData.terms && (
                        <>
                          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Term and Conditions :</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                            {invoiceData.terms}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Signature */}
                    {(invoiceData.signatureName || invoiceData.signatureRole) && (
                      <div className="text-right">
                        {invoiceData.signatureName && (
                          <>
                            <p className="signature-font text-2xl text-slate-400 dark:text-slate-500 mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>
                              {invoiceData.signatureName}
                            </p>
                            <p className="font-bold text-slate-900 dark:text-white text-base uppercase tracking-tight">
                              {invoiceData.signatureName}
                            </p>
                          </>
                        )}
                        {invoiceData.signatureRole && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                            {invoiceData.signatureRole}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Info Footer */}
                  {(invoiceData.phoneNumber || invoiceData.billFrom.email || invoiceData.location) && (
                    <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-800">
                      <div className="flex justify-center items-center gap-12 px-4">
                        {/* Phone */}
                        {invoiceData.phoneNumber && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full border border-cyan-200 dark:border-cyan-900">
                              <Phone className="w-4 h-4 text-[#06b6d4]" />
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {invoiceData.phoneNumber}
                            </span>
                          </div>
                        )}

                        {/* Email */}
                        {invoiceData.billFrom.email && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full border border-cyan-200 dark:border-cyan-900">
                              <Mail className="w-4 h-4 text-[#06b6d4]" />
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {invoiceData.billFrom.email}
                            </span>
                          </div>
                        )}

                        {/* Location */}
                        {invoiceData.location && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full border border-cyan-200 dark:border-cyan-900">
                              <MapPin className="w-4 h-4 text-[#06b6d4]" />
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {invoiceData.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className='text-center py-10'>
        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">This site made and maintain by <Link to="https://level6it.com" target="_blank" rel="noopener noreferrer" className='text-[#06b6d4] hover:underline'>Level6it.com</Link> </p>
      </div>
    </div>
  )
}
