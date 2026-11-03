(() => {
  const defaultTiles = [
    ['Amphora White','AMW'],['Alaska White','ALW'],['Antaliya Beige','AB'],['Breccia Natural','BRN'],['Colonial Black','COB'],['Fragment White','FW'],['Fossil Black','FOB'],['Golden Statuario','GLDST'],['Omani Grey','OMG'],['Portoro Black','PRTB'],['Simless White','SW'],['Versace Aloud','VA'],['Vibranium Brown','VRB'],['Volga Blue','VOB']
  ];
  const defaultTypes = [['Coffee Table','MCFT'],['Dining Table','MDINE'],['Side Table','MST'],['Study Table','ST'],['Metal Bed','MTB']];
  const headings = ['Product type','Revenue Segment','Parent SKU Code','Parent Product Name','Characters Length (40 Characters)','Child SKU Code','Child Description','Characters Length (40 Characters)','Packing Dimensions (MM) (LXWXH)','Product Dimensions (MM) (LXWXH)','Gross Weight (KG)','Net Weight (KG)','SAP Code Parent','SAP Code Child','Plant','Conversion Factor'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return Array.isArray(v) && v.length ? v : fallback.map(x=>[...x]); } catch { return fallback.map(x=>[...x]); } };
  let tiles = load('metalBom.tiles', defaultTiles), types = load('metalBom.types', defaultTypes);
  const legacyTypeDefaults = [['Coffee Table','CFT'],['Dining Table',''],['Side Table',''],['Study Table',''],['Metal Bed','']];
  for (const [name, oldCode] of legacyTypeDefaults) {
    const row = types.find(x => x[0] === name), currentDefault = defaultTypes.find(x => x[0] === name)?.[1];
    if (row && row[1] === oldCode) row[1] = currentDefault;
  }
  const sizeOptions=[['Big','Big'],['Small','Small'],['Combo','Combo'],['None','No size (blank)']];
  let savedSizeTiles={};try{savedSizeTiles=JSON.parse(localStorage.getItem('metalBom.sizeTiles')||'{}')||{};}catch{}
  const legacySizes=load('metalBom.selectedSizes', []).flat().filter(size=>sizeOptions.some(x=>x[0]===size));
  const legacyTiles=load('metalBom.selectedTiles', []).flat().filter(name=>tiles.some(t=>t[0]===name));
  let selectedSizes=new Set((savedSizeTiles.sizes||legacySizes).filter(size=>sizeOptions.some(x=>x[0]===size)));
  let tilesBySize=new Map(sizeOptions.map(([size])=>[size,new Set((savedSizeTiles.tiles?.[size]|| (legacySizes.includes(size)?legacyTiles:[])).filter(name=>tiles.some(t=>t[0]===name)))]));
  const sizeDetails=new Map();
  const persist = () => { localStorage.setItem('metalBom.tiles',JSON.stringify(tiles));localStorage.setItem('metalBom.types',JSON.stringify(types));localStorage.setItem('metalBom.sizeTiles',JSON.stringify({sizes:[...selectedSizes],tiles:Object.fromEntries([...tilesBySize].map(([size,names])=>[size,[...names]]))})); };
  const values = id => $(id).value.trim();
  const normalize = s => s.toUpperCase().replace(/\s+/g,'');
  const tileCode = name => (tiles.find(x=>x[0]===name)||[])[1]||'';
  const typeCode = name => (types.find(x=>x[0]===name)||[])[1]||'';
  const sizeCode = size => size==='Big'?'B':size==='Small'?'S':size==='Combo'?'C':'';
  const makeInput = (value, attr='') => `<input value="${esc(value)}" ${attr}>`;

  function drawCatalog() {
    $('tileRows').innerHTML = tiles.map((x,i)=>`<tr><td>${makeInput(x[0],`data-list="tile" data-i="${i}" data-c="0" aria-label="Tile name"`)}</td><td>${makeInput(x[1],`data-list="tile" data-i="${i}" data-c="1" aria-label="Tile short form"`)}</td><td><button class="remove" data-remove="tile" data-i="${i}" aria-label="Remove tile">Remove</button></td></tr>`).join('');
    $('typeRows').innerHTML = types.map((x,i)=>`<tr><td>${makeInput(x[0],`data-list="type" data-i="${i}" data-c="0" aria-label="Product type"`)}</td><td>${makeInput(x[1],`data-list="type" data-i="${i}" data-c="1" aria-label="Product code"`)}</td><td><button class="remove" data-remove="type" data-i="${i}" aria-label="Remove product type">Remove</button></td></tr>`).join('');
    updateSelectors();
  }
  function updateSelectors() {
    const oldType=values('productType');
    $('productType').innerHTML = `<option value="">Select product type</option>`+types.filter(x=>x[0]).map(x=>`<option>${esc(x[0])}</option>`).join('');
    if(types.some(x=>x[0]===oldType)) $('productType').value=oldType;
    let totalVariants=0;
    for(const [,names] of tilesBySize){for(const name of [...names])if(!tiles.some(t=>t[0]===name))names.delete(name);}
    $('sizeGroups').innerHTML=sizeOptions.map(([size,label])=>{
      const active=selectedSizes.has(size), names=tilesBySize.get(size), selected=names.size;totalVariants+=selected;
      const choices=active?`<div class="size-tile-list">${tiles.filter(x=>x[0]).map(x=>`<label class="tile-option"><input type="checkbox" data-size-tile="${esc(size)}" data-tile-name="${esc(x[0])}" ${names.has(x[0])?'checked':''}><span>${esc(x[0])} <span class="count">(${esc(x[1])})</span></span></label>`).join('')}</div>`:'';
      return `<div class="size-group"><label class="size-group-head"><input type="checkbox" data-size-select="${esc(size)}" ${active?'checked':''}><strong>${label}</strong><span class="count">${selected} tiles</span></label>${choices}</div>`;
    }).join('');
    $('variantSelectionCount').textContent=`${totalVariants} size and tile combination${totalVariants===1?'':'s'} selected`;
  }
  function childCount() { let n=parseInt($('childCount').value,10); if(!Number.isFinite(n)) n=1; n=Math.max(1,Math.min(30,n)); $('childCount').value=n; return n; }
  function saveChildDetails() {
    for(const card of $('childDetails').querySelectorAll('[data-size-details]')) {
      const size=card.dataset.sizeDetails, countInput=card.querySelector('[data-size-count]');
      const rows=[...card.querySelectorAll('tbody tr')].map(tr=>({component:tr.querySelector('select').value,values:[...tr.querySelectorAll('input')].map(input=>input.value)}));
      sizeDetails.set(size,{count:Math.max(1,Math.min(30,parseInt(countInput.value,10)||1)),rows});
    }
  }
  function drawChildren() {
    saveChildDetails();
    const sizes=sizeOptions.filter(([size])=>selectedSizes.has(size));
    $('childDetails').innerHTML=sizes.length?sizes.map(([size,label])=>{
      const detail=sizeDetails.get(size)||{count:childCount(),rows:[]};
      sizeDetails.set(size,detail);
      const count=Math.max(1,Math.min(30,parseInt(detail.count,10)||1));
      const rows=Array.from({length:count},(_,i)=>{
        const old=detail.rows[i]||{component:i===0?'Tile':'Frame',values:['','','','','']};
        const d=old.values||[];
        return `<tr><td class="num">${i+1}</td><td><select data-size-child="${esc(size)}"><option ${old.component==='Tile'?'selected':''}>Tile</option><option ${old.component==='Frame'?'selected':''}>Frame</option></select></td><td><input value="${esc(d[0])}" aria-label="${esc(label)} box ${i+1} packing dimensions"></td><td><input value="${esc(d[1])}" aria-label="${esc(label)} box ${i+1} product dimensions"></td><td><input type="number" step="0.01" value="${esc(d[2])}" aria-label="${esc(label)} box ${i+1} gross weight"></td><td><input type="number" step="0.01" value="${esc(d[3])}" aria-label="${esc(label)} box ${i+1} net weight"></td><td><input value="${esc(d[4])}" aria-label="${esc(label)} box ${i+1} SAP code child (Column N)"></td></tr>`;
      }).join('');
      return `<section class="size-details-card" data-size-details="${esc(size)}"><div class="size-details-head"><h3>${esc(label)} details</h3><div class="field"><label>Child boxes for ${esc(label)}</label><input type="number" min="1" max="30" data-size-count value="${count}" aria-label="${esc(label)} child count"></div></div><div class="table-wrap"><table class="children"><thead><tr><th>Box #</th><th>Component</th><th>Column I: Packing Dimensions (MM) (LXWXH)</th><th>Column J: Product Dimensions (MM) (LXWXH)</th><th>Column K: Gross Weight (KG)</th><th>Column L: Net Weight (KG)</th><th>Column N: SAP Code Child</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
    }).join(''):`<p class="empty">Select one or more sizes to enter their child details.</p>`;
    render();
  }
  function makeRows() {
    const model=values('modelName'), modelId=model, type=values('productType'), code=typeCode(type), plant=values('plant')||'MKA7';
    const ready=model&&type&&code;
    if(!ready) return [];
    const typeSku=normalize(code);
    const variants=sizeOptions.filter(([size])=>selectedSizes.has(size)).flatMap(([size])=>[...tilesBySize.get(size)].map(tile=>({size,tile})));
    if(!variants.length)return [];
    return variants.flatMap(({size,tile},variantIndex)=>{
      const detail=sizeDetails.get(size)||{count:childCount(),rows:[]}, n=Math.max(1,Math.min(30,parseInt(detail.count,10)||1));
      const childRows=detail.rows;
      const sizeLabel=size==='None'?'':size, base=`W${typeSku}${normalize(modelId)}${sizeCode(size)}`;
      const tCode=tileCode(tile), parent=`${base}${normalize(tCode)}`, parentName=`${model}${sizeLabel?` ${sizeLabel}`:''} ${type}-${tile}`;
      const group=Array.from({length:n},(_,i)=>{
        const child=childRows[i]||{component:i===0?'Tile':'Frame',values:['','','','','']}, ins=child.values, isTile=child.component==='Tile';
        const suffix=isTile?'T':'F', childBase=isTile?parent:base;
        const childCode=`${childBase}-B-${i+1}-${n}-${suffix}`;
        const childDesc=`${model}${sizeLabel?` ${sizeLabel}`:''} ${type}-${isTile?normalize(tCode)+'-':''}B-${i+1}-${n}-${suffix}`;
        return [type,values('revenueSegment')||'Fabrication (MKA7)',parent,parentName,String(parentName.length),childCode,childDesc,String(childDesc.length),ins[0],ins[1],ins[2],ins[3],'',ins[4],plant,(1/n).toFixed(2)];
      });
      return variantIndex<variants.length-1?[...group,Array(16).fill('')]:group;
    });
  }
  function render() {
    saveChildDetails();
    const rows=makeRows(), dataRows=rows.filter(row=>row.some(value=>value!=='')); $('rowCount').textContent=`${dataRows.length} ${dataRows.length===1?'row':'rows'}`;
    if(!rows.length){$('outputRows').innerHTML=`<tr><td class="empty" colspan="16">Enter a model name and product type, then choose each size and its tile variants in the left panel.</td></tr>`;return;}
    $('outputRows').innerHTML=rows.map(row=>row.every(value=>value==='')?'<tr class="group-gap"><td colspan="16"></td></tr>':`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');
  }
  function csvText(){const rows=makeRows().map((row,i)=>{if(row.some(value=>value!=='')){row[4]=`=LEN(D${i+2})`;row[7]=`=LEN(G${i+2})`;}return row;});return [headings,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');}
  function createExcelWorkbook(){
    const escXml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const colName=index=>{let n=index+1,out='';while(n){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;};
    const widths=[20,24,26,38,18,34,38,18,30,30,18,18,20,20,14,18];
    const cols=widths.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('');
    const rows=[headings,...makeRows()];
    const sheetRows=rows.map((row,rowIndex)=>{
      const r=rowIndex+1;
      if(rowIndex>0&&row.every(value=>value===''))return `<row r="${r}"/>`;
      const cells=row.map((value,colIndex)=>{
        const ref=`${colName(colIndex)}${r}`,style=rowIndex===0?' s="1"':colIndex===15?' s="2"':'';
        if(rowIndex>0&&(colIndex===4||colIndex===7))return `<c r="${ref}"${style}><f>LEN(${colName(colIndex-1)}${r})</f><v>${Number(value)||0}</v></c>`;
        if(rowIndex>0&&[10,11,15].includes(colIndex)&&value!==''&&Number.isFinite(Number(value)))return `<c r="${ref}"${style}><v>${Number(value)}</v></c>`;
        return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escXml(value)}</t></is></c>`;
      }).join('');
      return `<row r="${r}">${cells}</row>`;
    }).join('');
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="BOM Summary" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      'xl/worksheets/sheet1.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:P${rows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${sheetRows}</sheetData><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`
    };
    const encoder=new TextEncoder(),u16=(view,offset,value)=>view.setUint16(offset,value,true),u32=(view,offset,value)=>view.setUint32(offset,value>>>0,true);
    const crc32=data=>{let crc=0xffffffff;for(const byte of data){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
    const localParts=[],centralParts=[];let offset=0;
    for(const [path,content] of Object.entries(files)){
      const name=encoder.encode(path),data=encoder.encode(content),crc=crc32(data);
      const local=new Uint8Array(30+name.length+data.length),lv=new DataView(local.buffer);
      u32(lv,0,0x04034b50);u16(lv,4,20);u16(lv,6,0);u16(lv,8,0);u16(lv,10,0);u16(lv,12,33);u32(lv,14,crc);u32(lv,18,data.length);u32(lv,22,data.length);u16(lv,26,name.length);u16(lv,28,0);local.set(name,30);local.set(data,30+name.length);localParts.push(local);
      const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
      u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0);u16(cv,10,0);u16(cv,12,0);u16(cv,14,33);u32(cv,16,crc);u32(cv,20,data.length);u32(cv,24,data.length);u16(cv,28,name.length);u16(cv,30,0);u16(cv,32,0);u16(cv,34,0);u16(cv,36,0);u32(cv,38,0);u32(cv,42,offset);central.set(name,46);centralParts.push(central);offset+=local.length;
    }
    const centralSize=centralParts.reduce((sum,part)=>sum+part.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
    u32(ev,0,0x06054b50);u16(ev,4,0);u16(ev,6,0);u16(ev,8,centralParts.length);u16(ev,10,centralParts.length);u32(ev,12,centralSize);u32(ev,16,offset);u16(ev,20,0);
    return new Blob([...localParts,...centralParts,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  $('outputHead').innerHTML=headings.map(h=>`<th>${esc(h)}</th>`).join('');
  drawCatalog(); drawChildren();
  document.addEventListener('input',e=>{if(e.target.matches('[data-list]')){const a=e.target.dataset, arr=a.list==='tile'?tiles:types, old=arr[+a.i][+a.c];arr[+a.i][+a.c]=e.target.value;if(a.list==='tile'&&a.c==='0')for(const names of tilesBySize.values())if(names.has(old)){names.delete(old);names.add(e.target.value);}persist();updateSelectors();render();}else if(e.target.matches('[data-size-count]'))drawChildren();else if(e.target.closest('[data-size-details]'))render();else if(['modelName','childCount','plant','revenueSegment'].includes(e.target.id)) {if(e.target.id==='childCount')drawChildren();else render();}});
  document.addEventListener('change',e=>{if(e.target.matches('[data-size-select]')){const size=e.target.dataset.sizeSelect;if(e.target.checked)selectedSizes.add(size);else selectedSizes.delete(size);persist();updateSelectors();drawChildren();}else if(e.target.matches('[data-size-tile]')){const size=e.target.dataset.sizeTile,name=e.target.dataset.tileName,names=tilesBySize.get(size);if(e.target.checked)names.add(name);else names.delete(name);persist();updateSelectors();render();}else if(e.target.id==='productType'||e.target.closest('[data-size-details]'))render();});
  document.addEventListener('click',e=>{
    const rm=e.target.closest('[data-remove]'); if(rm){const a=rm.dataset,arr=a.remove==='tile'?tiles:types;if(a.remove==='tile'){const name=arr[+a.i][0];for(const names of tilesBySize.values())names.delete(name);}arr.splice(+a.i,1);persist();drawCatalog();render();}
  });
  $('addTile').addEventListener('click',()=>{tiles.push(['','']);persist();drawCatalog();$('tileRows').querySelector('tr:last-child input').focus();});
  $('addType').addEventListener('click',()=>{types.push(['','']);persist();drawCatalog();$('typeRows').querySelector('tr:last-child input').focus();});
  $('download').addEventListener('click',()=>{if(!makeRows().length){$('status').textContent='Complete the required product setup before downloading.';return;}const blob=createExcelWorkbook(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='summary-bom-generator.xlsx';a.click();URL.revokeObjectURL(url);$('status').textContent='Excel workbook downloaded.';});
  $('copy').addEventListener('click',async()=>{if(!makeRows().length){$('status').textContent='Complete the required product setup before copying.';return;}try{await navigator.clipboard.writeText(csvText());$('status').textContent='CSV copied to clipboard.';}catch{$('status').textContent='Clipboard access is unavailable. Use Download CSV.';}});
  ['modelName','productType','childCount','plant','revenueSegment'].forEach(id=>$(id).addEventListener('change',render));
})();

