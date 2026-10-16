(() => {
  const {el, state: S, formatBytes, setStatus, setState, setProgress} = WS;
  const chooseFile = file => {
    if (!file) return;
    S.file = file;
    WS.syncScan();
    el.navCta.textContent = 'Scan world';
    el.fileName.textContent = `${file.name}  (${formatBytes(file.size)})`;
    el.dropTitle.textContent = 'World selected';
    el.dropHint.textContent = 'Choose a different ZIP or drop another one here.';
    setProgress(0, 'Ready to scan');
    setState('Ready', '');
    setStatus('Press Scan world to begin.');
  };
  const openPicker = () => el.zipInput.click();
  el.zipInput.addEventListener('change', () => chooseFile(el.zipInput.files && el.zipInput.files[0]));
  el.heroChoose.addEventListener('click', openPicker);
  el.ctaChoose.addEventListener('click', openPicker);
  el.navCta.addEventListener('click', () => { if (!S.file) openPicker(); else if (!S.scanning) WS.scanWorld(); });
  ['dragenter', 'dragover'].forEach(ev => el.drop.addEventListener(ev, e => { e.preventDefault(); el.drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => el.drop.addEventListener(ev, e => { e.preventDefault(); el.drop.classList.remove('over'); }));
  el.drop.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) chooseFile(f); });
})();
