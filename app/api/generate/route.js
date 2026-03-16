import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Blueprints klasörü: blueprints-converted/ (Database Legacy moduna çevrilmiş)
const BLUEPRINTS_DIR = path.join(process.cwd(), 'blueprints-converted');

const OLD_IDS = {
  systemSettings: '314869cd-9cc1-803d-bb6f-000b22fb720c',
  clients:        '314869cd-9cc1-80e9-a154-000b55d12bb0',
  systemLogs:     '319869cd-9cc1-8060-9c1e-000baffc56c4',
  dashboardKpis:  '317869cd-9cc1-8099-be78-000b5e8d2140',
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

async function fetchAllDatabases(notionToken) {
  const databases = {};
  let cursor = undefined;

  do {
    const body = { filter: { value: 'database', property: 'object' } };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) throw { status: 401, message: 'Invalid Notion token. Please check your Integration Token.' };
      if (res.status === 429) throw { status: 429, message: 'Notion API rate limit. Please wait a moment and try again.' };
      throw { status: 500, message: 'An unexpected error occurred. Please try again.' };
    }

    const data = await res.json();
    for (const db of data.results) {
      const title = db.title?.[0]?.plain_text?.trim();
      if (title) databases[title.toLowerCase()] = db.id;
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return databases;
}

async function findMainConfigPage(notionToken, systemSettingsDbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${systemSettingsDbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'Config Key', title: { equals: 'Main Config' } },
    }),
  });

  if (!res.ok) throw { status: 500, message: 'An unexpected error occurred. Please try again.' };

  const data = await res.json();
  if (!data.results?.length) {
    throw { status: 404, message: "Could not find 'Main Config' page in System Settings database." };
  }
  return data.results[0].id;
}

export async function POST(request) {
  try {
    const { notionToken, selectedBlueprints } = await request.json();

    // Adım 1 — Token validasyonu
    if (!notionToken || !notionToken.startsWith('ntn_')) {
      return NextResponse.json(
        { error: 'Please enter a valid Notion Integration Token (starts with ntn_)' },
        { status: 400 }
      );
    }

    const meRes = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-01',
      },
    });
    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Invalid Notion token. Please check your Integration Token.' },
        { status: 401 }
      );
    }

    // Adım 2 — Veritabanlarını bul
    const requiredDatabases = [
      { name: 'Clients',          key: 'clients' },
      { name: 'System Settings',  key: 'systemSettings' },
      { name: 'System Logs',      key: 'systemLogs' },
      { name: 'Dashboard KPIs',   key: 'dashboardKpis' },
    ];

    const allDbs = await fetchAllDatabases(notionToken);
    const newIds = {};
    const foundNames = [];

    for (const { name, key } of requiredDatabases) {
      const id = allDbs[name.toLowerCase()];
      if (!id) {
        return NextResponse.json(
          { error: `Could not find database: ${name}. Make sure you shared it with your integration.` },
          { status: 404 }
        );
      }
      newIds[key] = id;
      foundNames.push(name);
    }

    // Adım 3 — Main Config Page ID
    const mainConfigPageId = await findMainConfigPage(notionToken, newIds.systemSettings);
    newIds.mainConfigPage = mainConfigPageId;

    // Adım 4 — JSON String Replace
    const blueprints = {};
    let totalReplacements = 0;
    const blueprintIds = selectedBlueprints || ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

    for (const id of blueprintIds) {
      const filePath = path.join(BLUEPRINTS_DIR, `${id}.json`);
      const masterString = fs.readFileSync(filePath, 'utf-8');
      const personalized = personalize(masterString, newIds);
      blueprints[id] = personalized;

      // Yaklaşık replacement sayısı
      for (const oldId of Object.values(OLD_IDS)) {
        const count = (masterString.match(new RegExp(oldId, 'g')) || []).length;
        totalReplacements += count;
      }
    }

    // Adım 5 — Response
    return NextResponse.json({
      success: true,
      blueprints,
      summary: {
        databasesFound: foundNames,
        mainConfigPageFound: true,
        totalReplacements,
      },
    });
  } catch (err) {
    if (err.status && err.message) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
