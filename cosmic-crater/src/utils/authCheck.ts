/**
 * Utility function to check if a user is authenticated from Astro SSR context
 * Since session cookies may not be available in SSR, we'll default to showing SSR
 * and let the client-side check handle mounting the SPA
 * @param astro - Astro context object with request and url
 * @returns Promise<boolean> - Always returns false to show SSR, client will handle SPA mounting
 */
import https from 'https';

export async function checkAuthentication(astro: {
	request: Request;
	url: URL;
}): Promise<boolean> {
	// Always return false - we'll check auth client-side instead
	// This avoids the issue of session cookies not being available in SSR
	return false;
}

