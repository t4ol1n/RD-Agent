# Development & Testing

Everything a contributor needs to set up, lint, test, package, and document RD-Agent. The canonical entry is the [Makefile](../../../../Makefile); tool configuration lives in [`pyproject.toml`](../../../../pyproject.toml).

## Environment setup

```bash
conda create -n rdagent python=3.10   # 3.10 / 3.11 are CI-tested
conda activate rdagent

# users
pip install rdagent

# developers (editable install + docs/lint/package/test extras + pre-commit)
git clone https://github.com/microsoft/RD-Agent && cd RD-Agent
make dev
```

- **Constraints**: `make dev` installs against `constraints/<py-version>.txt` (pinned dep sets; regenerate with `make constraints`).
- **Optional extras**: `make dev-torch` (or `pip install -e .[torch]`) for agent algorithms needing torch; extras defined in `requirements/` (`docs.txt`, `lint.txt`, `package.txt`, `test.txt`, `torch.txt`).
- **Qlib runtime**: `make init-qlib-env` creates a separate `qlibRDAgent` conda env (pyqlib, torch 2.1.1, catboost) used by quant runners.
- **Docker** is required for most scenarios; verify with `rdagent health_check`.
- A dev container definition is provided in [`.devcontainer/`](../../../../.devcontainer).

## Linting

`pyproject.toml` configures: **ruff** (`select = ["ALL"]`, line-length 120, many style rules ignored), **mypy** (strict: `disallow_untyped_defs`, `warn_return_any`, …), **isort** (black profile), **black**, and **toml-sort**. Note that CI lint currently scopes mypy/ruff to `rdagent/core` and expands gradually:

```bash
make lint        # mypy + ruff + isort + black + toml-sort (check mode)
make auto-lint   # auto-fix: isort + black + toml-sort
make pre-commit  # pre-commit run --all-files
```

Pre-commit hooks install on `pre-push` during `make dev`.

## Testing

pytest configuration is in `pyproject.toml` (`addopts`, `markers: offline`). Suites live under [`test/`](../../../../test):

| Folder | Coverage |
|--------|----------|
| `test/oai/` | LLM backends, pydantic output parsing, embeddings, caching, connectivity |
| `test/utils/` | Env execution, agent infra, kaggle helpers, workflow/workspace, config |
| `test/qlib/` | Model/factor proposal logic |
| `test/finetune/` | Fine-tune benchmarks (incl. TableBench API) |
| `test/notebook/` | Notebook ↔ code converter |
| `test/rl/` | RL scenario placeholder |

```bash
make test             # coverage run + report (fail-under currently 20; target 80)
make test-offline     # only tests marked `offline` (no external API calls)
```

## Packaging & release

- `setuptools` + **setuptools-scm** (`version_scheme = "guess-next-dev"`, no local version) — versions derive from git tags (`.bumpversion.cfg` keeps version references in sync).
- Runtime deps come from `requirements.txt` (`[tool.setuptools.dynamic]`); extras from `requirements/*.txt`.
- `make build` (python-build) and `make upload` (twine). GitHub workflows: CI (`ci.yml`), PR-title lint (`pr.yml`), release (`release.yml`), dependabot. Commit style enforced by `.commitlintrc.js` (conventional commits).

## Documentation

Sphinx sources in [`docs/`](../../../../docs) (readthedocs-hosted):

```bash
make docs-autobuild   # live preview while editing
make docs-gen         # strict build (-W)
make docs             # changelog + docs + mypy report + coverage report
```

`docs/changelog.md` is generated from git history with git-changelog (conventional commits); see the `changelog` target.

## Conventions worth knowing

- **Settings naming**: every settings class extends `ExtendedBaseSettings`; env vars are UPPER_SNAKE_CASE of the field names, optionally prefixed per scenario (`DS_*`, `CHAT_MODEL`, …). See [`.env.example`](../../../../.env.example) for a starter.
- **Runtime artifacts** go under `git_ignore_folder/` (workspace, logs, static UI build) — this folder is git-ignored by convention.
- **Prompts** live in `prompts.yaml` next to the code that uses them, rendered through `rdagent.utils.agent.tpl.T`.
- **Type hints**: `rdagent/core` is fully typed and mypy-checked; new core code must pass `make mypy`.
- Contribution guidance is in [`CONTRIBUTING.md`](../../../../CONTRIBUTING.md); search `grep -r "TODO:"` for starter tasks.
