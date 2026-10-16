(() => {
  const {el} = WS;
  let current = '';
  const hideCode = () => { current = ''; el.codeResult.hidden = true; el.codeNote.hidden = true; el.copyCodeBtn.textContent = 'Copy'; };
  const showCode = code => {
    current = code || '';
    el.codeResult.hidden = false;
    el.codeNote.hidden = false;
    el.codeValue.textContent = code || '------';
    el.copyCodeBtn.disabled = !code;
    el.codeNote.textContent = code ? 'Enter this code on the viewer page. It only works in this browser.' : 'Could not save. Browser storage may be full or blocked.';
  };
  const copyCode = async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(current); el.copyCodeBtn.textContent = 'Copied'; } catch (e) { el.copyCodeBtn.textContent = 'Copy failed'; }
    setTimeout(() => { el.copyCodeBtn.textContent = 'Copy'; }, 1500);
  };
  Object.assign(WS, {hideCode, showCode, copyCode});
})();
