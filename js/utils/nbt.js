(() => {
  const getTag = (compound, name) => {
    if (!compound) return null;
    if (compound.value && Object.prototype.hasOwnProperty.call(compound.value, name)) return compound.value[name];
    return null;
  };
  const getScalar = (compound, name) => {
    const tag = getTag(compound, name);
    if (!tag) return undefined;
    if (tag.value !== undefined && (typeof tag.value !== 'object' || tag.value === null)) return tag.value;
    return undefined;
  };
  const parseNBT = bytes => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let pos = 0;
    const need = n => { if (pos+n > view.byteLength) throw new Error('Unexpected end of NBT data'); };
    const u8 = () => { need(1); return view.getUint8(pos++); };
    const i16 = () => { need(2); const v=view.getInt16(pos); pos+=2; return v; };
    const i32 = () => { need(4); const v=view.getInt32(pos); pos+=4; return v; };
    const i64 = () => { need(8); const v=view.getBigInt64(pos); pos+=8; return Number(v); };
    const f32 = () => { need(4); const v=view.getFloat32(pos); pos+=4; return v; };
    const f64 = () => { need(8); const v=view.getFloat64(pos); pos+=8; return v; };
    const str = () => { const n=u8()*256+u8(); need(n); let s=''; for(let i=0;i<n;i++) s+=String.fromCharCode(view.getUint8(pos+i)); pos+=n; return s; };
    const payload = (type, depth=0) => {
      if(depth>80) throw new Error('NBT nesting too deep');
      switch(type) {
        case 1: { need(1); const v=view.getInt8(pos); pos++; return v; }
        case 2: return i16();
        case 3: return i32();
        case 4: return i64();
        case 5: return f32();
        case 6: return f64();
        case 7: { const n=i32(); if(n<0 || n>bytes.length) throw new Error('Bad byte array'); need(n); const a=bytes.slice(pos,pos+n); pos+=n; return a; }
        case 8: return str();
        case 9: { const childType=u8(), n=i32(); if(n<0 || n>1000000) throw new Error('Bad list'); const arr=[]; for(let i=0;i<n;i++) arr.push({type:childType,value:payload(childType,depth+1)}); return arr; }
        case 10: { const obj={}; while(true) { const t=u8(); if(t===0) break; const name=str(); obj[name]={type:t,value:payload(t,depth+1)}; } return obj; }
        case 11: { const n=i32(); if(n<0 || n>1000000) throw new Error('Bad int array'); const a=[]; for(let i=0;i<n;i++) a.push(i32()); return a; }
        case 12: { const n=i32(); if(n<0 || n>1000000) throw new Error('Bad long array'); const a=[]; for(let i=0;i<n;i++) a.push(i64()); return a; }
        default: throw new Error('Unknown NBT tag type '+type);
      }
    };
    const type=u8();
    if(type===0) return null;
    const name=str();
    return {type, name, value:payload(type)};
  };
  Object.assign(WS, {getTag, getScalar, parseNBT});
})();
