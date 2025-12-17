/**
 * Utility functions for breadcrumb components
 */

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

/**
 * Generates JSON-LD structured data for breadcrumbs (Schema.org BreadcrumbList)
 * @param items - Array of breadcrumb items
 * @param baseUrl - Base URL for the site (e.g., 'https://rivcodelivery.com')
 * @returns JSON-LD structured data object
 */
export function generateBreadcrumbJsonLd(
	items: BreadcrumbItem[],
	baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): object {
	if (!items || items.length === 0) {
		return {};
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => {
			const position = index + 1;
			const itemUrl = item.href
				? item.href.startsWith('http')
					? item.href
					: `${baseUrl}${item.href}`
				: baseUrl;

			return {
				'@type': 'ListItem',
				position,
				name: item.label,
				item: itemUrl
			};
		})
	};
}
