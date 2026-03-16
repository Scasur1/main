const { Client } = require('@notionhq/client');

async function validateToken(notionToken) {
  try {
    const notion = new Client({ auth: notionToken });
    await notion.users.me();
    return true;
  } catch {
    return false;
  }
}

async function findDatabases(notionToken) {
  const notion = new Client({ auth: notionToken });
  const requiredDatabases = [
    { name: 'Clients', key: 'clients' },
    { name: 'System Settings', key: 'systemSettings' },
    { name: 'System Logs', key: 'systemLogs' },
    { name: 'Dashboard KPIs', key: 'dashboardKpis' },
  ];

  const found = {};
  let cursor = undefined;

  do {
    const response = await notion.search({
      filter: { value: 'database', property: 'object' },
      start_cursor: cursor,
    });

    for (const db of response.results) {
      const title = db.title?.[0]?.plain_text?.trim();
      if (title) {
        for (const req of requiredDatabases) {
          if (title.toLowerCase() === req.name.toLowerCase()) {
            found[req.key] = db.id;
          }
        }
      }
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  const missing = requiredDatabases.filter(r => !found[r.key]);
  if (missing.length > 0) {
    const names = missing.map(m => m.name).join(', ');
    throw new Error(`Could not find database: ${names}. Make sure you shared it with your integration.`);
  }

  return found;
}

async function findMainConfigPage(notionToken, systemSettingsDbId) {
  const notion = new Client({ auth: notionToken });
  const response = await notion.databases.query({
    database_id: systemSettingsDbId,
    filter: {
      property: 'Config Key',
      title: { equals: 'Main Config' },
    },
  });

  if (!response.results.length) {
    throw new Error("Could not find 'Main Config' page in System Settings database.");
  }

  return response.results[0].id;
}

module.exports = { validateToken, findDatabases, findMainConfigPage };
