async function Proxy(request, env, ctx) {
	const { RAYCAST_URL_DOMAIN } = env;
	const headers = new Headers(request.headers);
	headers.delete('Host');
	headers.delete('Accept-encoding');
	const url = new URL(request.url);
	const path = url.pathname;
	const modifiedRequest = new Request(
		new URL('https://' + RAYCAST_URL_DOMAIN + path),
		{
			method: request.method,
			headers: headers,
			body: request.body
		});
	return fetch(modifiedRequest);
}

module.exports = {
	Proxy
};
