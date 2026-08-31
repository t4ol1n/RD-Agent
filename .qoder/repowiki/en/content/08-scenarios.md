# Scenarios (`rdagent/scenarios`)

A *scenario* is a concrete R&D domain wired from core abstractions: it supplies a `Scenario` description, an `Experiment` type, proposal classes, coders/runners/summarizers, and a loop. Settings live in `rdagent/app/<scenario>/conf.py`; implementations live here.

## Data Science / Kaggle / MLE-bench — `scenarios/data_science/`

The flagship autonomous ML-engineering scenario (top MLE-bench results).

- **Loop**: [`DataScienceRDLoop`](../../../../rdagent/scenarios/data_science/loop.py) extends `RDLoop`; skips on `CoderError`/`RunnerError` (jump to `record`), withdraws on `PolicyError`. Its `coding` step iterates task families: data loading → feature engineering → model → workflow/ensemble (each backed by a dedicated CoSTEER coder from `components/coder/data_science/`).
- **Scenario classes**: [`scen/__init__.py`](../../../../rdagent/scenarios/data_science/scen/__init__.py) — `DataScienceScen` (general/medical datasets) and `KaggleScen` (Kaggle competitions); scenario text is built from competition description + data folder schema by [`scen/utils.py`](../../../../rdagent/scenarios/data_science/scen/utils.py). Selection is via env `DS_SCEN`.
- **Experiment**: `DSExperiment` ([`experiment/experiment.py`](../../../../rdagent/scenarios/data_science/experiment/experiment.py)) tracks per-stage workspaces and `pending_tasks_list`.
- **Proposal ("R")**: a rich `exp_gen` package ([`proposal/exp_gen/`](../../../../rdagent/scenarios/data_science/proposal/exp_gen)):
  - `router/` — decides which generation strategy to use;
  - `draft/` — fast initial drafts; `idea_pool.py` — reusable idea library;
  - `planner/` — multi-stage experiment planning (`DSExperimentPlan`);
  - `proposal.py` — the main LLM proposal engine (1.5k lines);
  - `select/expand.py` & `select/submit.py` — trace selection and submission logic;
  - `merge.py`, `diversity_strategy.py`, `trace_scheduler.py` — parallel/diverse exploration support;
  - `naive.py`, `package_info.py` — baseline generators.
- **Feedback**: `DSExperiment2Feedback` ([`dev/feedback.py`](../../../../rdagent/scenarios/data_science/dev/feedback.py)) + runner ([`dev/runner/`](../../../../rdagent/scenarios/data_science/dev/runner)) executes the pipeline in Docker and compares against the previous SOTA.
- **Extras**: `interactor/` (user interaction), `debug/data.py` (data debugging tools), `example/` (sample competitions + graders), `test_eval.py`.
- **Config**: `DS_RD_SETTING` in [`rdagent/app/data_science/conf.py`](../../../../rdagent/app/data_science/conf.py) (`DS_*` env vars: `DS_LOCAL_DATA_PATH`, `DS_IF_USING_MLE_DATA`, `DS_SAMPLE_DATA_BY_LLM`, `DS_CODER_ON_WHOLE_PIPELINE`, …).

## Kaggle (legacy) — `scenarios/kaggle/`

Earlier, more constrained Kaggle scenario with templated workspaces (e.g. `spaceship-titanic_template` separating `feature/` and `model/` slots), `KGScenario`, and dedicated coder/runner/feedback under `developer/`. Wired via [`rdagent/app/kaggle/`](../../../../rdagent/app/kaggle).

## Quant Finance (Qlib) — `scenarios/qlib/`

RD-Agent(Q) — factor/model joint optimization on [Qlib](https://github.com/microsoft/qlib):

- **Scenarios**: `QlibFactorScenario`, `QlibModelScenario`, `QlibQuantScenario` (joint), `QlibFactorFromReportScenario` ([`experiment/`](../../../../rdagent/scenarios/qlib/experiment)).
- **Proposals**: [`proposal/`](../../../../rdagent/scenarios/qlib/proposal) — `factor_proposal.py`, `model_proposal.py`, `quant_proposal.py`, plus `bandit.py` (explore/exploit selection).
- **Developers**: [`developer/`](../../../../rdagent/scenarios/qlib/developer) — factor/model runners that execute backtests in the Qlib conda env (`QlibCondaEnv`) and `feedback.py` summarizers reading IC/IR/backtest metrics.
- **Loaders**: `factor_experiment_loader/` — JSON and **PDF report** factor extraction (`pdf_loader.py`, 589 lines) powering `fin_factor_report`.
- **Experiment templates**: `factor_template/`, `model_template/`, `factor_data_template/` with `read_exp_res.py` result parsers; base features include `ALPHA20` from [`rdagent/utils/qlib.py`](../../../../rdagent/utils/qlib.py).

## LLM Fine-Tuning (FT-Agent) — `scenarios/finetune/`

Autonomous benchmark-driven SFT (ICML 2026 FT-Dojo paper):

- `LLMFinetuneRDLoop` ([`loop.py`](../../../../rdagent/scenarios/finetune/loop.py)) with `LLMFinetuneScen` (extends `DataScienceScen`).
- `scen/` — fine-tuning scenario description: LLaMA-Factory management (`llama_factory_manager.py`), GPU memory estimation, Docker scripts.
- `datasets/` + `download/` — dataset registry (chemcot, financeiq, …) and HuggingFace download.
- `benchmark/` — benchmark definitions and data adapters; `train/` — training runner & eval; `proposal/` — fine-tuning hypothesis/trace logic; `coder` components live in [`components/coder/finetune`](../../../../rdagent/components/coder/finetune).
- Data-science flavor of fine-tuning under [`rdagent/app/finetune/data_science/`](../../../../rdagent/app/finetune/data_science).
- Streamlit visualization app: [`rdagent/app/finetune/llm/ui/`](../../../../rdagent/app/finetune/llm/ui).

## General Model Extraction — `scenarios/general_model/`

`GeneralModelScenario` ([`scenario.py`](../../../../rdagent/scenarios/general_model/scenario.py)) — reads a paper/report, extracts model architectures, and implements them (used by `rdagent general_model`).

## RL Post-Training — `scenarios/rl/`

`RLPostTrainingScen` + `RLPostTrainingRDLoop` ([`loop.py`](../../../../rdagent/scenarios/rl/loop.py)) — reinforcement-learning post-training experiments with its own Streamlit summary UI under [`rdagent/app/rl/ui/`](../../../../rdagent/app/rl/ui).

## Shared — `scenarios/shared/`

Cross-scenario helpers (e.g. common prompt fragments/utilities).

## Wiring pattern

Every scenario follows the same recipe:

```python
class MyPropSetting(BasePropSetting):
    scen = "rdagent.scenarios.my.MyScenario"
    hypothesis_gen = "rdagent.scenarios.my.proposal.MyHypothesisGen"
    hypothesis2experiment = "rdagent.scenarios.my.MyH2E"
    coder = "rdagent.scenarios.my.MyCoder"
    runner = "rdagent.scenarios.my.MyRunner"
    summarizer = "rdagent.scenarios.my.MySummarizer"

def main(...):
    MyRDLoop(MyPropSetting()).run(step_n=..., loop_n=..., all_duration=...)
```

See [CLI & Applications](09-cli-and-applications.md) for the entry points that instantiate these.
