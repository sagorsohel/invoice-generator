'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, ChevronRight, Upload, X, Download, Printer, DollarSign, Coins } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InvoiceItem {
  id: string
  name: string
  description: string
  quantity: number
  rate: number
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
      },
    ],
    currency: 'USD',
    taxRate: 0,
    discountRate: 0,
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
        
        // Remove oklch dependencies in the clone by forcing hex colors
        const styleOverride = document.createElement('style')
        styleOverride.innerHTML = `
          * { 
            color-scheme: light !important;
            --background: #ffffff !important;
            --foreground: #020617 !important;
            --primary: #06b6d4 !important;
            --border: #e2e8f0 !important;
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

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const discount = (subtotal * invoiceData.discountRate) / 100
  const tax = ((subtotal - discount) * invoiceData.taxRate) / 100
  const total = subtotal - discount + tax

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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
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
                          Item
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                          Description
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          QTY
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600 dark:text-slate-400">
                          Rate
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
                      {invoiceData.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <Input
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="bg-white dark:bg-slate-900 text-sm"
                            />
                          </td>
                          <td className="py-4 px-4 hidden sm:table-cell">
                            <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="bg-white dark:bg-slate-900 text-sm"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
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
                                className="bg-white dark:bg-slate-900 text-sm"
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-slate-900 dark:text-white">
                            {symbol}
                            {(item.quantity * item.rate).toFixed(2)}
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
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
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
              <Button
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Save as Draft
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
                    {invoiceData.billFrom.logo && (
                      <img
                        src={invoiceData.billFrom.logo}
                        alt="Logo"
                        className="w-24 h-24 object-contain"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {invoiceData.billFrom.name || 'Company Name'}
                      </h1>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        {invoiceData.billFrom.email}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {invoiceData.billFrom.address}
                      </p>
                    </div>
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

                {/* Bill To / Bill From */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">BILL TO:</h3>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {invoiceData.billTo.name || 'Client Name'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billTo.email}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billTo.address}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">BILL FROM:</h3>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {invoiceData.billFrom.name || 'Your Name'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billFrom.email}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoiceData.billFrom.address}</p>
                  </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="text-left py-3 px-4 font-semibold">DESCRIPTION</th>
                        <th className="text-center py-3 px-4 font-semibold">QTY</th>
                        <th className="text-right py-3 px-4 font-semibold">RATE</th>
                        <th className="text-right py-3 px-4 font-semibold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-200 dark:border-slate-700 ${
                            idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'
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
                          <td className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {symbol}
                            {(item.quantity * item.rate).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end mb-8">
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
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
