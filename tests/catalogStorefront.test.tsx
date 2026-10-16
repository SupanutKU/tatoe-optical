import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeScreen } from '../src/components/HomeScreen';
import { EssilorStyleRail } from '../src/components/tryOn/EssilorStyleRail';
import { useGlasses } from '../src/hooks/useGlasses';
import { MOCK_USER } from '../src/data/mockData';
import type {Product} from '../src/types';
const fixture=(i:number):Product=>({id:String(i),name:`Uploaded model ${i}`,colorName:'Gold',category:'sunglasses',shape:'drop',material:'metal',price:990,rating:5,reviewCount:0,salesCount:'0',stockStatus:'in_stock',images:[],lensType:'Tinted',weight:'20g',warranty:'1 year',size:'60-18-142',description:'From admin',model3d:'/models/aviator_lavender.glb'});
const rows=Array.from({length:14},(_,i)=>fixture(i));
const home=renderToStaticMarkup(<HomeScreen user={{...MOCK_USER,role:'customer'}} products={rows} wishlist={[]} onToggleWishlist={()=>{}} onSelectProduct={()=>{}} onAddToCart={()=>{}} onNavigate={()=>{}} onOpenVirtualTryOn={()=>{}} onOpenVirtualTryOnWithProduct={()=>{}} />);
for(const p of rows) assert.ok(home.includes(p.name),`Missing storefront product ${p.id}`);
assert.ok(home.includes('สินค้าทั้งหมด'));assert.ok(home.includes('ลองแว่น 3D'));
const rail=renderToStaticMarkup(<EssilorStyleRail products={rows} selectedId="13" onSelect={()=>{}} expanded={false} onToggle={()=>{}} />);
assert.ok(rail.includes('Uploaded model 13'),'Collapsed rail must include products after the 12th');
function Selected({products,initial}:{products:Product[],initial:Product}) {
 const {selected}=useGlasses({products,initialProduct:initial});
 return <span>{selected?.model3d||'none'}</span>;
}
const stale={...rows[0],model3d:undefined};
assert.ok(renderToStaticMarkup(<Selected products={rows} initial={stale}/>).includes('aviator_lavender.glb'));
assert.ok(renderToStaticMarkup(<Selected products={[]} initial={stale}/>).includes('none'));
console.log('Passed: admin sunglasses visible by default, direct 3D try-on, full rail, latest selected model, empty catalog.');
