async function GetStore(env, key) {
	return await env.RAYCAST_PRO_PROXY.get(key, 'json');
}


async function SetStore(env, key, value) {
	return await env.RAYCAST_PRO_PROXY.put(key, value);
}

module.exports = {
	GetStore,
	SetStore
};
