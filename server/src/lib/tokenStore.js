const store = new Map();

export function get(userId) {
  return store.get(userId) || null;
}

export function save(userId, token) {
  store.set(userId, token);
}

export default { get, save };
