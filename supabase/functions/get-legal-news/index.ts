
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    console.log("Function requested:", req.method);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const rssUrl = 'https://www.conjur.com.br/rss.xml';
        console.log("Fetching RSS from:", rssUrl);

        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*'
            }
        });

        if (!response.ok) {
            console.error("RSS fetch failed:", response.status, response.statusText);
            throw new Error(`Failed to fetch RSS: ${response.statusText}`);
        }

        const xmlText = await response.text();
        console.log("XML received, length:", xmlText.length);

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const items = [];
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xmlText)) !== null && count < 6) {
            const itemContent = match[1];

            const titleRaw = itemContent.match(/<title>(.*?)<\/title>/)?.[1] || "";
            const linkRaw = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || "";
            const pubDateRaw = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

            if (titleRaw && linkRaw) {
                // Clean CDATA and whitespace
                const cleanTitle = titleRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
                const cleanLink = linkRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();

                let formattedTime = '';
                if (pubDateRaw) {
                    try {
                        const dateObj = new Date(pubDateRaw);
                        if (!isNaN(dateObj.getTime())) {
                            formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                        }
                    } catch (e) { }
                }

                items.push({
                    title: cleanTitle,
                    link: cleanLink,
                    time: formattedTime || "--:--"
                });
                count++;
            }
        }

        console.log(`Parsed ${items.length} items successfully`);

        return new Response(JSON.stringify(items), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error("Critical error in edge function:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
