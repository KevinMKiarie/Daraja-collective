# Daraja CLI

The official CLI for the M-Pesa Daraja API — batteries included for every Kenyan developer.

```bash
npm install -g @daraja/cli
daraja --help
```

## What this is

Most M-Pesa packages are thin HTTP wrappers that leave authentication, token caching, webhook handling, credential generation, and error debugging entirely to you. Daraja CLI covers all of that — from your first `daraja init` to production go-live.

## Commands

| Command | What it does |
|---------|-------------|
| `daraja init` | Scaffold config, `.env`, and open the Daraja portal |
| `daraja auth token` | Generate and cache an OAuth token |
| `daraja keygen security` | Encrypt your initiator password with the Safaricom certificate |
| `daraja doctor` | Diagnose credentials, connectivity, and certificate issues |
| `daraja stk push` | Trigger an STK Push payment |
| `daraja stk query <id>` | Check STK Push status |
| `daraja c2b register` | Register C2B validation and confirmation URLs |
| `daraja c2b simulate` | Simulate a C2B payment in sandbox |
| `daraja b2c pay` | Disburse funds to a customer |
| `daraja b2b pay` | Transfer between business accounts |
| `daraja b2b express-checkout` | B2B USSD push flow |
| `daraja status <txId>` | Query transaction outcome |
| `daraja balance` | Check account balance |
| `daraja reverse <txId>` | Reverse a transaction |
| `daraja qr generate` | Generate a Dynamic QR code |
| `daraja tax remit` | Remit tax to KRA via M-Pesa |
| `daraja bill optin` | Opt in to Bill Manager |
| `daraja bill invoice send` | Send an e-invoice to a customer |
| `daraja bill reconcile` | Reconcile paid invoices |
| `daraja ratiba create` | Set up a standing order |
| `daraja go-live` | Guide through production submission and OTP confirmation |
| `daraja webhook serve` | Start a local webhook server for development |
| `daraja logs` | Tail transaction logs |
| `daraja sandbox` / `daraja prod` | Switch environment |

## Debug flags

Every command supports these flags:

```bash
daraja stk push --debug       # full request and response dump
daraja b2c pay --dry-run      # show payload without sending
daraja status <id> --verbose  # step-by-step execution trace
daraja auth token --format json
```

## Quick start

```bash
# Install
npm install -g @daraja/cli

# Set up a new project
daraja init

# Test your credentials
daraja doctor

# Trigger a payment
daraja stk push --phone 0712345678 --amount 100 --ref "Invoice #001"
```

## Multi-language collective

The CLI is one part of a broader collective. The same canonical spec is implemented across languages:

- [`daraja-node`](https://github.com/daraja-collective/daraja-node) — Node.js / TypeScript
- [`daraja-elixir`](https://github.com/daraja-collective/daraja-elixir) — Elixir / Phoenix
- [`daraja-go`](https://github.com/daraja-collective/daraja-go) — Go
- [`daraja-python`](https://github.com/daraja-collective/daraja-python) — Python

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `perf:` trigger automatic releases.

## License

MIT
