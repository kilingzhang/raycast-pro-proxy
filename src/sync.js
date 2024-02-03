import { GetStore, SetStore } from './store';

const SyncFailedResponse = {
	updated: [],
	updated_at: null,
	deleted: []
};

async function GetSyncSettings(env, user) {
	const key = `sync-${user?.email}`;
	return await GetStore(env, key) ?? SyncFailedResponse;
}


async function SetSyncSettings(env, user, settings) {

	const key = `sync-${user?.email}`;
	const updated_at = new Date().toISOString();
	const lastSettings = await GetStore(env, key);
	const bodyDeleted = settings?.deleted ?? [];
	settings.deleted = [];
	settings.updated_at = updated_at;
	settings.updated = settings.updated ?? [];

	if (!lastSettings) {

		for (const item of settings.updated) {
			item.updated_at = updated_at;
			item.created_at = item.client_updated_at;
		}
		await SetStore(env, key, JSON.stringify(settings));

	} else {

		let updated = lastSettings.updated.filter((item) => !bodyDeleted.includes(item.id));
		for (const item of settings.updated) {
			item.updated_at = updated_at;
			item.created_at = item.client_updated_at;
		}
		updated = updated.concat(settings.updated);
		settings.updated = updated;
		await SetStore(env, key, JSON.stringify(settings));

	}

	console.debug(`[Sync] Synced with ${settings.updated.length} items and ${bodyDeleted.length} deleted items. Updated at ${updated_at} - @${user?.email}`);
}


module.exports = {
	SetSyncSettings,
	GetSyncSettings,
	SyncFailedResponse
};
