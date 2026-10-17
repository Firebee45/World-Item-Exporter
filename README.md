# World Item Exporter

Scan a Minecraft (Java) world in your browser and get exact totals for every item stored in containers chests, barrels, hoppers, shulker boxes, and more. in all explored chunks

## Features

- **Full container scan**: Overworld, Nether, and The End (toggle each dimension)
- **Nested shulkers**: Contents of shulker boxes are counted, including boxes inside other containers
- **Structure filter**: Optionally ignore containers inside structure bounding boxes (used to try avoid counting loot tables from structures in explored chunks)
- **Item icons**: Inventory icons next to every name via [mc-api.bisai.dev](https://mc-api.bisai.dev) (mainly added this note for credit reasons)
- **Top items**: The top 10% of item types by quantity 
- **Export**: Excel (`.xlsx`), CSV, or a code (This code is not used for anything yet but will be)
- **Dark / light theme**: Follows system preference, or toggle manually

## What is counted

| Counted | Not counted |
|--------|-------------|
| Chests, trapped chests | Player inventories |
| Barrels | Ender chests |
| Hoppers, droppers, dispensers | Dropped items |
| Shulker boxes (all colours, nested) | Item frames |
| | Storage minecarts |

Results depend on the world format and which region files are present in the ZIP.

## How it works

1. **Open the archive**: JSZip reads the ZIP in the browser and finds region files (`r.X.Z.mca`).
2. **Read the chunks**: Each region holds up to 1,024 chunks. Locations, sizes, and compression are read from the region header; chunks are decompressed (gzip / zlib / uncompressed).
3. **Parse NBT**: Chunks are Minecraft’s binary NBT format. Block entities (chests, barrels, etc.) are extracted.
4. **Count items**: Every stack is tallied. Shulker boxes store items inside the item NBT, so nested contents are opened and counted as well.

## Export options

- **Excel (`.xlsx`)**: Columns auto-sized to content
- **CSV**: Plain spreadsheet-friendly text
- **Export as code**: Used Soon 

You can ignore items below a minimum quantity before exporting.

### Dependencies (CDN)

- [JSZip](https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js): read the world archive
- [pako](https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js): decompress region chunks

Item icons are loaded from `https://mc-api.bisai.dev/v1/assets/items/{id}/texture.png`.

## notes
- Structure exclusion uses the world’s saved structure bounding boxes; player builds that sit inside those boxes are skipped too when the option is on.



