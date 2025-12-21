<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Demo Booking Request</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0b1a34 0%, #1e3a5f 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .info-section {
            background-color: #f9fafb;
            border-left: 4px solid #f97316;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-row {
            margin: 10px 0;
        }
        .info-label {
            font-weight: bold;
            color: #0b1a34;
            display: inline-block;
            width: 140px;
        }
        .info-value {
            color: #555;
        }
        .message-box {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .message-box h3 {
            margin-top: 0;
            color: #0b1a34;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .badge {
            display: inline-block;
            background-color: #f97316;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 New Demo Booking Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">SchoolMS Platform</p>
        </div>

        <div class="content">
            <p style="font-size: 16px; color: #0b1a34;">
                <strong>A new demo booking request has been submitted!</strong>
            </p>

            <div class="info-section">
                <h3 style="margin-top: 0; color: #0b1a34;">Contact Information</h3>
                
                <div class="info-row">
                    <span class="info-label">👤 Name:</span>
                    <span class="info-value">{{ $bookingData['name'] }}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">📧 Email:</span>
                    <span class="info-value">
                        <a href="mailto:{{ $bookingData['email'] }}" style="color: #f97316; text-decoration: none;">
                            {{ $bookingData['email'] }}
                        </a>
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">📱 Phone:</span>
                    <span class="info-value">
                        <a href="tel:{{ $bookingData['phone'] }}" style="color: #f97316; text-decoration: none;">
                            {{ $bookingData['phone'] }}
                        </a>
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">🏫 School Name:</span>
                    <span class="info-value">{{ $bookingData['school_name'] }}</span>
                </div>
            </div>

            <div class="info-section">
                <h3 style="margin-top: 0; color: #0b1a34;">Preferred Schedule</h3>
                
                <div class="info-row">
                    <span class="info-label">📅 Date:</span>
                    <span class="info-value">
                        {{ \Carbon\Carbon::parse($bookingData['date'])->format('l, F j, Y') }}
                        <span class="badge">{{ \Carbon\Carbon::parse($bookingData['date'])->diffForHumans() }}</span>
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">🕐 Time:</span>
                    <span class="info-value">{{ $bookingData['time'] }}</span>
                </div>

                @if(!empty($bookingData['meet_link']))
                <div class="info-row" style="background-color: #f0fdf4; border-left: 4px solid #22c55e;">
                    <span class="info-label">🎥 Google Meet Link:</span>
                    <span class="info-value">
                        <a href="{{ $bookingData['meet_link'] }}" style="color: #15803d; text-decoration: none; font-weight: bold;">
                            Join Meeting
                        </a>
                    </span>
                </div>
                @endif
            </div>

            @if(!empty($bookingData['message']))
            <div class="message-box">
                <h3>💬 Additional Message</h3>
                <p style="margin: 0; white-space: pre-wrap;">{{ $bookingData['message'] }}</p>
            </div>
            @endif

            <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 4px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af;">
                    <strong>⚡ Action Required:</strong> Please reach out to this prospect within 24 hours to confirm the demo schedule. The Google Meet link has been automatically created and shared with the client.
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 5px 0;">
                This email was sent from the SchoolMS Demo Booking System
            </p>
            <p style="margin: 5px 0; color: #999;">
                Submitted on {{ now()->format('F j, Y \a\t g:i A') }}
            </p>
        </div>
    </div>
</body>
</html>

