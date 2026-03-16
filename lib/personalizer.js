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
  result = result.replaceAll(OLD_IDS.clients, newIds.clients);
  result = result.replaceAll(OLD_IDS.systemLogs, newIds.systemLogs);
  result = result.replaceAll(OLD_IDS.dashboardKpis, newIds.dashboardKpis);
  result = result.replaceAll(OLD_IDS.mainConfigPage, newIds.mainConfigPage);
  return result;
}

module.exports = { OLD_IDS, personalize };
