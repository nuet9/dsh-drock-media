// Native ContentBlock projection for direct tools and PTC nested dispatch.
// saveFile persists imageRef from attachments.saveImage and a real deliverable path.
// This module performs no I/O or generation.
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const positiveInteger = v => Number.isSafeInteger(v) && v > 0;
export function isImageAttachmentRef(ref) {
 return !!ref && typeof ref === 'object' &&
  typeof ref.attachmentId === 'string' && ref.attachmentId.length > 0 &&
  imageTypes.has(ref.mediaType) && positiveInteger(ref.bytes) &&
  positiveInteger(ref.width) && positiveInteger(ref.height) &&
  (ref.name === undefined || typeof ref.name === 'string') &&
  (ref.originalDimensions === undefined ||
   (!!ref.originalDimensions && positiveInteger(ref.originalDimensions.width) && positiveInteger(ref.originalDimensions.height)));
}
// Copy only official ImageAttachmentRef fields; branding is erased at runtime.
export function imageContent(ref) {
 if (!isImageAttachmentRef(ref)) return undefined;
 return {type: 'image', attachment: {
  attachmentId: ref.attachmentId, mediaType: ref.mediaType,
  bytes: ref.bytes, width: ref.width, height: ref.height,
  ...(ref.name === undefined ? {} : {name: ref.name}),
  ...(ref.originalDimensions === undefined ? {} : {originalDimensions: {
   width: ref.originalDimensions.width, height: ref.originalDimensions.height
  }})
 }};
}
// Link existing saveFile paths only; never invent an extension or write a file.
export function mediaFileLinks(files) {
 if (!Array.isArray(files)) return '';
 return files.flatMap(file => {
  if (typeof file?.path !== 'string') return [];
  const path = file.path.replaceAll(String.fromCharCode(92), '/');
  const drive = /^[A-Za-z]:/.test(path) && path[2] === '/';
  if ((!drive && !path.startsWith('/')) || [...path].some(c => c.charCodeAt(0) < 32)) return [];
  const name = path.slice(path.lastIndexOf('/') + 1);
  if (!name) return [];
  const label = [...name].map(c => '[]'.includes(c) ? String.fromCharCode(92) + c : c).join('');
  const target = drive ? '/' + path : path;
  const destination = [...target].map(c => '%<>#'.includes(c) ? '%' + c.charCodeAt(0).toString(16).toUpperCase() : c).join('');
  return ['[' + label + '](<' + destination + '>)'];
 }).join(String.fromCharCode(10));
}
// Inline image destinations use native Windows drive paths, unlike folder links.
export function mediaImageMarkdown(files) {
 if (!Array.isArray(files)) return '';
 return files.filter(f => isImageAttachmentRef(f?.imageRef) && typeof f.path === 'string').map(f => {
  const path=f.path.replaceAll(String.fromCharCode(92),'/').replace(/^\/([A-Za-z]:\/)/,'$1');
  if ((!/^[A-Za-z]:\//.test(path) && !path.startsWith('/')) || /[\u0000-\u001f]/.test(path)) return '';
  const destination=[...path].map(c=>'%<>#'.includes(c)?'%'+c.charCodeAt(0).toString(16).toUpperCase():c).join('');
  return '!['+f.imageRef.width+' × '+f.imageRef.height+'](<' + destination + '>)';
 }).filter(Boolean).join('\n\n');
}
export function renderMedia(_args, value) {
 const content = [{type: 'text', text: JSON.stringify(value)}];
 const files = Array.isArray(value?.files) ? value.files : [];
 const links = mediaFileLinks(files);
 if (links) content.push({type: 'text', text: links});
 for (const file of files) {
  const image = imageContent(file?.imageRef);
  if (image) content.push(image);
 }
 return content;
}
