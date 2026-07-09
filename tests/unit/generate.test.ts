import { describe, it, expect } from 'vitest'
import {
  generateStkCallback,
  generateC2BWebhook,
  generateEnvTemplate,
  SUPPORTED_STACKS,
  SUPPORTED_PLATFORMS,
  STACK_LABELS,
  PLATFORM_LABELS,
  type Stack,
  type EnvPlatform,
} from '../../src/commands/generate/templates.js'

// ─── generateStkCallback ──────────────────────────────────────────────────────

describe('generateStkCallback', () => {
  it('covers all supported stacks', () => {
    for (const stack of SUPPORTED_STACKS) {
      const file = generateStkCallback(stack)
      expect(file.filename).toBeTruthy()
      expect(file.language).toBeTruthy()
      expect(file.content.length).toBeGreaterThan(100)
    }
  })

  it('returns a filename and language for every stack', () => {
    for (const stack of SUPPORTED_STACKS) {
      const file = generateStkCallback(stack)
      expect(file).toHaveProperty('filename')
      expect(file).toHaveProperty('language')
      expect(file).toHaveProperty('content')
    }
  })

  describe('express (JavaScript)', () => {
    const file = generateStkCallback('express')
    it('has a .js filename', () => expect(file.filename).toMatch(/\.js$/))
    it('language is javascript', () => expect(file.language).toBe('javascript'))
    it('handles ResultCode 0', () => expect(file.content).toContain('ResultCode'))
    it('references the callback URL path', () => expect(file.content).toContain('stk-callback'))
    it('extracts MpesaReceiptNumber', () => expect(file.content).toContain('MpesaReceiptNumber'))
  })

  describe('express-ts (TypeScript)', () => {
    const file = generateStkCallback('express-ts')
    it('has a .ts filename', () => expect(file.filename).toMatch(/\.ts$/))
    it('language is typescript', () => expect(file.language).toBe('typescript'))
    it('includes TypeScript interface definitions', () => expect(file.content).toContain('interface'))
    it('imports from express', () => expect(file.content).toContain("from 'express'"))
  })

  describe('fastify', () => {
    const file = generateStkCallback('fastify')
    it('imports FastifyPluginAsync', () => expect(file.content).toContain('FastifyPluginAsync'))
    it('uses fastify.log not console.log', () => expect(file.content).toContain('fastify.log'))
  })

  describe('nextjs', () => {
    const file = generateStkCallback('nextjs')
    it('uses NextRequest and NextResponse', () => {
      expect(file.content).toContain('NextRequest')
      expect(file.content).toContain('NextResponse')
    })
    it('exports a POST function', () => expect(file.content).toContain('export async function POST'))
    it('suggests app router path in filename', () => expect(file.filename).toContain('app/api'))
  })

  describe('fastapi', () => {
    const file = generateStkCallback('fastapi')
    it('language is python', () => expect(file.language).toBe('python'))
    it('uses BackgroundTasks for async processing', () => expect(file.content).toContain('BackgroundTasks'))
    it('uses Pydantic BaseModel', () => expect(file.content).toContain('BaseModel'))
    it('returns ResultCode 0 immediately', () => expect(file.content).toContain('ResultCode": 0'))
  })

  describe('flask', () => {
    const file = generateStkCallback('flask')
    it('uses Blueprint', () => expect(file.content).toContain('Blueprint'))
    it('uses Thread for async processing', () => expect(file.content).toContain('Thread'))
    it('returns JSON response', () => expect(file.content).toContain('jsonify'))
  })

  describe('django', () => {
    const file = generateStkCallback('django')
    it('skips CSRF via decorator', () => expect(file.content).toContain('csrf_exempt'))
    it('uses Django View class', () => expect(file.content).toContain('class STKCallbackView'))
    it('includes urls.py instructions', () => expect(file.content).toContain('urls.py'))
  })

  describe('laravel', () => {
    const file = generateStkCallback('laravel')
    it('language is php', () => expect(file.language).toBe('php'))
    it('uses Laravel JsonResponse', () => expect(file.content).toContain('JsonResponse'))
    it('uses Log facade', () => expect(file.content).toContain('Log::'))
    it('includes route registration comment', () => expect(file.content).toContain('routes/api.php'))
  })

  describe('gin', () => {
    const file = generateStkCallback('gin')
    it('language is go', () => expect(file.language).toBe('go'))
    it('imports gin package', () => expect(file.content).toContain('github.com/gin-gonic/gin'))
    it('exports STKCallback handler function', () => expect(file.content).toContain('func STKCallback'))
    it('includes router registration comment', () => expect(file.content).toContain('r.POST'))
  })

  describe('rails', () => {
    const file = generateStkCallback('rails')
    it('language is ruby', () => expect(file.language).toBe('ruby'))
    it('skips CSRF verification', () => expect(file.content).toContain('skip_before_action'))
    it('uses Rails.logger', () => expect(file.content).toContain('Rails.logger'))
    it('includes routes.rb instructions', () => expect(file.content).toContain('routes.rb'))
  })

  describe('aspnet', () => {
    const file = generateStkCallback('aspnet')
    it('language is csharp', () => expect(file.language).toBe('csharp'))
    it('uses ASP.NET ApiController', () => expect(file.content).toContain('[ApiController]'))
    it('uses ILogger', () => expect(file.content).toContain('ILogger'))
    it('processes asynchronously with Task.Run', () => expect(file.content).toContain('Task.Run'))
  })
})

// ─── generateC2BWebhook ───────────────────────────────────────────────────────

describe('generateC2BWebhook', () => {
  it('covers all supported stacks', () => {
    for (const stack of SUPPORTED_STACKS) {
      const file = generateC2BWebhook(stack)
      expect(file.filename).toBeTruthy()
      expect(file.content.length).toBeGreaterThan(100)
    }
  })

  it('all outputs include both validate and confirm handling', () => {
    for (const stack of SUPPORTED_STACKS) {
      const file = generateC2BWebhook(stack)
      expect(file.content).toContain('validate')
      expect(file.content).toContain('confirm')
    }
  })

  it('validate handlers check amount validity', () => {
    const stacks: Stack[] = ['express', 'express-ts', 'fastapi', 'flask', 'gin']
    for (const stack of stacks) {
      const file = generateC2BWebhook(stack)
      expect(file.content).toContain('TransAmount')
    }
  })

  it('confirm handlers always return ResultCode 0', () => {
    for (const stack of SUPPORTED_STACKS) {
      const file = generateC2BWebhook(stack)
      expect(file.content).toContain('0')
    }
  })

  describe('express', () => {
    const file = generateC2BWebhook('express')
    it('registers both /validate and /confirm routes', () => {
      expect(file.content).toContain('/mpesa/c2b/validate')
      expect(file.content).toContain('/mpesa/c2b/confirm')
    })
  })

  describe('laravel', () => {
    const file = generateC2BWebhook('laravel')
    it('has separate validate() and confirm() controller methods', () => {
      expect(file.content).toContain('public function validate')
      expect(file.content).toContain('public function confirm')
    })
  })

  describe('gin', () => {
    const file = generateC2BWebhook('gin')
    it('exports C2BValidate and C2BConfirm', () => {
      expect(file.content).toContain('func C2BValidate')
      expect(file.content).toContain('func C2BConfirm')
    })
  })
})

// ─── generateEnvTemplate ──────────────────────────────────────────────────────

describe('generateEnvTemplate', () => {
  it('covers all supported platforms', () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      const file = generateEnvTemplate(platform)
      expect(file.filename).toBeTruthy()
      expect(file.content.length).toBeGreaterThan(50)
    }
  })

  it('all templates include the core credential keys', () => {
    const coreKeys = [
      'DARAJA_CONSUMER_KEY',
      'DARAJA_CONSUMER_SECRET',
      'DARAJA_SHORTCODE',
    ]
    for (const platform of SUPPORTED_PLATFORMS) {
      const file = generateEnvTemplate(platform)
      for (const key of coreKeys) {
        expect(file.content).toContain(key)
      }
    }
  })

  describe('dotenv', () => {
    const file = generateEnvTemplate('dotenv')
    it('filename is .env', () => expect(file.filename).toBe('.env'))
    it('language is dotenv', () => expect(file.language).toBe('dotenv'))
    it('includes callback URL placeholder', () => expect(file.content).toContain('DARAJA_CALLBACK_URL'))
    it('includes a gitignore warning', () => expect(file.content).toContain('.gitignore'))
  })

  describe('github-actions', () => {
    const file = generateEnvTemplate('github-actions')
    it('shows secrets syntax', () => expect(file.content).toContain('secrets.'))
    it('has a .yml filename', () => expect(file.filename).toMatch(/\.yml$/))
    it('includes workflow job example', () => expect(file.content).toContain('runs-on'))
  })

  describe('vercel', () => {
    const file = generateEnvTemplate('vercel')
    it('mentions vercel domain', () => expect(file.content).toContain('vercel.app'))
    it('sets environment to production', () => expect(file.content).toContain('production'))
  })

  describe('docker', () => {
    const file = generateEnvTemplate('docker')
    it('filename is docker-compose.yml', () => expect(file.filename).toBe('docker-compose.yml'))
    it('uses env_file directive', () => expect(file.content).toContain('env_file'))
    it('uses variable substitution syntax', () => expect(file.content).toContain('${DARAJA_'))
  })

  describe('railway', () => {
    const file = generateEnvTemplate('railway')
    it('mentions railway.app domain', () => expect(file.content).toContain('railway.app'))
    it('includes Railway CLI tip', () => expect(file.content).toContain('railway'))
  })
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

describe('STACK_LABELS', () => {
  it('has a label for every supported stack', () => {
    for (const stack of SUPPORTED_STACKS) {
      expect(STACK_LABELS[stack]).toBeTruthy()
    }
  })
})

describe('PLATFORM_LABELS', () => {
  it('has a label for every supported platform', () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toBeTruthy()
    }
  })
})
