import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'
import path from 'path'
import os from 'os'
import fs from 'fs'

const dbDir = path.join(os.homedir(), '.devonz')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const client = createClient({
  url: `file:${path.join(dbDir, 'devonz.db')}`,
})

export const db = drizzle(client, { schema })
