import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMedia, imageContent, mediaFileLinks, mediaImageMarkdown} from './render.js';
const ref = {attachmentId: 'sha256:' + 'a'.repeat(64), mediaType: 'image/png', bytes: 123, width: 64, height: 32, name: '结果.png'};

test('completed mixed results retain JSON and emit native image blocks in order', () => {
 const next = {...ref, attachmentId: 'sha256:' + 'b'.repeat(64), mediaType: 'image/webp', originalDimensions: {width: 128, height: 64}};
 const value = {status: 'completed', files: [{path: 'C:/成果/第一张.png', imageRef: ref}, {path: 'C:/成果/movie.mp4'}, {path: '/tmp/second.webp', imageRef: next}]};
 const snapshot = structuredClone(value);
 const blocks = renderMedia({}, value);
 assert.deepEqual(JSON.parse(blocks[0].text), value);
 assert.deepEqual(blocks.filter(b => b.type === 'image'), [{type: 'image', attachment: ref}, {type: 'image', attachment: next}]);
 assert.ok(blocks[1].text.includes('[第一张.png](</C:/成果/第一张.png>)'));
 assert.ok(blocks[1].text.includes('[movie.mp4](</C:/成果/movie.mp4>)'));
 assert.deepEqual(value, snapshot);
 // PTC defers result.content whenever one image block is present, unchanged.
 const deferred = blocks.some(b => b.type === 'image') ? JSON.parse(JSON.stringify(blocks)) : [];
 assert.deepEqual(deferred, blocks);
});

test('get, pending, failed and historical file records remain text-only', () => {
 for (const value of [{settings: {}, jobs: [{files: [{imageRef: ref}]}]}, {status: 'queued', files: []}, {status: 'failed', error: 'upstream error'}, {status: 'completed', files: [{path: '/tmp/legacy'}]}, null]) {
  const blocks = renderMedia({}, value);
  assert.ok(blocks.every(b => b.type === 'text'));
  assert.deepEqual(JSON.parse(blocks[0].text), value);
 }
});

test('malformed image refs do not break transport or discard result metadata', () => {
 for (const imageRef of [null, {}, {...ref, width: 0}, {...ref, bytes: -1}, {...ref, mediaType: 'video/mp4'}, {...ref, originalDimensions: {width: 0, height: 3}}, {...ref, name: 42}]) {
  const value = {files: [{path: '/tmp/output.png', imageRef}]};
  const blocks = renderMedia({}, value);
  assert.ok(blocks.every(b => b.type === 'text'));
  assert.deepEqual(JSON.parse(blocks[0].text), value);
 }
 assert.deepEqual(imageContent({...ref, extra: 'not part of official ref'}), {type: 'image', attachment: ref});
});

test('links normalize Windows paths and escape Markdown without fake extensions', () => {
 const path = ['C:', 'result folder', 'a[b]#100%.png'].join(String.fromCharCode(92));
 const links = mediaFileLinks([{path}, {path: '/tmp/no-extension'}, {path: 'relative.png'}, {path: 'https://example.org/a.png'}, {path: '/tmp/'}, null]);
 assert.ok(links.includes('/C:/result folder/a[b]%23100%25.png'));
 assert.ok(links.includes(String.fromCharCode(92) + '['));
 assert.ok(links.includes('[no-extension](</tmp/no-extension>)'));
 assert.ok(!links.includes('no-extension.png'));
 assert.ok(!links.includes('relative.png'));
 assert.ok(!links.includes('https:'));
 assert.equal(mediaFileLinks(undefined), '');
});

test('optional fields are omitted and all official raster types are accepted', () => {
 const {name, ...minimal} = ref;
 for (const mediaType of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
  assert.deepEqual(imageContent({...minimal, mediaType}), {type: 'image', attachment: {...minimal, mediaType}});
 }
});

test('inline image paths preserve native Windows drive while file links keep slash-drive syntax',()=>{
 for(const path of ['C:/results/a.jpg','C:\\results\\a.jpg','/C:/results/a.jpg']){
  const md=mediaImageMarkdown([{path,imageRef:ref}]);const destination=md.match(/\(<(.*)>\)/)[1];
  assert.equal(destination,'C:/results/a.jpg');assert.equal(new URL('http://localhost/api/file?path='+encodeURIComponent(destination)).searchParams.get('path'),'C:/results/a.jpg');
 }
 assert.equal(mediaImageMarkdown([{path:'/tmp/a b#%.png',imageRef:ref}]),'![64 × 32](</tmp/a b%23%25.png>)');
 assert.equal(mediaImageMarkdown([{path:'https://example.com/a.png',imageRef:ref}]),'');
});
