/**
 * Script to check environment variable consistency
 * Usage: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' })

const expectedEnvVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
  },
  {
    name: 'NEXT_PUBLIC_QR_SCAN_ENDPOINT',
    required: true,
    description: 'QR scan Edge Function URL',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service role key (for scripts)',
  },
]

console.log('\n📋 Environment Variables Check\n')

let hasErrors = false

expectedEnvVars.forEach((envVar) => {
  const value = process.env[envVar.name]
  const isSet = !!value
  const isPlaceholder = value && value.includes('your-edge-function-url-here')

  if (envVar.required) {
    if (!isSet) {
      console.log(`❌ ${envVar.name} - MISSING (Required)`)
      console.log(`   ${envVar.description}`)
      hasErrors = true
    } else if (isPlaceholder) {
      console.log(`⚠️  ${envVar.name} - PLACEHOLDER VALUE`)
      console.log(`   ${envVar.description}`)
      console.log(`   Current: ${value}`)
      hasErrors = true
    } else {
      console.log(`✅ ${envVar.name} - Set`)
    }
  } else {
    if (isSet) {
      console.log(`✅ ${envVar.name} - Set (Optional)`)
    } else {
      console.log(`⚪ ${envVar.name} - Not set (Optional)`)
    }
  }
})

if (hasErrors) {
  console.log('\n❌ Some required environment variables are missing or have placeholder values.')
  console.log('   Please check your .env.local file.\n')
  process.exit(1)
} else {
  console.log('\n✅ All environment variables are properly configured!\n')
  process.exit(0)
}

