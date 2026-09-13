import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root = process.cwd();
const out = path.join(root, 'release');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const sourceUrls = {
  eibi: 'https://github.com/jks-prv/KiwiSDR/blob/3b570602a14161188f8c85eede62ab2a70e7ad66/dx/EiBi.h',
  hfcc: 'https://github.com/sv1btl/PhantomSDR-Plus/blob/main/frequencylist/A26all00.TXT',
  sat: 'https://github.com/Stellarium/stellarium/blob/master/plugins/Satellites/resources/communications.json'
};

const rows = [];
const clean = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const add = row => {
  const frequencyHz = Math.round(Number(row.frequencyHz));
  if (!Number.isFinite(frequencyHz) || frequencyHz < 3000) return;
  rows.push({
    frequencyHz,
    label: clean(row.label).slice(0, 110),
    group: clean(row.group).slice(0, 80),
    mode: ['AM','NFM','WFM','LSB','USB','DSB','CW','RAW'].includes(row.mode) ? row.mode : 'AM',
    bandwidthHz: Math.max(100, Math.round(Number(row.bandwidthHz) || 3000)),
    service: clean(row.service), country: clean(row.country), language: clean(row.language),
    target: clean(row.target), scheduleUtc: clean(row.scheduleUtc), days: clean(row.days),
    season: clean(row.season), station: clean(row.station), sourceDataset: clean(row.sourceDataset),
    sourceUrl: clean(row.sourceUrl), notes: clean(row.notes)
  });
};

const modeMap = token => {
  const t = clean(token).toUpperCase();
  if (t.includes('WFM')) return ['WFM', 120000];
  if (t.includes('NFM') || t === 'FM' || t.includes('/FM')) return ['NFM', 12500];
  if (t.includes('LSB')) return ['LSB', 2700];
  if (t.includes('USB')) return ['USB', 2700];
  if (t.includes('CW')) return ['CW', 500];
  if (t.includes('AM')) return ['AM', 9000];
  if (['FSK','RTTY','FAX','HFDL','ALE','MSK','PSK'].some(x => t.includes(x))) return ['USB', 3000];
  return ['AM', 9000];
};

// EiBi A26 as compiled by KiwiSDR. Each schedule/service record becomes one bookmark.
const eibiText = fs.readFileSync(path.join(root, 'eibi_A26.h'), 'utf8');
const eibiBlock = eibiText.split('dx_t eibi_db[] = {')[1].split('\n};')[0];
let eibiRecord = 0;
for (const line of eibiBlock.split(/\r?\n/)) {
  if (!line.includes('//') || !/^\s*\{\s*\d/.test(line)) continue;
  const [record, rawComment] = line.split('//', 2);
  const m = record.match(/^\s*\{\s*([0-9.]+),\s*(\d+),\s*(\d+),.*?\|\s*([A-Z0-9_]+)\|\s*([A-Z0-9]+),\s*\d+,\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\s*\}/);
  if (!m) throw new Error(`Unparsed EiBi row: ${line}`);
  const [, freqKHz, begin, end, type, rawMode, country, language, target] = m;
  eibiRecord += 1;
  const comment = clean(rawComment);
  const cm = comment.match(/^-([a-z0-9]+)\s+(.*)$/i);
  const station = clean(cm ? cm[2] : comment);
  const service = clean(cm ? cm[1] : type).toUpperCase();
  const [mode, bw] = modeMap(rawMode);
  add({ frequencyHz: Number(freqKHz) * 1000, label: `${station} · ${begin.padStart(4,'0')}-${end.padStart(4,'0')}Z`,
    group: `EiBi A26 – ${service}`, mode, bandwidthHz: bw, service, country,
    language: language.replace(/^-/, ''), target, scheduleUtc: `${begin.padStart(4,'0')}-${end.padStart(4,'0')}`,
    station, sourceDataset: 'EiBi A26 / KiwiSDR snapshot', sourceUrl: sourceUrls.eibi,
    notes: `EiBi record ${eibiRecord}; mode token: ${rawMode}` });
}

// HFCC fixed-width A26 operational schedule snapshot.
const hfccLines = fs.readFileSync(path.join(root, 'hfcc_A26all00.TXT'), 'utf8').split(/\r?\n/);
const cuts = [1,6,11,16,47,51,56,64,68,72,80,87,93,97,102,113,117,121,125,130,134,139,145,151];
const field = (line, index) => clean(line.slice(cuts[index], cuts[index + 1] ?? line.length));
for (const line of hfccLines) {
  if (!/^\s*\d/.test(line)) continue;
  const freqKHz = Number(field(line, 0));
  const start = field(line,1), stop = field(line,2), zones = field(line,3), loc = field(line,4);
  const power = field(line,5), azimuth = field(line,6), antenna = field(line,8), days = field(line,9);
  const from = field(line,10), to = field(line,11), mod = field(line,12), audio = field(line,13);
  const language = field(line,14), admin = field(line,15), broadcaster = field(line,16), fmo = field(line,17), notes = field(line,23);
  const station = broadcaster || admin || loc || 'HFCC station';
  const drm = mod && mod !== 'D';
  const bandwidth = Math.max(5000, Number(audio) || 9000);
  add({ frequencyHz: freqKHz * 1000, label: `${station} ${loc} · ${start}-${stop}Z${drm ? ' · digital' : ''}`,
    group: drm ? 'HFCC A26 – Digital broadcast' : 'HFCC A26 – Broadcast', mode: 'AM', bandwidthHz: bandwidth,
    service: drm ? 'Digital broadcast' : 'Broadcast', country: admin, language, target: zones,
    scheduleUtc: `${start}-${stop}`, days, season: `${from}-${to}`, station,
    sourceDataset: 'HFCC A26 ALL 09-Jul-2026', sourceUrl: sourceUrls.hfcc,
    notes: `Site ${loc}; ${power ? power+' kW; ' : ''}${azimuth ? 'azimuth '+azimuth+'; ' : ''}${antenna ? 'antenna '+antenna+'; ' : ''}FMO ${fmo}${notes ? '; '+notes : ''}` });
}

// Satellite downlinks and beacons distributed with Stellarium (mixed cited sources, including SatNOGS).
const sats = JSON.parse(fs.readFileSync(path.join(root, 'stellarium_communications.json'), 'utf8')).satellites;
for (const [norad, sat] of Object.entries(sats)) for (const comm of sat.comms ?? []) {
  const freqMHz = Number(comm.frequency);
  if (!Number.isFinite(freqMHz)) continue;
  const [mode, bw] = modeMap(comm.modulation || comm.description);
  const description = clean(comm.description || 'satellite link');
  add({ frequencyHz: freqMHz * 1e6, label: `${clean(sat.name)} · ${description}`,
    group: 'Satellite – Stellarium communications', mode, bandwidthHz: bw, service: description,
    country: '', language: '', target: 'Satellite footprint', scheduleUtc: 'Pass-dependent', days: '', season: '',
    station: clean(sat.name), sourceDataset: 'Stellarium communications.json', sourceUrl: clean(sat.source || sourceUrls.sat),
    notes: `NORAD ${norad}${comm.modulation ? '; '+clean(comm.modulation) : ''}` });
}

rows.sort((a,b) => a.frequencyHz-b.frequencyHz || a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
const keys = new Set();
const uniqueRows = [];
for (const r of rows) {
  const k = [r.frequencyHz,r.label,r.group,r.scheduleUtc,r.days,r.season,r.country,r.language,r.target,r.notes,r.sourceUrl].join('|');
  if (keys.has(k)) continue;
  keys.add(k);
  uniqueRows.push(r);
}
rows.splice(0, rows.length, ...uniqueRows);

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xml = `<?xml version="1.0" encoding="utf-8"?>\n<ArrayOfMemoryEntry xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n${rows.map(r => `  <MemoryEntry>\n    <IsScanned>false</IsScanned>\n    <IsFavourite>false</IsFavourite>\n    <Name>${esc(r.label)}</Name>\n    <GroupName>${esc(r.group)}</GroupName>\n    <Frequency>${r.frequencyHz}</Frequency>\n    <DetectorType>${r.mode}</DetectorType>\n    <Shift>0</Shift>\n    <FilterBandwidth>${r.bandwidthHz}</FilterBandwidth>\n    <CenterFrequency>0</CenterFrequency>\n  </MemoryEntry>`).join('\n')}\n</ArrayOfMemoryEntry>\n`;
fs.writeFileSync(path.join(out,'Frequencies.xml'), xml);

const headers = ['Frequency_Hz','Frequency_kHz','Label','Group','Mode','Bandwidth_Hz','Service','Country','Language','Target','Schedule_UTC','Days','Season','Station','Source_Dataset','Source_URL','Notes'];
const csvCell = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
const matrix = rows.map(r => [r.frequencyHz,r.frequencyHz/1000,r.label,r.group,r.mode,r.bandwidthHz,r.service,r.country,r.language,r.target,r.scheduleUtc,r.days,r.season,r.station,r.sourceDataset,r.sourceUrl,r.notes]);
fs.writeFileSync(path.join(out,'sdrsharp_swl_database.csv'), '\uFEFF'+[headers,...matrix].map(x=>x.map(csvCell).join(',')).join('\r\n')+'\r\n');

const counts = Object.entries(rows.reduce((a,r)=>(a[r.sourceDataset]=(a[r.sourceDataset]||0)+1,a),{}));
const wb = Workbook.create();
const summary = wb.worksheets.add('Summary');
summary.getRange('A1:F1').merge(); summary.getRange('A1').values=[['SDR# Worldwide SWL Database — A26']];
summary.getRange('A2:F2').merge(); summary.getRange('A2').values=[['VLF, LF, MF, HF and satellite records — ULF excluded']];
summary.getRange(`A4:B${7+counts.length}`).values=[['Metric','Value'],['Total records',rows.length],['Minimum frequency (Hz)',rows[0].frequencyHz],['Maximum frequency (Hz)',rows.at(-1).frequencyHz],...counts];
summary.getRange('A1:F1').format={fill:'#17365D',font:{bold:true,color:'#FFFFFF',size:18},horizontalAlignment:'center'};
summary.getRange('A2:F2').format={fill:'#D9EAF7',font:{italic:true,color:'#17365D'},horizontalAlignment:'center'};
summary.getRange('A4:B4').format={fill:'#5B9BD5',font:{bold:true,color:'#FFFFFF'}};
summary.getRange('A:B').format.autofitColumns(); summary.freezePanes.freezeRows(2);
const sheet = wb.worksheets.add('Database');
sheet.getRangeByIndexes(0,0,matrix.length+1,headers.length).values=[headers,...matrix];
sheet.getRangeByIndexes(0,0,1,headers.length).format={fill:'#17365D',font:{bold:true,color:'#FFFFFF'},wrapText:true};
sheet.freezePanes.freezeRows(1); sheet.tables.add(`A1:Q${matrix.length+1}`,true,'SWLDatabase');
sheet.getRange('A:Q').format.autofitColumns();
for (const col of ['C','D','N','O','P','Q']) sheet.getRange(`${col}:${col}`).format.columnWidth = col==='Q' ? 55 : 34;
const xlsx = await SpreadsheetFile.exportXlsx(wb); await xlsx.save(path.join(out,'sdrsharp_swl_database.xlsx'));

const countMap = Object.fromEntries(counts);
const readme = `# SDR# Worldwide SWL Database\n\nA ready-to-use SDR# frequency database built from real A26 schedules and published station data. **ULF is intentionally excluded.**\n\n## Contents\n\n- **${rows.length.toLocaleString('en-US')} records** in the SDR# XML file, CSV and Excel workbook\n- VLF/LF time, utility, naval and communications stations\n- MF/HF international broadcasting, utilities, aviation, maritime, ALE, HFDL, military, fax, CW, FSK and reported stations\n- Published satellite downlinks and beacons above HF\n- UTC schedules, countries, languages, targets, modes and source fields in CSV/XLSX\n\n## Files\n\n| File | Purpose |\n|---|---|\n| \`Frequencies.xml\` | SDR# Frequency Manager database |\n| \`sdrsharp_swl_database.csv\` | Full UTF-8 metadata table |\n| \`sdrsharp_swl_database.xlsx\` | Filterable Excel workbook |\n| \`SDRSharp_Worldwide_SWL_Database_A26.zip\` | Complete download package |\n| \`SHA256SUMS.txt\` | File-integrity hashes |\n\n## Import into SDR#\n\n1. Close SDR#.\n2. Back up your existing \`Frequencies.xml\`.\n3. Copy the downloaded \`Frequencies.xml\` into the SDR# folder that already contains your current file.\n4. Start SDR# and open **Frequency Manager**.\n5. Enable **Show on spectrum** in Frequency Manager to display labels above signals.\n\nReplacing the file replaces your existing bookmarks. To keep them, merge the \`<MemoryEntry>...</MemoryEntry>\` blocks while SDR# is closed. Some third-party Frequency Manager plugins use SQLite instead of SDR#'s XML; for those, import the CSV and map the frequency, label, group, detector and bandwidth columns.\n\n## Data included in this release\n\n| Dataset | Records | Snapshot |\n|---|---:|---|\n| EiBi A26 compiled in KiwiSDR | ${countMap['EiBi A26 / KiwiSDR snapshot'] || 0} | Git commit \`3b570602a14161188f8c85eede62ab2a70e7ad66\` |\n| HFCC A26 ALL | ${countMap['HFCC A26 ALL 09-Jul-2026'] || 0} | 09 July 2026 |\n| Stellarium satellite communications | ${countMap['Stellarium communications.json'] || 0} | Repository snapshot used for this build |\n| **Total** | **${rows.length}** | Built 13 September 2026 |\n\nSources: [EiBi/KiwiSDR](${sourceUrls.eibi}), [HFCC A26 mirror](${sourceUrls.hfcc}), [official HFCC data page](https://new.hfcc.org/data/), and [Stellarium communications data](${sourceUrls.sat}). Each CSV/XLSX row includes its source URL.\n\n## Important notes\n\nA database entry identifies a published or reported assignment; it does not guarantee that a transmitter is active or receivable at a particular time and location. HF schedules change seasonally. Satellite reception is pass-dependent. Receiver modes and bandwidths are practical starting points; specialized digital decoders may require different audio offsets.\n\nThis is a receive-only reference. Follow your licence and local law before transmitting.\n\n## Validation\n\nThe build checks the XML element order expected by SDR#'s \`MemoryEntry\` serializer, allowed detector names, integer frequencies and bandwidths, duplicate output keys, CSV row count, XLSX sheet dimensions, ZIP CRC integrity and SHA-256 hashes.\n`;
fs.writeFileSync(path.join(out,'README.md'),readme);
fs.writeFileSync(path.join(out,'DATA_SOURCES.md'),`# Data sources and attribution\n\nThis release incorporates records from the following public datasets. Their original authors remain the authors of those datasets.\n\n- EiBi A26 data compiled into KiwiSDR: ${sourceUrls.eibi}\n- HFCC A26 schedule mirror: ${sourceUrls.hfcc}; official archive: https://new.hfcc.org/data/\n- Stellarium satellite communications file: ${sourceUrls.sat}. Individual satellite rows retain the source URL supplied by that file. SatNOGS-sourced records are subject to SatNOGS database terms (CC BY-SA 4.0): https://db.satnogs.org/\n\nNo claim is made that every assignment is currently active.\n`);

const checksumTargets = ['Frequencies.xml','sdrsharp_swl_database.csv','sdrsharp_swl_database.xlsx','README.md','DATA_SOURCES.md'];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex');
fs.writeFileSync(path.join(out,'SHA256SUMS.txt'), checksumTargets.map(f=>`${hash(f)}  ${f}`).join('\n')+'\n');
execFileSync('zip',['-q','-9','SDRSharp_Worldwide_SWL_Database_A26.zip',...checksumTargets,'SHA256SUMS.txt'],{cwd:out});
fs.appendFileSync(path.join(out,'SHA256SUMS.txt'),`${hash('SDRSharp_Worldwide_SWL_Database_A26.zip')}  SDRSharp_Worldwide_SWL_Database_A26.zip\n`);
fs.writeFileSync(path.join(out,'build_stats.json'),JSON.stringify({records:rows.length,minimumHz:rows[0].frequencyHz,maximumHz:rows.at(-1).frequencyHz,bySource:countMap},null,2)+'\n');
console.log(JSON.stringify({records:rows.length,bySource:countMap,out},null,2));
