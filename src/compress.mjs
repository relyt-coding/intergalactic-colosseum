import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, prune, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(src);
await doc.transform(dedup(), weld(), prune(), draco({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 10 }));
await io.write(out, doc);
