<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Request Received</title>
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
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .success-icon {
            text-align: center;
            margin-bottom: 30px;
        }
        .success-icon svg {
            width: 80px;
            height: 80px;
        }
        .message-box {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .message-box h2 {
            margin-top: 0;
            color: #15803d;
            font-size: 20px;
        }
        .message-box p {
            margin: 10px 0;
            color: #166534;
            line-height: 1.8;
        }
        .info-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            margin-top: 0;
            color: #1e40af;
            font-size: 18px;
        }
        .info-box p {
            margin: 8px 0;
            color: #1e3a8a;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .footer p {
            margin: 5px 0;
        }
        .contact-info {
            margin-top: 15px;
        }
        .contact-info a {
            color: #f97316;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Request Received!</h1>
            <p>Thank you for your interest in SchoolMS</p>
        </div>

        <div class="content">
            <div class="message-box">
                <h2>Hi {{ $bookingData['name'] }},</h2>
                <p>
                    Thank you for requesting a demo of SchoolMS for <strong>{{ $bookingData['school_name'] }}</strong>.
                </p>
                <p>
                    We have successfully received your demo booking request and our team will review it shortly.
                </p>
                <p>
                    <strong>We will get back to you within 24 hours</strong> to confirm your preferred schedule and provide further details.
                </p>
            </div>

            <div class="info-box">
                <h3>📅 Your Scheduled Demo</h3>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($bookingData['date'])->format('l, F j, Y') }}</p>
                <p><strong>Time:</strong> {{ $bookingData['time'] }}</p>
            </div>

            @if(!empty($bookingData['meet_link']))
            <div style="margin-top: 20px; padding: 25px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; border: 2px solid #22c55e; text-align: center;">
                <h3 style="margin-top: 0; color: #15803d; font-size: 20px;">🎥 Your Google Meet Link is Ready!</h3>
                <p style="margin: 10px 0; color: #166534;">Click the button below to join the demo at your scheduled time:</p>
                <a href="{{ $bookingData['meet_link'] }}" style="display: inline-block; margin-top: 15px; padding: 15px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Join Google Meet
                </a>
                <p style="margin-top: 15px; font-size: 12px; color: #166534;">
                    💡 Save this link! You can use it to join the demo at your scheduled time.
                </p>
            </div>
            @endif

            <div style="margin-top: 30px; padding: 20px; background-color: #fff7ed; border-radius: 4px; border-left: 4px solid #f97316;">
                <p style="margin: 0; color: #9a3412;">
                    <strong>💡 What's Next?</strong><br>
                    Our team will reach out to you via email or phone to confirm the demo schedule and answer any questions you may have about SchoolMS. The Google Meet link above is ready for your scheduled demo session.
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin-bottom: 15px; font-size: 16px; color: #333;">
                <strong>Need immediate assistance?</strong>
            </p>
            <div class="contact-info">
                <p>📧 Email: <a href="mailto:bisinleabdi@gmail.com">bisinleabdi@gmail.com</a></p>
                <p style="margin-top: 20px; color: #999; font-size: 12px;">
                    This is an automated confirmation email from SchoolMS
                </p>
            </div>
        </div>
    </div>
</body>
</html>

