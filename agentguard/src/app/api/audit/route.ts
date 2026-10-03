import { NextResponse } from 'next/server';
import path from 'path';
import { AuditService } from '@/lib/audit-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const auditService = new AuditService(PROJECT_DIR);
    const auditLogs = auditService.getAuditLogs(50);
    const compliance = auditService.getComplianceStatus();
    return NextResponse.json({ auditLogs, compliance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch audit data' }, { status: 500 });
  }
}
