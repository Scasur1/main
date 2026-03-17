export const runtime = 'edge';

import { NextResponse } from 'next/server';

import M0 from '../../../blueprints/M0.json';
import M1 from '../../../blueprints/M1.json';
import M2 from '../../../blueprints/M2.json';
import M3 from '../../../blueprints/M3.json';
import M4 from '../../../blueprints/M4.json';
import M5 from '../../../blueprints/M5.json';
import M6 from '../../../blueprints/M6.json';

const BLUEPRINTS = { M0, M1, M2, M3, M4, M5, M6 };

const OLD_IDS = {
  systemSettings: '314869cd-9cc1-8015-8ede-f20c7759b4b4',
  clients:        '314869cd-9cc1-80f8-9bd4-eeda05b64741',
  systemLogs:     '319869cd-9cc1-8055-b71c-e479cda951d6',
  dashboardKpis:  '317869cd-9cc1-80f8-bf40-dae0672a5a4a',
  mainConfigPage: '320869cd-9cc1-81a7-883f-dd59822b7904',
};

function personalize(masterJsonString, newIds) {
  let result = masterJsonString;
  result = result.replaceAll(OLD_IDS.systemSettings, newIds.systemSettings);
  result = result.replaceAll(OLD_IDS.clients,         newIds.clients);
  result = result.replaceAll(OLD_IDS.systemLogs,      newIds.systemLogs);
  result = result.replaceAll(OLD_IDS.dashboardKpis,   newIds.dashboardKpis);
  result = result.replaceAll(OLD_IDS.mainConfigPage,  newIds.mainConfigPage);
  return result;
}

async function notionPost(token, endpoint, body) {
  const res = await fetch(`https://api.notion.com${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[Notion ${endpoint}] HTTP ${res.status}:`, text);
    if (res.status === 401) throw { status: 401, message: 'Invalid Notion token. Please check your Integration Token.' };
    if (res.status === 429) throw { status: 429, message: 'Notion API rate limit. Please wait a moment and try again.' };
    throw { status: 500, message: `Notion API error (HTTP ${res.status}): ${text}` };
  }
  return res.json();
}

async function fetchAllDatabases(token) {
  const databases = {};
  let cursor = undefined;
  do {
    const body = { filter: { value: 'database', property: 'object' } };
    if (cursor) body.start_cursor = cursor;
    const data = await notionPost(token, '/v1/search', body);
    for (const db of data.results) {
      const title = (db.title?.[0]?.plain_text ?? db.name ?? '').trim();
      if (title) databases[title.toLowerCase()] = db.id;
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return databases;
}

async function findMainConfigPage(token, systemSettingsDbId) {
  const norm = (id) => (id || '').replace(/-/g, '').toLowerCase();
  const targetId = norm(systemSettingsDbId);
  let cursor = undefined;
  do {
    const body = { query: 'Main Config', filter: { value: 'page', property: 'object' } };
    if (cursor) body.start_cursor = cursor;
    const data = await notionPost(token, '/v1/search', body);
    for (const page of data.results) {
      const parentId = norm(page.parent?.database_id || page.parent?.data_source_id || '');
      if (parentId !== targetId) continue;
      const titleProp = page.properties?.title
        || page.properties?.Name
        || page.properties?.['Config Key'];
      const title = (titleProp?.title?.[0]?.plain_text || '').trim();
      if (title === 'Main Config') return page.id;
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  throw { status: 404, message: "Could not find 'Main Config' page in System Settings database." };
}

export async function POST(request) {
  try {
    const { notionToken, selectedBlueprints } = await request.json();

    if (!notionToken || (!notionToken.startsWith('ntn_') && !notionToken.startsWith('secret_'))) {
      return NextResponse.json(
        { error: 'Please enter a valid Notion Integration Token (starts with ntn_ or secret_)' },
        { status: 400 }
      );
    }

    const requiredDatabases = [
      { name: 'Clients',         key: 'clients' },
      { name: 'System Settings', key: 'systemSettings' },
      { name: 'System Logs',     key: 'systemLogs' },
      { name: 'Dashboard KPIs',  key: 'dashboardKpis' },
    ];

    const allDbs = await fetchAllDatabases(notionToken);
    const newIds = {};
    const foundNames = [];

    for (const { name, key } of requiredDatabases) {
      const id = allDbs[name.toLowerCase()];
      if (!id) {
        return NextResponse.json(
          {
            error: `Could not find database: "${name}". Make sure you shared it with your integration.`,
            debug_found_databases: Object.keys(allDbs),
          },
          { status: 404 }
        );
      }
      newIds[key] = id;
      foundNames.push(name);
    }

    newIds.mainConfigPage = await findMainConfigPage(notionToken, newIds.systemSettings);

    const blueprints = {};
    let totalReplacements = 0;
    const ids = selectedBlueprints?.length ? selectedBlueprints : ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

    for (const id of ids) {
      if (!BLUEPRINTS[id]) throw { status: 400, message: `Unknown blueprint: ${id}` };
      const masterString = JSON.stringify(BLUEPRINTS[id]);
      const personalized = personalize(masterString, newIds);
      blueprints[id] = personalized;
      for (const oldId of Object.values(OLD_IDS)) {
        totalReplacements += (masterString.match(new RegExp(oldId, 'g')) || []).length;
      }
    }

    return NextResponse.json({
      success: true,
      blueprints,
      summary: { databasesFound: foundNames, mainConfigPageFound: true, totalReplacements },
    });
  } catch (err) {
    if (err.status && err.message) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[/api/generate] Unexpected error:', err);
    return NextResponse.json({ error: `Server error: ${err?.message || String(err)}` }, { status: 500 });
  }
}
