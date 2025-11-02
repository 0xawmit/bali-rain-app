import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QRScanRequest {
  code: string
}

interface QRScanResponse {
  result: 'accepted' | 'rejected'
  points_awarded?: number
  new_balance?: number
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { code }: QRScanRequest = await req.json()
    
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'Invalid code format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (qrError || !qrCode) {
      // Insert rejected scan event
      await supabase.from('scan_events').insert({
        user_id: user.id,
        qr_code_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for non-existent code
        result: 'rejected',
        reject_reason: 'Code not found'
      })

      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'Invalid code. Please check and try again.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if code is within active time window
    const now = new Date()
    if (qrCode.starts_at && new Date(qrCode.starts_at) > now) {
      await supabase.from('scan_events').insert({
        user_id: user.id,
        qr_code_id: qrCode.id,
        result: 'rejected',
        reject_reason: 'Code not yet active'
      })

      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'This code is not yet active.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (qrCode.ends_at && new Date(qrCode.ends_at) < now) {
      await supabase.from('scan_events').insert({
        user_id: user.id,
        qr_code_id: qrCode.id,
        result: 'rejected',
        reject_reason: 'Code expired'
      })

      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'This code has expired.' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check cooldown/single-use logic
    if (qrCode.is_unique) {
      // Single-use code: check if ANY user has scanned it
      const { data: existingScans } = await supabase
        .from('scan_events')
        .select('id')
        .eq('qr_code_id', qrCode.id)
        .eq('result', 'accepted')
        .limit(1)

      if (existingScans && existingScans.length > 0) {
        await supabase.from('scan_events').insert({
          user_id: user.id,
          qr_code_id: qrCode.id,
          result: 'rejected',
          reject_reason: 'Code already used'
        })

        return new Response(
          JSON.stringify({ result: 'rejected', reason: 'This code has already been claimed.' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Generic code: check if THIS user has scanned it in last 24 hours
      const { data: recentScans } = await supabase
        .from('scan_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('qr_code_id', qrCode.id)
        .eq('result', 'accepted')
        .gte('scanned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (recentScans && recentScans.length > 0) {
        await supabase.from('scan_events').insert({
          user_id: user.id,
          qr_code_id: qrCode.id,
          result: 'rejected',
          reject_reason: 'Cooldown period active'
        })

        return new Response(
          JSON.stringify({ result: 'rejected', reason: 'You already scanned this code in the last 24 hours.' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Code is valid! Create scan event and award points
    const { data: scanEvent, error: scanError } = await supabase
      .from('scan_events')
      .insert({
        user_id: user.id,
        qr_code_id: qrCode.id,
        result: 'accepted'
      })
      .select()
      .single()

    if (scanError) {
      console.error('Error creating scan event:', scanError)
      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Award points by inserting into point_ledger (trigger will update wallet)
    const { error: ledgerError } = await supabase
      .from('point_ledger')
      .insert({
        user_id: user.id,
        source: 'scan',
        ref_id: scanEvent.id,
        delta: qrCode.points_value,
        reason: `QR code scan: ${qrCode.label || qrCode.code}`
      })

    if (ledgerError) {
      console.error('Error awarding points:', ledgerError)
      return new Response(
        JSON.stringify({ result: 'rejected', reason: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get updated wallet balance
    const { data: wallet } = await supabase
      .from('point_wallets')
      .select('balance_cached')
      .eq('user_id', user.id)
      .single()

    const response: QRScanResponse = {
      result: 'accepted',
      points_awarded: qrCode.points_value,
      new_balance: wallet?.balance_cached || 0
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('QR scan error:', error)
    return new Response(
      JSON.stringify({ result: 'rejected', reason: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})




