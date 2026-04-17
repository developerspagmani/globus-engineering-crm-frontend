import { NextRequest, NextResponse } from 'next/server';

// Mock storage for invoices and reminder states
// In production, this would connect to your actual database
const invoices: any[] = [];
const reminderStates: Record<string, { enabled: boolean }> = {};

// Helper function to calculate reminder dates based on DC date
function calculateReminderDates(dcDate: string) {
  if (!dcDate) return null;
  
  const dc = new Date(dcDate);
  const today = new Date();
  
  return {
    '30_days': new Date(dc.getTime() - (30 * 24 * 60 * 60 * 1000)),
    '1_week': new Date(dc.getTime() - (7 * 24 * 60 * 60 * 1000)),
    '1_day': new Date(dc.getTime() - (1 * 24 * 60 * 60 * 1000)),
    'today': dc,
  };
}

// Helper function to check if today matches a reminder date
function shouldSendReminderToday(targetDate: Date): boolean {
  const today = new Date();
  const target = new Date(targetDate);
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetNormalized = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  
  return todayNormalized.getTime() === targetNormalized.getTime();
}

// Helper function to generate email content
function generateEmailContent(invoice: any) {
  return {
    subject: `Payment Reminder - Invoice ${invoice.invoiceNumber}`,
    body: `
Dear ${invoice.customerName},

This is a friendly reminder that your invoice ${invoice.invoiceNumber} for the amount of ₹${invoice.grandTotal?.toLocaleString() || '0'} is due.

Delivery Challan Details:
- DC Number: ${invoice.dcNo || 'N/A'}
- DC Date: ${invoice.dcDate || 'N/A'}
- Invoice Amount: ₹${invoice.grandTotal?.toLocaleString() || '0'}

Please ensure timely payment to avoid any service interruptions. If you have already made the payment, please disregard this notice.

For any queries or assistance, please contact our finance department.

Best regards,
Globus Engineering Team
    `.trim(),
  };
}

// Mock email sending function
async function sendEmail(to: string, subject: string, body: string) {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('📧 Email sent:', {
    to,
    subject,
    timestamp: new Date().toISOString(),
  });
  
  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  return true;
}

// GET /api/email-reminder-service - Process and send pending reminders
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting email reminder service check...');
    
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    
    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get all invoices with enabled reminders for this company
    const enabledReminders = Object.entries(reminderStates)
      .filter(([key, state]) => 
        key.startsWith(`${company_id}-`) && state.enabled
      )
      .map(([key]) => key.split('-')[1]); // Extract invoice ID

    console.log(`📊 Found ${enabledReminders.length} enabled reminders for company ${company_id}`);

    let sentCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    // Process each enabled reminder
    for (const invoiceId of enabledReminders) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice || !invoice.dcDate) {
        console.log(`⚠️ Skipping invoice ${invoiceId}: No invoice or DC date found`);
        continue;
      }

      const reminderDates = calculateReminderDates(invoice.dcDate);
      
      // Check each reminder type
      for (const [reminderType, targetDate] of Object.entries(reminderDates)) {
        if (!targetDate) continue;
        
        if (shouldSendReminderToday(targetDate)) {
          try {
            console.log(`📧 Sending ${reminderType} reminder for invoice ${invoiceId}`);
            
            const emailContent = generateEmailContent(invoice);
            const customerEmail = `${invoice.customerName?.toLowerCase().replace(/\s+/g, '.')}@example.com`; // Mock email
            
            const success = await sendEmail(
              customerEmail,
              emailContent.subject,
              emailContent.body
            );

            if (success) {
              sentCount++;
              results.push({
                invoiceId,
                reminderType,
                status: 'sent',
                timestamp: new Date().toISOString(),
                customerEmail,
              });
            } else {
              failedCount++;
              results.push({
                invoiceId,
                reminderType,
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: 'Email service unavailable',
              });
            }
          } catch (error) {
            failedCount++;
            console.error(`❌ Failed to send ${reminderType} reminder for invoice ${invoiceId}:`, error);
            results.push({
              invoiceId,
              reminderType,
              status: 'failed',
              timestamp: new Date().toISOString(),
              error: String(error),
            });
          }
        }
      }
    }

    console.log(`✅ Email reminder service completed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return NextResponse.json({
      success: true,
      processed: enabledReminders.length,
      sent: sentCount,
      failed: failedCount,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Email reminder service error:', error);
    return NextResponse.json(
      { 
        error: 'Email reminder service failed',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/email-reminder-service/sync - Sync invoice data (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoices: invoiceData, company_id } = body;
    
    if (!company_id || !Array.isArray(invoiceData)) {
      return NextResponse.json(
        { error: 'Company ID and invoice data array are required' },
        { status: 400 }
      );
    }

    // Clear existing invoices and add new ones
    invoices.length = 0;
    invoices.push(...invoiceData);
    
    console.log(`📊 Synced ${invoiceData.length} invoices for company ${company_id}`);

    return NextResponse.json({
      success: true,
      synced: invoiceData.length,
      message: 'Invoice data synced successfully',
    });
    
  } catch (error) {
    console.error('❌ Invoice sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync invoice data' },
      { status: 500 }
    );
  }
}
