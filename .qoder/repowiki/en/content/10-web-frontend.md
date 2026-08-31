# Web Frontend (`web/`)

A Vue 3 single-page application that provides the real-time interactive UI for `rdagent server_ui` (the Flask log server). It is intentionally separate from the Streamlit viewers (`rdagent ui`).

> **Scope note:** the web UI currently does **not** support the `data_science` scenario; use `rdagent ui --data-science` for those traces.

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | Vue 3 (Composition API) + TypeScript |
| Build | Vite 8 (`@vitejs/plugin-vue`), type check via `vue-tsc` |
| UI kit | Element Plus (auto-imported via `unplugin-vue-components`) |
| Charts | ECharts 5 + `vue-echarts` (+ `echarts-gl`) |
| Routing | vue-router 4 ([`src/router/index.ts`](../../../../web/src/router/index.ts)) |
| HTTP | axios |
| Markdown / code rendering | `markdown-it` (+ texmath), `marked`, KaTeX, highlight.js, Prism.js |
| Misc | jszip (artifact download), crypto-js, jQuery, sass |

Auto-import declarations are generated at build time (`auto-imports.d.ts`, `components.d.ts`).

## Build & serve

```bash
cd web
npm install
npm run dev            # dev server
npm run build          # type check + production build (dist/)
npm run build:flask    # builds into ../git_ignore_folder/static for server_ui
```

`rdagent server_ui --port 19899` then serves the static bundle from `UI_SETTING.static_path` (override with `UI_STATIC_PATH`) together with the real-time REST APIs (see [Logging, Tracing & UI](07-logging-tracing-and-ui.md#flask-server--rdagentlogserverapppy)).

## Source layout

```
web/src/
├── main.ts / App.vue        # bootstrap + root component
├── router/index.ts          # route table
├── views/                   # top-level pages
│   ├── Home.vue             # landing / trace list
│   ├── Login.vue            # auth entry
│   ├── Playground.vue       # main live-run playground (trace streaming, interaction)
│   ├── PlaygroundPage.vue   # extended playground variant
│   ├── Playground1.vue      # legacy/scratch variant
│   └── ResultPage.vue       # results & metrics visualization
├── components/              # 23 reusable widgets (message renderers, charts, editors…)
├── common/                  # CSS: reset.css, code-theme.css, py-theme.css
├── constants/               # app-wide constants
├── utils/                   # HTTP helpers, formatting, markdown pipeline
└── assets/                  # images, icons (vite-plugin-svg-icons)
```

## How it interacts with the backend

1. **Start a run** — POST a scenario (+ optional uploaded competition files) to the Flask server; the server spawns the loop process and returns a trace id (`scenario/trace_name`).
2. **Stream logs** — poll `/receive`-style endpoints with the trace id; the server returns logged messages newer than the client's pointer, which the Playground renders per loop/step tag.
3. **Human-in-the-loop** — when the loop pauses for interaction (hypothesis/feedback editing), the server pushes a request dict through `user_request_q`; the UI renders an editor form and posts the answer back via `user_response_q`, unblocking `RDLoop._interact_*`.
4. **Artifacts** — download workspaces/logs (jszip on the client side).
