# Slice 1 — Walking skeleton vertical

Primeiro slice do template. Atravessa DB → main → IPC → renderer com a fatia mais fina possível, prova plumbing ponta-a-ponta sem ainda incluir as áreas que merecem slice próprio (observabilidade, settings, distribuição, auto-update, CI, testes).

---

## Critério de pronto

Rodando `bun run dev` no projeto:

1. Janela do Electron abre com frame nativo.
2. Renderer renderiza rota `/` com o título "Todos", input de texto, botão "Adicionar" e lista vazia.
3. Digitar texto + clicar "Adicionar" envia `todos.create` via ORPC; lista atualiza com o item novo (via `invalidateQueries`).
4. Fechar a janela e abrir de novo: itens persistem (vêm do `app.db` em `app.getPath('userData')`).

Nada além disso é parte do critério.

---

## Escopo dentro

### Build / boot
- `package.json` com `name`, `version`, `productName`, `appId`, `description`, `author`, `repository`, `homepage` como placeholders explícitos para fork manual (decisions.md:191-192).
- `engines.bun: ">=1.3.0"`.
- electron-vite com 3 configs paralelos (main / preload / renderer).
- Path aliases (`@main`, `@preload`, `@renderer`, `@shared`) em `tsconfig.node.json` e `tsconfig.web.json`.
- `postinstall: electron-builder install-app-deps` para rebuild de `better-sqlite3` contra o Node embutido. (electron-builder vira dep só por causa disso; o packager em si fica pra slice futuro.)
- `src/main/index.ts`: cria janela com `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `frame: true`. Em dev, `webContents.openDevTools({ mode: 'detach' })`.

### DB
- `better-sqlite3` + `drizzle-orm/better-sqlite3`.
- Singleton em `src/main/db/index.ts` apontando para `app.getPath('userData')/app.db` (em dev e prod). Pragmas no startup: `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`, `busy_timeout=5000`.
- `src/main/db/schema.ts`:
  ```ts
  export const todos = sqliteTable('todos', {
    id: integer('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  });
  ```
- drizzle-kit gera migration inicial em `src/main/db/migrations/`. `migrate(db, { migrationsFolder })` chamado no boot do main, antes de qualquer query.
- `src/main/db/DbTodos.ts`: `list()` (ordenado por `createdAt desc`) e `create({ title })` (retorna a row inserida).

### IPC + ORPC
- `src/main/ipc/index.ts`: bootstrap `start-orpc-server` channel — main escuta `'start-orpc-server'`, recebe a `MessagePortMain` do preload, anexa ao `RPCHandler`.
- `src/main/router/_base.ts`: `os` base do ORPC com `context: {}`. **Sem middleware** (trail entra em slice futuro).
- `src/main/router/todos.ts`: `list` (sem input) e `create` (input `type({ title: 'string > 0' })` validado por Arktype).
- `src/main/router/index.ts`: compõe domains. Exporta `Router` type para o renderer importar com `import type`.
- `src/preload/index.ts`: ouve `'start-orpc-server'` do renderer, forwarda a port para o main.

### Renderer
- React 19, TanStack Router file-based (Vite plugin), TanStack Query + `@orpc/tanstack-query`, Tailwind v4 via `@tailwindcss/vite`.
- `createMemoryHistory()`. `staleTime: Infinity`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`.
- `src/renderer/src/lib/api.ts`: cria `MessageChannel` no renderer, posta `port2` para o preload via `ipcRenderer.postMessage('start-orpc-server', null, [port2])`, monta `createORPCClient` em cima de `port1` com `RPCLink` message-port.
- `src/renderer/src/lib/query-client.ts`: `QueryClient` exportado.
- `src/renderer/src/routes/__root.tsx`: layout vazio com `<Outlet />`, classes Tailwind base (`min-h-screen`, fundo neutro).
- `src/renderer/src/routes/index.tsx`: componente único com `useQuery` (`todos.list`), `useMutation` (`todos.create`) que invalida `todos.list` em `onSuccess`. Form HTML nativo, `<button disabled={!title.trim()}>`.
- `verbatimModuleSyntax: true` em `tsconfig.web.json` para forçar `import type` em tudo que cruza boundary.

### Dev experience
- DevTools detach em dev, fechado em prod (`if (!app.isPackaged)`).
- `console.*` no main fica visível no terminal de dev.
- HMR do renderer e rebuild+reload de main/preload via electron-vite default.

---

## Escopo fora (e por quê)

| Área | Justificativa |
|---|---|
| `todos.update` / `todos.delete` | Variações de `create` em termos de plumbing — não validam nada novo. Cada fork acrescenta o que precisar. |
| `settings` (tabela, contract, theme, windowBounds) | Slice próprio. Theme + dark mode acoplam UI global; melhor isolado. |
| Observabilidade (`@juicerq/trail`) | Pré-requisito `@juicerq/trail/better-sqlite3` ainda não existe na trail. ORPC middleware é compositional, adicionar depois mexe só em `_base.ts`. |
| `tests/` (setup + utils + assertions) | Decisão consciente: slice 1 é validado manualmente, slice de testes vem em seguida com `todos.test.ts` cobrindo create/list. |
| electron-builder.yml + AppImage / NSIS | Distribuição é slice próprio. Empacotar antes de tudo funcionar é prematuro. |
| Auto-update (`electron-updater`, GitHub Releases) | Depende de empacotamento. |
| CI/CD (`.github/workflows/release.yml`) | Depende de empacotamento. |
| Component library | Decidido em decisions.md:142 — nenhuma prebaked. |
| Dark mode / theme switcher | Acopla a `settings`. |
| Toasts / error UI / loading skeletons | UX library decision; sem lock-in no template. |
| Window bounds persistence | Acopla a `settings`. |
| Code signing | Decidido em decisions.md:187. |
| Lint / format (oxlint / oxfmt) | Decisões fora da grelha; cada fork escolhe. |

---

## Sequência de execução sugerida (não-vinculante)

1. `package.json` + `tsconfig*.json` + `electron.vite.config.ts` + path aliases. Confirmar que `bunx electron-vite preview` (ou similar) carrega o nada.
2. `src/main/index.ts` mínimo: cria janela, carrega URL do dev server. Verificar window aparece em branco.
3. DB: schema + drizzle-kit + migrations + singleton + pragmas + `DbTodos`. Verificar via `console.log` no boot.
4. ORPC main: `_base.ts` + `todos.ts` + `index.ts` + IPC bootstrap em `src/main/ipc/index.ts`.
5. Preload: forward de port.
6. Renderer: api client + query client + router setup + rota `/` com query + mutation.
7. Tailwind base.
8. Demo manual: criar todo, fechar app, reabrir, conferir persistência.

---

## Riscos / armadilhas conhecidas

- **better-sqlite3 ABI mismatch:** sem `electron-builder install-app-deps` no postinstall, app crasha no `require('better-sqlite3')` por incompatibilidade ABI Node vs Electron. Fixar postinstall antes do passo 3.
- **migrations no bundle do main:** electron-vite bundla `src/main/index.ts` para `out/main/index.js`. `migrationsFolder` resolvido com `path.join(__dirname, 'migrations')` precisa que migrations estejam ao lado do bundle. Usar `viteStaticCopy` ou plugin equivalente para copiar `src/main/db/migrations/` para `out/main/migrations/` no build do main.
- **MessageChannel timing:** renderer cria o canal *uma única vez* no bootstrap; se isso for feito dentro de um componente que remonta, o canal vaza. Montar em `src/renderer/src/main.tsx` antes do `<RouterProvider />`.
- **`verbatimModuleSyntax` quebra imports não-`type` que cruzam boundary:** todos os imports de tipos do main no renderer precisam ser `import type`. Esperar warnings e ajustar.
- **`unixepoch()` é SQLite ≥ 3.38.** better-sqlite3 atual embute uma versão recente; mas se algum dia o driver regredir, troca por `(strftime('%s', 'now'))`.
