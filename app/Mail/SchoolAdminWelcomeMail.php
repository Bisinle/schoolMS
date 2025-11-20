<?php

namespace App\Mail;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SchoolAdminWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public string $password,
        public string $loginUrl
    ) {
        //
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to ' . $this->school->name . ' - Your Admin Access',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildEmailHtml(),
        );
    }

    protected function buildEmailHtml(): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {$this->school->name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SchoolMS! 🎉</h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
                <h2 style="color: #0b1a34; margin-top: 0;">Hello {$this->school->admin_name}!</h2>
                
                <p style="color: #4b5563; line-height: 1.6;">
                    Your school management system has been successfully set up. You now have full administrative access to manage <strong>{$this->school->name}</strong>.
                </p>

                <!-- Credentials Box -->
                <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #0b1a34; margin-top: 0; margin-bottom: 15px;">Your Login Credentials</h3>
                    
                    <div style="margin: 10px 0;">
                        <strong style="color: #6b7280;">School Name:</strong>
                        <div style="color: #111827; margin-top: 5px;">{$this->school->name}</div>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <strong style="color: #6b7280;">Your Role:</strong>
                        <div style="color: #111827; margin-top: 5px;">School Administrator</div>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <strong style="color: #6b7280;">Email:</strong>
                        <div style="color: #111827; margin-top: 5px;">{$this->school->admin_email}</div>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <strong style="color: #6b7280;">Password:</strong>
                        <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; margin-top: 5px; font-family: monospace; font-size: 16px; color: #111827; letter-spacing: 1px;">
                            {$this->password}
                        </div>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <strong style="color: #6b7280;">Login URL:</strong>
                        <div style="margin-top: 5px;">
                            <a href="{$this->loginUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">{$this->loginUrl}</a>
                        </div>
                    </div>
                </div>

                <!-- Login Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{$this->loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                        Login to Your Dashboard
                    </a>
                </div>

                <!-- Warning Box -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>⚠️ Important:</strong> Please change your password immediately after logging in for security purposes.
                    </p>
                </div>

                <!-- Features List -->
                <div style="margin: 25px 0;">
                    <p style="color: #111827; font-weight: bold; margin-bottom: 10px;">You have full administrative access to manage:</p>
                    <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Students and Guardians</li>
                        <li>Teachers and Staff</li>
                        <li>Classes and Subjects</li>
                        <li>Attendance and Grades</li>
                        <li>Exams and Reports</li>
                        <li>School Settings</li>
                    </ul>
                </div>

                <p style="color: #4b5563; line-height: 1.6; margin-top: 25px;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                    This is an automated message from <strong>SchoolMS</strong>
                </p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                    Need help? Contact support at <a href="mailto:support@schoolms.com" style="color: #667eea; text-decoration: none;">support@schoolms.com</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    public function attachments(): array
    {
        return [];
    }
}

