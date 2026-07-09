# Daraja CLI

The official CLI for the M-Pesa Daraja API — batteries included for every developer, in every language.

```bash
npm install -g @daraja/cli
daraja init
daraja stk push --phone 0712345678 --amount 100
```

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Commands](#commands)
  - [daraja init](#daraja-init)
  - [daraja doctor](#daraja-doctor)
  - [daraja config](#daraja-config)
  - [daraja auth](#daraja-auth)
  - [daraja keygen](#daraja-keygen)
  - [daraja stk](#daraja-stk)
  - [daraja c2b](#daraja-c2b)
  - [daraja b2c](#daraja-b2c)
  - [daraja b2b](#daraja-b2b)
  - [daraja balance](#daraja-balance)
  - [daraja status](#daraja-status)
  - [daraja reverse](#daraja-reverse)
  - [daraja qr](#daraja-qr)
  - [daraja bill](#daraja-bill)
  - [daraja ratiba](#daraja-ratiba)
  - [daraja tax](#daraja-tax)
  - [daraja webhook](#daraja-webhook)
  - [daraja generate](#daraja-generate)
  - [daraja ecosystem](#daraja-ecosystem)
  - [daraja serve](#daraja-serve)
  - [daraja mock](#daraja-mock)
  - [daraja completions](#daraja-completions)
  - [daraja update](#daraja-update)
- [Multi-language integration](#multi-language-integration)
- [Docker sidecar](#docker-sidecar)
- [Environment variables](#environment-variables)
- [Contributing](#contributing)

---

## Installation

**Requires Node.js 18 or later.**

```bash
npm install -g @daraja/cli
```

Verify the installation:

```bash
daraja --version
daraja --help
```

---

## Quick start

```bash
# 1. Set up your credentials (interactive)
daraja init

# 2. Verify everything is working
daraja doctor

# 3. Send an STK Push payment prompt
daraja stk push --phone 0712345678 --amount 50 --ref ORDER-001

# 4. Check the result
daraja stk query <CheckoutRequestID>
```

---

## Configuration

The CLI looks for credentials in this order (highest priority first):

| Source | Location |
|--------|----------|
| Environment variables | `DARAJA_*` (see [table below](#environment-variables)) |
| Local config file | `.daraja.json` in the current or any parent directory |
| Global config file | `~/.daraja/config.json` |

**Creating a config file**

```bash
daraja init          # interactive wizard
# or
daraja config set consumerKey <key>
daraja config set consumerSecret <secret>
daraja config set shortcode 174379
daraja config set environment sandbox
```

**Always add `.daraja.json` to `.gitignore`** — it contains secrets.

---

## Commands

### `daraja init`

Interactive wizard that creates a `.daraja.json` config file and automatically adds it to `.gitignore`.

```bash
daraja init
```

---

### `daraja doctor`

Checks your configuration for missing fields, validates credentials, and tests connectivity to Safaricom.

```bash
daraja doctor
```

---

### `daraja config`

Read and write individual configuration values without re-running `init`.

```bash
daraja config list                          # all values (secrets masked)
daraja config list --reveal                 # show secrets in plaintext
daraja config get shortcode                 # single value
daraja config set callbackUrl https://...   # update a value
daraja config set shortcode 174379 --global # write to ~/.daraja/config.json
daraja config unset passkey                 # remove a value
daraja config path                          # show which files are loaded
daraja config keys                          # list all keys + env var names
```

---

### `daraja auth`

Manage OAuth access tokens.

```bash
daraja auth token             # fetch and cache a token
daraja auth token --fresh     # force a new token (ignore cache)
daraja auth token --format json
daraja auth clear             # remove all cached tokens
```

---

### `daraja keygen`

Generate and manage Daraja security credentials.

```bash
daraja keygen security                        # download Safaricom certificate
daraja keygen security --env production --force
daraja keygen passkey                         # generate STK Push password for current minute
daraja keygen passkey --format json
```

---

### `daraja stk`

STK Push (Lipa Na M-Pesa Online) — prompt a customer to pay via their phone.

```bash
daraja stk push
daraja stk push --phone 0712345678 --amount 100 --ref ORDER-001 --description "Payment"
daraja stk push --phone 0712345678 --amount 100 --dry-run
daraja stk query ws_CO_1234567890
```

---

### `daraja c2b`

Customer-to-Business — register callback URLs for paybill/till payments.

```bash
daraja c2b register
daraja c2b register --validation-url https://api.myapp.com/validate \
                    --confirmation-url https://api.myapp.com/confirm
daraja c2b simulate --phone 0712345678 --amount 500 --bill-ref ACCOUNT001
```

---

### `daraja b2c`

Business-to-Customer — send money from your shortcode to a customer.

```bash
daraja b2c pay --phone 0712345678 --amount 500 --command-id SalaryPayment
daraja b2c pay --phone 0712345678 --amount 200 --command-id PromotionPayment
```

`--command-id` options: `SalaryPayment` | `BusinessPayment` | `PromotionPayment`

---

### `daraja b2b`

Business-to-Business — transfer funds between shortcodes.

```bash
daraja b2b pay --receiver-shortcode 000111 --amount 5000 --command-id BusinessPayBill
```

---

### `daraja balance`

Query the account balance for your shortcode.

```bash
daraja balance
daraja balance --format json
```

---

### `daraja status`

Query the status of any Daraja transaction.

```bash
daraja status SOM0000000000001
daraja status SOM0000000000001 --format json
```

---

### `daraja reverse`

Reverse a completed M-Pesa transaction.

```bash
daraja reverse SOM0000000000001 --amount 500
daraja reverse SOM0000000000001 --amount 500 --remarks "Customer refund"
```

---

### `daraja qr`

Generate an M-Pesa QR code for a payment.

```bash
daraja qr generate --merchant-name "Acme Shop" --ref-no "ORDER-001" --amount 250 --cpi 174379
```

`--trx-code` options: `BG` (Buy Goods) | `PB` (PayBill) | `WA` (Withdrawal Agent) | `SM` (Send Money) | `SB` (Send to Business)

---

### `daraja bill`

Bill Manager — invoicing and payment reconciliation.

```bash
daraja bill optin
daraja bill invoice
daraja bill reconcile
```

---

### `daraja ratiba`

Standing orders — schedule recurring M-Pesa payments.

```bash
daraja ratiba create \
  --phone 0712345678 \
  --amount 2000 \
  --start-date 20260101 \
  --end-date 20261231 \
  --frequency Monthly \
  --reference "Rent"
```

---

### `daraja tax`

Remit taxes directly to KRA via M-Pesa.

```bash
daraja tax remit --amount 5000 --account-reference P051234567890
```

---

### `daraja webhook`

Webhook development utilities.

```bash
# Receive and log callbacks
daraja webhook serve --port 3000

# Save captured payloads for replay
daraja webhook serve --port 3000 --save ./payloads.json

# List saved payloads
daraja webhook list ./payloads.json

# Replay to your handler
daraja webhook replay ./payloads.json http://localhost:3000/mpesa/stk-callback
daraja webhook replay ./payloads.json http://localhost:3000 --index 0
daraja webhook replay ./payloads.json http://localhost:3000 --dry-run
```

> Use `ngrok http 3000` or `lt --port 3000` to expose your local server to Daraja.

---

### `daraja generate`

Generate production-ready M-Pesa integration code for your framework.

```bash
daraja generate stk-callback --stack express-ts
daraja generate stk-callback --stack fastapi --output app/routers/mpesa.py
daraja generate c2b --stack gin --output handlers/mpesa_c2b.go
daraja generate env --platform github-actions
daraja generate env --platform docker --output docker-compose.yml
daraja generate list
```

**Supported stacks:**

| Language | Stacks |
|----------|--------|
| Node.js | `express` · `express-ts` · `fastify` · `nextjs` |
| Python | `fastapi` · `flask` · `django` |
| PHP | `laravel` |
| Go | `gin` |
| Ruby | `rails` |
| C# | `aspnet` |
| Elixir | `phoenix` |
| Kotlin | `ktor` |
| Java | `spring` |
| Swift | `vapor` |

**Supported platforms:** `dotenv` · `github-actions` · `vercel` · `docker` · `railway`

---

### `daraja ecosystem`

Explore SDK support across languages and get a personalised recommendation.

```bash
daraja ecosystem list
daraja ecosystem recommend
daraja ecosystem show python
daraja ecosystem compare node python php
daraja ecosystem status
```

**SDK tiers**

| Tier | Meaning |
|------|---------|
| 1 | Official, full API coverage |
| 2 | Official, core coverage |
| 3 | Community, verified |
| 4 | Community, unverified |

---

### `daraja serve`

Start a local REST proxy — any language calls Daraja via plain HTTP. No OAuth, no certificates, no token management in your app.

```bash
daraja serve                    # localhost:8080
daraja serve --port 4000
daraja serve --host 0.0.0.0     # all interfaces (Docker)
daraja serve --debug
```

**Endpoints**

```
GET  /health
POST /stk/push            { phone, amount, reference, description }
POST /stk/query           { checkoutRequestId }
POST /c2b/register        { validationUrl, confirmationUrl }
POST /c2b/simulate        { phone, amount, billRefNumber }
POST /b2c/pay             { phone, amount, commandId }
POST /b2b/pay             { receiverShortcode, amount, commandId }
GET  /balance
GET  /status/:transactionId
POST /reverse             { transactionId, amount }
POST /qr/generate         { merchantName, refNo, amount, cpi, trxCode }
POST /bill/optin          { email, callbackUrl }
POST /bill/invoice        { reference, billedTo, phone, billedAmount, dueDate, accountReference }
POST /bill/reconcile      { paymentDate, paidAmount, accountReference, transactionId, phoneNumber, fullName }
POST /ratiba/create       { phone, amount, startDate, endDate, frequency, accountReference }
POST /tax/remit           { amount, accountReference }
```

**Python example**

```python
import httpx
r = httpx.post("http://localhost:8080/stk/push", json={
    "phone": "0712345678", "amount": 100,
    "reference": "INV-001", "description": "Payment",
})
print(r.json())
```

---

### `daraja mock`

Start a fake Safaricom API server — returns realistic responses without real credentials.

```bash
daraja mock
daraja mock --port 5000
daraja mock --init       # write .daraja.json with fake credentials
daraja mock --delay 200  # add 200ms artificial latency
```

Special endpoint — returns a realistic STK Push callback payload:

```
GET /mock/stk-callback?phone=254712345678&amount=100&checkoutId=ws_CO_001
```

---

### `daraja completions`

Generate shell completion scripts.

```bash
eval "$(daraja completions bash)"    # add to ~/.bashrc
eval "$(daraja completions zsh)"     # add to ~/.zshrc
daraja completions fish > ~/.config/fish/completions/daraja.fish
daraja completions bash --install    # see install instructions
```

---

### `daraja update`

Check if a newer version is available on npm.

```bash
daraja update
daraja update --format json
```

---

## Multi-language integration

Three patterns depending on your language and needs:

### 1. Native SDK (coming soon)

Official SDKs for Node.js, Python, PHP, and Go.

```bash
daraja ecosystem status     # check current status
daraja ecosystem recommend  # get a personalised recommendation
```

### 2. REST proxy (available now)

`daraja serve` handles all Daraja communication. Your app makes plain HTTP calls — no OAuth, no certificates, no M-Pesa SDK required. Works with every language.

```bash
daraja serve &
curl -s -X POST http://localhost:8080/stk/push \
  -H "Content-Type: application/json" \
  -d '{"phone":"0712345678","amount":100,"reference":"INV-001","description":"Payment"}'
```

**Language examples using `daraja serve`:**

```elixir
# Elixir — HTTPoison
HTTPoison.post("http://localhost:8080/stk/push", Jason.encode!(%{phone: "0712345678", amount: 100}), [{"Content-Type", "application/json"}])
```

```kotlin
// Kotlin — Ktor HttpClient
client.post("http://localhost:8080/stk/push") {
    contentType(ContentType.Application.Json)
    setBody(mapOf("phone" to "0712345678", "amount" to 100))
}
```

```java
// Java — Spring RestTemplate
restTemplate.postForObject("http://localhost:8080/stk/push",
    Map.of("phone", "0712345678", "amount", 100), Map.class);
```

```swift
// Swift — URLSession
var req = URLRequest(url: URL(string: "http://localhost:8080/stk/push")!)
req.httpMethod = "POST"
req.httpBody = try JSONSerialization.data(withJSONObject: ["phone": "0712345678", "amount": 100])
let (data, _) = try await URLSession.shared.data(for: req)
```

```dart
// Dart / Flutter — http package
await http.post(Uri.parse('http://localhost:8080/stk/push'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'phone': '0712345678', 'amount': 100}));
```

### 3. Code scaffold

`daraja generate` drops production-ready webhook handler code into your project for 15 frameworks across 10 languages.

```bash
daraja generate stk-callback --stack phoenix  --output lib/your_app_web/controllers/mpesa_controller.ex
daraja generate stk-callback --stack ktor     --output src/main/kotlin/com/yourapp/routes/MpesaRoutes.kt
daraja generate stk-callback --stack spring   --output src/main/java/com/yourapp/controller/MpesaController.java
daraja generate stk-callback --stack vapor    --output Sources/App/Controllers/MpesaController.swift
daraja generate stk-callback --stack rails    --output app/controllers/mpesa_controller.rb
daraja generate c2b          --stack laravel  --output app/Http/Controllers/MpesaC2BController.php
```

---

## Docker sidecar

```yaml
services:
  app:
    build: .
    environment:
      MPESA_BASE_URL: http://daraja:8080

  daraja:
    image: node:18-alpine
    command: sh -c "npm install -g @daraja/cli && daraja serve --host 0.0.0.0 --port 8080"
    env_file: .env
    ports:
      - "8080:8080"
```

Generate the env file: `daraja generate env --platform docker`

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `DARAJA_ENVIRONMENT` | `sandbox` or `production` |
| `DARAJA_CONSUMER_KEY` | Daraja consumer key |
| `DARAJA_CONSUMER_SECRET` | Daraja consumer secret |
| `DARAJA_SHORTCODE` | M-Pesa shortcode |
| `DARAJA_PASSKEY` | STK Push passkey |
| `DARAJA_INITIATOR_NAME` | API operator username |
| `DARAJA_INITIATOR_PASSWORD` | API operator password |
| `DARAJA_CALLBACK_URL` | Default callback URL |
| `DARAJA_VALIDATION_URL` | C2B validation endpoint |
| `DARAJA_CONFIRMATION_URL` | C2B confirmation endpoint |

Generate a template: `daraja generate env --platform dotenv`

---

## Contributing

1. Fork and clone the repository
2. `npm install`
3. `npm run dev -- <command>` — run without building
4. `npm test` — run the test suite (188 tests)
5. `npm run typecheck` — verify types before opening a PR

**Adding a stack to `daraja generate`:** edit `src/commands/generate/templates.ts`

**Listing a community SDK:** edit `src/commands/ecosystem/registry.ts`

---

## License

MIT © Daraja Collective
