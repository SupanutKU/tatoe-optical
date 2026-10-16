import assert from 'node:assert/strict';
import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ProductDetailScreen } from '../src/components/ProductDetailScreen';
import { ProductVisual } from '../src/components/ProductVisual';
import { useGlasses } from '../src/hooks/useGlasses';
import { createModelPreview } from '../src/lib/modelPreview';
import type { Product } from '../src/types';

const bytes = fs.readFileSync('public/models/aviator_lavender.glb');
const model3d = `data:model/gltf-binary;base64,${bytes.toString('base64')}`;
const product = { id: 'uploaded', name: 'Uploaded Aviator', images: [], model3d, price: 1200, colorName: 'Lavender', rating: 0, reviewCount: 0, stockStatus: 'in_stock', description: '', lensType: '', weight: '', size: '' } as Product;
const markup = renderToStaticMarkup(<ProductDetailScreen product={product} isFavorite={false} onToggleFavorite={()=>{}} onAddToCart={()=>{}} onOpenChat={()=>{}} />);
assert.ok(markup.includes('โมเดล 3D Uploaded Aviator'));
assert.ok(markup.includes('3D • '));
assert.ok(!markup.includes('src="undefined"'));
assert.ok(renderToStaticMarkup(<ProductVisual product={product} />).includes('โมเดล 3D Uploaded Aviator'));
assert.ok(renderToStaticMarkup(<ProductVisual product={{...product, images:['/photo.png']}} />).includes('โมเดล 3D Uploaded Aviator'));
assert.ok(renderToStaticMarkup(<ProductVisual product={{...product, model3d:undefined, images:['/photo.png']}} />).includes('src="/photo.png"'));
assert.ok(renderToStaticMarkup(<ProductVisual product={product} />).includes('>3D</span>'));

function Selected({ products, initial }: { products: Product[]; initial?: Product }) {
  const glasses = useGlasses({ products, initialProduct: initial });
  return <span>{glasses.selected?.model3d || 'none'}</span>;
}
const old = {...product, model3d:'/old.glb'};
assert.ok(renderToStaticMarkup(<Selected products={[product]} initial={old} />).includes(model3d));
assert.ok(renderToStaticMarkup(<Selected products={[product]} />).includes(model3d));
assert.ok(!renderToStaticMarkup(<Selected products={[]} initial={old} />).includes('/old.glb'));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const { scene, camera } = createModelPreview(gltf.scene,640,420);
assert.ok(scene.children.length >= 3);
assert.ok(camera.right > camera.left && camera.top > camera.bottom);
console.log('Passed: model-only storefront/detail rendering, photo fallback, current catalog selection and GLB preview framing.');
