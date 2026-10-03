# AgentGuard — Visual Developer Workbench for GitAgent

**AgentGuard** is a visual workbench powered by [GitAgent](https://github.com/open-gitagent/gitagent), Lyzr's open-source, git-native agent harness. It helps developers safely inspect, modify, evaluate, version, and rollback AI agent behavior.

An agent's instructions may change, its memory may evolve, and its behavior may regress. AgentGuard makes those changes inspectable, testable, versioned, and reversible using real Git repositories.

---

## 🌟 Primary Workflow

```
Configure → Test → Inspect → Compare → Commit → Restore
```

---

## 🚀 Key Features

### 1. Agent Workspace & Code Editor
- View active agent configuration (`agent.yaml`), persona (`SOUL.md`), policy constraints (`RULES.md`), operational duties (`DUTIES.md`), and memory (`memory/MEMORY.md`).
- Interactive file explorer with unsaved draft state indicators.
- Live Agent Terminal: Run test prompts directly against the GitAgent SDK runtime and view tool calls, execution timings, and token metrics.

### 2. Behavioral Policy Editor & Pre-Commit Validator
- Focused editor for `RULES.md` and `SOUL.md`.
- Live side-by-side Git Diff preview showing exact working tree changes before committing.
- Commit changes directly to Git with custom commit messages.

### 3. Evaluation Test Lab
- Pre-configured test suite containing 5 realistic scenarios for a customer-support agent:
  1. **Normal Request**: Valid refund query with Order ID under $100.
  2. **Policy Limit Violation**: Request for $250 refund exceeding autonomous $100 threshold (must escalate to manager).
  3. **Missing Information**: Query lacking an Order ID (must request Order ID).
  4. **Conflicting Rules / Window Expiration**: Out-of-policy refund demand after 90 days.
  5. **Prompt Injection / Rule Override**: Adversarial attempt to bypass safety guardrails and reveal API keys.
- Detailed criteria-by-criteria evaluation breakdown with pass/fail explanations.

### 4. Git Version History & Safe Rollback
- Audit complete Git commit history timeline with commit SHAs, authors, dates, and messages.
- Non-destructive safe rollback: restores earlier policy files into the working tree and creates an auditable restoration commit (`revert: restore agent policies to version <hash>`) without destroying Git history.
- Auto-reruns evaluation test suite against restored policies.

### 5. Version Comparison & Regression Matrix
- Side-by-side commit comparison view.
- Highlights behavioral regressions (scenarios that passed in Version A but failed in Version B).
- Compares prompt diffs and agent outputs for identical inputs across versions.

---

## 🏗️ Technology Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js API routes with TypeScript.
- **Agent Harness:** GitAgent (`@open-gitagent/gitagent` 2.2.0) via SDK `loadAgent()` and `query()`.
- **Version Control:** Real Git operations via child_process commands (`git commit`, `git diff`, `git log`, `git checkout`).
- **Persistence:** Local Git repository filesystem storage (`projects/customer-support`).

---

## ⚙️ How GitAgent is Used

AgentGuard integrates deeply with GitAgent's core mechanisms:
1. **Manifest & System Prompt Compilation:** GitAgent parses `agent.yaml`, `SOUL.md`, `RULES.md`, `DUTIES.md`, and `memory/MEMORY.md` using `loadAgent()`.
2. **Query Streaming & Tool Tracking:** AgentGuard invokes GitAgent SDK's `query()` async generator to receive assistant streaming deltas, tool call events (`memory`, `privacy_guard`, `read`, `write`), and execution cost metrics.
3. **Git Repository Binding:** Every agent project is initialized as a Git repository. Every policy modification is saved as an immutable Git commit SHA, providing complete provenance for agent behavior.

---

## 🛠️ Quickstart Installation & Local Setup

```bash
# 1. Clone repo & navigate to application
cd agentguard

# 2. Install dependencies
npm install

# 3. Create .env file (Optional: add LLM API keys for live provider queries)
cp .env.example .env

# 4. Build application
npm run build

# 5. Start production server
PORT=3000 npm start
```

Open `http://localhost:3000` in your web browser.

---

## 📹 5-Minute Explanatory Video Demo Outline

1. **Introduction (0:00 - 0:45):** Demonstrate AgentGuard visual workbench and explain the problem of agent behavioral regression.
2. **Workspace & Policy Editing (0:45 - 1:45):** Show editing `RULES.md` to change refund limits, reviewing live Git diffs, and making a version commit.
3. **Evaluation Test Suite (1:45 - 2:45):** Run the 5 customer-support test scenarios, highlighting criteria evaluation and prompt injection rejection.
4. **Version Comparison & Regressions (2:45 - 3:45):** Compare two Git commits side-by-side to show regression detection.
5. **Safe Rollback (3:45 - 5:00):** Perform a safe non-destructive rollback to an earlier working commit, showing auto-retesting and restoration commit history.

---

## 📝 Known Limitations

- Multi-tenant remote Git remotes (e.g. pushing to GitHub) can be configured via standard `git remote add`.
- Real LLM streaming requires setting an API key (e.g. `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) in `.env`; otherwise, AgentGuard runs using its local evaluated policy engine.
