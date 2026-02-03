
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const token = url.searchParams.get('token')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch the expected token from office_settings
        const { data: tokenSetting, error: tokenError } = await supabase
            .from('office_settings')
            .select('value')
            .eq('key', 'calendar_token')
            .single()

        if (tokenError || !tokenSetting) {
            console.error('Error fetching calendar token:', tokenError)
            return new Response(JSON.stringify({ error: 'System configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const expectedToken = tokenSetting.value

        if (!token || token !== expectedToken) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch deadlines that are not canceled
        const { data: deadlines, error } = await supabase
            .from('deadlines')
            .select(`
        id,
        title,
        due_date,
        start_time,
        status,
        case_id,
        customer_name,
        cases (
          number,
          client_name,
          court
        )
      `)
            .neq('status', 'Canceled')

        if (error) throw error

        // Generate iCalendar content
        let ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//LexPrime//NONSGML Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:LexPrime Prazos',
            'X-WR-TIMEZONE:America/Sao_Paulo',
        ]

        for (const d of deadlines) {
            const date = d.due_date.replace(/-/g, '')
            const startTime = (d.start_time || '09:00').replace(/:/g, '')
            const dtStart = `${date}T${startTime}00`
            const dtEnd = `${date}T${startTime === '2359' ? '235959' : (parseInt(startTime.substring(0, 2)) + 1).toString().padStart(2, '0') + startTime.substring(2)}00`

            const processNumber = d.cases?.number || 'Avulso'
            const clientName = d.cases?.client_name || d.customer_name || 'Não informado'
            const court = d.cases?.court || 'Não informado'

            ics.push('BEGIN:VEVENT')
            ics.push(`UID:${d.id}@lexprime.com.br`)
            ics.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)
            ics.push(`DTSTART;TZID=America/Sao_Paulo:${dtStart}`)
            ics.push(`DTEND;TZID=America/Sao_Paulo:${dtEnd}`)
            ics.push(`SUMMARY:[PRAZO] - ${d.title}`)
            ics.push(`DESCRIPTION:Processo: ${processNumber}\\nCliente: ${clientName}\\nLocal: ${court}`)
            ics.push('END:VEVENT')
        }

        ics.push('END:VCALENDAR')

        return new Response(ics.join('\r\n'), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename=lexprime-prazos.ics',
            },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
