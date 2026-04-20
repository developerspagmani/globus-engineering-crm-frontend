import { NextRequest, NextResponse } from 'next/server';

// Mock storage for reminder states (in production, this would be a database)
const reminderStates: Record<string, { enabled: boolean; lastChecked?: string }> = {};

// GET /api/invoices/[id]/reminder-status - Get reminder status for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const { id: invoiceId } = await params;

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Return reminder state or default to true (enabled by default)
    const reminderState = reminderStates[`${company_id}-${invoiceId}`] || { enabled: true };

    return NextResponse.json(reminderState);
  } catch (error) {
    console.error('Error fetching reminder status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder status' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id]/reminder-status - Update reminder status for an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { company_id, enabled } = body;
    const { id: invoiceId } = await params;

    if (!company_id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Company ID and enabled status are required' },
        { status: 400 }
      );
    }

    // Update reminder state
    reminderStates[`${company_id}-${invoiceId}`] = {
      enabled,
      lastChecked: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      enabled,
      message: `Email reminders ${enabled ? 'enabled' : 'disabled'} for invoice ${invoiceId}`,
    });
  } catch (error) {
    console.error('Error updating reminder status:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder status' },
      { status: 500 }
    );
  }
}
