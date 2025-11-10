<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            padding: 40px 20px;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .email-container {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(11, 26, 52, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #0b1a34 0%, #1a2f5a 100%);
            padding: 40px 40px 35px;
            text-align: center;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .logo-icon {
            font-size: 36px;
            margin-bottom: 12px;
            display: block;
        }
        
        .logo-subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        
        .content {
            padding: 48px 40px;
        }
        
        .greeting {
            font-size: 24px;
            color: #0b1a34;
            margin-bottom: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .message {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.7;
            margin-bottom: 32px;
        }
        
        .button-container {
            text-align: center;
            color: #ffffff;
            margin: 40px 0;
        }
        
        .button {
            display: inline-block;
            padding: 18px 48px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
            transition: all 0.3s ease;
            letter-spacing: 0.3px;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(249, 115, 22, 0.4);
        }
        
        .divider {
            text-align: center;
            margin: 32px 0;
            position: relative;
        }
        
        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e5e7eb;
        }
        
        .divider-text {
            display: inline-block;
            background: #ffffff;
            padding: 0 16px;
            position: relative;
            font-size: 13px;
            color: #9ca3af;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .alternative-link {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .alternative-link-title {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .alternative-link-url {
            font-size: 13px;
            color: #0b1a34;
            word-break: break-all;
            font-family: 'Courier New', Consolas, monospace;
            background-color: #ffffff;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            line-height: 1.6;
        }
        
        .info-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px 24px;
            margin: 32px 0;
            border-radius: 8px;
        }
        
        .info-box-content {
            display: flex;
            align-items: flex-start;
        }
        
        .info-icon {
            font-size: 24px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        
        .info-text {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
            font-weight: 500;
        }
        
        .info-text strong {
            color: #78350f;
            font-weight: 700;
        }
        
        .security-tips {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-radius: 12px;
            padding: 28px;
            margin: 32px 0;
            border: 1px solid #bfdbfe;
        }
        
        .security-tips-title {
            color: #0b1a34;
            font-weight: 700;
            margin-bottom: 16px;
            font-size: 16px;
            display: flex;
            align-items: center;
        }
        
        .security-tips-title-icon {
            font-size: 20px;
            margin-right: 10px;
        }
        
        .security-tips ul {
            margin: 0;
            padding-left: 24px;
        }
        
        .security-tips li {
            margin: 10px 0;
            color: #1e40af;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .security-tips li::marker {
            color: #3b82f6;
        }
        
        .footer {
            background: #f9fafb;
            text-align: center;
            padding: 32px 40px;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
            font-size: 13px;
            color: #6b7280;
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .footer-link {
            color: #f97316;
            text-decoration: none;
            font-weight: 600;
        }
        
        .footer-link:hover {
            text-decoration: underline;
            color: #ea580c;
        }
        
        .footer-brand {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-brand-text {
            font-size: 12px;
            color: #9ca3af;
            font-weight: 500;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .content {
                padding: 32px 24px;
            }
            
            .header {
                padding: 32px 24px 28px;
            }
            
            .footer {
                padding: 24px 24px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .message {
                font-size: 15px;
            }
            
            .button {
                padding: 16px 36px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo-icon">🏫</div>
                <div class="logo">School Management System</div>
                <p class="logo-subtitle">Islamic School • Kenyan CBC</p>
            </div>

            <!-- Content -->
            <div class="content">
                <h1 class="greeting">Hi {{ $user->name }}! 👋</h1>

                <p class="message">
                    You're receiving this email because a password reset was requested for your account. 
                    Click the button below to choose a new password.
                </p>

                <!-- CTA Button -->
                <div class="button-container">
                    <a href="{{ $resetUrl }}" class="button">
                        Reset My Password
                    </a>
                </div>

                <!-- Divider -->
                <div class="divider">
                    <span class="divider-text">Or use this link</span>
                </div>

                <!-- Alternative Link -->
                <div class="alternative-link">
                    <p class="alternative-link-title">Copy & Paste This URL:</p>
                    <div class="alternative-link-url">{{ $resetUrl }}</div>
                </div>

                <!-- Warning Box -->
                <div class="info-box">
                    <div class="info-box-content">
                        <div class="info-icon">⏰</div>
                        <div class="info-text">
                            <strong>This link expires in 60 minutes</strong> for security reasons. 
                            If it expires, you can request a new one from the login page.
                        </div>
                    </div>
                </div>

                <!-- Security Tips -->
                <div class="security-tips">
                    <div class="security-tips-title">
                        <span class="security-tips-title-icon">🔒</span>
                        Password Best Practices
                    </div>
                    <ul>
                        <li>Use at least 8 characters with mixed case letters</li>
                        <li>Include numbers and special characters (!@#$%^&*)</li>
                        <li>Avoid personal information like birthdays or names</li>
                        <li>Never share your password with anyone</li>
                        <li>Use a unique password for this account</li>
                    </ul>
                </div>

                <p class="message" style="margin-top: 32px; font-size: 14px; color: #9ca3af;">
                    If you didn't request this password reset, you can safely ignore this email. 
                    Your password will remain unchanged.
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    This is an automated message from School Management System.
                </p>
                <p class="footer-text">
                    Need help? Contact us at 
                    <a href="mailto:support@schoolms.com" class="footer-link">support@schoolms.com</a>
                </p>
                <p class="footer-text" style="margin-top: 16px;">
                    <a href="{{ config('app.url') }}" class="footer-link">{{ config('app.url') }}</a>
                </p>
                
                <div class="footer-brand">
                    <p class="footer-brand-text">
                        © {{ date('Y') }} School Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>