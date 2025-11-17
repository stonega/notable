export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const urlToFetch = url.searchParams.get('url');

    if (!urlToFetch) {
      return new Response(JSON.stringify({ success: 0, meta: {}, error: 'No URL to fetch' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    try {
      const response = await fetch(urlToFetch, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Notable-Link-Preview/1.0; +https://github.com/stonega/notable)',
        }
      });
      const meta = await extractMeta(response);

      const responseBody = {
        success: 1,
        link: urlToFetch,
        meta: meta,
      };

      return new Response(JSON.stringify(responseBody), {
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: 0, meta: {}, error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-requested-with',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      },
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: 'GET, OPTIONS',
      },
    });
  }
}

async function extractMeta(response) {
  const meta = {
    title: '',
    description: '',
    image: {
        url: ''
    }
  };

  const rewriter = new HTMLRewriter()
    .on('title', {
      text(text) {
        if (text.text && !meta.title) {
          meta.title += text.text;
        }
      },
    })
    .on('meta', {
      element(element) {
        const name = element.getAttribute('name');
        const property = element.getAttribute('property');
        const content = element.getAttribute('content');

        if (content) {
            if (property === 'og:title') {
                meta.title = content;
            }
            if (name === 'description' && !meta.description) {
                meta.description = content;
            }
            if (property === 'og:description') {
                meta.description = content;
            }
            if (property === 'og:image' && !meta.image.url) {
                meta.image.url = content;
            }
        }
      },
    });

    const transformedResponse = rewriter.transform(response);
    await transformedResponse.text();
    
    meta.title = meta.title.replace(/\n/g, '').trim();

    return meta;
}
