const { OpenAI } = require('openai');

async function StreamChatCompletions(request, env, ctx) {
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

module.exports = {
	StreamChatCompletions
};
