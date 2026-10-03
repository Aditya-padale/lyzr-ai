import fs from 'fs';
import path from 'path';
import { AuditEntry, ComplianceStatus } from './types';

export class AuditService {
  private projectDir: string;
  private auditFile: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    const gitagentDir = path.join(projectDir, '.gitagent');
    if (!fs.existsSync(gitagentDir)) {
      fs.mkdirSync(gitagentDir, { recursive: true });
    }
    this.auditFile = path.join(gitagentDir, 'audit.jsonl');
  }

  public logEvent(action: AuditEntry['action'], details: string, commitHash?: string, branch?: string, author = 'Developer'): AuditEntry {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      author,
      details,
      commitHash,
      branch,
    };

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditFile, line, 'utf-8');
    return entry;
  }

  public getAuditLogs(limit = 50): AuditEntry[] {
    if (!fs.existsSync(this.auditFile)) return [];
    try {
      const raw = fs.readFileSync(this.auditFile, 'utf-8');
      const lines = raw.split('\n').filter(Boolean);
      const entries: AuditEntry[] = [];
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // ignore corrupted lines
        }
      }
      return entries.reverse().slice(0, limit);
    } catch {
      return [];
    }
  }

  public getComplianceStatus(): ComplianceStatus {
    const rulesPath = path.join(this.projectDir, 'RULES.md');
    const warnings: ComplianceStatus['warnings'] = [];

    if (!fs.existsSync(rulesPath)) {
      warnings.push({
        ruleId: 'CMP-001',
        severity: 'high',
        message: 'Missing RULES.md file. Agent is operating without explicit safety rules.',
      });
      return { hasWarnings: true, warnings };
    }

    const rulesText = fs.readFileSync(rulesPath, 'utf-8');

    if (!rulesText.toLowerCase().includes('refund')) {
      warnings.push({
        ruleId: 'CMP-002',
        severity: 'medium',
        message: 'RULES.md lacks clear financial/refund policy boundaries.',
      });
    }

    if (!rulesText.toLowerCase().includes('pii') && !rulesText.toLowerCase().includes('privacy') && !rulesText.toLowerCase().includes('credit card')) {
      warnings.push({
        ruleId: 'CMP-003',
        severity: 'high',
        message: 'No Data Privacy guardrail detected in RULES.md (PII protection rule recommended).',
      });
    }

    if (!rulesText.toLowerCase().includes('override') && !rulesText.toLowerCase().includes('injection') && !rulesText.toLowerCase().includes('safety')) {
      warnings.push({
        ruleId: 'CMP-004',
        severity: 'medium',
        message: 'Prompt injection defense rule missing from RULES.md.',
      });
    }

    return {
      hasWarnings: warnings.length > 0,
      warnings,
    };
  }
}
