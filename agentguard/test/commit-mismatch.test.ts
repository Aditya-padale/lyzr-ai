import { getProjectDir } from '../src/lib/project-config';
import { GitService } from '../src/lib/git-service';
import { GitAgentService } from '../src/lib/gitagent-service';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

async function runCommitMismatchTest() {
  console.log('=== Running AgentGuard Commit Mismatch & Version History Test ===\n');

  // Requirement 1: Verify absolute path of customer-support repository
  const projectDir = getProjectDir();
  console.log('[1/5] Verifying repository absolute path:', projectDir);
  assert(fs.existsSync(projectDir), `Repository path must exist at ${projectDir}`);
  assert(projectDir.endsWith(path.join('projects', 'customer-support')), 'Path must resolve to projects/customer-support');

  const gitService = new GitService(projectDir);
  const gitAgentService = new GitAgentService(projectDir);

  // Store initial commit SHA for clean teardown
  const initialHead = gitService.getCurrentCommitHash();
  console.log('✔ Repository verified at HEAD:', initialHead.slice(0, 7));

  try {
    // Requirement 6 & 8: Verify empty working tree status (no fabricated pending changes)
    console.log('\n[2/5] Testing clean working tree status & empty commit behavior...');

    // If there were any leftover uncommitted changes, stash or reset them
    const initialDiffs = gitService.getUncommittedDiff();
    console.log('Initial uncommitted diff count:', initialDiffs.length);

    if (initialDiffs.length === 0) {
      const emptyCommitRes = gitService.commit('test: attempt commit on clean tree');
      assert.strictEqual(emptyCommitRes.success, false, 'Commit on clean tree must return success=false');
      assert(
        emptyCommitRes.error?.includes('No changes to commit in repository:'),
        `Error message must explain no changes and include repo path. Received: ${emptyCommitRes.error}`
      );
      assert(
        emptyCommitRes.error?.includes(projectDir),
        `Error message must include actual repo directory ${projectDir}`
      );
      console.log('✔ Clean working tree correctly reported 0 pending changes and returned repo path explanation:');
      console.log('  ', emptyCommitRes.error);
    }

    // Requirement 4 & 5: Test modifying agent policy files and committing
    console.log('\n[3/5] Modifying agent files (RULES.md & agent.yaml) to create pending changes...');

    const originalRules = fs.readFileSync(path.join(projectDir, 'RULES.md'), 'utf-8');
    const updatedRules = `${originalRules.trim()}\n# Test Rule Change ${Date.now()}\n`;

    gitAgentService.saveAgentFile('RULES.md', updatedRules);

    // Requirement 4: Use git status --porcelain / real git diff to inspect pending changes
    const pendingDiffs = gitService.getUncommittedDiff();
    console.log(`Pending changes detected (${pendingDiffs.length} files):`, pendingDiffs.map(d => d.path));

    assert(pendingDiffs.length >= 1, 'Pending changes must reflect saved file modification');
    assert(pendingDiffs.some(d => d.path === 'RULES.md'), 'RULES.md must be listed in pending changes');

    // Requirement 5 & 7: Stage intended files and create real Git commit, returning real commit SHA
    console.log('\n[4/5] Executing git commit via GitService...');
    const commitMsg = `test: update policy rules timestamp ${Date.now()}`;
    const commitRes = gitService.commit(commitMsg);

    assert.strictEqual(commitRes.success, true, 'Commit operation must succeed when pending changes exist');
    assert(commitRes.hash, 'Commit result must return actual commit SHA');
    assert.strictEqual(commitRes.hash.length, 40, 'Commit SHA must be full 40-character hex string');
    console.log('✔ Real Git commit created successfully with SHA:', commitRes.hash);

    // Requirement 7: Refresh and verify history from real Git log
    const commitsAfter = gitService.getCommits();
    const headCommit = commitsAfter[0];
    assert.strictEqual(headCommit.hash, commitRes.hash, 'HEAD commit in git log must match commit result SHA');
    assert.strictEqual(headCommit.message, commitMsg, 'HEAD commit message must match');
    assert.strictEqual(gitService.getUncommittedDiff().length, 0, 'Working tree must be clean after commit');

    console.log('✔ Git log verified HEAD:', headCommit.shortHash, '-', headCommit.message);

    console.log('\n[5/5] Reverting test commit to restore repository state...');
  } finally {
    // Teardown: Restore to initial HEAD
    if (initialHead) {
      gitService.restoreToCommit(initialHead);
      console.log('✔ Restored test repository back to initial HEAD:', initialHead.slice(0, 7));
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 COMMIT MISMATCH & VERSION HISTORY TEST PASSED SUCCESSFULLY! 🎉');
  console.log('===============================================================\n');
}

runCommitMismatchTest().catch(err => {
  console.error('❌ Commit Mismatch Test Failed:', err);
  process.exit(1);
});
