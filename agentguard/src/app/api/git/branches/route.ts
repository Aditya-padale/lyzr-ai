import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitService } from '@/lib/git-service';
import { AuditService } from '@/lib/audit-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const gitService = new GitService(PROJECT_DIR);
    const branches = gitService.getBranches();
    const currentBranch = gitService.getCurrentBranch();
    return NextResponse.json({ branches, currentBranch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, branchName } = body;

    if (!branchName) {
      return NextResponse.json({ error: 'branchName is required' }, { status: 400 });
    }

    const gitService = new GitService(PROJECT_DIR);
    const auditService = new AuditService(PROJECT_DIR);

    if (action === 'create') {
      const res = gitService.createBranch(branchName);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to create branch' }, { status: 400 });
      }
      auditService.logEvent('branch_create', `Created experimental feature branch '${res.branchName}'`, gitService.getCurrentCommitHash(), res.branchName);
      return NextResponse.json({ success: true, branchName: res.branchName, currentBranch: gitService.getCurrentBranch() });
    }

    if (action === 'checkout') {
      const res = gitService.checkoutBranch(branchName);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to checkout branch' }, { status: 400 });
      }
      return NextResponse.json({ success: true, currentBranch: gitService.getCurrentBranch() });
    }

    return NextResponse.json({ error: 'Invalid action specified. Expected create or checkout.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Branch operation failed' }, { status: 500 });
  }
}
