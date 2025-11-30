import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Try import.meta.env first, then fall back to process.env
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('[Places Details] Google Maps API key not configured');
    return new Response(
      JSON.stringify({ error: 'Google Maps API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const placeId = url.searchParams.get('placeId');
  const sessionToken = url.searchParams.get('sessionToken');
  const fields = url.searchParams.get('fields') || 'formatted_address,geometry,address_components';

  if (!placeId) {
    console.error('[Places Details] Missing required parameter: placeId', { url: request.url });
    return new Response(
      JSON.stringify({ error: 'Missing required parameter: placeId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const googleApiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    googleApiUrl.searchParams.set('place_id', placeId);
    googleApiUrl.searchParams.set('key', apiKey);
    googleApiUrl.searchParams.set('fields', fields);
    
    if (sessionToken) {
      googleApiUrl.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(googleApiUrl.toString());
    const data = await response.json();

    // Log if Google API returned an error status
    if (data.status !== 'OK') {
      console.error('[Places Details] Google API error response:', {
        status: data.status,
        error_message: data.error_message,
        placeId: placeId.substring(0, 50), // Log first 50 chars for debugging
      });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Places Details] Error proxying Google Places Details API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch place details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

