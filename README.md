# SDR# SWL Frequency Database

A curated set of SDR# frequency bookmarks for shortwave listeners, radio amateurs, signal-identification enthusiasts, and general SDR users.

The database covers **VLF through microwave frequencies** and intentionally excludes ULF. It currently contains **97 reviewed entries in 25 groups**, spanning **17.2 kHz to 10.4895 GHz**.

## What is included

- VLF and LF naval, navigation, historic, and time-signal references
- Longwave broadcast landmarks
- NAVTEX and GMDSS DSC channels
- HF time and frequency standards
- Aeronautical VOLMET, emergency, HFDL, and military reference channels
- Common amateur CW, SSB, FT8, WSPR, FM, and beacon frequencies
- VHF marine, AIS, aviation, and weather-satellite channels
- Amateur satellite and ISS reference frequencies
- PMR446, ADS-B, GNSS, and QO-100 landmarks

The entries are arranged in practical groups so that SDR# can display readable labels above known frequencies in the spectrum view.

## Files

| File | Purpose |
| --- | --- |
| `Frequencies.xml` | Bookmark database for the standard SDR# Frequency Manager |
| `sdrsharp_swl_database.csv` | Complete data with frequencies, modes, bandwidths, notes, status, and source links |
| `sdrsharp_swl_database.xlsx` | Filterable Excel reference workbook with summary and database sheets |
| `SDRSharp_SWL_Database_no_ULF_2026-09-13.zip` | Ready-to-download package containing all files |

## Installing the XML database in SDR#

1. Close SDR#.
2. Locate the existing `Frequencies.xml` file in the SDR# program or configuration directory.
3. Make a backup of that file.
4. Either replace it with the supplied `Frequencies.xml`, or merge the supplied `<MemoryEntry>` blocks into your existing database.
5. Start SDR# and enable frequency labels or bookmarks in the spectrum display.

SDR# releases and third-party Frequency Manager plugins do not all use the same storage format. Frequency Manager Suite commonly uses its own database and import utility. In that case, import the CSV through its Data Tools Wizard and map the frequency, label, group, detector mode, and bandwidth fields. Renaming a SQLite database to XML will not work.

## Database fields

The CSV and Excel versions contain:

- Frequency in hertz and kilohertz
- Display label and group
- Suggested receiver mode and filter bandwidth
- Service and country
- UTC schedule information where applicable
- Status and identification notes
- Source URL when a suitable primary or authoritative reference is available

## Status labels and limitations

This is a **curated receiver bookmark set**, not a live spectrum-allocation database and not proof that every listed transmitter is currently on the air.

Entries marked as **Active reference** identify well-established services. **Reported**, **Schedule-dependent**, **Band marker**, and **Reference** entries are starting points for monitoring and signal identification. Military callsigns, broadcast assignments, satellite status, schedules, and operating frequencies can change without notice.

Seasonal HF broadcast schedules are deliberately not duplicated as thousands of SDR# bookmarks. Doing so would create unreadable overlapping labels and would become obsolete every A/B broadcasting season. For current international shortwave schedules, use the official [HFCC public data](https://new.hfcc.org/data/) or the [EiBi schedule database](https://www.eibispace.de/).

The selected demodulation mode is a practical starting point. FSK, MSK, DSC, NAVTEX, and similar decoders may require a particular USB audio offset rather than zero-beat tuning.

## Legal notice

This project is intended for lawful reception and technical study. Do not transmit on aviation, maritime, military, satellite, safety, or licence-exempt channels unless your licence and the law applicable at your location explicitly permit it. Some jurisdictions also restrict the interception, recording, decoding, or disclosure of particular communications.

## Verification

The XML is well formed, the ZIP archive passes an integrity test, and the XML and CSV releases contain the same 97 entries.

## Contributions

Corrections and well-sourced additions are welcome through GitHub issues or pull requests. Please include a reliable source, the exact frequency, mode, bandwidth, service, location or country, schedule if relevant, and the date on which the information was verified.

## Maintainer

**Nikiforos Kontopoulos — SV1EEX**

Piraeus, Greece — KM17TW
