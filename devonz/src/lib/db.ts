const DB_NAME = 'devonz'
const DB_VERSION = 1

interface DBOp<T> {
  store: string
  mode: 'readonly' | 'readwrite'
  cb: (store: IDBObjectStore) => IDBRequest<T> | void
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function op<T>({ store, mode, cb }: DBOp<T>): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const objectStore = tx.objectStore(store)
    const result = cb(objectStore)
    if (result instanceof IDBRequest) {
      result.onsuccess = () => resolve(result.result as T)
      result.onerror = () => reject(result.error)
    } else {
      tx.oncomplete = () => resolve(undefined as T)
    }
    tx.onerror = () => reject(tx.error)
  })
}

export const idb = {
  messages: {
    getAll: () => op<any[]>({ store: 'messages', mode: 'readonly', cb: (s) => s.getAll() }),
    put: (msg: any) => op<void>({ store: 'messages', mode: 'readwrite', cb: (s) => { s.put(msg) } }),
    clear: () => op<void>({ store: 'messages', mode: 'readwrite', cb: (s) => { s.clear() } }),
  },
  projects: {
    getAll: () => op<any[]>({ store: 'projects', mode: 'readonly', cb: (s) => s.getAll() }),
    put: (project: any) => op<void>({ store: 'projects', mode: 'readwrite', cb: (s) => { s.put(project) } }),
  },
  settings: {
    get: (key: string) => op<any>({ store: 'settings', mode: 'readonly', cb: (s) => s.get(key) }),
    set: (key: string, value: any) => op<void>({ store: 'settings', mode: 'readwrite', cb: (s) => { s.put({ key, value }) } }),
  },
}
