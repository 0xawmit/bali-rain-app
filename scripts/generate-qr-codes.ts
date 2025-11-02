import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Generate random alphanumeric string
function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate QR codes
async function generateQRCodes() {
  console.log('🚀 Generating QR codes...')

  const codes = []
  const batchSize = 100

  try {
    // Generate generic codes (reusable with 24h cooldown)
    console.log(`Generating ${batchSize} generic codes...`)
    
    for (let i = 0; i < batchSize; i++) {
      const code = `BOTTLE-${generateRandomCode(6)}`
      codes.push({
        code,
        label: `Bottle Code ${i + 1}`,
        points_value: 25,
        is_unique: false,
        metadata: { batch: 'generic', generated_at: new Date().toISOString() }
      })
    }

    // Generate some unique codes (single-use)
    console.log('Generating 10 unique codes...')
    
    for (let i = 0; i < 10; i++) {
      const code = `SPECIAL-${generateRandomCode(8)}`
      codes.push({
        code,
        label: `Special Code ${i + 1}`,
        points_value: 50,
        is_unique: true,
        metadata: { batch: 'unique', generated_at: new Date().toISOString() }
      })
    }

    // Insert codes into database
    console.log('Inserting codes into database...')
    
    const { data, error } = await supabase
      .from('qr_codes')
      .insert(codes)
      .select()

    if (error) {
      console.error('Error inserting codes:', error)
      process.exit(1)
    }

    console.log(`✅ Successfully generated ${data.length} QR codes!`)

    // Export to CSV
    const csvPath = path.join(process.cwd(), 'qr-codes-export.csv')
    const csvHeader = 'code,label,points_value,type,generated_at\n'
    const csvRows = codes.map(c => 
      `${c.code},${c.label},${c.points_value},${c.is_unique ? 'unique' : 'generic'},${c.metadata.generated_at}`
    ).join('\n')
    
    fs.writeFileSync(csvPath, csvHeader + csvRows)
    console.log(`📄 CSV exported to: ${csvPath}`)

    // Print summary
    console.log('\n📊 Summary:')
    console.log(`- Generic codes: ${batchSize} (reusable, 24h cooldown)`)
    console.log(`- Unique codes: 10 (single-use)`)
    console.log(`- Total codes: ${codes.length}`)
    console.log('\n🎯 Next steps:')
    console.log('1. Print the QR codes from the CSV file')
    console.log('2. Deploy the Edge Function to Supabase')
    console.log('3. Test scanning with one of the codes')

  } catch (error) {
    console.error('Error generating QR codes:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  generateQRCodes()
}

export { generateQRCodes }




