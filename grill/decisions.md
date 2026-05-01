# Stack e Decisões — Personal Desktop App Template

Saída consolidada da grelha. Cada decisão tem origem rastreável no Q&A.

---

## 1. Plataforma e build

| Item | Decisão | Razão |
|---|---|---|
| Runtime desktop | **Electron** | Stack TS-only end-to-end; ecossistema com mais tutorial/SO answers para alguém sem experiência prévia em desktop. |
| Package manager | **Bun** | Decisão pessoal default; t3code valida viabilidade em produção. |
| Pinning de versão (Mise) | **Pular** | Single-user single-machine; trade-off "latest Bun" aceito explicitamente. |
| `engines.bun` | `">=1.3.0"` no `package.json` | Custo zero, captura erro óbvio de versão antiga. |
| Dev/build tool | **electron-vite** (alex8088) | Vite para renderer + esbuild para main+preload, três configs paralelos. |
| Packager | **electron-builder** | Padrão da indústria para .AppImage / .exe / installer assets. |
| Forge | **NÃO usar** | Wrapper sobre electron-vite + electron-builder; esconde, não simplifica. |
| Estrutura repo | **Single `package.json`**, sem monorepo | Single app; monorepo = especulação. |

## 2. Estrutura de diretórios

```
src/
  main/
    index.ts
    db/
      index.ts
      schema.ts
      migrations/
      DbTodos.ts
      DbSettings.ts
    ipc/
      index.ts            # bootstrap MessagePort + RPCHandler
    router/
      _base.ts            # os com middleware trail
      index.ts            # compõe domains
      todos.ts
      settings.ts
    observability/
      index.ts            # createObservability + betterSqlite3Store
    auto-update.ts
  preload/
    index.ts              # forward MessagePort para main
  renderer/
    index.html
    src/
      main.tsx            # entry React
      lib/
        api.ts            # createORPCClient + RPCLink message-port
        query-client.ts
        router.ts
      routes/
        __root.tsx
        index.tsx
        todos/
          index.tsx
      styles.css
  shared/                  # tipos compartilhados (se houver)
tests/
  setup.ts                 # log preload
  utils/
    db.ts                  # withDb / resetDb helpers
    orpc.ts                # createTestClient
    assertions.ts          # assertDefined, assertIsInstanceOf
  todos.test.ts            # demo
build/
  icon.png                 # placeholder 1024x1024
electron.vite.config.ts
electron-builder.yml
.env.test
bunfig.toml
package.json
tsconfig.json
tsconfig.node.json         # main + preload
tsconfig.web.json          # renderer
.github/
  workflows/
    release.yml
```

## 3. Path aliases

| Alias | Resolve |
|---|---|
| `@main/*` | `src/main/*` |
| `@preload/*` | `src/preload/*` |
| `@renderer/*` | `src/renderer/src/*` |
| `@shared/*` | `src/shared/*` |

Configurar em todos os tsconfigs relevantes (`tsconfig.node.json`, `tsconfig.web.json`).

## 4. Banco de dados

| Item | Decisão |
|---|---|
| Engine | **SQLite** |
| Driver | **better-sqlite3** (síncrono, native module) |
| ORM | **Drizzle ORM** (`drizzle-orm/better-sqlite3`) |
| `bun:sqlite` | **NÃO usar** — incompatível com Node embutido no Electron |
| `node:sqlite` | **NÃO usar** — experimental, adapter Drizzle jovem |
| Localização (prod) | `app.getPath('userData')/app.db` |
| Localização (test) | `:memory:` via `DATABASE_PATH` em `.env.test` |
| Singleton | Sim. DbX importam singleton, sem parâmetro `db` |
| Pragmas no startup | `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`, `busy_timeout=5000` |
| Migrations | drizzle-kit gera SQL em `src/main/db/migrations/` |
| Migrations no bundle | Via `extraResources` no electron-builder |
| Migrations no startup | `migrate(db, { migrationsFolder })` no boot do main |
| Rebuild do native module | `electron-builder install-app-deps` no postinstall |

## 5. IPC + ORPC

| Item | Decisão |
|---|---|
| Transport | **`@orpc/server/message-port` + `@orpc/client/message-port`** (oficial) |
| `contextIsolation` | `true` (não negociável) |
| `nodeIntegration` | `false` (não negociável) |
| `sandbox` | `true` (não negociável) |
| Channel inicial | `start-orpc-server` (renderer cria MessageChannel, preload forwarda port pro main) |
| Tipo no renderer | `import type { Router } from '@main/router'` (erase compile-time) |
| `verbatimModuleSyntax` | `true` no tsconfig do renderer (força explicitar `type` em imports) |
| Estrutura router | Domain split (`todos.ts`, `settings.ts`) montados em `index.ts` |
| Validação | Arktype (`type({...}).input(...)`) |
| Context | **Vazio** (`{ context: {} }`). Procedures usam singleton DB. |
| Middleware base | `createOrpcMiddleware` do `@juicerq/trail/orpc` em `_base.ts` |
| Errors | ORPC scoped errors quando precisar (`os.errors({ NOT_FOUND: ... })`) |
| Demo procedures | `todos.list / todos.create / todos.update / todos.delete` |

## 6. Frontend

| Item | Decisão |
|---|---|
| Framework | React 19 |
| Router | **TanStack Router** file-based (Vite plugin, codegen em watch) |
| History | **`createMemoryHistory()`** — desktop não tem URL bar |
| Query | **TanStack Query + `@orpc/tanstack-query`** |
| Default `staleTime` | **`Infinity`** — invalidação manual em mutations |
| `refetchOnWindowFocus` | `false` |
| `refetchOnReconnect` | `false` |
| Devtools | `@tanstack/react-query-devtools` em dev |
| CSS | **Tailwind v4** + `@tailwindcss/vite` |
| Dark mode | Class-based (`<html class="dark">`), system preference como default, persistido em settings via IPC |
| Component library | **NENHUMA** prebaked (cada projeto-fork escolhe) |
| Window frame | **Native** (`frame: true`), sem custom titlebar |
| Root layout | `<Outlet />` em `__root.tsx` com classes Tailwind base. Cada fork desenha header/sidebar próprios. |

## 7. Settings

| Item | Decisão |
|---|---|
| Storage | **Tabela `settings`** no `app.db` (não electron-store, não JSON) |
| Schema da tabela | `key TEXT PRIMARY KEY, value TEXT (JSON), updated_at INTEGER` |
| Validação por key | Map `settingsContract` com Arktype por key |
| Domain object | `DbSettings.get<K>(key) / set<K>(key, value)` |
| Procedures | `settingsRouter.get(key) / set(key, value)` |
| Settings iniciais no template | `theme` (`light` \| `dark` \| `system`), `windowBounds` (`{x, y, width, height, maximized}`) |
| Autoridade | DB é a verdade. Renderer consulta via IPC, sem cache mutável em main. |

## 8. Observabilidade

| Item | Decisão |
|---|---|
| Lib | **`@juicerq/trail`** (sua própria) |
| Subpath SQLite | **`@juicerq/trail/better-sqlite3`** — **PRECISA SER ADICIONADO À TRAIL ANTES** |
| Justificativa do subpath | trail/sqlite usa `bun:sqlite`, indisponível no Node embutido do Electron |
| Schema do .db | **Idêntico** ao `bun:sqlite` store (Trail Studio precisa abrir os dois indistintamente) |
| Localização | `app.getPath('userData')/obs.db` (separado de `app.db`) |
| Retention | `default: '7d'`, `bySeverity: { error: '90d' }` |
| Middleware ORPC | `createOrpcMiddleware(obs, { slowRequestMs: 3000, captureInput: true, maxFieldBytes: 512, expectedErrorCodes: ['NOT_FOUND'] })` |
| Trail Studio | `bun add -d @juicerq/trail-studio` + script `"obs": "bunx trail-studio --db <path>"` |
| Vite | `ssr.noExternal: ['@juicerq/trail']` no main config (trail publica TS source) |
| Dev linking | `"@juicerq/trail": "file:../trail/packages/trail"` durante dev; trocar por versão npm publicada quando estável |

**Pré-requisito bloqueador:** Trabalho na trail (não no template):
- Novo arquivo `packages/trail/src/better-sqlite3.ts`
- Função `betterSqlite3Store({ dbPath, columns, retention })`
- Schema/SQL/retention compartilhado em `_sqlite-shared.ts` (extração de `sqlite.ts`)
- Peer dep `better-sqlite3` opcional
- Tests TDD (regra da trail)

## 9. Distribuição

| Item | Decisão |
|---|---|
| Linux | **AppImage x64** apenas |
| Windows | **NSIS x64** apenas |
| Pular | .deb, .rpm, MSI, arm64, macOS |
| Code signing | **Nenhum** (Windows mostra SmartScreen warning na primeira instalação) |
| Config file | **`electron-builder.yml`** separado (não em `package.json`) |
| NSIS options | `oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true` |
| `extraResources` | `src/main/db/migrations/` para `migrations/` |
| App identity | Placeholders no template: `appId`, `productName`, `name`, `repo`, `description`, `author`, `homepage` |
| Bootstrap script de rename | **NÃO criar** — find-replace manual ao forkar |
| Ícone | `build/icon.png` (1024×1024) placeholder, electron-builder gera ICO |

## 10. Auto-update

| Item | Decisão |
|---|---|
| Lib | **`electron-updater`** |
| Provider | **GitHub Releases** (repo público) |
| Owner | `juicerq` |
| Channel | **Single (`latest`)**, sem nightly/beta |
| Comportamento | Silent download + install-on-quit (`autoDownload: true`, `autoInstallOnAppQuit: true`) |
| Cadência | Check no startup + a cada 6 horas (`setInterval`) |
| Verificação | SHA512 (auto pelo electron-builder) — sem code signing, é a única integridade |
| Skip em dev | `if (!app.isPackaged) return` no setup |
| Eventos | Logados via trail (`obs.event(...)`) em `error` e `update-downloaded` |

## 11. CI/CD

| Item | Decisão |
|---|---|
| Plataforma | **GitHub Actions** |
| Trigger | Push de tag `v*` |
| Matrix | `ubuntu-latest`, `windows-latest` |
| Setup Bun | `oven-sh/setup-bun@v2` (latest) |
| Install | `bun install --frozen-lockfile` |
| Build | `bun run build` |
| Publish | `bunx electron-builder --publish always` |
| Token | `GITHUB_TOKEN` (automático) |
| Versioning | SemVer manual: `npm version patch && git push && git push --tags` |
| Concorrência | Duas máquinas buildam em paralelo, ambas publicam no mesmo tag |

## 12. Testes

| Item | Decisão |
|---|---|
| Runner | **`bun test`**, sem `--concurrent` |
| Estrutura | **`tests/`** dedicado na raiz (não colocado, não workspace) |
| Padrão | Singleton DB + `resetDb()` em `beforeEach` (pattern do **omnarr**, não tx rollback do web-template) |
| Por que não tx rollback | better-sqlite3 sync é incompatível com ORPC client async |
| Por que connection-per-test | `:memory:` por-processo dá isolamento entre arquivos; `resetDb()` dá isolamento entre testes |
| Variável `DATABASE_PATH` | `:memory:` em `.env.test`; sem isso, default vai pra `app.getPath('userData')` |
| ORPC test client | `createRouterClient(appRouter, { context: {} })` |
| `withDb` wrapper | Não usar — singleton + reset cobre |
| `withRollback` | Não usar — Postgres-only pattern |
| `tests/utils/db.ts` | `resetDb()` que SELECT-a tabelas via `sqlite_master` e DELETE em cada |
| `tests/utils/orpc.ts` | Exporta `testClient` singleton |
| `tests/utils/assertions.ts` | `assertDefined`, `assertIsInstanceOf` |
| `bunfig.toml` | `[test] preload = ["./tests/setup.ts"]` |
| `tests/setup.ts` | Log apenas (migrations rodam no module-load do db/index.ts) |
| Componentes (`*.test.tsx`) | **NÃO no template.** Adicionar por projeto seguindo skill `frontend-testing`. |
| E2E (Playwright Electron) | **NÃO no template.** Adicionar por projeto se justificar. |
| Async assertions | `expect(() => asyncCall()).toThrow(...)` (regra do skill `testing`) |
| External HTTP | Sem `@lobomfz/ghostapi` no template (sem HTTP externo em CRUD local) |

## 13. Dev experience

| Item | Decisão |
|---|---|
| DevTools | Open `detach` em dev, **nunca** em prod (`if (!app.isPackaged)`) |
| Hot reload renderer | Vite HMR (electron-vite default) |
| Hot reload main | electron-vite rebuild + restart automático |
| Hot reload preload | electron-vite rebuild + reload da window |
| Logs main em dev | `console.*` visível no terminal |
| Logs main em prod | **Apenas via trail** (eventos estruturados) |
| `electron-log` | **NÃO usar** — não preempt sem necessidade comprovada |
| Crash reporter | **NÃO usar** (Sentry/Crashpad). trail captura últimos events; reportar via `.db` se crashar. |

## 14. Convenções de código

| Item | Decisão |
|---|---|
| Linguagem das mensagens de erro | pt-br (toasts, ORPC errors, observability) |
| Lint | A definir por projeto (oxlint candidato, mas decisão fora da grelha) |
| Format | A definir por projeto (oxfmt candidato) |
| Import style | Named exports apenas, sem barrel files |
| Tipos | `import type` explícito quando atravessa boundary main↔renderer |

## 15. Princípios herdados (CLAUDE.md global)

- Truth before convenience
- Ownership before caller comfort
- Simplicity before speculation
- Real depth before apparent structure
- Understanding before production

Aplicação no template:
- Nenhuma feature/abstração que não tenha problema atual concreto
- Nenhum wrapper sobre lib externa sem complexidade real escondida
- Nenhuma pasta vazia "para o futuro"
- Nenhuma compatibilidade legada (template é greenfield por definição)
- Settings, DB, IPC: cada um tem **um** dono, não dois

---

## Trabalho prerequisito (fora do template)

1. Adicionar `@juicerq/trail/better-sqlite3` à trail (subpath irmão de `@juicerq/trail/sqlite`).
2. Schema/SQL/retention idênticos ao `bun:sqlite` store.
3. Tests TDD (regra da trail).
4. Bump da versão da trail.

Sem isso, template não builda. Pode ser feito em paralelo, mas template precisa esperar trail estar pronta antes do primeiro release.

---

## Referências usadas na grelha

- t3code (`pingdotgg/t3code`) — comparativo de toolchain (rejeitado: monorepo, custom dev runner, Effect)
- t3code `apps/desktop/src/desktopSettings.ts` — comparativo de settings (rejeitado: JSON em vez de SQLite por contexto sem DB)
- web-template (`/home/jui/projects/web-template`) — comparativo de testing (parcialmente adotado: estrutura `tests/`, in-process ORPC; rejeitado: tx rollback, context.db por incompatibilidade SQLite)
- omnarr (`lobomfz/omnarr`) — comparativo de testing (adotado: singleton + `db.reset()` + env-driven path; alinhado com SQLite + sync)
- jupe (`/home/jui/projects/jupe`) — referenciado para component tests (rejeitado: usa pattern legacy banido pelo skill `frontend-testing` atual)
- ORPC docs via context7 — confirmação do adapter Electron MessagePort oficial
- trail (`/home/jui/projects/trail`) — biblioteca-alvo da observabilidade
