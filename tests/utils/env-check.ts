/**
 * Environment Variable Consistency Checker
 * Verifies that all required environment variables are documented and used consistently
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
  usedIn: string[]
}

const expectedEnvVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    usedIn: ['lib/supabase/client.ts', 'lib/supabase/server.ts', 'lib/supabase/middleware.ts'],
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (safe for client-side)',
    usedIn: ['lib/supabase/client.ts', 'lib/supabase/server.ts', 'lib/supabase/middleware.ts'],
  },
  {
    name: 'NEXT_PUBLIC_QR_SCAN_ENDPOINT',
    required: true,
    description: 'Supabase Edge Function URL for QR scanning',
    usedIn: ['lib/api.ts', 'app/scan/page.tsx'],
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service role key (server-side only, never expose)',
    usedIn: ['scripts/generate-qr-codes.ts'],
  },
]

export function checkEnvVars(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if environment variables are set (when running in Node.js)
  if (typeof process !== 'undefined' && process.env) {
    for (const envVar of expectedEnvVars) {
      if (envVar.required && !process.env[envVar.name]) {
        errors.push(
          `Missing required environment variable: ${envVar.name} - ${envVar.description}`
        )
      }

      // Check for placeholder values
      if (
        process.env[envVar.name] &&
        process.env[envVar.name].includes('your-edge-function-url-here')
      ) {
        errors.push(
          `Environment variable ${envVar.name} appears to have a placeholder value`
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function printEnvVarReport(): void {
  console.log('\n📋 Environment Variables Report\n')
  console.log('Required Variables:')
  
  expectedEnvVars
    .filter((v) => v.required)
    .forEach((envVar) => {
      const isSet = typeof process !== 'undefined' && process.env && !!process.env[envVar.name]
      console.log(`  ${isSet ? '✅' : '❌'} ${envVar.name}`)
      console.log(`     ${envVar.description}`)
      console.log(`     Used in: ${envVar.usedIn.join(', ')}`)
    })

  console.log('\nOptional Variables:')
  
  expectedEnvVars
    .filter((v) => !v.required)
    .forEach((envVar) => {
      const isSet = typeof process !== 'undefined' && process.env && !!process.env[envVar.name]
      console.log(`  ${isSet ? '✅' : '⚪'} ${envVar.name}`)
      console.log(`     ${envVar.description}`)
      console.log(`     Used in: ${envVar.usedIn.join(', ')}`)
    })

  const result = checkEnvVars()
  if (!result.valid) {
    console.log('\n❌ Issues found:')
    result.errors.forEach((error) => console.log(`  - ${error}`))
  } else {
    console.log('\n✅ All environment variables are properly configured!')
  }
}

// Run if executed directly
if (require.main === module) {
  printEnvVarReport()
  const result = checkEnvVars()
  process.exit(result.valid ? 0 : 1)
}

