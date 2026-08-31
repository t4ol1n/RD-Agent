# Workflow Loop Engine

The loop engine is what turns "an R&D idea" into a durable, resumable, observable process. It lives in [`rdagent/utils/workflow/`](../../../../rdagent/utils/workflow) (`LoopBase`, `LoopMeta`, `WorkflowTracker`, `wait_retry`) and is specialized for R&D by [`RDLoop`](../../../../rdagent/components/workflow/rd_loop.py) in `rdagent/components/workflow`.

## `LoopMeta` — declarative step collection

A metaclass that **auto-discovers steps**: any public, non-underscore, callable attribute declared on a `LoopBase` subclass becomes a step, in declaration order, merged with steps inherited from base classes (`load`/`dump` are excluded). The resulting `steps: list[str]` drives scheduling. This is why a scenario only needs to define methods like `coding`, `running`, `feedback`, `record` — no manual pipeline registration.

## `LoopBase` — async step scheduler

Core state:

| Member | Meaning |
|--------|---------|
| `loop_idx` / `step_idx[li]` | Progress: next loop to kick off / next step per loop |
| `loop_prev_out[li][step_name]` | Output of each step; steps read the dict of previous outputs (`prev_out`) |
| `loop_trace[li]` | `LoopTrace` records (start/end time, step idx) per loop |
| `queue` | asyncio queue coupling `kickoff_loop` with worker tasks |
| `semaphores` | Per-step concurrency limits from `RD_AGENT_SETTINGS.step_semaphore` |

Runtime model (`run(step_n, loop_n, all_duration)`):

1. `kickoff_loop()` starts new loops (step 0 is assumed to be experiment generation) until `loop_n` is exhausted.
2. `get_max_parallel()` worker coroutines (`execute_loop`) pull loop ids from the queue and run remaining steps.
3. `_run_step(li)` executes one step:
   - sync/async functions auto-detected; if parallelism is on, sync steps run in a `ProcessPoolExecutor` (deep-copied inputs);
   - wrapped in `logger.tag(f"Loop_{li}.{name}")` so all logging is attributed;
   - **error policy**: exceptions in `skip_loop_error` jump to `feedback` (or the configured `skip_loop_error_stepname`) and record `_EXCEPTION`; exceptions in `withdraw_loop_error` roll back to the previous loop's session (`withdraw_loop`) and raise `LoopResumeError` to restart all coroutines;
   - **on success** the step output is stored, the trace appended, and a **session snapshot** pickled to `<trace_path>/__session__/{li}/{si}_{name}`.
4. Termination: `step_n` budget, `loop_n` budget, or global `RDAgentTimer` timeout raise `LoopTerminationError`; `kill_subprocesses()` then terminates lingering executor children (coroutine loops don't reap them automatically).

Concurrency notes:

- `feedback` and `record` steps are always serialized (semaphore = 1) to keep trace selection (`(-1,)` latest-SOTA) and DAG recording consistent.
- `record` is expected to be the last step and the only one mutating shared state.

## Session store / resume / checkout

- `dump(path)` pickles the whole loop object (minus unpicklable queue/semaphore/pbar) after updating the remaining timer.
- `load(path, checkout, replace_timer)` restores a session; if `path` is a directory it picks the latest `{li}/{si}_{name}` snapshot.
- `checkout=True` re-uses the original trace folder and **truncates** sessions/logs recorded after the restored point (`truncate_session_folder`, `logger.truncate_storages`) — this is what `--checkout` on CLI commands does.
- `checkout=<new path>` forks the session into a new trace directory.
- Timer handling: `replace_timer=True` continues the saved countdown (`restart_by_remain_time`), enabling time-budgeted runs to survive restarts.

## `RDLoop` — the R&D specialization

[`rdagent/components/workflow/rd_loop.py`](../../../../rdagent/components/workflow/rd_loop.py) wires the standard five steps from configuration (`BasePropSetting` in [`conf.py`](../../../../rdagent/components/workflow/conf.py)):

- Constructor resolves class paths via `import_class`: `scen`, `hypothesis_gen`, `hypothesis2experiment`, `coder`, `runner`, `summarizer`, and creates the `Trace`.
- Steps: `direct_exp_gen` (propose + convert, gated on unfinished-loop count for parallelism), `coding`, `running`, `feedback`, `record`.
- **Human-in-the-loop**: if `_set_interactor(request_q, response_q)` was called (the Flask server does this), `_interact_init_params`, `_interact_hypo`, and `_interact_feedback` pause the loop to let a user edit initial features, the hypothesis, or the feedback through the web UI.
- Quant specifics: initializes `plan["features"]` from `ALPHA20` or user-provided `base_factors.json` (validated by `validate_qlib_features`).

## `BasePropSetting` — scenario wiring

The settings class every app launcher subclasses. Fields map 1:1 to loop collaborators: `scen`, `hypothesis_gen`, `hypothesis2experiment`, `coder`, `runner`, `summarizer`, `knowledge_base`, `scheduled_time`, `log_trace_path`. Example (factor loop) lives in [`rdagent/app/qlib_rd_loop/conf.py`](../../../../rdagent/app/qlib_rd_loop/conf.py).

## Supporting pieces

- `WorkflowTracker` ([`tracking.py`](../../../../rdagent/utils/workflow/tracking.py)) — logs workflow state (loop/step progress) for the UI.
- `wait_retry` ([`misc.py`](../../../../rdagent/utils/workflow/misc.py)) — retry decorator for flaky external calls.
- `RDAgentTimer` ([`rdagent/log/timer.py`](../../../../rdagent/log/timer.py)) — global countdown (`all_duration` like `"12h"`), checked between steps and inside CoSTEER evolution.

## Extension pattern

To build a new scenario loop:

```python
class MyLoop(RDLoop):
    # optional: error policies
    skip_loop_error = (CoderError, RunnerError)
    skip_loop_error_stepname = "record"

    # override any step; e.g. custom coding over multiple task types
    def coding(self, prev_out): ...
```

See [`DataScienceRDLoop`](../../../../rdagent/scenarios/data_science/loop.py) for a full example that overrides `coding`/`running`/`feedback`/`record` and adds `submit`-style behavior.
