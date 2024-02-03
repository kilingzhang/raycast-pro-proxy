import { GetStore, SetStore } from './store';

async function Users(env) {
	return await GetStore(env, 'users') ?? [];
}

async function User(env, authorization) {
	return (await Users(env)).find(u => u.token === authorization);
}

async function AddUser(env, user) {
	const users = await Users(env);
	users.push(user);
	return await SetStore(env, 'users', JSON.stringify(users));
}

module.exports = {
	User,
	AddUser
};
