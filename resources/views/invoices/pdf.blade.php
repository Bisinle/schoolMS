<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
        }
        
        .container {
            padding: 20px;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(to right, #fff7ed, #ffffff);
            border-bottom: 4px solid #f97316;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .header-top {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .school-info {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }
        
        .invoice-title {
            display: table-cell;
            width: 40%;
            text-align: right;
            vertical-align: top;
        }
        
        .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        
        .school-tagline {
            font-style: italic;
            color: #4b5563;
            margin-bottom: 12px;
        }
        
        .school-contact {
            font-size: 10px;
            color: #374151;
            line-height: 1.6;
        }
        
        .invoice-title-text {
            font-size: 32px;
            font-weight: bold;
            color: #f97316;
        }
        
        /* Info Boxes */
        .info-box {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .info-box-header {
            background: linear-gradient(to right, #0b1a34, #0f2347);
            color: #ffffff;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-box-content {
            padding: 12px;
        }
        
        .info-row {
            display: table;
            width: 100%;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            display: table-cell;
            width: 40%;
            color: #4b5563;
            font-weight: 500;
        }
        
        .info-value {
            display: table-cell;
            width: 60%;
            text-align: right;
            color: #111827;
            font-weight: 600;
        }
        
        .guardian-info {
            display: table;
            width: 100%;
        }
        
        .guardian-icon {
            display: table-cell;
            width: 40px;
            vertical-align: top;
        }
        
        .guardian-details {
            display: table-cell;
            vertical-align: top;
        }
        
        .guardian-name {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 4px;
        }
        
        .guardian-id {
            font-size: 10px;
            color: #4b5563;
        }
        
        /* Fee Breakdown Section */
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            margin: 20px 0 12px 0;
            letter-spacing: 0.5px;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }

        thead {
            background: linear-gradient(to right, #0b1a34, #0f2347);
        }

        thead th {
            color: #ffffff;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            padding: 10px 8px;
            text-align: left;
            letter-spacing: 0.5px;
        }

        thead th.text-right {
            text-align: right;
        }

        thead th.total-header {
            background: linear-gradient(to right, #ea580c, #c2410c);
        }

        tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }

        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        tbody td {
            padding: 10px 8px;
            font-size: 10px;
        }

        tbody td.student-name {
            font-weight: 600;
            color: #111827;
        }

        tbody td.grade {
            color: #374151;
        }

        tbody td.amount {
            text-align: right;
            font-family: 'Courier New', monospace;
            color: #111827;
        }

        tbody td.total-amount {
            text-align: right;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            color: #ea580c;
            background: linear-gradient(to right, #fff7ed, #ffedd5);
        }

        /* Totals Section */
        .totals-section {
            margin-top: 30px;
            float: right;
            width: 40%;
        }

        .totals-box {
            background: linear-gradient(to bottom right, #f9fafb, #ffffff);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
        }

        .total-row {
            display: table;
            width: 100%;
            padding: 8px 0;
        }

        .total-label {
            display: table-cell;
            color: #4b5563;
            font-weight: 600;
        }

        .total-value {
            display: table-cell;
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 12px;
        }

        .total-row.main-total {
            border-top: 2px solid #d1d5db;
            padding-top: 12px;
            margin-top: 8px;
            font-size: 14px;
        }

        .total-row.main-total .total-label {
            color: #111827;
        }

        .total-row.main-total .total-value {
            color: #ea580c;
            font-size: 14px;
        }

        .total-value.green {
            color: #16a34a;
        }

        .total-value.red {
            color: #dc2626;
        }

        .total-value.discount {
            color: #16a34a;
        }

        /* Payment History */
        .payment-section {
            clear: both;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }

        .payment-header {
            background: linear-gradient(to right, #16a34a, #15803d);
            color: #ffffff;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 12px;
            border-radius: 6px;
        }

        .payment-table thead {
            background: linear-gradient(to right, #16a34a, #15803d);
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
        }

        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="header-top">
                <div class="school-info">
                    <div class="school-name">{{ $school->name }}</div>
                    @if($school->tagline)
                        <div class="school-tagline">{{ $school->tagline }}</div>
                    @endif
                    <div class="school-contact">
                        @if($school->phone_primary || $school->phone_secondary)
                            <div>📞 {{ $school->phone_primary }}@if($school->phone_secondary) / {{ $school->phone_secondary }}@endif</div>
                        @endif
                        @if($school->email)
                            <div>✉ {{ $school->email }}</div>
                        @endif
                        @if($school->physical_address)
                            <div>📍 {{ $school->physical_address }}</div>
                        @endif
                    </div>
                </div>
                <div class="invoice-title">
                    <div class="invoice-title-text">INVOICE</div>
                </div>
            </div>

            <!-- Invoice Details Box -->
            <div class="info-box">
                <div class="info-box-header">Invoice Details</div>
                <div class="info-box-content">
                    <div class="info-row">
                        <div class="info-label">Invoice Number</div>
                        <div class="info-value">{{ $invoice->invoice_number }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Invoice Date</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($invoice->invoice_date)->format('M d, Y') }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Due Date</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Academic Term</div>
                        <div class="info-value">{{ $invoice->academicTerm->academicYear->year }} - Term {{ $invoice->academicTerm->term_number }}</div>
                    </div>
                </div>
            </div>

            <!-- Guardian Info Box -->
            <div class="info-box">
                <div class="info-box-header">Bill To</div>
                <div class="info-box-content">
                    <div class="guardian-info">
                        <div class="guardian-icon">👤</div>
                        <div class="guardian-details">
                            <div class="guardian-name">{{ $invoice->guardian->user->name }}</div>
                            <div class="guardian-id">Guardian ID: {{ $invoice->guardian->guardian_number }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fee Breakdown Section -->
        <div class="section-title">Fee Breakdown</div>

        <table>
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Grade</th>
                    @php
                        $feeCategories = [];
                        foreach($invoice->lineItems as $item) {
                            if($item->fee_breakdown) {
                                foreach(array_keys($item->fee_breakdown) as $category) {
                                    if(!in_array($category, $feeCategories)) {
                                        $feeCategories[] = $category;
                                    }
                                }
                            }
                        }
                        sort($feeCategories);
                    @endphp
                    @foreach($feeCategories as $category)
                        <th class="text-right">{{ $category }}</th>
                    @endforeach
                    <th class="text-right total-header">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->lineItems as $item)
                    <tr>
                        <td class="student-name">{{ $item->student_name }}</td>
                        <td class="grade">{{ $item->grade_name }}</td>
                        @foreach($feeCategories as $category)
                            <td class="amount">
                                @if(isset($item->fee_breakdown[$category]) && $item->fee_breakdown[$category] > 0)
                                    KSh {{ number_format($item->fee_breakdown[$category], 2) }}
                                @else
                                    -
                                @endif
                            </td>
                        @endforeach
                        <td class="total-amount">KSh {{ number_format($item->total_amount, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="clearfix">
            <div class="totals-section">
                <div class="totals-box">
                    <div class="total-row">
                        <div class="total-label">Subtotal:</div>
                        <div class="total-value">KSh {{ number_format($invoice->subtotal_amount, 2) }}</div>
                    </div>

                    @if($invoice->discount_amount > 0)
                        <div class="total-row">
                            <div class="total-label">Discount ({{ $invoice->discount_percentage }}%):</div>
                            <div class="total-value discount">- KSh {{ number_format($invoice->discount_amount, 2) }}</div>
                        </div>
                    @endif

                    <div class="total-row main-total">
                        <div class="total-label">Total Amount:</div>
                        <div class="total-value">KSh {{ number_format($invoice->total_amount, 2) }}</div>
                    </div>

                    @if($invoice->amount_paid > 0)
                        <div class="total-row">
                            <div class="total-label">Amount Paid:</div>
                            <div class="total-value green">KSh {{ number_format($invoice->amount_paid, 2) }}</div>
                        </div>

                        <div class="total-row main-total">
                            <div class="total-label">Balance Due:</div>
                            <div class="total-value {{ $invoice->balance_due > 0 ? 'red' : 'green' }}">
                                KSh {{ number_format($invoice->balance_due, 2) }}
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Payment History Section -->
        @if($invoice->payments && $invoice->payments->count() > 0)
            <div class="payment-section">
                <div class="payment-header">💰 Payment History</div>

                <table class="payment-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Reference</th>
                            <th class="text-right">Amount</th>
                            <th>Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoice->payments as $payment)
                            <tr>
                                <td>{{ \Carbon\Carbon::parse($payment->payment_date)->format('M d, Y') }}</td>
                                <td style="text-transform: capitalize;">{{ str_replace('_', ' ', $payment->payment_method) }}</td>
                                <td>{{ $payment->reference_number ?? '-' }}</td>
                                <td class="amount" style="color: #16a34a; font-weight: bold;">
                                    KSh {{ number_format($payment->amount, 2) }}
                                </td>
                                <td>{{ $payment->recordedBy->name ?? 'System' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer-generated invoice. For any queries, please contact the school administration.</p>
            <p style="margin-top: 8px;">Generated on {{ \Carbon\Carbon::now()->format('F d, Y \a\t h:i A') }}</p>
        </div>
    </div>
</body>
</html>

