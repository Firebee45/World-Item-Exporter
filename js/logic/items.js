(() => {
  const {state: S, add, itemName, containerLabel, getTag, getScalar} = WS;
  const COLORS = ['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black'];
  const MODERN = ['trapped_chest','chest','barrel','hopper','dropper','dispenser','shulker_box', ...COLORS.map(c => `${c}_shulker_box`)];
  const MODERN_RE = new RegExp(`^(minecraft:)?(${MODERN.join('|')})$`, 'i');
  const LEGACY_RE = /^(TrappedChest|Chest|Barrel|Hopper|Dropper|Dispenser)$/i;
  const isContainerId = id => MODERN_RE.test(id) || LEGACY_RE.test(id);
  const itemIdOf = item => getScalar(item, 'id') || getScalar(item, 'Id') || 'unknown:item';
  const itemCountOf = item => Number(getScalar(item, 'Count') ?? getScalar(item, 'count') ?? 1);
  const isShulkerItem = item => /(?:^|:)(?:[a-z_]+_)?shulker_box$/i.test(String(itemIdOf(item)));
  const nestedItemsOf = item => {
    const tag = getTag(item, 'tag') || getTag(item, 'Tag');
    const blockEntityTag = tag && getTag(tag, 'BlockEntityTag');
    const legacyItems = blockEntityTag && getTag(blockEntityTag, 'Items');
    if (legacyItems && Array.isArray(legacyItems.value)) return legacyItems.value;
    const components = getTag(item, 'components');
    const containerComponent = components && (getTag(components, 'minecraft:container') || getTag(components, 'container'));
    if (containerComponent && Array.isArray(containerComponent.value)) return containerComponent.value.map(entry => getTag(entry, 'item') || entry);
    return [];
  };
  const collectItem = (item, map, allowNested, depth=0) => {
    if (!item || depth > 32) return;
    add(map, itemName(itemIdOf(item)), itemCountOf(item));
    if (allowNested && isShulkerItem(item)) for (const child of nestedItemsOf(item)) collectItem(child, map, true, depth+1);
  };
  const nestedLabels = (item, depth, labels) => {
    if (!item || depth > 32 || !isShulkerItem(item)) return;
    const items = nestedItemsOf(item);
    if (items.length) labels.push(itemIdOf(item));
    for (const child of items) nestedLabels(child, depth + 1, labels);
  };
  const readContainer = entity => {
    const id = String(getScalar(entity, 'id') || '');
    if (!isContainerId(id)) return null;
    const itemsTag = getTag(entity, 'Items');
    const items = itemsTag && Array.isArray(itemsTag.value) ? itemsTag.value : [];
    if (!items.length) return null;
    const counts = new Map(), labels = [id];
    for (const item of items) { collectItem(item, counts, true); nestedLabels(item, 0, labels); }
    return {x:Number(getScalar(entity, 'x')), y:Number(getScalar(entity, 'y')), z:Number(getScalar(entity, 'z')), counts, labels};
  };
  const commit = rec => {
    for (const [name, n] of rec.counts) add(S.direct, name, n);
    for (const id of rec.labels) {
      const type = containerLabel(id);
      S.containerSummary.set(type, (S.containerSummary.get(type) || 0) + 1);
      S.containerCount++;
    }
  };
  const collectChunk = (chunk, dim) => {
    const blockEntities = getTag(chunk, 'block_entities') || getTag(chunk, 'TileEntities') || getTag(chunk, 'tile_entities');
    if (!blockEntities || blockEntities.type !== 9 || !Array.isArray(blockEntities.value)) return;
    for (const entity of blockEntities.value) {
      const rec = readContainer(entity);
      if (!rec) continue;
      if (S.excludeStructures) { rec.dim = dim; S.pending.push(rec); } else commit(rec);
    }
  };
  const flushPending = () => {
    let excluded = 0;
    for (const rec of S.pending) {
      if (S.excludeStructures && WS.structures.contains(rec.dim, rec.x, rec.y, rec.z)) excluded++; else commit(rec);
    }
    S.pending = [];
    return excluded;
  };
  Object.assign(WS, {collectChunk, flushPending});
})();
