# SDR# Worldwide SWL Database

A ready-to-use SDR# frequency database built from real A26 schedules and published station data. **ULF is intentionally excluded.**

## Contents

- **13,903 records** in the SDR# XML file, CSV and Excel workbook
- VLF/LF time, utility, naval and communications stations
- MF/HF international broadcasting, utilities, aviation, maritime, ALE, HFDL, military, fax, CW, FSK and reported stations
- Published satellite downlinks and beacons above HF
- UTC schedules, countries, languages, targets, modes and source fields in CSV/XLSX

## Files

| File | Purpose |
|---|---|
| `Frequencies.xml` | SDR# Frequency Manager database |
| `sdrsharp_swl_database.csv` | Full UTF-8 metadata table |
| `sdrsharp_swl_database.xlsx` | Filterable Excel workbook |
| `SDRSharp_Worldwide_SWL_Database_A26.zip` | Complete download package |
| `SHA256SUMS.txt` | File-integrity hashes |

## Import into SDR#

1. Close SDR#.
2. Back up your existing `Frequencies.xml`.
3. Copy the downloaded `Frequencies.xml` into the SDR# folder that already contains your current file.
4. Start SDR# and open **Frequency Manager**.
5. Enable **Show on spectrum** in Frequency Manager to display labels above signals.

Replacing the file replaces your existing bookmarks. To keep them, merge the `<MemoryEntry>...</MemoryEntry>` blocks while SDR# is closed. Some third-party Frequency Manager plugins use SQLite instead of SDR#'s XML; for those, import the CSV and map the frequency, label, group, detector and bandwidth columns.

## Data included in this release

| Dataset | Records | Snapshot |
|---|---:|---|
| EiBi A26 compiled in KiwiSDR | 10086 | Git commit `3b570602a14161188f8c85eede62ab2a70e7ad66` |
| HFCC A26 ALL | 3301 | 09 July 2026 |
| Stellarium satellite communications | 516 | Repository snapshot used for this build |
| **Total** | **13903** | Built 13 September 2026 |

Sources: [EiBi/KiwiSDR](https://github.com/jks-prv/KiwiSDR/blob/3b570602a14161188f8c85eede62ab2a70e7ad66/dx/EiBi.h), [HFCC A26 mirror](https://github.com/sv1btl/PhantomSDR-Plus/blob/main/frequencylist/A26all00.TXT), [official HFCC data page](https://new.hfcc.org/data/), and [Stellarium communications data](https://github.com/Stellarium/stellarium/blob/master/plugins/Satellites/resources/communications.json). Each CSV/XLSX row includes its source URL.

## Important notes

A database entry identifies a published or reported assignment; it does not guarantee that a transmitter is active or receivable at a particular time and location. HF schedules change seasonally. Satellite reception is pass-dependent. Receiver modes and bandwidths are practical starting points; specialized digital decoders may require different audio offsets.

This is a receive-only reference. Follow your licence and local law before transmitting.

## Validation

The build checks the XML element order expected by SDR#'s `MemoryEntry` serializer, allowed detector names, integer frequencies and bandwidths, duplicate output keys, CSV row count, XLSX sheet dimensions, ZIP CRC integrity and SHA-256 hashes.

