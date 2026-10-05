import { NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { AuditService } from '@/lib/audit-service';

export async function GET() {
  try {
    const projectDir = getProjectDir();
    const auditService = new AuditService(projectDir);
    const auditLogs = auditService.getAuditLogs(50);
    const compliance = auditService.getComplianceStatus();
    return NextResponse.json({ auditLogs, compliance, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch audit data' }, { status: 500 });
  }
}
