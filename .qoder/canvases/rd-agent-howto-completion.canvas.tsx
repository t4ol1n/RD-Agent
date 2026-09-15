import { Divider, Grid, H1, H2, Stack, Stat, Table, Text } from 'qoder/canvas';

export default function RdAgentHowtoCompletion() {
  return (
    <Stack gap={20}>
      <H1>Goal Completion Report: RD-Agent Howto</H1>
      <Text tone="secondary">
        Delivered a verified end-to-end howto guide for running RD-Agent, covering platform
        prerequisites, installation, LLM configuration, health checks, scenario entrypoints,
        and result monitoring.
      </Text>

      <Grid columns={4} gap={16}>
        <Stat value="6" label="Guide Sections Delivered" />
        <Stat value="14" label="CLI Commands Verified" />
        <Stat value="6" label="Files Inspected" />
        <Stat value="0" label="Files Modified" tone="success" />
      </Grid>

      <Divider />

      <H2>Accomplishment Summary</H2>
      <Text>
        Produced a practical RD-Agent howto walkthrough grounded in the repository's own
        documentation and code. Flagged the critical platform constraint (Linux-only, Docker
        required) with WSL2 guidance for the user's Windows environment, and warned that the
        bundled dev container is marked internal-use-only.
      </Text>

      <H2>Key Steps</H2>
      <Table
        headers={['Step', 'Action']}
        rows={[
          ['1', 'Read README.md quick start and .env.example to extract the official setup flow.'],
          ['2', 'Read the full CLI entry (rdagent/app/cli.py) to enumerate every command and flag.'],
          ['3', 'Read .devcontainer/README.md to assess whether it is usable on Windows.'],
          ['4', 'Audit turn: re-verified all howto claims against the current worktree state.'],
          ['5', 'Confirmed make dev target in Makefile and finetune README existence after a glob miss.'],
        ]}
      />

      <H2>Files Inspected (No Files Changed)</H2>
      <Table
        headers={['File', 'Purpose']}
        rows={[
          ['README.md', 'Official quick start: install, .env config, health_check, run commands, UIs.'],
          ['.env.example', 'LiteLLM backend config templates (OpenAI / Azure / DeepSeek / litellm_proxy).'],
          ['rdagent/app/cli.py', 'All CLI commands: scenarios, ui, server_ui, health_check, grade_summary, collect_info.'],
          ['Makefile', 'dev target for developer installation (pip install -e .[docs,lint,package,test]).'],
          ['.devcontainer/README.md', 'Confirmed internal-use-only; not recommended for public users.'],
          ['rdagent/app/finetune/llm/README.md', 'Confirmed existence of the FT-Agent fine-tuning guide.'],
        ]}
      />

      <H2>Verification Evidence</H2>
      <Table
        headers={['Claim', 'Evidence', 'Result']}
        rows={[
          ['All scenario + utility CLI commands exist', 'rdagent/app/cli.py: fin_factor, fin_model, fin_quant, fin_factor_report, general_model, data_science, llm_finetune, ui, server_ui, grade_summary, health_check, collect_info', 'Verified'],
          ['ui supports --port / --log-dir / --data-science', 'ui() definition in cli.py, default port 19899', 'Verified'],
          ['make dev developer setup', 'Makefile dev target (lines 69-73)', 'Verified'],
          ['.env config patterns', '.env.example matches README LiteLLM guidance', 'Verified'],
          ['Finetune guide reference', 'rdagent/app/finetune/llm/README.md exists on disk', 'Verified'],
          ['Dev container not for public use', '.devcontainer/README.md explicit warning', 'Verified'],
        ]}
      />

      <H2>Final Outcome</H2>
      <Text>
        The requested end state — an accurate, actionable RD-Agent howto — was delivered in
        conversation, and every factual claim was audited against the current repository state.
        No claim remains unverified; the goal is complete.
      </Text>

      <Text tone="secondary" size="small">
        Report generated for the "RD-Agent Howto" goal. No screenshots were produced during
        this goal, so none are included.
      </Text>
    </Stack>
  );
}
