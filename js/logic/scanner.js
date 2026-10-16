(() => {
  const {el, state: S, tick, setStatus, setState, setProgress} = WS;
  const REGION_RE = /\/?region\/r\.-?\d+\.-?\d+\.mca$/i;
  const NETHER_RE = /(^|\/)(DIM-1|dimensions\/[^/]+\/the_nether)\//i;
  const END_RE = /(^|\/)(DIM1|dimensions\/[^/]+\/the_end)\//i;
  const dimOf = name => NETHER_RE.test(name) ? 'nether' : END_RE.test(name) ? 'end' : 'overworld';
  const dimKeyOf = name => name.replace(REGION_RE, '');
  const syncScan = () => { el.scanBtn.disabled = S.scanning || !S.file || !el.dimChecks.some(c => c.checked); };
  const readChunk = (bytes, slot) => {
    const loc = slot * 4;
    const sectorOffset = (bytes[loc] << 16) | (bytes[loc+1] << 8) | bytes[loc+2];
    const sectorCount = bytes[loc+3];
    if (!sectorOffset || !sectorCount) return {empty:true};
    const start = sectorOffset * 4096;
    if (start + 5 > bytes.length) return {skipped:true};
    const length = (bytes[start] * 0x1000000) + (bytes[start+1] << 16) + (bytes[start+2] << 8) + bytes[start+3];
    if (!length || start + 4 + length > bytes.length) return {skipped:true};
    const compression = bytes[start+4] & 0x7f;
    try {
      const payload = bytes.subarray(start+5, start+4+length);
      const nbtBytes = compression === 1 ? pako.ungzip(payload) : compression === 2 ? pako.inflate(payload) : compression === 3 ? payload : null;
      if (!nbtBytes) return {skipped:true};
      const root = WS.parseNBT(nbtBytes);
      return {chunk: root && root.value && root.value.Level ? root.value.Level : root};
    } catch (e) { return {skipped:true}; }
  };
  const scanRegion = async (file, index, total, token) => {
    const bytes = await file.async('uint8array');
    const dim = dimKeyOf(file.name);
    const stats = {chunks:0, skipped:0};
    for (let slot = 0; slot < 1024; slot++) {
      if (slot % 128 === 127) {
        setProgress((index + slot / 1024) / total * 100);
        await tick();
        if (token !== S.scanToken) return null;
      }
      const read = readChunk(bytes, slot);
      if (read.empty) continue;
      if (read.skipped) { stats.skipped++; continue; }
      try {
        if (S.excludeStructures) WS.structures.addChunk(read.chunk, dim);
        WS.collectChunk(read.chunk, dim);
        stats.chunks++;
      } catch (e) { stats.skipped++; }
    }
    return stats;
  };
  const scanWorld = async () => {
    if (!S.file || !el.dimChecks.some(c => c.checked)) return;
    const wanted = new Set(el.dimChecks.filter(c => c.checked).map(c => c.value));
    const token = ++S.scanToken;
    S.scanning = true;
    S.excludeStructures = el.excludeStructures.checked;
    S.pending = [];
    WS.structures.reset();
    WS.closeMenu(); WS.closeDimMenu(); WS.hideCode();
    el.scanBtn.disabled = true; el.exportBtn.disabled = true; el.search.disabled = true;
    S.totals = new Map(); S.direct = new Map(); S.containerSummary = new Map(); S.containerCount = 0; S.totalCount = 0;
    ['itemKinds', 'itemCount', 'containers'].forEach(key => el[key].textContent = '--');
    WS.renderContainers();
    WS.render();
    setState('Scanning', 'busy');
    setProgress(null, 'Opening archive');
    try {
      if (!window.JSZip || !window.pako) throw new Error('Required browser libraries did not load. Check your internet connection and reload this file.');
      setStatus('Reading ZIP archive...');
      const zip = await JSZip.loadAsync(S.file);
      const found = Object.values(zip.files).filter(f => !f.dir && REGION_RE.test(f.name));
      if (!found.length) throw new Error('No .mca region files found. ZIP the world folder itself, or the folder containing level.dat and region/.');
      const regions = found.filter(f => wanted.has(dimOf(f.name)));
      if (!regions.length) throw new Error('No region files found in the selected dimensions.');
      const total = regions.length;
      let chunks = 0, skipped = 0;
      for (let i = 0; i < total; i++) {
        if (token !== S.scanToken) return;
        setProgress(i / total * 100, `Scanning region ${i + 1} of ${total}`);
        setStatus(regions[i].name);
        const stats = await scanRegion(regions[i], i, total, token);
        if (!stats) return;
        chunks += stats.chunks; skipped += stats.skipped;
        setProgress((i + 1) / total * 100);
        await tick();
      }
      const excluded = S.excludeStructures ? WS.flushPending() : 0;
      WS.showResults();
      el.search.disabled = false;
      el.exportBtn.disabled = S.totals.size === 0;
      setProgress(100, 'Scan complete');
      setState('Complete', 'done');
      const skippedNote = skipped ? ` ${skipped.toLocaleString()} chunk records were skipped or unreadable.` : '';
      const structureNote = S.excludeStructures ? ` Ignored ${excluded.toLocaleString()} containers inside structure boxes (${WS.structures.count.toLocaleString()} structure pieces found).` : '';
      setStatus(`Read ${total} region files and ${chunks.toLocaleString()} chunk records.${skippedNote}${structureNote}`);
    } catch (err) {
      setProgress(0, 'Scan failed');
      setState('Error', 'error');
      setStatus(err && err.message ? err.message : String(err), true);
    } finally {
      S.scanning = false;
      syncScan();
    }
  };
  Object.assign(WS, {dimOf, syncScan, scanWorld});
})();
