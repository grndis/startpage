import { checkHostPermission } from "app/components/RequestHostPermission";
import { miscMessages } from "app/locale/common";
import { IntlShape, useIntl } from "react-intl";
import { usePromise } from "./promises";


function makeProxy(url: string) {
	if (typeof browser !== 'undefined') {
		console.log("Detected running as webext");
		return url;
	} else {
		const ret = new URL(config.PROXY_URL);
		ret.searchParams.set("url", url);
		return ret.toString();
	}
}


async function fetchCheckCors(intl: IntlShape, request: Request,
		init?: RequestInit): Promise<Response> {
	try {
		return await fetch(request, init);
	} catch (e) {
		if (typeof(e) == "object" &&
				(e.message.includes("NetworkError") ||
					e.message.includes("Failed to fetch"))) {
			await checkHostPermission(intl, request.url);

			throw miscMessages.no_network;
		}
		throw e;
	}
}


async function fetchJSON(intl: IntlShape, url: string) {
	const response = await fetchCheckCors(intl, new Request(url, {
		method: "GET",
		headers: {
			"Accept": "application/json",
		}
	}));

	if (!response.ok) {
		throw await response.text();
	}

	return await response.json();
}


async function fetchXML(intl: IntlShape, url: string) {
	const response = await fetchCheckCors(intl, new Request(url, {
		method: "GET",
		headers: {
			"Accept": "application/json",
		}
	}));

	const str = await response.text();
	if (!response.ok) {
		if (response.headers.get("content-type")?.startsWith("text/html")) {
			throw intl.formatMessage({
				defaultMessage: "HTTP request failed, {code} {msg}."
			}, { code: response.status, msg: response.statusText });
		} else {
			throw str;
		}
	}

	const xml = new window.DOMParser().parseFromString(str, "text/xml");
	return xml;
}


/**
* Downloads a JSON document from a URL.
*
* @param {string} url - The URL
* @param {any[]} dependents - A list of dependent variables for the URL.
* @return {[response, error]]} - Response and error
*/
export function useJSON<T>(url: string, dependents?: any[]): [(T | null), (string | null)] {
	const intl = useIntl();
	return usePromise(() => fetchJSON(intl, makeProxy(url)), dependents);
}


/**
 * Downloads a JSON document from a URL.
 *
 * @param intl Intl
 * @param {string} path - Path to endpoint, relative to API_URL's path.
 * @param {any} args - Key-value object representing query arguments.
 * @param {any[]} dependents - A list of dependent variables for the URL.
 * @return {[response, error]]} - Response and error
 */
export async function getAPI<T>(intl: IntlShape, path: string, args: any): Promise<T> { // eslint-disable-line
	const url = new URL(config.API_URL);
	url.pathname = (url.pathname + path).replace(/\/\//g, "/");
	Object.entries(args).forEach(([key, value]) => {
		url.searchParams.set(key.toString(), (value as any).toString());
	})

	return fetchJSON(intl, url.toString());
}


/**
 * Downloads a JSON document from a URL.
 *
 * @param {string} path - Path to endpoint, relative to API_URL's path.
 * @param {any} args - Key-value object representing query arguments.
 * @param {any[]} dependents - A list of dependent variables for the URL.
 * @return {[response, error]]} - Response and error
 */
export function useAPI<T>(path: string, args: any, // eslint-disable-line
		dependents?: any[]): [(T | null), (string | null)] {
	const intl = useIntl();
	return usePromise(() => getAPI(intl, path, args), dependents);
}


/**
 * Downloads an XML document from a URL.
 *
 * @param {string} url - The URL
 * @param {any[]} dependents - A list of dependent variables for the URL.
 * @return {[response, error]]} - Response and error
 */
export function useXML(url: string, dependents?: any[]): [(Document | null), (string | null)] {
	const intl = useIntl();
	return usePromise(() => fetchXML(intl, makeProxy(url)), dependents);
}
