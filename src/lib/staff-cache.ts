import { db } from "@/lib/firebase-admin";

declare global {
  // eslint-disable-next-line no-var
  var __staffCache:
    | {
        map: Map<string, string>;
        list: Array<{ id: string; name: string; role: string; email: string; avatar: string }>;
        expiry: number;
      }
    | undefined;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function load() {
  const snap = await db.collection("staff").get();
  const map = new Map<string, string>();
  const list: Array<{ id: string; name: string; role: string; email: string; avatar: string }> = [];
  snap.docs.forEach((d) => {
    const s = d.data();
    map.set(d.id, s.name);
    list.push({ id: d.id, name: s.name, role: s.role, email: s.email, avatar: s.avatar });
  });
  globalThis.__staffCache = { map, list, expiry: Date.now() + TTL_MS };
}

function isValid() {
  return !!globalThis.__staffCache && Date.now() < globalThis.__staffCache.expiry;
}

export async function getStaffMap(): Promise<Map<string, string>> {
  if (!isValid()) await load();
  return globalThis.__staffCache!.map;
}

export async function getStaffList(): Promise<
  Array<{ id: string; name: string; role: string; email: string; avatar: string }>
> {
  if (!isValid()) await load();
  return globalThis.__staffCache!.list;
}

export function invalidateStaffCache() {
  globalThis.__staffCache = undefined;
}
