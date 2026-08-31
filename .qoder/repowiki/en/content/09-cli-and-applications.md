# CLI & Applications (`rdagent/app`)

The `app` package contains all executable entry points. The console script `rdagent` is registered in `pyproject.toml` (`rdagent = "rdagent.app.cli:app"`) and is a [Typer](https://typer.tiangolo.com/) app defined in [`cli.py`](../../../../rdagent/app/cli.py). The CLI loads `.env` via `python-dotenv` **before** any settings class is instantiated — this ordering is essential for configuration to take effect.

## Command reference

| Command | Entry module | Purpose |
|---------|--------------|---------|
| `fin_factor` | [`qlib_rd_loop/factor.py`](../../../../rdagent/app/qlib_rd_loop/factor.py) | Qlib factor evolution loop |
| `fin_model` | [`qlib_rd_loop/model.py`](../../../../rdagent/app/qlib_rd_loop/model.py) | Qlib model evolution loop |
| `fin_quant` | [`qlib_rd_loop/quant.py`](../../../../rdagent/app/qlib_rd_loop/quant.py) | Joint factor + model loop |
| `fin_factor_report` | [`qlib_rd_loop/factor_from_report.py`](../../../../rdagent/app/qlib_rd_loop/factor_from_report.py) | Factor extraction from financial reports (`--report-folder`) |
| `general_model` | [`general_model/general_model.py`](../../../../rdagent/app/general_model/general_model.py) | Extract & implement models from a paper URL |
| `data_science` | [`data_science/loop.py`](../../../../rdagent/app/data_science/loop.py) | Kaggle/MLE-bench/medical data science loop (`--competition`) |
| `llm_finetune` | [`finetune/llm/loop.py`](../../../../rdagent/app/finetune/llm/loop.py) | FT-Agent autonomous LLM fine-tuning |
| `ui` | `cli.ui` | Streamlit trace viewer (`--data-science` for DS viewer) |
| `server_ui` | [`log/server/app.py`](../../../../rdagent/log/server/app.py) | Flask backend + Vue frontend, live runs |
| `ds_user_interact` | `cli.ds_user_interact` | Streamlit human-in-the-loop app (port 19900) |
| `grade_summary` | [`log/mle_summary.py`](../../../../rdagent/log/mle_summary.py) | Grade data-science runs against MLE-bench |
| `health_check` | [`app/utils/health_check.py`](../../../../rdagent/app/utils/health_check.py) | Verify Docker + LLM env + port 19899 availability |
| `collect_info` | [`app/utils/info.py`](../../../../rdagent/app/utils/info.py) | Environment diagnostics for bug reports |

Common loop options: `--path` (resume session), `--checkout/--no-checkout` (truncate-after-resume), `--step-n`, `--loop-n`, `--all-duration` (time budget, e.g. `12h`).

## Launcher anatomy

Each launcher is a thin layer over the loop engine — see the [wiring pattern](08-scenarios.md#wiring-pattern):

```python
# rdagent/app/qlib_rd_loop/factor.py (simplified)
def main(path=None, step_n=None, loop_n=None, all_duration=None, checkout=True):
    loop = RDLoop(FactorBasePropSetting())
    if path is not None:
        loop = RDLoop.load(path, checkout=checkout)
    loop.run(step_n=step_n, loop_n=loop_n, all_duration=all_duration)
```

Per-scenario settings classes (all `ExtendedBaseSettings`, env-overridable):

- [`qlib_rd_loop/conf.py`](../../../../rdagent/app/qlib_rd_loop/conf.py) — `FactorBasePropSetting`, `ModelBasePropSetting`, `QuantBasePropSetting`, `FactorFromReportPropSetting` (plus `prompts.yaml` templates).
- [`data_science/conf.py`](../../../../rdagent/app/data_science/conf.py) — `DataScienceBasePropSetting` (extends `KaggleBasePropSetting`); `DS_RD_SETTING` holds the many `DS_*` runtime switches.
- [`finetune/llm/conf.py`](../../../../rdagent/app/finetune/llm/conf.py) — `LLMFinetunePropSetting` (base model, target benchmark, dataset, data size limits).
- [`rl/conf.py`](../../../../rdagent/app/rl/conf.py) — `RLPostTrainingPropSetting`.

## App utilities (`app/utils/`)

- `health_check.py` — checks Docker install/run, `.env` LLM configuration, and whether the UI port is free. Flags: `--no-check-env`, `--no-check-docker`, `--no-check-ports`.
- `ws.py` / `ws_ft.py` — typer helpers to launch the data-science (or fine-tune) Docker environment for a competition and exec arbitrary commands inside it (for debugging).
- `info.py` — collects version/config info for issue reports.
- `ape.py` — experimental Automated Prompt Engineering tooling over logged LLM Q/A pairs.

## Auxiliary apps

- [`app/CI/`](../../../../rdagent/app/CI) — the **CI-fix agent** (`run.py`, `ci.ipynb`, `prompts.yaml`): analyzes failing CI jobs and proposes fixes (tree-sitter based parsing).
- [`app/benchmark/`](../../../../rdagent/app/benchmark) — factor/model benchmark evaluation entry points (`factor/analysis.py`, `factor/eval.py`, `model/eval.py`).
- [`app/finetune/llm/ui/`](../../../../rdagent/app/finetune/llm/ui) — Streamlit app visualizing fine-tuning runs and benchmark results (`app.py`, `ft_summary.py`, `benchmarks/`).
- [`app/rl/ui/`](../../../../rdagent/app/rl/ui) — Streamlit app for RL post-training runs.

## Running the UIs

```bash
# Streamlit trace viewer
rdagent ui --port 19899 --log-dir log/ --data-science

# Flask backend + Vue frontend (build first)
cd web && npm install && npm run build:flask && cd ..
rdagent server_ui --port 19899
```

Port 19899 is the default for both; verify availability with `rdagent health_check --no-check-env --no-check-docker`.
