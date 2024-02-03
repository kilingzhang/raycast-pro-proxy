/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { StreamChatCompletions } from './openai';
import { Proxy } from './utils';
import { GetSyncSettings, SetSyncSettings, SyncFailedResponse } from './sync';
import { AddUser, User } from './user';


export default {
	async fetch(request, env, ctx) {

		const authorization = request.headers.get('Authorization');
		const user = await User(env, authorization);

		let url = request.url;
		let path = new URL(url).pathname;

		if (path === '/api/v1/ai/chat_completions') {
			return StreamChatCompletions(request, env, ctx);
		}

		if (path === '/api/v1/me/sync') {

			if (!user) {
				return Response.json(SyncFailedResponse);
			}

			if (request.method === 'PUT') {

				await SetSyncSettings(env, user,await request.json());
				return Response.json({
					updated_at: new Date().toISOString()
				});

			} else if (request.method === 'GET') {

				const settings = await GetSyncSettings(env, user);
				return Response.json(settings);

			}
		}

		let response = await Proxy(request, env, ctx);
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
				body['can_upgrade_to_pro'] = false;
				body['admin'] = true;

				if (user?.token !== authorization) {
					console.debug(`<${body.email}> is logged in.`);
					await AddUser(env, {
						'email': body.email,
						'token': authorization
					});
				}

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
						id: 'openai-gpt-3.5-turbo',
						model: 'gpt-3.5-turbo',
						name: 'GPT-3.5 Turbo',
						provider: 'openai',
						provider_name: 'OpenAI',
						requires_better_ai: true,
						features: ['chat', 'quick_ai', 'commands', 'api']
					},
					{
						id: 'openai-gpt-4-1106-preview',
						model: 'gpt-4-1106-preview',
						name: 'GPT-4 Turbo',
						provider: 'openai',
						provider_name: 'OpenAI',
						requires_better_ai: true,
						features: ['chat', 'quick_ai', 'commands', 'api']
					},
					{
						id: 'gemini-pro',
						model: 'gemini-pro',
						name: 'Gemini Pro',
						provider: 'google',
						provider_name: 'Google',
						requires_better_ai: true,
						features: ['chat', 'quick_ai', 'commands', 'api']
					}
				];
				body['default_models'] = {
					'chat': 'openai-gpt-4-1106-preview',
					'quick_ai': 'openai-gpt-4-1106-preview',
					'commands': 'openai-gpt-4-1106-preview',
					'api': 'openai-gpt-4-1106-preview'
				};
				return new Response(JSON.stringify(body), response);
			default:
				body = await response.json();
				return new Response(JSON.stringify(body), response);
		}

	}
};
