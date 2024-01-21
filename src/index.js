/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { OpenAI } from 'openai';

async function proxy(request, env, ctx) {
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


async function stream_chat_completions(request, env, ctx) {
	let data = await request.json();
	let temperature = 0.5;
	let messages = [];

	for (let msg of data['messages']) {
		if ('system_instructions' in msg['content']) {
			messages.push({
				role: 'system',
				content: msg['content']['system_instructions']
			});
		}
		if ('command_instructions' in msg['content']) {
			messages.push({
				role: 'system',
				content: msg['content']['command_instructions']
			});
		}
		if ('additional_system_instructions' in data) {
			messages.push({
				role: 'system',
				content: data['additional_system_instructions']
			});
		}
		if ('text' in msg['content']) {
			messages.push({ role: 'user', content: msg['content']['text'] });
		}
		if ('temperature' in msg['content']) {
			temperature = msg['content']['temperature'];
		}
	}

	const openai = new OpenAI({
		apiKey: env.OPENAI_API_KEY,
		baseURL: env.OPENAI_API_BASE
	});


	const stream = await openai.chat.completions.create({
		model: data['model'],
		messages: messages,
		temperature: temperature,
		max_tokens: 4095,
		stream: true
	});

	const { writable, readable } = new TransformStream();

	const writer = writable.getWriter();

	for await (const chunk of stream) {
		writer.write(new TextEncoder().encode('data: ' + JSON.stringify({ 'text': chunk.choices[0]?.delta?.content || '' }) + '\n\n'));
	}

	writer.close();
	return new Response(readable);
}


export default {
	async fetch(request, env, ctx) {
		let url = request.url;
		let path = new URL(url).pathname;
		if (path === '/api/v1/ai/chat_completions') {
			return stream_chat_completions(request, env, ctx);
		}
		if (request.method === 'PUT' && path === '/api/v1/me/sync') {
			const settings = await request.json();
			await env.raycast_pro_proxy.put('settings', JSON.stringify(settings));
		}
		let response = await proxy(request, env, ctx);
		let body = {};
		switch (path) {
			case '/api/v1/me':
				body = await response.json();
				body['eligible_for_pro_features'] = true;
				body['has_active_subscription'] = true;
				body['eligible_for_ai'] = true;
				body['eligible_for_gpt4'] = true;
				body['eligible_for_ai_citations'] = true;
				body['eligible_for_developer_hub'] = true;
				body['eligible_for_application_settings'] = true;
				body['publishing_bot'] = true;
				body['has_pro_features'] = true;
				body['eligible_for_cloud_sync'] = true;
				body['has_better_ai'] = true;
				body['can_upgrade_to_pro'] = true;
				body['admin'] = true;
				return new Response(JSON.stringify(body), response);
			case '/api/v1/me/trial_status':
				body = await response.json();
				body['organizations'] = [];
				body['trial_limits']['commands_limit'] = 999;
				body['trial_limits']['quicklinks_limit'] = 999;
				body['trial_limits']['snippets_limit'] = 999;
				return new Response(JSON.stringify(body), response);
			case '/api/v1/ai/models':
				body = await response.json();
				body['models'] = [
					{
						'id': 'gemini-pro',
						'model': 'gemini-pro',
						'name': 'Gemini Pro',
						'provider': 'google',
						'provider_name': 'Google',
						'requires_better_ai': true,
						'features': []
					}
				];
				body['models'] = [
					{
						'id': 'openai-gpt-3.5-turbo',
						'model': 'gpt-3.5-turbo',
						'name': 'GPT-3.5 Turbo',
						'provider': 'openai',
						'provider_name': 'OpenAI',
						'requires_better_ai': true,
						'features': []
					},
					{
						'id': 'openai-gpt-4-1106-preview',
						'model': 'gpt-4-1106-preview',
						'name': 'GPT-4 Turbo',
						'provider': 'openai',
						'provider_name': 'OpenAI',
						'requires_better_ai': true,
						'features': []
					}
				];
				body['default_models'] = {
					'chat': 'openai-gpt-4-1106-preview',
					'quick_ai': 'openai-gpt-4-1106-preview',
					'commands': 'openai-gpt-4-1106-preview',
					'api': 'openai-gpt-4-1106-preview'
				};
				return new Response(JSON.stringify(body), response);
			case '/api/v1/currencies':
				body = await response.json();
				return new Response(JSON.stringify(body), response);
			case '/api/v1/currencies/crypto':
				body = await response.json();
				return new Response(JSON.stringify(body), response);
			case '/api/v1/me/sync':
				return Response.json(await env.raycast_pro_proxy.get('sync', 'json'));
		}
		return response;
	}
};
