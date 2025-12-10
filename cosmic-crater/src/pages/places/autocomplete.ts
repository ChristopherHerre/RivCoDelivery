import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Try import.meta.env first, then fall back to process.env
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('[Places Autocomplete] Google Maps API key not configured');
    return new Response(
      JSON.stringify({ error: 'Google Maps API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const input = url.searchParams.get('input');
  const sessionToken = url.searchParams.get('sessionToken');
  const country = url.searchParams.get('country') || 'us';

  if (!input) {
    console.error('[Places Autocomplete] Missing required parameter: input', { url: request.url });
    return new Response(
      JSON.stringify({ error: 'Missing required parameter: input' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const googleApiUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleApiUrl.searchParams.set('input', input);
    googleApiUrl.searchParams.set('key', apiKey);
    googleApiUrl.searchParams.set('components', `country:${country}`);
    
    // Bias towards Riverside County, California
    // Using Riverside city coordinates (approximately center of Riverside County)
    googleApiUrl.searchParams.set('location', '33.9533,-117.3962');
    // Radius in meters: ~80km covers most of Riverside County
    googleApiUrl.searchParams.set('radius', '80000');
    
    if (sessionToken) {
      googleApiUrl.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(googleApiUrl.toString());
    const data = await response.json();

    // Log if Google API returned an error status
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Places Autocomplete] Google API error response:', {
        status: data.status,
        error_message: data.error_message,
        input: input.substring(0, 50), // Log first 50 chars for debugging
      });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Places Autocomplete] Error proxying Google Places Autocomplete API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch autocomplete results' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

