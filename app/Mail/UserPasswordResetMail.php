<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserPasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public string $password,
        public string $loginUrl
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Password Has Been Reset',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildEmailHtml(),
        );
    }

    /**
     * Build the HTML email content
     */
    protected function buildEmailHtml(): string
    {
        $schoolName = $this->user->school ? $this->user->school->name : 'School Management System';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                Hello <strong>{$this->user->name}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Your password for <strong>{$schoolName}</strong> has been reset by a system administrator.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Your New Login Credentials</h3>
                
                <div style="margin: 10px 0;">
                    <strong style="color: #6b7280;">Email:</strong>
                    <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; margin-top: 5px; font-family: monospace; font-size: 14px; color: #111827;">
                        {$this->user->email}
                    </div>
                </div>
                
                <div style="margin: 10px 0;">
                    <strong style="color: #6b7280;">New Password:</strong>
                    <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; margin-top: 5px; font-family: monospace; font-size: 16px; color: #111827; letter-spacing: 1px;">
                        {$this->password}
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{$this->loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Login to Your Account
                </a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>⚠️ Security Notice:</strong> For your security, please change this password immediately after logging in.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                If you did not request this password reset, please contact your system administrator immediately.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 5px 0;">This is an automated message from {$schoolName}</p>
            <p style="margin: 5px 0;">Please do not reply to this email</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

