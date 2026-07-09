export type Stack =
  | 'express'
  | 'express-ts'
  | 'fastify'
  | 'nextjs'
  | 'fastapi'
  | 'flask'
  | 'django'
  | 'laravel'
  | 'gin'
  | 'rails'
  | 'aspnet'
  | 'phoenix'
  | 'ktor'
  | 'spring'
  | 'vapor'

export type EnvPlatform = 'dotenv' | 'github-actions' | 'vercel' | 'docker' | 'railway'

export interface GeneratedFile {
  filename: string
  language: string
  content: string
}

export const SUPPORTED_STACKS: Stack[] = [
  'express',
  'express-ts',
  'fastify',
  'nextjs',
  'fastapi',
  'flask',
  'django',
  'laravel',
  'gin',
  'rails',
  'aspnet',
  'phoenix',
  'ktor',
  'spring',
  'vapor',
]

export const SUPPORTED_PLATFORMS: EnvPlatform[] = [
  'dotenv',
  'github-actions',
  'vercel',
  'docker',
  'railway',
]

export const STACK_LABELS: Record<Stack, string> = {
  'express': 'Node.js + Express (JavaScript)',
  'express-ts': 'Node.js + Express (TypeScript)',
  'fastify': 'Node.js + Fastify (TypeScript)',
  'nextjs': 'Next.js API Route (TypeScript)',
  'fastapi': 'Python + FastAPI',
  'flask': 'Python + Flask',
  'django': 'Python + Django',
  'laravel': 'PHP + Laravel',
  'gin': 'Go + Gin',
  'rails': 'Ruby on Rails',
  'aspnet': 'ASP.NET Core (C#)',
  'phoenix': 'Elixir + Phoenix',
  'ktor':    'Kotlin + Ktor',
  'spring':  'Java + Spring Boot',
  'vapor':   'Swift + Vapor',
}

export const PLATFORM_LABELS: Record<EnvPlatform, string> = {
  'dotenv': '.env file',
  'github-actions': 'GitHub Actions secrets',
  'vercel': 'Vercel environment variables',
  'docker': 'Docker Compose env_file',
  'railway': 'Railway variables',
}

// ---------------------------------------------------------------------------
// STK Push callback handlers
// ---------------------------------------------------------------------------

function stkExpress(): GeneratedFile {
  return {
    filename: 'routes/mpesa.js',
    language: 'javascript',
    content: `const express = require('express')
const router = express.Router()

/**
 * POST /mpesa/stk-callback
 *
 * Daraja delivers the payment result here after an STK Push completes or fails.
 * Respond immediately with 200 — Daraja retries if it waits more than 5 seconds.
 */
router.post('/mpesa/stk-callback', (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  const callback = req.body?.Body?.stkCallback
  if (!callback) return

  const { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID } = callback

  if (ResultCode !== 0) {
    console.error('STK Push failed', { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID })
    return
  }

  const items = callback.CallbackMetadata?.Item ?? []
  const get = (name) => items.find((i) => i.Name === name)?.Value

  const receipt = get('MpesaReceiptNumber')
  const amount  = get('Amount')
  const phone   = get('PhoneNumber')
  const paidAt  = get('TransactionDate') // YYYYMMDDHHmmss

  console.log('Payment confirmed', { receipt, amount, phone, paidAt, CheckoutRequestID })
  // TODO: mark the corresponding order as paid in your database
})

module.exports = router
`,
  }
}

function stkExpressTs(): GeneratedFile {
  return {
    filename: 'src/routes/mpesa.ts',
    language: 'typescript',
    content: `import { Router, Request, Response } from 'express'

interface STKCallbackItem {
  Name: string
  Value?: string | number
}

interface STKCallbackMetadata {
  Item: STKCallbackItem[]
}

interface STKCallback {
  ResultCode: number
  ResultDesc: string
  MerchantRequestID: string
  CheckoutRequestID: string
  CallbackMetadata?: STKCallbackMetadata
}

interface STKCallbackBody {
  Body: {
    stkCallback: STKCallback
  }
}

const router = Router()

/**
 * POST /mpesa/stk-callback
 *
 * Daraja delivers the payment result here after an STK Push completes or fails.
 * Respond immediately with 200 — Daraja retries if it waits more than 5 seconds.
 */
router.post('/mpesa/stk-callback', (req: Request<object, object, STKCallbackBody>, res: Response) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  const callback = req.body?.Body?.stkCallback
  if (!callback) return

  const { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID } = callback

  if (ResultCode !== 0) {
    console.error('STK Push failed', { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID })
    return
  }

  const items = callback.CallbackMetadata?.Item ?? []
  const get = (name: string): string | number | undefined =>
    items.find((i) => i.Name === name)?.Value

  const receipt = get('MpesaReceiptNumber') as string
  const amount  = get('Amount') as number
  const phone   = get('PhoneNumber') as string
  const paidAt  = get('TransactionDate') as string // YYYYMMDDHHmmss

  console.log('Payment confirmed', { receipt, amount, phone, paidAt, CheckoutRequestID })
  // TODO: mark the corresponding order as paid in your database
})

export default router
`,
  }
}

function stkFastify(): GeneratedFile {
  return {
    filename: 'src/routes/mpesa.ts',
    language: 'typescript',
    content: `import type { FastifyPluginAsync } from 'fastify'

interface STKCallbackItem {
  Name: string
  Value?: string | number
}

interface STKCallbackBody {
  Body: {
    stkCallback: {
      ResultCode: number
      ResultDesc: string
      MerchantRequestID: string
      CheckoutRequestID: string
      CallbackMetadata?: { Item: STKCallbackItem[] }
    }
  }
}

/**
 * POST /mpesa/stk-callback
 *
 * Daraja delivers the payment result here after an STK Push completes or fails.
 * Reply before processing — Daraja retries if you wait more than 5 seconds.
 */
const mpesaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: STKCallbackBody }>('/mpesa/stk-callback', async (request, reply) => {
    await reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })

    const callback = request.body?.Body?.stkCallback
    if (!callback) return

    const { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID } = callback

    if (ResultCode !== 0) {
      fastify.log.error({ ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID }, 'STK Push failed')
      return
    }

    const items = callback.CallbackMetadata?.Item ?? []
    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    const receipt = get('MpesaReceiptNumber') as string
    const amount  = get('Amount') as number
    const phone   = get('PhoneNumber') as string
    const paidAt  = get('TransactionDate') as string // YYYYMMDDHHmmss

    fastify.log.info({ receipt, amount, phone, paidAt, CheckoutRequestID }, 'Payment confirmed')
    // TODO: mark the corresponding order as paid in your database
  })
}

export default mpesaRoutes
`,
  }
}

function stkNextjs(): GeneratedFile {
  return {
    filename: 'app/api/mpesa/stk-callback/route.ts',
    language: 'typescript',
    content: `import { NextRequest, NextResponse } from 'next/server'

interface STKCallbackItem {
  Name: string
  Value?: string | number
}

interface STKCallback {
  ResultCode: number
  ResultDesc: string
  MerchantRequestID: string
  CheckoutRequestID: string
  CallbackMetadata?: { Item: STKCallbackItem[] }
}

/**
 * POST /api/mpesa/stk-callback
 *
 * Daraja delivers the payment result here after an STK Push completes or fails.
 * Return 200 immediately — Daraja retries if it waits more than 5 seconds.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as { Body: { stkCallback: STKCallback } }
  const callback = body?.Body?.stkCallback

  // Acknowledge immediately so Daraja doesn't time out
  const accepted = NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  if (!callback) return accepted

  const { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID } = callback

  if (ResultCode !== 0) {
    console.error('STK Push failed', { ResultCode, ResultDesc, MerchantRequestID, CheckoutRequestID })
    return accepted
  }

  const items = callback.CallbackMetadata?.Item ?? []
  const get = (name: string) => items.find((i) => i.Name === name)?.Value

  const receipt = get('MpesaReceiptNumber') as string
  const amount  = get('Amount') as number
  const phone   = get('PhoneNumber') as string
  const paidAt  = get('TransactionDate') as string // YYYYMMDDHHmmss

  console.log('Payment confirmed', { receipt, amount, phone, paidAt, CheckoutRequestID })
  // TODO: mark the corresponding order as paid in your database

  return accepted
}
`,
  }
}

function stkFastapi(): GeneratedFile {
  return {
    filename: 'app/routers/mpesa.py',
    language: 'python',
    content: `from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/mpesa", tags=["mpesa"])


class STKCallbackRequest(BaseModel):
    Body: dict[str, Any]


async def _handle_stk_result(callback: dict[str, Any]) -> None:
    result_code: int = callback.get("ResultCode", -1)
    merchant_id: str = callback.get("MerchantRequestID", "")
    checkout_id: str = callback.get("CheckoutRequestID", "")

    if result_code != 0:
        print(f"STK Push failed: {callback.get('ResultDesc')} "
              f"(merchant={merchant_id}, checkout={checkout_id})")
        return

    items: list[dict] = callback.get("CallbackMetadata", {}).get("Item", [])
    meta = {item["Name"]: item.get("Value") for item in items}

    receipt = meta.get("MpesaReceiptNumber")
    amount  = meta.get("Amount")
    phone   = meta.get("PhoneNumber")
    paid_at = meta.get("TransactionDate")  # YYYYMMDDHHmmss

    print(f"Payment confirmed: receipt={receipt} amount={amount} phone={phone} at={paid_at}")
    # TODO: mark the corresponding order as paid in your database


@router.post("/stk-callback")
async def stk_callback(
    payload: STKCallbackRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """
    Daraja delivers the payment result here after an STK Push completes or fails.
    Reply 200 immediately and process in the background — Daraja retries after 5 seconds.
    """
    callback = payload.Body.get("stkCallback", {})
    background_tasks.add_task(_handle_stk_result, callback)
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
`,
  }
}

function stkFlask(): GeneratedFile {
  return {
    filename: 'blueprints/mpesa.py',
    language: 'python',
    content: `from flask import Blueprint, request, jsonify
from threading import Thread

mpesa_bp = Blueprint("mpesa", __name__, url_prefix="/mpesa")


def _handle_stk_result(callback: dict) -> None:
    result_code: int = callback.get("ResultCode", -1)

    if result_code != 0:
        print(f"STK Push failed: {callback.get('ResultDesc')}")
        return

    items = callback.get("CallbackMetadata", {}).get("Item", [])
    meta = {item["Name"]: item.get("Value") for item in items}

    receipt = meta.get("MpesaReceiptNumber")
    amount  = meta.get("Amount")
    phone   = meta.get("PhoneNumber")
    paid_at = meta.get("TransactionDate")  # YYYYMMDDHHmmss

    print(f"Payment confirmed: receipt={receipt} amount={amount} phone={phone} at={paid_at}")
    # TODO: mark the corresponding order as paid in your database


@mpesa_bp.route("/stk-callback", methods=["POST"])
def stk_callback():
    """
    Daraja delivers the payment result here after an STK Push completes or fails.
    Reply 200 immediately — Daraja retries if it waits more than 5 seconds.
    """
    body = request.get_json(silent=True) or {}
    callback = body.get("Body", {}).get("stkCallback", {})

    Thread(target=_handle_stk_result, args=(callback,), daemon=True).start()
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"})
`,
  }
}

function stkDjango(): GeneratedFile {
  return {
    filename: 'mpesa/views.py',
    language: 'python',
    content: `import json
from threading import Thread
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


def _handle_stk_result(callback: dict) -> None:
    result_code: int = callback.get("ResultCode", -1)

    if result_code != 0:
        print(f"STK Push failed: {callback.get('ResultDesc')}")
        return

    items = callback.get("CallbackMetadata", {}).get("Item", [])
    meta = {item["Name"]: item.get("Value") for item in items}

    receipt = meta.get("MpesaReceiptNumber")
    amount  = meta.get("Amount")
    phone   = meta.get("PhoneNumber")
    paid_at = meta.get("TransactionDate")  # YYYYMMDDHHmmss

    print(f"Payment confirmed: receipt={receipt} amount={amount} phone={phone} at={paid_at}")
    # TODO: mark the corresponding order as paid in your database


@method_decorator(csrf_exempt, name="dispatch")
class STKCallbackView(View):
    """
    POST /mpesa/stk-callback
    Daraja delivers the payment result here after an STK Push completes or fails.
    Reply 200 immediately — Daraja retries if it waits more than 5 seconds.
    """

    def post(self, request):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid JSON"}, status=400)

        callback = body.get("Body", {}).get("stkCallback", {})
        Thread(target=_handle_stk_result, args=(callback,), daemon=True).start()
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


# urls.py — add this to your URL patterns:
# from mpesa.views import STKCallbackView
# path("mpesa/stk-callback", STKCallbackView.as_view(), name="stk-callback"),
`,
  }
}

function stkLaravel(): GeneratedFile {
  return {
    filename: 'app/Http/Controllers/MpesaController.php',
    language: 'php',
    content: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class MpesaController extends Controller
{
    /**
     * POST /mpesa/stk-callback
     *
     * Daraja delivers the payment result here after an STK Push completes or fails.
     * Respond immediately — Daraja retries if you take longer than 5 seconds.
     */
    public function stkCallback(Request $request): JsonResponse
    {
        $callback = $request->input('Body.stkCallback');

        if (!$callback) {
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $resultCode = $callback['ResultCode'] ?? -1;
        $merchantId = $callback['MerchantRequestID'] ?? '';
        $checkoutId = $callback['CheckoutRequestID'] ?? '';

        if ($resultCode !== 0) {
            Log::error('STK Push failed', [
                'ResultCode' => $resultCode,
                'ResultDesc' => $callback['ResultDesc'] ?? '',
                'MerchantRequestID' => $merchantId,
                'CheckoutRequestID' => $checkoutId,
            ]);

            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $items   = $callback['CallbackMetadata']['Item'] ?? [];
        $meta    = collect($items)->keyBy('Name')->map(fn($i) => $i['Value'] ?? null);

        $receipt = $meta->get('MpesaReceiptNumber');
        $amount  = $meta->get('Amount');
        $phone   = $meta->get('PhoneNumber');
        $paidAt  = $meta->get('TransactionDate'); // YYYYMMDDHHmmss

        Log::info('Payment confirmed', compact('receipt', 'amount', 'phone', 'paidAt', 'checkoutId'));
        // TODO: mark the corresponding order as paid in your database

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }
}

// routes/api.php — add this route:
// Route::post('/mpesa/stk-callback', [MpesaController::class, 'stkCallback']);
//
// Don't forget to exclude this route from CSRF protection in bootstrap/app.php:
// ->withMiddleware(function (Middleware $middleware) {
//     $middleware->validateCsrfTokens(except: ['mpesa/*']);
// })
`,
  }
}

function stkGin(): GeneratedFile {
  return {
    filename: 'handlers/mpesa.go',
    language: 'go',
    content: `package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type stkCallbackItem struct {
	Name  string      \`json:"Name"\`
	Value interface{} \`json:"Value"\`
}

type stkCallback struct {
	ResultCode       int                \`json:"ResultCode"\`
	ResultDesc       string             \`json:"ResultDesc"\`
	MerchantRequestID string           \`json:"MerchantRequestID"\`
	CheckoutRequestID string           \`json:"CheckoutRequestID"\`
	CallbackMetadata *struct {
		Item []stkCallbackItem \`json:"Item"\`
	} \`json:"CallbackMetadata"\`
}

type stkCallbackRequest struct {
	Body struct {
		STKCallback stkCallback \`json:"stkCallback"\`
	} \`json:"Body"\`
}

// STKCallback handles POST /mpesa/stk-callback.
// Daraja delivers the payment result here after an STK Push completes or fails.
// Reply 200 immediately — Daraja retries if it waits more than 5 seconds.
func STKCallback(c *gin.Context) {
	var payload stkCallbackRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ResultCode": 1, "ResultDesc": "Invalid JSON"})
		return
	}

	// Acknowledge before processing
	c.JSON(http.StatusOK, gin.H{"ResultCode": 0, "ResultDesc": "Accepted"})

	cb := payload.Body.STKCallback

	if cb.ResultCode != 0 {
		log.Printf("STK Push failed: %s (merchant=%s, checkout=%s)",
			cb.ResultDesc, cb.MerchantRequestID, cb.CheckoutRequestID)
		return
	}

	meta := make(map[string]interface{})
	if cb.CallbackMetadata != nil {
		for _, item := range cb.CallbackMetadata.Item {
			meta[item.Name] = item.Value
		}
	}

	receipt := fmt.Sprintf("%v", meta["MpesaReceiptNumber"])
	amount  := fmt.Sprintf("%v", meta["Amount"])
	phone   := fmt.Sprintf("%v", meta["PhoneNumber"])
	paidAt  := fmt.Sprintf("%v", meta["TransactionDate"]) // YYYYMMDDHHmmss

	log.Printf("Payment confirmed: receipt=%s amount=%s phone=%s at=%s checkout=%s",
		receipt, amount, phone, paidAt, cb.CheckoutRequestID)
	// TODO: mark the corresponding order as paid in your database
}

// Register with your Gin router:
// r.POST("/mpesa/stk-callback", handlers.STKCallback)
`,
  }
}

function stkRails(): GeneratedFile {
  return {
    filename: 'app/controllers/mpesa_controller.rb',
    language: 'ruby',
    content: `class MpesaController < ApplicationController
  # Daraja posts raw JSON — skip Rails CSRF protection for this endpoint
  skip_before_action :verify_authenticity_token, only: [:stk_callback]

  # POST /mpesa/stk-callback
  #
  # Daraja delivers the payment result here after an STK Push completes or fails.
  # Respond immediately — Daraja retries if you take longer than 5 seconds.
  def stk_callback
    callback = params.dig(:Body, :stkCallback)

    render json: { ResultCode: 0, ResultDesc: "Accepted" } and return unless callback

    result_code = callback[:ResultCode].to_i
    merchant_id = callback[:MerchantRequestID]
    checkout_id = callback[:CheckoutRequestID]

    if result_code != 0
      Rails.logger.error("STK Push failed: #{callback[:ResultDesc]} " \
                         "(merchant=#{merchant_id}, checkout=#{checkout_id})")
      render json: { ResultCode: 0, ResultDesc: "Accepted" } and return
    end

    items   = callback.dig(:CallbackMetadata, :Item) || []
    meta    = items.index_by { |i| i[:Name] }.transform_values { |i| i[:Value] }

    receipt = meta["MpesaReceiptNumber"]
    amount  = meta["Amount"]
    phone   = meta["PhoneNumber"]
    paid_at = meta["TransactionDate"] # YYYYMMDDHHmmss

    Rails.logger.info("Payment confirmed: receipt=#{receipt} amount=#{amount} " \
                      "phone=#{phone} at=#{paid_at} checkout=#{checkout_id}")
    # TODO: mark the corresponding order as paid in your database

    render json: { ResultCode: 0, ResultDesc: "Accepted" }
  end
end

# config/routes.rb — add:
# post "mpesa/stk-callback", to: "mpesa#stk_callback"
`,
  }
}

function stkAspnet(): GeneratedFile {
  return {
    filename: 'Controllers/MpesaController.cs',
    language: 'csharp',
    content: `using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace YourApp.Controllers;

[ApiController]
[Route("mpesa")]
public class MpesaController : ControllerBase
{
    private readonly ILogger<MpesaController> _logger;

    public MpesaController(ILogger<MpesaController> logger) => _logger = logger;

    /// <summary>
    /// POST /mpesa/stk-callback
    /// Daraja delivers the payment result here after an STK Push completes or fails.
    /// Return 200 immediately — Daraja retries if it waits more than 5 seconds.
    /// </summary>
    [HttpPost("stk-callback")]
    public async Task<IActionResult> StkCallback([FromBody] StkCallbackRequest request)
    {
        var callback = request.Body?.StkCallback;
        if (callback is null) return Ok(new { ResultCode = 0, ResultDesc = "Accepted" });

        // Process asynchronously so the response isn't held up
        _ = Task.Run(() => HandlePaymentResult(callback));

        return Ok(new { ResultCode = 0, ResultDesc = "Accepted" });
    }

    private void HandlePaymentResult(StkCallback callback)
    {
        if (callback.ResultCode != 0)
        {
            _logger.LogError("STK Push failed: {Desc} (merchant={Mid}, checkout={Cid})",
                callback.ResultDesc, callback.MerchantRequestID, callback.CheckoutRequestID);
            return;
        }

        var meta = callback.CallbackMetadata?.Item
            .ToDictionary(i => i.Name, i => i.Value) ?? new();

        meta.TryGetValue("MpesaReceiptNumber", out var receipt);
        meta.TryGetValue("Amount", out var amount);
        meta.TryGetValue("PhoneNumber", out var phone);
        meta.TryGetValue("TransactionDate", out var paidAt); // YYYYMMDDHHmmss

        _logger.LogInformation("Payment confirmed: receipt={R} amount={A} phone={P} at={T}",
            receipt, amount, phone, paidAt);
        // TODO: mark the corresponding order as paid in your database
    }
}

// Models — place in Models/Mpesa.cs
public record StkCallbackRequest(StkCallbackBody? Body);
public record StkCallbackBody([property: JsonPropertyName("stkCallback")] StkCallback? StkCallback);
public record StkCallback(
    int ResultCode,
    string ResultDesc,
    string MerchantRequestID,
    string CheckoutRequestID,
    CallbackMetadata? CallbackMetadata
);
public record CallbackMetadata(List<CallbackItem> Item);
public record CallbackItem(string Name, JsonElement? Value);
`,
  }
}

// ---------------------------------------------------------------------------
// C2B validation + confirmation handlers
// ---------------------------------------------------------------------------

function c2bExpress(): GeneratedFile {
  return {
    filename: 'routes/mpesa-c2b.js',
    language: 'javascript',
    content: `const express = require('express')
const router = express.Router()

/**
 * POST /mpesa/c2b/validate
 *
 * Daraja calls this endpoint before processing a till/paybill payment.
 * Return ResultCode 0 to accept or a non-zero code to reject it.
 * You have roughly 8 seconds to respond.
 */
router.post('/mpesa/c2b/validate', (req, res) => {
  const { TransID, TransAmount, MSISDN, BillRefNumber } = req.body

  console.log('C2B validation request', { TransID, TransAmount, MSISDN, BillRefNumber })

  // Example: reject payments below KES 1
  if (Number(TransAmount) < 1) {
    return res.json({ ResultCode: 'C2B00011', ResultDesc: 'Invalid amount' })
  }

  // TODO: validate bill reference against your records
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

/**
 * POST /mpesa/c2b/confirm
 *
 * Daraja calls this endpoint after a payment has been processed successfully.
 * Always return ResultCode 0 — the money has already moved.
 * You have roughly 8 seconds to respond.
 */
router.post('/mpesa/c2b/confirm', (req, res) => {
  const {
    TransID, TransAmount, MSISDN,
    BillRefNumber, TransactionType, BusinessShortCode,
  } = req.body

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  console.log('C2B payment confirmed', {
    TransID, TransAmount, MSISDN, BillRefNumber, TransactionType, BusinessShortCode,
  })
  // TODO: credit the account in your database
})

module.exports = router
`,
  }
}

function c2bExpressTs(): GeneratedFile {
  return {
    filename: 'src/routes/mpesa-c2b.ts',
    language: 'typescript',
    content: `import { Router, Request, Response } from 'express'

interface C2BPayload {
  TransID: string
  TransTime: string
  TransAmount: string
  BusinessShortCode: string
  BillRefNumber: string
  InvoiceNumber?: string
  OrgAccountBalance: string
  ThirdPartyTransID?: string
  MSISDN: string
  FirstName?: string
  MiddleName?: string
  LastName?: string
  TransactionType: string
}

const router = Router()

/**
 * POST /mpesa/c2b/validate
 *
 * Daraja calls this endpoint before processing a till/paybill payment.
 * Return ResultCode 0 to accept or a non-zero code to reject it.
 * You have roughly 8 seconds to respond.
 */
router.post('/mpesa/c2b/validate', (req: Request<object, object, C2BPayload>, res: Response) => {
  const { TransID, TransAmount, MSISDN, BillRefNumber } = req.body

  console.log('C2B validation request', { TransID, TransAmount, MSISDN, BillRefNumber })

  if (Number(TransAmount) < 1) {
    return res.json({ ResultCode: 'C2B00011', ResultDesc: 'Invalid amount' })
  }

  // TODO: validate bill reference against your records
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

/**
 * POST /mpesa/c2b/confirm
 *
 * Daraja calls this endpoint after a payment has been processed successfully.
 * Always return ResultCode 0 — the money has already moved.
 * You have roughly 8 seconds to respond.
 */
router.post('/mpesa/c2b/confirm', (req: Request<object, object, C2BPayload>, res: Response) => {
  const { TransID, TransAmount, MSISDN, BillRefNumber, TransactionType, BusinessShortCode } = req.body

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  console.log('C2B payment confirmed', {
    TransID, TransAmount, MSISDN, BillRefNumber, TransactionType, BusinessShortCode,
  })
  // TODO: credit the account in your database
})

export default router
`,
  }
}

function c2bFastify(): GeneratedFile {
  return {
    filename: 'src/routes/mpesa-c2b.ts',
    language: 'typescript',
    content: `import type { FastifyPluginAsync } from 'fastify'

interface C2BPayload {
  TransID: string
  TransTime: string
  TransAmount: string
  BusinessShortCode: string
  BillRefNumber: string
  MSISDN: string
  TransactionType: string
  OrgAccountBalance: string
}

const c2bRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /mpesa/c2b/validate
   *
   * Daraja calls this endpoint before processing a till/paybill payment.
   * Return ResultCode 0 to accept or a non-zero code to reject it.
   */
  fastify.post<{ Body: C2BPayload }>('/mpesa/c2b/validate', async (request, reply) => {
    const { TransID, TransAmount, MSISDN, BillRefNumber } = request.body

    fastify.log.info({ TransID, TransAmount, MSISDN, BillRefNumber }, 'C2B validation request')

    if (Number(TransAmount) < 1) {
      return reply.send({ ResultCode: 'C2B00011', ResultDesc: 'Invalid amount' })
    }

    // TODO: validate bill reference against your records
    return reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })
  })

  /**
   * POST /mpesa/c2b/confirm
   *
   * Daraja calls this endpoint after a payment has been processed successfully.
   * Always return ResultCode 0 — the money has already moved.
   */
  fastify.post<{ Body: C2BPayload }>('/mpesa/c2b/confirm', async (request, reply) => {
    const { TransID, TransAmount, MSISDN, BillRefNumber, TransactionType } = request.body

    await reply.send({ ResultCode: 0, ResultDesc: 'Accepted' })

    fastify.log.info({ TransID, TransAmount, MSISDN, BillRefNumber, TransactionType }, 'C2B payment confirmed')
    // TODO: credit the account in your database
  })
}

export default c2bRoutes
`,
  }
}

function c2bNextjs(): GeneratedFile {
  return {
    filename: 'app/api/mpesa/c2b',
    language: 'typescript',
    content: `// app/api/mpesa/c2b/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface C2BPayload {
  TransID: string
  TransTime: string
  TransAmount: string
  BusinessShortCode: string
  BillRefNumber: string
  MSISDN: string
  TransactionType: string
}

/**
 * POST /api/mpesa/c2b/validate
 *
 * Daraja calls this endpoint before processing a till/paybill payment.
 * Return ResultCode 0 to accept or a non-zero code to reject it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await request.json() as C2BPayload

  console.log('C2B validation request', payload)

  if (Number(payload.TransAmount) < 1) {
    return NextResponse.json({ ResultCode: 'C2B00011', ResultDesc: 'Invalid amount' })
  }

  // TODO: validate BillRefNumber against your records
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}

// ─── app/api/mpesa/c2b/confirm/route.ts ──────────────────────────────────────

/**
 * POST /api/mpesa/c2b/confirm
 *
 * Daraja calls this after a payment succeeds. Always return ResultCode 0.
 * The money has already moved at this point.
 */
export async function POST_confirm(request: NextRequest): Promise<NextResponse> {
  const payload = await request.json() as C2BPayload

  console.log('C2B payment confirmed', payload)
  // TODO: credit the account in your database

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}
// Create app/api/mpesa/c2b/confirm/route.ts and export the POST_confirm function as POST.
`,
  }
}

function c2bFastapi(): GeneratedFile {
  return {
    filename: 'app/routers/mpesa_c2b.py',
    language: 'python',
    content: `from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/mpesa/c2b", tags=["mpesa-c2b"])


class C2BPayload(BaseModel):
    TransID: str
    TransTime: str
    TransAmount: str
    BusinessShortCode: str
    BillRefNumber: str
    MSISDN: str
    TransactionType: str
    OrgAccountBalance: str = ""
    InvoiceNumber: str = ""
    FirstName: str = ""
    MiddleName: str = ""
    LastName: str = ""


async def _record_payment(payload: C2BPayload) -> None:
    print(f"C2B confirmed: trans={payload.TransID} amount={payload.TransAmount} "
          f"phone={payload.MSISDN} ref={payload.BillRefNumber}")
    # TODO: credit the account in your database


@router.post("/validate")
async def validate(payload: C2BPayload) -> dict[str, Any]:
    """
    Daraja calls this endpoint before processing a till/paybill payment.
    Return ResultCode 0 to accept or a non-zero code to reject it.
    You have roughly 8 seconds to respond.
    """
    print(f"C2B validation: trans={payload.TransID} amount={payload.TransAmount} "
          f"phone={payload.MSISDN} ref={payload.BillRefNumber}")

    if float(payload.TransAmount) < 1:
        return {"ResultCode": "C2B00011", "ResultDesc": "Invalid amount"}

    # TODO: validate BillRefNumber against your records
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.post("/confirm")
async def confirm(payload: C2BPayload, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """
    Daraja calls this after a payment succeeds. Always return ResultCode 0.
    The money has already moved — never reject a confirmation.
    """
    background_tasks.add_task(_record_payment, payload)
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
`,
  }
}

function c2bFlask(): GeneratedFile {
  return {
    filename: 'blueprints/mpesa_c2b.py',
    language: 'python',
    content: `from flask import Blueprint, request, jsonify
from threading import Thread

mpesa_c2b_bp = Blueprint("mpesa_c2b", __name__, url_prefix="/mpesa/c2b")


def _record_payment(data: dict) -> None:
    print(f"C2B confirmed: trans={data.get('TransID')} amount={data.get('TransAmount')} "
          f"phone={data.get('MSISDN')} ref={data.get('BillRefNumber')}")
    # TODO: credit the account in your database


@mpesa_c2b_bp.route("/validate", methods=["POST"])
def validate():
    """
    Daraja calls this endpoint before processing a till/paybill payment.
    Return ResultCode 0 to accept or a non-zero code to reject it.
    You have roughly 8 seconds to respond.
    """
    data = request.get_json(silent=True) or {}

    if float(data.get("TransAmount", 0)) < 1:
        return jsonify({"ResultCode": "C2B00011", "ResultDesc": "Invalid amount"})

    # TODO: validate BillRefNumber against your records
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"})


@mpesa_c2b_bp.route("/confirm", methods=["POST"])
def confirm():
    """
    Daraja calls this after a payment succeeds. Always return ResultCode 0.
    The money has already moved — never reject a confirmation.
    """
    data = request.get_json(silent=True) or {}
    Thread(target=_record_payment, args=(data,), daemon=True).start()
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"})
`,
  }
}

function c2bDjango(): GeneratedFile {
  return {
    filename: 'mpesa/views_c2b.py',
    language: 'python',
    content: `import json
from threading import Thread
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


def _record_payment(data: dict) -> None:
    print(f"C2B confirmed: trans={data.get('TransID')} amount={data.get('TransAmount')} "
          f"phone={data.get('MSISDN')} ref={data.get('BillRefNumber')}")
    # TODO: credit the account in your database


@method_decorator(csrf_exempt, name="dispatch")
class C2BValidateView(View):
    """
    POST /mpesa/c2b/validate
    Daraja calls this before processing a till/paybill payment.
    Return ResultCode 0 to accept or a non-zero code to reject it.
    """

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"ResultCode": "C2B00016", "ResultDesc": "Invalid JSON"}, status=400)

        if float(data.get("TransAmount", 0)) < 1:
            return JsonResponse({"ResultCode": "C2B00011", "ResultDesc": "Invalid amount"})

        # TODO: validate BillRefNumber against your records
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


@method_decorator(csrf_exempt, name="dispatch")
class C2BConfirmView(View):
    """
    POST /mpesa/c2b/confirm
    Daraja calls this after a payment succeeds. Always return ResultCode 0.
    """

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

        Thread(target=_record_payment, args=(data,), daemon=True).start()
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


# urls.py — add these URL patterns:
# from mpesa.views_c2b import C2BValidateView, C2BConfirmView
# path("mpesa/c2b/validate", C2BValidateView.as_view(), name="c2b-validate"),
# path("mpesa/c2b/confirm",  C2BConfirmView.as_view(),  name="c2b-confirm"),
`,
  }
}

function c2bLaravel(): GeneratedFile {
  return {
    filename: 'app/Http/Controllers/MpesaC2BController.php',
    language: 'php',
    content: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class MpesaC2BController extends Controller
{
    /**
     * POST /mpesa/c2b/validate
     *
     * Daraja calls this endpoint before processing a till/paybill payment.
     * Return ResultCode 0 to accept or a non-zero code to reject it.
     * You have roughly 8 seconds to respond.
     */
    public function validate(Request $request): JsonResponse
    {
        $transId     = $request->input('TransID');
        $amount      = (float) $request->input('TransAmount', 0);
        $phone       = $request->input('MSISDN');
        $billRef     = $request->input('BillRefNumber');

        Log::info('C2B validation request', compact('transId', 'amount', 'phone', 'billRef'));

        if ($amount < 1) {
            return response()->json(['ResultCode' => 'C2B00011', 'ResultDesc' => 'Invalid amount']);
        }

        // TODO: validate $billRef against your records
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /**
     * POST /mpesa/c2b/confirm
     *
     * Daraja calls this after a payment succeeds. Always return ResultCode 0.
     * The money has already moved — never reject a confirmation.
     */
    public function confirm(Request $request): JsonResponse
    {
        Log::info('C2B payment confirmed', $request->all());
        // TODO: credit the account in your database

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }
}

// routes/api.php — add these routes:
// Route::post('/mpesa/c2b/validate', [MpesaC2BController::class, 'validate']);
// Route::post('/mpesa/c2b/confirm',  [MpesaC2BController::class, 'confirm']);
//
// Don't forget to exclude these routes from CSRF protection in bootstrap/app.php.
`,
  }
}

function c2bGin(): GeneratedFile {
  return {
    filename: 'handlers/mpesa_c2b.go',
    language: 'go',
    content: `package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type c2bPayload struct {
	TransID           string \`json:"TransID"\`
	TransTime         string \`json:"TransTime"\`
	TransAmount       string \`json:"TransAmount"\`
	BusinessShortCode string \`json:"BusinessShortCode"\`
	BillRefNumber     string \`json:"BillRefNumber"\`
	MSISDN            string \`json:"MSISDN"\`
	TransactionType   string \`json:"TransactionType"\`
	OrgAccountBalance string \`json:"OrgAccountBalance"\`
}

// C2BValidate handles POST /mpesa/c2b/validate.
// Daraja calls this before processing a till/paybill payment.
// Return ResultCode 0 to accept or a non-zero code to reject.
func C2BValidate(c *gin.Context) {
	var p c2bPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ResultCode": "C2B00016", "ResultDesc": "Invalid request"})
		return
	}

	log.Printf("C2B validate: trans=%s amount=%s phone=%s ref=%s", p.TransID, p.TransAmount, p.MSISDN, p.BillRefNumber)

	amount, _ := strconv.ParseFloat(p.TransAmount, 64)
	if amount < 1 {
		c.JSON(http.StatusOK, gin.H{"ResultCode": "C2B00011", "ResultDesc": "Invalid amount"})
		return
	}

	// TODO: validate BillRefNumber against your records
	c.JSON(http.StatusOK, gin.H{"ResultCode": 0, "ResultDesc": "Accepted"})
}

// C2BConfirm handles POST /mpesa/c2b/confirm.
// Daraja calls this after a payment succeeds. Always return ResultCode 0.
// The money has already moved — never reject a confirmation.
func C2BConfirm(c *gin.Context) {
	var p c2bPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		// Still acknowledge — the payment went through regardless
		c.JSON(http.StatusOK, gin.H{"ResultCode": 0, "ResultDesc": "Accepted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ResultCode": 0, "ResultDesc": "Accepted"})

	log.Printf("C2B confirmed: trans=%s amount=%s phone=%s ref=%s", p.TransID, p.TransAmount, p.MSISDN, p.BillRefNumber)
	// TODO: credit the account in your database
}

// Register with your Gin router:
// r.POST("/mpesa/c2b/validate", handlers.C2BValidate)
// r.POST("/mpesa/c2b/confirm",  handlers.C2BConfirm)
`,
  }
}

function c2bRails(): GeneratedFile {
  return {
    filename: 'app/controllers/mpesa_c2b_controller.rb',
    language: 'ruby',
    content: `class MpesaC2bController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:validate, :confirm]

  # POST /mpesa/c2b/validate
  #
  # Daraja calls this before processing a till/paybill payment.
  # Return ResultCode 0 to accept or a non-zero code to reject it.
  def validate
    trans_id  = params[:TransID]
    amount    = params[:TransAmount].to_f
    phone     = params[:MSISDN]
    bill_ref  = params[:BillRefNumber]

    Rails.logger.info("C2B validate: trans=#{trans_id} amount=#{amount} phone=#{phone} ref=#{bill_ref}")

    if amount < 1
      render json: { ResultCode: "C2B00011", ResultDesc: "Invalid amount" } and return
    end

    # TODO: validate bill_ref against your records
    render json: { ResultCode: 0, ResultDesc: "Accepted" }
  end

  # POST /mpesa/c2b/confirm
  #
  # Daraja calls this after a payment succeeds. Always return ResultCode 0.
  # The money has already moved — never reject a confirmation.
  def confirm
    Rails.logger.info("C2B confirmed: #{params.to_unsafe_h.slice('TransID', 'TransAmount', 'MSISDN', 'BillRefNumber')}")
    # TODO: credit the account in your database
    render json: { ResultCode: 0, ResultDesc: "Accepted" }
  end
end

# config/routes.rb — add:
# post "mpesa/c2b/validate", to: "mpesa_c2b#validate"
# post "mpesa/c2b/confirm",  to: "mpesa_c2b#confirm"
`,
  }
}

function c2bAspnet(): GeneratedFile {
  return {
    filename: 'Controllers/MpesaC2BController.cs',
    language: 'csharp',
    content: `using Microsoft.AspNetCore.Mvc;

namespace YourApp.Controllers;

[ApiController]
[Route("mpesa/c2b")]
public class MpesaC2BController : ControllerBase
{
    private readonly ILogger<MpesaC2BController> _logger;

    public MpesaC2BController(ILogger<MpesaC2BController> logger) => _logger = logger;

    /// <summary>
    /// POST /mpesa/c2b/validate
    /// Daraja calls this before processing a till/paybill payment.
    /// Return ResultCode 0 to accept or a non-zero code to reject it.
    /// </summary>
    [HttpPost("validate")]
    public IActionResult Validate([FromBody] C2BPayload payload)
    {
        _logger.LogInformation("C2B validate: trans={T} amount={A} phone={P} ref={R}",
            payload.TransID, payload.TransAmount, payload.MSISDN, payload.BillRefNumber);

        if (decimal.TryParse(payload.TransAmount, out var amount) && amount < 1)
            return Ok(new { ResultCode = "C2B00011", ResultDesc = "Invalid amount" });

        // TODO: validate BillRefNumber against your records
        return Ok(new { ResultCode = 0, ResultDesc = "Accepted" });
    }

    /// <summary>
    /// POST /mpesa/c2b/confirm
    /// Daraja calls this after a payment succeeds. Always return ResultCode 0.
    /// The money has already moved — never reject a confirmation.
    /// </summary>
    [HttpPost("confirm")]
    public IActionResult Confirm([FromBody] C2BPayload payload)
    {
        _logger.LogInformation("C2B confirmed: trans={T} amount={A} phone={P} ref={R}",
            payload.TransID, payload.TransAmount, payload.MSISDN, payload.BillRefNumber);

        // TODO: credit the account in your database
        return Ok(new { ResultCode = 0, ResultDesc = "Accepted" });
    }
}

// Models/C2BPayload.cs
public record C2BPayload(
    string TransID,
    string TransTime,
    string TransAmount,
    string BusinessShortCode,
    string BillRefNumber,
    string MSISDN,
    string TransactionType,
    string OrgAccountBalance = ""
);
`,
  }
}

// ---------------------------------------------------------------------------
// Phoenix (Elixir) templates
// ---------------------------------------------------------------------------

function stkPhoenix(): GeneratedFile {
  return {
    filename: 'lib/your_app_web/controllers/mpesa_controller.ex',
    language: 'elixir',
    content: `defmodule YourAppWeb.MpesaController do
  use YourAppWeb, :controller
  require Logger

  # POST /mpesa/stk-callback
  # Daraja delivers the payment result here after an STK Push completes or fails.
  # Respond with 200 immediately — Daraja retries if it waits more than 5 seconds.
  def stk_callback(conn, %{"Body" => %{"stkCallback" => callback}}) do
    Task.start(fn -> handle_stk_result(callback) end)
    json(conn, %{ResultCode: 0, ResultDesc: "Accepted"})
  end

  def stk_callback(conn, _params) do
    json(conn, %{ResultCode: 0, ResultDesc: "Accepted"})
  end

  defp handle_stk_result(callback) do
    result_code = callback["ResultCode"]
    merchant_id = callback["MerchantRequestID"]
    checkout_id = callback["CheckoutRequestID"]

    if result_code != 0 do
      Logger.error("STK Push failed: #{callback["ResultDesc"]} (merchant=#{merchant_id}, checkout=#{checkout_id})")
    else
      meta =
        callback
        |> get_in(["CallbackMetadata", "Item"])
        |> Kernel.||([] )
        |> Enum.reduce(%{}, fn %{"Name" => k, "Value" => v}, acc -> Map.put(acc, k, v) end)

      receipt = meta["MpesaReceiptNumber"]
      amount  = meta["Amount"]
      phone   = meta["PhoneNumber"]
      paid_at = meta["TransactionDate"]  # YYYYMMDDHHmmss

      Logger.info("Payment confirmed: receipt=#{receipt} amount=#{amount} phone=#{phone} at=#{paid_at} checkout=#{checkout_id}")
      # TODO: mark the corresponding order as paid in your database
    end
  end
end

# lib/your_app_web/router.ex — add inside a scope block:
# scope "/", YourAppWeb do
#   pipe_through :api
#   post "/mpesa/stk-callback", MpesaController, :stk_callback
# end
`,
  }
}

function stkKtor(): GeneratedFile {
  return {
    filename: 'src/main/kotlin/com/yourapp/routes/MpesaRoutes.kt',
    language: 'kotlin',
    content: `package com.yourapp.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("MpesaRoutes")

// ── Models ─────────────────────────────────────────────────────────────────

@Serializable
data class StkCallbackItem(val Name: String, val Value: JsonElement? = null)

@Serializable
data class StkCallbackMetadata(val Item: List<StkCallbackItem> = emptyList())

@Serializable
data class StkCallback(
    val ResultCode: Int,
    val ResultDesc: String,
    val MerchantRequestID: String,
    val CheckoutRequestID: String,
    val CallbackMetadata: StkCallbackMetadata? = null
)

@Serializable
data class StkCallbackBody(val stkCallback: StkCallback)

@Serializable
data class StkCallbackRequest(val Body: StkCallbackBody)

// ── Route ──────────────────────────────────────────────────────────────────

fun Application.configureMpesaRoutes() {
    routing {
        // POST /mpesa/stk-callback
        // Daraja delivers the payment result here after an STK Push completes or fails.
        // Respond immediately — Daraja retries if you take more than 5 seconds.
        post("/mpesa/stk-callback") {
            val payload = call.receive<StkCallbackRequest>()

            // Acknowledge before processing
            call.respond(mapOf("ResultCode" to 0, "ResultDesc" to "Accepted"))

            val cb = payload.Body.stkCallback

            launch {
                if (cb.ResultCode != 0) {
                    logger.error("STK Push failed: \${cb.ResultDesc} (merchant=\${cb.MerchantRequestID}, checkout=\${cb.CheckoutRequestID})")
                    return@launch
                }

                val meta = cb.CallbackMetadata?.Item
                    ?.associate { it.Name to it.Value?.toString() }
                    ?: emptyMap()

                val receipt = meta["MpesaReceiptNumber"]
                val amount  = meta["Amount"]
                val phone   = meta["PhoneNumber"]
                val paidAt  = meta["TransactionDate"] // YYYYMMDDHHmmss

                logger.info("Payment confirmed: receipt=$receipt amount=$amount phone=$phone at=$paidAt checkout=\${cb.CheckoutRequestID}")
                // TODO: mark the corresponding order as paid in your database
            }
        }
    }
}

// Application.kt — call inside module():
// configureMpesaRoutes()
`,
  }
}

function stkSpring(): GeneratedFile {
  return {
    filename: 'src/main/java/com/yourapp/controller/MpesaController.java',
    language: 'java',
    content: `package com.yourapp.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * POST /mpesa/stk-callback
 * Daraja delivers the payment result here after an STK Push completes or fails.
 * Return 200 immediately — Daraja retries if it waits more than 5 seconds.
 */
@RestController
@RequestMapping("/mpesa")
public class MpesaController {

    private static final Logger log = LoggerFactory.getLogger(MpesaController.class);

    @PostMapping("/stk-callback")
    public ResponseEntity<Map<String, Object>> stkCallback(@RequestBody StkCallbackRequest request) {
        CompletableFuture.runAsync(() -> handlePaymentResult(request));
        return ResponseEntity.ok(Map.of("ResultCode", 0, "ResultDesc", "Accepted"));
    }

    private void handlePaymentResult(StkCallbackRequest request) {
        var cb = request.body() != null ? request.body().stkCallback() : null;
        if (cb == null) return;

        if (cb.resultCode() != 0) {
            log.error("STK Push failed: {} (merchant={}, checkout={})",
                cb.resultDesc(), cb.merchantRequestId(), cb.checkoutRequestId());
            return;
        }

        var meta = cb.callbackMetadata() != null
            ? cb.callbackMetadata().item().stream()
                .collect(Collectors.toMap(CallbackItem::name, i -> String.valueOf(i.value())))
            : Map.<String, String>of();

        log.info("Payment confirmed: receipt={} amount={} phone={} at={} checkout={}",
            meta.get("MpesaReceiptNumber"), meta.get("Amount"),
            meta.get("PhoneNumber"),        meta.get("TransactionDate"),
            cb.checkoutRequestId());
        // TODO: mark the corresponding order as paid in your database
    }

    // ─── Models ───────────────────────────────────────────────────────────────

    public record StkCallbackRequest(
        @JsonProperty("Body") StkCallbackBody body) {}

    public record StkCallbackBody(
        @JsonProperty("stkCallback") StkCallback stkCallback) {}

    public record StkCallback(
        @JsonProperty("ResultCode")        int    resultCode,
        @JsonProperty("ResultDesc")        String resultDesc,
        @JsonProperty("MerchantRequestID") String merchantRequestId,
        @JsonProperty("CheckoutRequestID") String checkoutRequestId,
        @JsonProperty("CallbackMetadata")  CallbackMetadata callbackMetadata) {}

    public record CallbackMetadata(
        @JsonProperty("Item") List<CallbackItem> item) {}

    public record CallbackItem(
        @JsonProperty("Name")  String name,
        @JsonProperty("Value") Object value) {}
}
`,
  }
}

function stkVapor(): GeneratedFile {
  return {
    filename: 'Sources/App/Controllers/MpesaController.swift',
    language: 'swift',
    content: `import Vapor

// MARK: - Models

struct StkCallbackRequest: Content {
    let Body: StkCallbackBody
}

struct StkCallbackBody: Content {
    let stkCallback: StkCallback
}

struct StkCallback: Content {
    let ResultCode: Int
    let ResultDesc: String
    let MerchantRequestID: String
    let CheckoutRequestID: String
    let CallbackMetadata: StkCallbackMetadata?
}

struct StkCallbackMetadata: Content {
    let Item: [StkCallbackItem]
}

// M-Pesa returns mixed types for Item.Value (String/Int/Double) — decode flexibly
struct StkCallbackItem: Content {
    let Name: String
    let value: String

    enum CodingKeys: String, CodingKey { case Name, value = "Value" }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        Name = try c.decode(String.self, forKey: .Name)
        if      let s = try? c.decode(String.self, forKey: .value) { value = s }
        else if let i = try? c.decode(Int.self,    forKey: .value) { value = String(i) }
        else if let d = try? c.decode(Double.self, forKey: .value) { value = String(d) }
        else { value = "" }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(Name,  forKey: .Name)
        try c.encode(value, forKey: .value)
    }
}

struct MpesaAck: Content {
    let ResultCode: Int
    let ResultDesc: String
}

// MARK: - Route handler

func stkCallback(req: Request) async throws -> MpesaAck {
    let payload = try req.content.decode(StkCallbackRequest.self)
    let cb      = payload.Body.stkCallback

    let ack = MpesaAck(resultCode: 0, resultDesc: "Accepted")

    if cb.ResultCode != 0 {
        req.logger.error("STK Push failed: \\(cb.ResultDesc) checkout=\\(cb.CheckoutRequestID)")
        return ack
    }

    let meta = Dictionary(uniqueKeysWithValues:
        (cb.CallbackMetadata?.Item ?? []).map { ($0.Name, $0.value) }
    )

    req.logger.info("Payment confirmed: receipt=" + (meta["MpesaReceiptNumber"] ?? "?") +
        " amount=" + (meta["Amount"] ?? "?") +
        " phone="  + (meta["PhoneNumber"] ?? "?") +
        " checkout=" + cb.CheckoutRequestID)
    // TODO: mark the corresponding order as paid in your database

    return ack
}

// Sources/App/configure.swift — register the route:
// app.post("mpesa", "stk-callback", use: stkCallback)
`,
  }
}

function c2bPhoenix(): GeneratedFile {
  return {
    filename: 'lib/your_app_web/controllers/mpesa_c2b_controller.ex',
    language: 'elixir',
    content: `defmodule YourAppWeb.MpesaC2BController do
  use YourAppWeb, :controller
  require Logger

  # POST /mpesa/c2b/validate
  # Daraja calls this before processing a till/paybill payment.
  # Return ResultCode 0 to accept or a non-zero code to reject.
  # You have roughly 8 seconds to respond.
  def validate(conn, params) do
    trans_id = params["TransID"]
    amount   = params["TransAmount"]
    msisdn   = params["MSISDN"]
    bill_ref = params["BillRefNumber"]

    Logger.info("C2B validate: TransID=#{trans_id} amount=#{amount} phone=#{msisdn} ref=#{bill_ref}")

    # TODO: validate bill reference against your records
    # Return a non-zero ResultCode to reject the payment
    json(conn, %{ResultCode: 0, ResultDesc: "Accepted"})
  end

  # POST /mpesa/c2b/confirm
  # Daraja posts the confirmed payment here after funds settle.
  # Return 200 immediately — this is informational.
  def confirm(conn, params) do
    trans_id = params["TransID"]
    amount   = params["TransAmount"]
    msisdn   = params["MSISDN"]
    bill_ref = params["BillRefNumber"]

    Logger.info("C2B confirmed: TransID=#{trans_id} amount=#{amount} phone=#{msisdn} ref=#{bill_ref}")
    # TODO: reconcile the payment in your database

    json(conn, %{ResultCode: 0, ResultDesc: "Accepted"})
  end
end

# lib/your_app_web/router.ex — add inside a scope block:
# scope "/", YourAppWeb do
#   pipe_through :api
#   post "/mpesa/c2b/validate", MpesaC2BController, :validate
#   post "/mpesa/c2b/confirm",  MpesaC2BController, :confirm
# end
`,
  }
}

function c2bKtor(): GeneratedFile {
  return {
    filename: 'src/main/kotlin/com/yourapp/routes/MpesaC2BRoutes.kt',
    language: 'kotlin',
    content: `package com.yourapp.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.slf4j.LoggerFactory

private val c2bLogger = LoggerFactory.getLogger("MpesaC2BRoutes")

fun Application.configureMpesaC2BRoutes() {
    routing {
        // POST /mpesa/c2b/validate
        // Daraja calls this before processing a till/paybill payment.
        // Return ResultCode 0 to accept or a non-zero code to reject.
        // You have roughly 8 seconds to respond.
        post("/mpesa/c2b/validate") {
            val params = call.receiveNullable<Map<String, String>>() ?: emptyMap()
            val transId  = params["TransID"]
            val amount   = params["TransAmount"]
            val msisdn   = params["MSISDN"]
            val billRef  = params["BillRefNumber"]

            c2bLogger.info("C2B validate: TransID=$transId amount=$amount phone=$msisdn ref=$billRef")

            // TODO: validate bill reference against your records
            call.respond(HttpStatusCode.OK, mapOf("ResultCode" to 0, "ResultDesc" to "Accepted"))
        }

        // POST /mpesa/c2b/confirm
        // Daraja posts the confirmed payment here after funds settle.
        // Return 200 immediately — this is informational.
        post("/mpesa/c2b/confirm") {
            val params  = call.receiveNullable<Map<String, String>>() ?: emptyMap()
            val transId = params["TransID"]
            val amount  = params["TransAmount"]
            val msisdn  = params["MSISDN"]
            val billRef = params["BillRefNumber"]

            c2bLogger.info("C2B confirmed: TransID=$transId amount=$amount phone=$msisdn ref=$billRef")
            // TODO: reconcile the payment in your database

            call.respond(HttpStatusCode.OK, mapOf("ResultCode" to 0, "ResultDesc" to "Accepted"))
        }
    }
}

// Application.kt — call inside module():
// configureMpesaC2BRoutes()
`,
  }
}

function c2bSpring(): GeneratedFile {
  return {
    filename: 'src/main/java/com/yourapp/controller/MpesaC2BController.java',
    language: 'java',
    content: `package com.yourapp.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/mpesa/c2b")
public class MpesaC2BController {

    private static final Logger log = LoggerFactory.getLogger(MpesaC2BController.class);

    /**
     * POST /mpesa/c2b/validate
     * Daraja calls this before processing a till/paybill payment.
     * Return ResultCode 0 to accept or a non-zero code to reject.
     * You have roughly 8 seconds to respond.
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> params) {
        var transId  = params.get("TransID");
        var amount   = params.get("TransAmount");
        var msisdn   = params.get("MSISDN");
        var billRef  = params.get("BillRefNumber");

        log.info("C2B validate: TransID={} amount={} phone={} ref={}", transId, amount, msisdn, billRef);

        // TODO: validate bill reference against your records
        // Return a non-zero ResultCode to reject the payment
        return ResponseEntity.ok(Map.of("ResultCode", 0, "ResultDesc", "Accepted"));
    }

    /**
     * POST /mpesa/c2b/confirm
     * Daraja posts the confirmed payment here after funds settle.
     * Return 200 immediately — this is informational.
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@RequestBody Map<String, String> params) {
        var transId = params.get("TransID");
        var amount  = params.get("TransAmount");
        var msisdn  = params.get("MSISDN");
        var billRef = params.get("BillRefNumber");

        log.info("C2B confirmed: TransID={} amount={} phone={} ref={}", transId, amount, msisdn, billRef);
        // TODO: reconcile the payment in your database

        return ResponseEntity.ok(Map.of("ResultCode", 0, "ResultDesc", "Accepted"));
    }
}
`,
  }
}

function c2bVapor(): GeneratedFile {
  return {
    filename: 'Sources/App/Controllers/MpesaC2BController.swift',
    language: 'swift',
    content: `import Vapor

struct C2BParams: Content {
    let TransID: String?
    let TransAmount: String?
    let MSISDN: String?
    let BillRefNumber: String?
}

struct C2BResult: Content {
    let ResultCode: Int
    let ResultDesc: String
}

// POST /mpesa/c2b/validate
// Daraja calls this before processing a till/paybill payment.
// Return ResultCode 0 to accept or a non-zero code to reject.
// You have roughly 8 seconds to respond.
func c2bValidate(req: Request) async throws -> C2BResult {
    let params = try req.content.decode(C2BParams.self)

    req.logger.info("C2B validate: TransID=" + (params.TransID ?? "") +
        " amount=" + (params.TransAmount ?? "") +
        " phone="  + (params.MSISDN ?? "") +
        " ref="    + (params.BillRefNumber ?? ""))

    // TODO: validate bill reference against your records
    return C2BResult(ResultCode: 0, ResultDesc: "Accepted")
}

// POST /mpesa/c2b/confirm
// Daraja posts the confirmed payment here after funds settle.
// Return 200 immediately — this is informational.
func c2bConfirm(req: Request) async throws -> C2BResult {
    let params = try req.content.decode(C2BParams.self)

    req.logger.info("C2B confirmed: TransID=" + (params.TransID ?? "") +
        " amount=" + (params.TransAmount ?? "") +
        " phone="  + (params.MSISDN ?? "") +
        " ref="    + (params.BillRefNumber ?? ""))

    // TODO: reconcile the payment in your database
    return C2BResult(ResultCode: 0, ResultDesc: "Accepted")
}

// Sources/App/configure.swift — register routes:
// app.post("mpesa", "c2b", "validate", use: c2bValidate)
// app.post("mpesa", "c2b", "confirm",  use: c2bConfirm)
`,
  }
}

// ---------------------------------------------------------------------------
// Environment variable templates
// ---------------------------------------------------------------------------

function envDotenv(): GeneratedFile {
  return {
    filename: '.env',
    language: 'dotenv',
    content: `# Daraja / M-Pesa credentials
# Generated by daraja generate env --platform dotenv
# IMPORTANT: Add this file to .gitignore — it contains secrets

DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your_passkey
DARAJA_INITIATOR_NAME=testapi
DARAJA_INITIATOR_PASSWORD=your_initiator_password

# Callback URLs — must be HTTPS in production
DARAJA_CALLBACK_URL=https://your-domain.com/mpesa/stk-callback
DARAJA_VALIDATION_URL=https://your-domain.com/mpesa/c2b/validate
DARAJA_CONFIRMATION_URL=https://your-domain.com/mpesa/c2b/confirm
`,
  }
}

function envGithubActions(): GeneratedFile {
  return {
    filename: '.github/workflows/daraja-secrets.yml',
    language: 'yaml',
    content: `# Add these secrets to your GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret
#
# Generated by: daraja generate env --platform github-actions

# Required for all API calls
# DARAJA_ENVIRONMENT        = sandbox | production
# DARAJA_CONSUMER_KEY       = <from Safaricom Developer Portal>
# DARAJA_CONSUMER_SECRET    = <from Safaricom Developer Portal>
# DARAJA_SHORTCODE          = <your paybill or till number>

# Required for STK Push and Ratiba
# DARAJA_PASSKEY            = <from Safaricom Developer Portal>

# Required for B2C, B2B, reversal, balance, status
# DARAJA_INITIATOR_NAME     = <your API operator username>
# DARAJA_INITIATOR_PASSWORD = <your API operator password>

# Callback URLs — must be HTTPS reachable from the internet
# DARAJA_CALLBACK_URL       = https://your-domain.com/mpesa/stk-callback
# DARAJA_VALIDATION_URL     = https://your-domain.com/mpesa/c2b/validate
# DARAJA_CONFIRMATION_URL   = https://your-domain.com/mpesa/c2b/confirm

# Example usage in a workflow step:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run with Daraja credentials
        env:
          DARAJA_ENVIRONMENT: \${{ secrets.DARAJA_ENVIRONMENT }}
          DARAJA_CONSUMER_KEY: \${{ secrets.DARAJA_CONSUMER_KEY }}
          DARAJA_CONSUMER_SECRET: \${{ secrets.DARAJA_CONSUMER_SECRET }}
          DARAJA_SHORTCODE: \${{ secrets.DARAJA_SHORTCODE }}
          DARAJA_PASSKEY: \${{ secrets.DARAJA_PASSKEY }}
          DARAJA_INITIATOR_NAME: \${{ secrets.DARAJA_INITIATOR_NAME }}
          DARAJA_INITIATOR_PASSWORD: \${{ secrets.DARAJA_INITIATOR_PASSWORD }}
          DARAJA_CALLBACK_URL: \${{ secrets.DARAJA_CALLBACK_URL }}
          DARAJA_VALIDATION_URL: \${{ secrets.DARAJA_VALIDATION_URL }}
          DARAJA_CONFIRMATION_URL: \${{ secrets.DARAJA_CONFIRMATION_URL }}
        run: daraja doctor
`,
  }
}

function envVercel(): GeneratedFile {
  return {
    filename: '.env.vercel',
    language: 'dotenv',
    content: `# Vercel environment variables
# Generated by: daraja generate env --platform vercel
#
# To import: vercel env add <NAME> from this file, or paste into:
# Vercel Dashboard → Your Project → Settings → Environment Variables
#
# Tip: add --environment=production to scope production-only secrets

DARAJA_ENVIRONMENT=production
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_SHORTCODE=your_shortcode
DARAJA_PASSKEY=your_passkey
DARAJA_INITIATOR_NAME=your_initiator_name
DARAJA_INITIATOR_PASSWORD=your_initiator_password
DARAJA_CALLBACK_URL=https://your-project.vercel.app/api/mpesa/stk-callback
DARAJA_VALIDATION_URL=https://your-project.vercel.app/api/mpesa/c2b/validate
DARAJA_CONFIRMATION_URL=https://your-project.vercel.app/api/mpesa/c2b/confirm
`,
  }
}

function envDocker(): GeneratedFile {
  return {
    filename: 'docker-compose.yml',
    language: 'yaml',
    content: `# Generated by: daraja generate env --platform docker
# Reference .env in your service so docker compose picks up credentials automatically.
# Run: docker compose --env-file .env up

version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      # Override individual variables here if needed
      DARAJA_ENVIRONMENT: \${DARAJA_ENVIRONMENT:-sandbox}
      DARAJA_CONSUMER_KEY: \${DARAJA_CONSUMER_KEY}
      DARAJA_CONSUMER_SECRET: \${DARAJA_CONSUMER_SECRET}
      DARAJA_SHORTCODE: \${DARAJA_SHORTCODE}
      DARAJA_PASSKEY: \${DARAJA_PASSKEY}
      DARAJA_INITIATOR_NAME: \${DARAJA_INITIATOR_NAME}
      DARAJA_INITIATOR_PASSWORD: \${DARAJA_INITIATOR_PASSWORD}
      DARAJA_CALLBACK_URL: \${DARAJA_CALLBACK_URL}
      DARAJA_VALIDATION_URL: \${DARAJA_VALIDATION_URL}
      DARAJA_CONFIRMATION_URL: \${DARAJA_CONFIRMATION_URL}
`,
  }
}

function envRailway(): GeneratedFile {
  return {
    filename: '.env.railway',
    language: 'dotenv',
    content: `# Railway environment variables
# Generated by: daraja generate env --platform railway
#
# To import: paste into Railway Dashboard → Your Service → Variables
# Or use the Railway CLI: railway variables set KEY=VALUE
#
# For service-to-service comms use Railway's internal networking:
# DARAJA_CALLBACK_URL=https://$RAILWAY_PUBLIC_DOMAIN/mpesa/stk-callback

DARAJA_ENVIRONMENT=production
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_SHORTCODE=your_shortcode
DARAJA_PASSKEY=your_passkey
DARAJA_INITIATOR_NAME=your_initiator_name
DARAJA_INITIATOR_PASSWORD=your_initiator_password
DARAJA_CALLBACK_URL=https://your-service.up.railway.app/mpesa/stk-callback
DARAJA_VALIDATION_URL=https://your-service.up.railway.app/mpesa/c2b/validate
DARAJA_CONFIRMATION_URL=https://your-service.up.railway.app/mpesa/c2b/confirm
`,
  }
}

// ---------------------------------------------------------------------------
// Public dispatch functions
// ---------------------------------------------------------------------------

const STK_GENERATORS: Record<Stack, () => GeneratedFile> = {
  'express': stkExpress,
  'express-ts': stkExpressTs,
  'fastify': stkFastify,
  'nextjs': stkNextjs,
  'fastapi': stkFastapi,
  'flask': stkFlask,
  'django': stkDjango,
  'laravel': stkLaravel,
  'gin': stkGin,
  'rails': stkRails,
  'aspnet': stkAspnet,
  'phoenix': stkPhoenix,
  'ktor':    stkKtor,
  'spring':  stkSpring,
  'vapor':   stkVapor,
}

const C2B_GENERATORS: Record<Stack, () => GeneratedFile> = {
  'express': c2bExpress,
  'express-ts': c2bExpressTs,
  'fastify': c2bFastify,
  'nextjs': c2bNextjs,
  'fastapi': c2bFastapi,
  'flask': c2bFlask,
  'django': c2bDjango,
  'laravel': c2bLaravel,
  'gin': c2bGin,
  'rails': c2bRails,
  'aspnet': c2bAspnet,
  'phoenix': c2bPhoenix,
  'ktor':    c2bKtor,
  'spring':  c2bSpring,
  'vapor':   c2bVapor,
}

const ENV_GENERATORS: Record<EnvPlatform, () => GeneratedFile> = {
  'dotenv': envDotenv,
  'github-actions': envGithubActions,
  'vercel': envVercel,
  'docker': envDocker,
  'railway': envRailway,
}

export function generateStkCallback(stack: Stack): GeneratedFile {
  return STK_GENERATORS[stack]()
}

export function generateC2BWebhook(stack: Stack): GeneratedFile {
  return C2B_GENERATORS[stack]()
}

export function generateEnvTemplate(platform: EnvPlatform): GeneratedFile {
  return ENV_GENERATORS[platform]()
}
