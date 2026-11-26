// Intergalactic Colosseum — procedural geometry (shared by the web viewer and the GLB exporter)
export const MODEL_VERSION = 'v1.0.52';

export function buildColosseum(THREE, mergeGeometries, logos = {}, opts = {}) {
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;
  // ARENA_SCALE scales the arena floor; everything outside the arena is pushed out by D
  const AS = 3, AW = 1.5;              // arena radius scale, inlay line-width scale
  const D = 21.8 * (AS - 1);           // radial offset for stands / walls / towers (43.6)
  const A = r => r * AS;
  const mat = (name, o) => new THREE.MeshStandardMaterial({ name, side: THREE.DoubleSide, ...o });
  const glow = (name, hex, i = 3) => mat(name, { color: 0x000000, emissive: hex, emissiveIntensity: i, roughness: 0.92, metalness: 0 });

  const M = {
    stone:    mat('Stone',      { color: 0x1c2036, roughness: 0.7, metalness: 0.2 }),
    stoneDk:  mat('StoneDark',  { color: 0x0e1120, roughness: 0.7,  metalness: 0.3 }),
    marble:   mat('Marble',     { color: 0x2d3557, roughness: 0.55, metalness: 0.25 }),
    floor:    mat('ArenaFloor', { color: 0x0c1636, roughness: 0.68, metalness: 0.2 }),
    gold:     mat('Gold',       { color: 0xd6a64a, roughness: 0.42, metalness: 0.85 }),
    gBlue:    glow('GlowBlue',    0x3f86ff, 3.2),
    gCyan:    glow('GlowCyan',    0x2fe3ff, 2.6),
    gMagenta: glow('GlowMagenta', 0xff3ab0, 2.2),
    gViolet:  glow('GlowViolet',  0x8b4dff, 2.6),
    gGold:    glow('GlowGold',    0xffc65a, 2.4),
    pCyan:    glow('NebulaCyan',    0x1a8fd0, 0.9),
    pMagenta: glow('NebulaMagenta', 0xb02a8a, 0.9),
    pViolet:  glow('NebulaViolet',  0x5a2bd0, 1.0),
    pDeep:    glow('NebulaDeep',    0x14236e, 1.4),
    rock:     mat('Rock',        { color: 0x1d1828, roughness: 0.92, metalness: 0.08 }),
    capeBlue: mat('StatueCapeBlue', { color: 0x1c2a5e, roughness: 0.75, metalness: 0.05 }),
    cable:    mat('Cable',       { color: 0x0b0b10, roughness: 0.6, metalness: 0.2 }),
    velvet:   mat('Velvet',      { color: 0x5a0f22, roughness: 0.95, metalness: 0.0 }),
    boothGlass: glow('BoothGlass', 0x0d2a48, 0.7),
    camBody:  mat('CameraBody',  { color: 0x3a3f4c, roughness: 0.38, metalness: 0.55 }),
    craneM:   mat('CraneMetal',  { color: 0xc4c8d2, roughness: 0.42, metalness: 0.35 }),
    wood:     mat('Wood',        { color: 0x4a3524, roughness: 0.85, metalness: 0.0 }),
    scaff:    mat('ScaffoldMetal', { color: 0x8a8f9a, roughness: 0.5, metalness: 0.7 }),
    capeRed:  mat('StatueCape',  { color: 0x7a1830, roughness: 0.75, metalness: 0.05 }),
    cloth:    mat('BannerCloth', { color: 0x2b1150, roughness: 0.8,  metalness: 0.05 }),
    holo:     mat('Hologram',    { color: 0x000000, emissive: 0x52c8ff, emissiveIntensity: 1.5, transparent: true, opacity: 0.8, depthWrite: true }),
    holoBack: mat('HologramBack',{ color: 0x000000, emissive: 0x2a3cff, emissiveIntensity: 0.7, transparent: true, opacity: 0.35, depthWrite: true }),
    goldLit:  mat('GoldLit',     { color: 0xd6a64a, roughness: 0.4, metalness: 0.8, emissive: 0xc8902e, emissiveIntensity: 0.75 }),
    vsBlue:   glow('VSBlue',        0x2c6cf0, 0.75),
    goldDk:   mat('GoldDark',    { color: 0x7d5d26, roughness: 0.5, metalness: 0.8 }),
    sunRay:   glow('SunRay',        0xe0a040, 0.55),
    portal:   glow('GatePortal',    0x1a0d3a, 0.6),
    statue:   mat('StatueMarble', { color: 0xd8dcee, roughness: 0.55, metalness: 0.05 }),
    screen:   glow('Screen',        0x101a44, 0.9),
    flame:    glow('Flame',         0x5fe8ff, 2.2),
    dish:     mat('DishMetal',   { color: 0xd8deee, roughness: 0.35, metalness: 0.7 }),
    solar:    mat('SolarPanel',  { color: 0x1a3a8a, roughness: 0.25, metalness: 0.7, emissive: 0x0a1a55, emissiveIntensity: 0.5 }),
    beacon:   glow('Beacon',        0xff3048, 2.5),
    strobe:   glow('Strobe',        0xffffff, 3.0),
    xDeep:    glow('WindowDeep',    0x0c1640, 0.9),
    xViolet:  glow('WindowViolet',  0x3a1c80, 0.9),
  };
  const nebulaCycle = [M.pViolet, M.pCyan, M.pMagenta, M.pViolet, M.pDeep];
  const stripCycle = [M.pCyan, M.pViolet, M.pMagenta];

  // ---------- collection ----------
  const bins = {}; // group -> material -> geos
  const add = (geo, m, matrix, group = 'Structure') => {
    if (matrix) geo.applyMatrix4(matrix);
    if (!geo.index) { const n = geo.attributes.position.count; geo.setIndex([...Array(n).keys()]); }
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    ((bins[group] ||= new Map()).get(m) || bins[group].set(m, []).get(m)).push(geo);
  };

  // ---------- transforms (polar: x = r sin phi, z = r cos phi; local +z = radial outward, +x = tangent) ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const at = (r, y, phi, rotY = phi, tangent = 0, extra) => {
    const m = new THREE.Matrix4();
    const p = V(r * Math.sin(phi) + tangent * Math.cos(phi), y, r * Math.cos(phi) - tangent * Math.sin(phi));
    m.compose(p, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), rotY), V(1, 1, 1));
    if (extra) m.multiply(extra);
    return m;
  };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const RX = a => new THREE.Matrix4().makeRotationX(a);
  const RZ = a => new THREE.Matrix4().makeRotationZ(a);
  const flat = (y) => new THREE.Matrix4().makeTranslation(0, y, 0).multiply(RX(-PI / 2));

  // lathe between two profile points over an angular range (flat-shaded band)
  const band = (r1, y1, r2, y2, phiStart = 0, phiLen = TAU, segs) => {
    segs ||= Math.max(8, Math.round(phiLen / TAU * 320));
    return new THREE.LatheGeometry([new THREE.Vector2(r1, y1), new THREE.Vector2(r2, y2)], segs, phiStart, phiLen);
  };
  // closed box ring section: inner/outer radius, bottom/top
  const ringBlock = (ri, ro, yb, yt, ps, pl, m, group) => {
    add(band(ri, yb, ri, yt, ps, pl), m, null, group);
    add(band(ro, yb, ro, yt, ps, pl), m, null, group);
    add(band(ri, yt, ro, yt, ps, pl), m, null, group);
  };
  // a beam from point a to point b (rectangular cross section w x h)
  const beam = (a, b, w, h, m, group) => {
    const d = b.clone().sub(a), len = d.length();
    const g = new THREE.BoxGeometry(w, h, len);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), d.normalize());
    add(g, m, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1)), group);
  };
  const polar = (r, y, phi) => V(r * Math.sin(phi), y, r * Math.cos(phi));
  const column = (r, y0, h, phi, rad, m = M.marble, capM = M.gold, group, lo = false) => {
    const sg = lo ? 7 : 10;
    add(new THREE.BoxGeometry(rad * 2.8, 0.3, rad * 2.8), capM, at(r, y0 + 0.15, phi), group);                       // plinth
    add(new THREE.CylinderGeometry(rad * 1.18, rad * 1.3, 0.3, sg, 1, true), m, at(r, y0 + 0.45, phi), group);      // base moulding
    add(new THREE.CylinderGeometry(rad * 0.94, rad * 1.04, h - 1.5, sg, 1, true), m, at(r, y0 + 0.6 + (h - 1.5) / 2, phi), group);   // shaft
    if (!lo) add(new THREE.CylinderGeometry(rad * 1.1, rad * 1.1, 0.1, sg, 1, true), capM, at(r, y0 + h - 0.88, phi), group);       // neck ring
    add(new THREE.LatheGeometry([new THREE.Vector2(rad * 0.98, 0), new THREE.Vector2(rad * 1.2, 0.24), new THREE.Vector2(rad * 1.52, 0.46)], sg), m, at(r, y0 + h - 0.9, phi), group);   // flared capital
    add(new THREE.BoxGeometry(rad * 3.1, 0.34, rad * 3.1), capM, at(r, y0 + h - 0.27, phi), group);                 // abacus
  };
  // stepped cornice profile swept around the ring: steps = [[dr, dy], ...] relative to (r0, y0); dir = +1 outward, -1 inward
  const cornice = (r0, y0, steps, m, dir = 1, segs = 400) => {
    let pr = r0, py = y0;
    for (const [dr, dy] of steps) {
      const nr = r0 + dir * dr, ny = y0 + dy;
      add(new THREE.LatheGeometry([new THREE.Vector2(pr, py), new THREE.Vector2(nr, ny)], segs), m);
      pr = nr; py = ny;
    }
  };
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;   // repeatable 'hand-placed' variation
  const arch = (R, tube, m, matrix, group) => add(new THREE.TorusGeometry(R, tube, 4, 12, PI), m, matrix, group);

  // ---------- logos (traced vector shapes, unit size, y up) ----------
  const toShapes = (arr, s, ox, oy) => arr.map(q => {
    const sh = new THREE.Shape(q.o.map(p => new THREE.Vector2(p[0] * s + ox, p[1] * s + oy)));
    sh.holes = q.h.map(h => new THREE.Path(h.map(p => new THREE.Vector2(p[0] * s + ox, p[1] * s + oy))));
    return sh;
  });
  const logo = (arr, s, depth, m, matrix, group, ox = 0, oy = 0, z = 0) => {
    if (!arr) return;
    const g = new THREE.ExtrudeGeometry(toShapes(arr, s, ox, oy), { depth, bevelEnabled: false, curveSegments: 1 });
    if (z) g.translate(0, 0, z);
    add(g, m, matrix.clone(), group);
  };
  // Combined crest: the VS shield set into the Maximus scales. S = width; centred on origin, faces +z.
  const CREST_H = 0.62;
  const crest = (S, matrix, group, o = {}) => {
    // v1.0.49: every layer gets its own depth band (fronts and backs at least 15% of the crest depth apart),
    // so no two surfaces ever share a plane (near-coplanar layers flickered, most visibly on the hologram's back).
    const d = o.depth ?? Math.max(0.12, S * 0.02), oy = (0.39 - 0.31) * S;
    logo(logos.scales?.shapes, S, d * 0.7, o.gold ?? M.gold, matrix, group, 0, oy, d * 0.15);           // z 0.15d..0.85d, behind the shield face
    logo(logos.vs?.sil, S * 0.62, d * 0.4, o.back ?? M.vsBlue, matrix, group, 0, oy - 0.08 * S, d * 0.3); // z 0.3d..0.7d, recessed fill
    logo(logos.vs?.shapes, S * 0.62, d, o.gold ?? M.gold, matrix, group, 0, oy - 0.08 * S);             // z 0..d
    if (o.backplate) logo(logos.vs?.sil, S * 0.62 * 1.02, d * 0.5, o.backplate, matrix, group, 0, oy - 0.08 * S, -d * 0.65);
  };
  // Maximus helmet-shield-scales emblem. S = width; centred, faces +z.
  const maxEmblem = (S, matrix, group, o = {}) => {
    const d = o.depth ?? Math.max(0.12, S * 0.02);
    logo(logos.maxIcon?.sil, S, d * 0.5, o.back ?? M.pDeep, matrix, group, 0, 0, d * 0.2);   // z 0.2d..0.7d
    logo(logos.maxIcon?.shapes, S, d, o.gold ?? M.gold, matrix, group);                     // z 0..d
    if (o.backplate) logo(logos.maxIcon?.sil, S * 1.02, d * 0.5, o.backplate, matrix, group, 0, 0, -d * 0.65);
  };

  // ============ GROUND ============
  add(new THREE.CylinderGeometry(60 + D + 2, 60 + D + 2, 0.3, 256), M.stoneDk, T(0, -0.15, 0));
  // moat glow + grating rings
  add(new THREE.RingGeometry(23.3 + D, 23.6 + D, 256), M.gCyan, flat(0.02));
  add(new THREE.RingGeometry(24.6 + D, 24.75 + D, 256), M.gold, flat(0.02));

  // ============ ARENA PLATFORM ============
  add(new THREE.CylinderGeometry(A(20.6) + 1.2, A(21.8), 1.5, 256), M.stone, T(0, 0.75, 0));
  add(new THREE.CylinderGeometry(A(20.6) + 0.9, A(20.6) + 0.9, 0.12, 256), M.floor, T(0, 1.56, 0));
  add(new THREE.TorusGeometry(A(20.6) + 1.15, 0.3, 10, 360), M.gold, T(0, 1.55, 0).multiply(RX(PI / 2)));
  add(new THREE.TorusGeometry(A(21.8) - 0.2, 0.14, 8, 360), M.gBlue, T(0, 0.15, 0).multiply(RX(PI / 2)));
  // skirt light strips
  for (let i = 0; i < 144; i++) {
    const phi = i / 144 * TAU;
    add(new THREE.BoxGeometry(0.22, 0.9, 0.08), i % 2 ? M.gold : M.gViolet, at(A(21.8) - 0.55, 0.75, phi, phi, 0, RX(-0.04)));
  }
  // floor inlay
  const fy = 1.625;
  const rings = [[19.0, 19.4, M.gold], [17.9, 18.0, M.gCyan], [15.0, 15.3, M.gold], [12.0, 12.09, M.gBlue], [9.0, 9.25, M.gold]];
  for (const [a, b, m] of rings) { const w = (b - a) * AW, mid = A((a + b) / 2); add(new THREE.RingGeometry(mid - w / 2, mid + w / 2, 360), m, flat(fy + 0.01)); }
  // centre medallion + crest
  add(new THREE.CircleGeometry(A(8.6), 160), M.pDeep, flat(fy + 0.12));
  add(new THREE.RingGeometry(A(8.6) - 0.35, A(8.6), 240), M.gCyan, flat(fy + 0.15));
  crest(46, T(0, fy + 0.16, 0).multiply(RX(-PI / 2)), 'Structure', { depth: 0.14 });
  // flat triangle on the floor
  const tri = (pts, m, group) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => [p.x, p.y, p.z]), 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
    g.setIndex([0, 1, 2]);
    add(g, m, null, group);
  };
  // sunburst: tapered golden rays (slowly rotating group)
  for (let i = 0; i < 72; i++) {
    const phi = (i + 0.5) / 72 * TAU, long = i % 2 === 0;
    const r0 = A(8.9), r1 = long ? A(15.6) : A(13.2), hw = (long ? 0.55 : 0.4) * DEG * 3;
    tri([polar(r0, fy + 0.03, phi - hw), polar(r1, fy + 0.03, phi), polar(r0, fy + 0.03, phi + hw)], M.sunRay, 'RunesInner');
  }
  // compass rose: 8 two-tone points (long ones aim at the gates)
  for (let k = 0; k < 8; k++) {
    const phi = k * PI / 4, card = k % 2 === 0;
    const rt = card ? A(16.2) : A(12.6), rb = A(8.6) + 0.6, hw = (card ? 10 : 8) * DEG, y = fy + 0.06;
    const tip = polar(rt, y, phi), mid = polar(rb, y, phi);
    tri([polar(rb, y, phi - hw), tip, mid], card ? M.gold : M.goldDk);
    tri([mid, tip, polar(rb, y, phi + hw)], card ? M.goldDk : M.gold);
    beam(polar(rb, y + 0.02, phi - hw), tip, 0.18, 0.03, M.gGold);
    beam(polar(rb, y + 0.02, phi + hw), tip, 0.18, 0.03, M.gGold);
    beam(mid, tip, 0.12, 0.03, M.gold);
  }
  for (let i = 0; i < 160; i++) { // rune band
    const phi = i / 160 * TAU;
    if (i % 5 === 0) add(new THREE.CircleGeometry(0.28 * AW, 16), M.gCyan, at(A(16.6), fy + 0.02, phi, phi, 0, RX(-PI / 2)), 'RunesOuter');
    else add(new THREE.BoxGeometry(0.12 * AW, 0.02, (0.5 + (i * 7 % 3) * 0.25) * AW), M.gGold, at(A(16.6), fy + 0.02, phi), 'RunesOuter');
  }
  // stairs up to the platform at each gate
  for (let g = 0; g < 4; g++) {
    const phi = g * PI / 2;
    for (let s = 0; s < 3; s++) add(new THREE.BoxGeometry(6, (3 - s) * 0.5, 0.75), M.marble, at(A(21.8) + 0.1 + s * 0.75, (3 - s) * 0.25, phi));
  }

  // ============ MOAT OBELISKS ============
  for (let i = 0; i < 16; i++) {
    const phi = i / 16 * TAU + PI / 16;
    add(new THREE.CylinderGeometry(0.55, 0.85, 5, 4), M.stone, at(24 + D, 2.5, phi, phi + PI / 4));
    add(new THREE.ConeGeometry(0.62, 1.1, 4), M.gold, at(24 + D, 5.55, phi, phi + PI / 4));
    add(new THREE.OctahedronGeometry(0.55), M.gViolet, at(24 + D, 7.1, phi), 'Crystals');
    add(new THREE.TorusGeometry(0.95, 0.05, 6, 32), M.gold, at(24 + D, 7.1, phi, phi, 0, RX(PI / 2.4)), 'Crystals');
  }

  // ============ SEATING (4 sectors, gates between) ============
  const GAP = 2 * Math.atan(3.4 / (26 + D)), SECT = PI / 2 - GAP;
  const STEPS = 14, R0 = 27.5 + D, Y0 = 5.5, RISE = 1.3, RUN = 2.0;
  const RTOP = R0 + STEPS * RUN, YTOP = Y0 + STEPS * RISE; // 55.5, 23.7
  for (let s = 0; s < 4; s++) {
    const ps = s * PI / 2 + GAP / 2, pe = ps + SECT;
    // podium wall + parapet
    const PW = 26 + D;
    add(band(PW, 0, PW, Y0, ps, SECT), M.stone);
    add(band(PW, Y0, R0, Y0, ps, SECT), M.marble);
    add(band(PW - 0.1, Y0, PW - 0.1, Y0 + 0.9, ps, SECT), M.stone);
    add(band(PW - 0.15, Y0 + 0.9, PW + 0.3, Y0 + 0.9, ps, SECT), M.gold);
    add(band(PW - 0.12, 3.0, PW - 0.12, 3.25, ps, SECT), M.gBlue);
    // podium wall panels
    const nP = 34;
    for (let k = 0; k < nP; k++) {
      const phi = ps + (k + 0.5) / nP * SECT;
      add(new THREE.PlaneGeometry(4.2, 1.9), nebulaCycle[(k + s) % 5], at(PW - 0.08, 1.5, phi, phi + PI));
    }
    // steps
    let r = R0, y = Y0;
    for (let i = 0; i < STEPS; i++) {
      add(band(r, y, r, y + RISE, ps, SECT), M.stone);
      add(band(r - 0.02, y + 0.42, r - 0.02, y + 0.78, ps, SECT), stripCycle[i % 3]);
      add(band(r, y + RISE, r + RUN, y + RISE, ps, SECT), i % 2 ? M.marble : M.stone);
      add(band(r - 0.09, y + RISE - 0.14, r - 0.09, y + RISE + 0.04, ps, SECT), M.marble);      // bullnose lip catches the light
      add(band(r - 0.09, y + RISE + 0.04, r + 0.05, y + RISE + 0.06, ps, SECT), M.marble);
      add(band(r - 0.09, y + RISE - 0.14, r, y + RISE - 0.2, ps, SECT), M.stoneDk);
      r += RUN; y += RISE;
    }
    // sector end caps (stepped profile)
    for (const phi of [ps, pe]) {
      const sh = new THREE.Shape();
      sh.moveTo(PW, 0); sh.lineTo(PW, Y0); sh.lineTo(R0, Y0);
      let rr = R0, yy = Y0;
      for (let i = 0; i < STEPS; i++) { yy += RISE; sh.lineTo(rr, yy); rr += RUN; sh.lineTo(rr, yy); }
      sh.lineTo(rr, 0); sh.closePath();
      add(new THREE.ShapeGeometry(sh), M.stone, new THREE.Matrix4().makeRotationY(phi - PI / 2));
      // gold edge rail along the slope
      beam(polar(R0, Y0 + 0.2, phi), polar(RTOP, YTOP + 0.2, phi), 0.35, 0.35, M.gold);
    }
    // safety railings along both edges that drop into the gate passages
    for (const [edge, s] of [[ps, 1], [pe, -1]]) {
      const pt = (r, y) => polar(r, y, edge + s * 0.45 / r);
      const RH = 1.15;
      // posts on every tread + one on the podium
      const posts = [[R0 - 0.7, Y0]];
      for (let i = 0; i < STEPS; i++) posts.push([R0 + (i + 0.5) * RUN, Y0 + (i + 1) * RISE]);
      for (const [r, y] of posts) {
        const a = pt(r, y), b = pt(r, y + RH);
        beam(a, b, 0.14, 0.14, M.gold);
        add(new THREE.SphereGeometry(0.13, 8, 5), M.gold, T(b.x, b.y, b.z));
      }
      // podium section (flat) + sloped handrail, mid rail and a glow strip
      beam(pt(R0 - 0.7, Y0 + RH), pt(R0 + 0.5 * RUN, Y0 + RISE + RH), 0.16, 0.16, M.gold);
      beam(pt(R0 + 0.5 * RUN, Y0 + RISE + RH), pt(RTOP - 0.5 * RUN, YTOP + RH), 0.18, 0.18, M.gold);
      beam(pt(R0 + 0.5 * RUN, Y0 + RISE + RH * 0.5), pt(RTOP - 0.5 * RUN, YTOP + RH * 0.5), 0.09, 0.09, M.gold);
      beam(pt(R0 + 0.5 * RUN, Y0 + RISE + RH - 0.16), pt(RTOP - 0.5 * RUN, YTOP + RH - 0.16), 0.05, 0.05, M.gCyan);
    }
    // glowing aisles
    for (const f of [1 / 3, 2 / 3]) {
      const phi = ps + f * SECT;
      beam(polar(R0 + 0.3, Y0 + 0.15, phi), polar(RTOP - 0.3, YTOP + 0.15, phi), 0.3, 0.12, M.gGold);
    }
  }

  // ============ OUTER WALL ============
  const WI = 56.5 + D, WO = 58.5 + D, WTOP = 36, SEG = 400;
  // inner face, with openings for the four gate doorways
  const DOOR_TOP = 17, DOOR_HW = 6.2, doorGap = Math.asin(DOOR_HW / WI);
  add(band(WI, DOOR_TOP, WI, WTOP, 0, TAU, SEG), M.stone);
  for (let g = 0; g < 4; g++) add(band(WI, 0, WI, DOOR_TOP, g * PI / 2 + doorGap, PI / 2 - 2 * doorGap), M.stone);
  add(band(WO, 0, WO, WTOP, 0, TAU, SEG), M.stone);           // outer face
  add(band(RTOP - 0.1, YTOP, WI, YTOP, 0, TAU, SEG), M.marble);      // gallery floor
  add(band(RTOP - 0.1, YTOP - 1.2, RTOP - 0.1, YTOP, 0, TAU, SEG), M.stone);
  add(band(RTOP - 0.12, YTOP - 0.7, RTOP - 0.12, YTOP - 0.45, 0, TAU, SEG), M.gBlue);
  // gallery
  const NB = 128, GC = 55.9 + D, GH = 8.4;
  for (let i = 0; i < NB; i++) {
    const phi = i / NB * TAU;
    column(GC, YTOP, GH, phi, 0.38);
    const mid = phi + PI / NB;
    const R = Math.PI * GC / NB - 0.42;
    arch(R, 0.18, M.gold, at(GC, YTOP + GH - 2.5, mid));
    const repair = [21, 22, 77, 110].includes(i);
    add(new THREE.PlaneGeometry(2 * R + 0.2, GH - 0.6), repair ? M.stoneDk : nebulaCycle[(i * 3) % 5], at(WI - 0.04, YTOP + (GH - 0.6) / 2 + 0.2, mid, mid + PI));
    if (repair) {   // under repair: scaffolding, planks and a tarp
      const sr = WI - 1.3, half = R + 0.1;
      for (const tx of [-half, 0, half]) for (const dz of [0, 0.9])
        add(new THREE.CylinderGeometry(0.05, 0.05, GH - 0.3, 6), M.scaff, at(sr - dz, YTOP + (GH - 0.3) / 2, mid, mid, tx));
      for (const y of [2.2, 4.6, 7.0]) {
        add(new THREE.BoxGeometry(2 * half + 0.3, 0.08, 1.05), M.wood, at(sr - 0.45, YTOP + y, mid, mid));
        add(new THREE.CylinderGeometry(0.035, 0.035, 2 * half, 5), M.scaff, at(sr, YTOP + y + 0.9, mid, mid, 0, RZ(PI / 2)));
      }
      for (const s of [-1, 1]) {   // cross braces
        const a = polar(sr, YTOP + 0.3, mid), b = polar(sr, YTOP + GH - 0.6, mid);
        const tg = V(Math.cos(mid), 0, -Math.sin(mid));
        beam(a.clone().addScaledVector(tg, -s * half), b.clone().addScaledVector(tg, s * half), 0.06, 0.06, M.scaff);
      }
      if (i === 22 || i === 110) add(new THREE.PlaneGeometry(2 * half - 0.4, GH - 2.2), M.cloth, at(sr + 0.35, YTOP + (GH - 2.2) / 2 + 1.1, mid, mid + PI, 0.2, RX(-0.04)));
      for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.35, 0.3, 0.35), M.stoneDk, at(sr - 0.45 + (k - 1) * 0.12, YTOP + 0.15 + (k === 2 ? 0.3 : 0), mid, mid + k, (k - 1) * 0.5));   // stacked blocks
    }
  }
  ringBlock(55.3 + D, WI, YTOP + GH, YTOP + GH + 0.9, 0, TAU, M.marble);
  cornice(55.3 + D, YTOP + GH - 0.5, [[0, 0], [0.12, 0.08], [0.12, 0.2], [0.28, 0.3], [0.28, 0.42], [0, 0.5]], M.marble, -1);
  cornice(WI - 0.1, WTOP - 0.7, [[0, 0], [0.15, 0.1], [0.15, 0.25], [0.35, 0.4], [0.35, 0.55], [0.5, 0.65], [0.5, 0.7]], M.marble, -1);
  add(band(55.25 + D, YTOP + GH + 0.9, 55.25 + D, YTOP + GH + 1.25, 0, TAU, SEG), M.gold);
  add(band(55.25 + D, YTOP + GH + 1.25, WO + 0.3, YTOP + GH + 1.25, 0, TAU, SEG), M.gold);
  // attic & crenellations
  add(band(WI - 0.1, YTOP + GH + 1.25, WI - 0.1, WTOP, 0, TAU, SEG), M.stone);
  add(band(WI - 0.1, WTOP, WO, WTOP, 0, TAU, SEG), M.marble);
  cornice(WO, WTOP - 1.1, [[0, 0], [0.4, 0.18], [0.4, 0.4], [0.9, 0.62], [0.9, 0.8], [1.5, 1.0], [1.5, 1.1], [0, 1.1]], M.marble, 1);
  // statues and braziers are placed symmetrically around every gate
  const statueAt = j => (j + 0.5) / 16 * TAU;                 // 11.25° + j·22.5°
  const brazierAt = k => (k + 0.5) / 32 * TAU;                // 5.625° + k·11.25° (a pair flanks each gate and each statue)
  const wallFeatures = [...Array(16).keys()].map(statueAt).concat([...Array(32).keys()].map(brazierAt));
  const angDiff = (a, b) => Math.abs(((a - b + PI) % TAU + TAU) % TAU - PI);
  for (let k = 0; k < 32; k++) {
    const phi = brazierAt(k), y0 = WTOP;
    add(new THREE.BoxGeometry(1.3, 0.5, 1.9), M.stone, at(57.5 + D, y0 + 0.25, phi));
    add(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 10), M.marble, at(57.5 + D, y0 + 1.3, phi));
    add(new THREE.CylinderGeometry(0.62, 0.26, 0.45, 14), M.gold, at(57.5 + D, y0 + 2.3, phi));
    add(new THREE.TorusGeometry(0.62, 0.05, 6, 20), M.gold, at(57.5 + D, y0 + 2.52, phi, phi, 0, RX(PI / 2)));
    add(new THREE.ConeGeometry(0.42, 1.3, 7), M.flame, at(57.5 + D, y0 + 3.15, phi), 'Flames');
    add(new THREE.ConeGeometry(0.24, 0.8, 6), M.gViolet, at(57.5 + D, y0 + 2.95, phi, phi + 0.5), 'Flames');
  }
  for (let i = 0; i < 256; i++) {
    const phi = (i + 0.5) / 256 * TAU;
    if (wallFeatures.some(a => angDiff(a, phi) < TAU / 256 * 1.05)) continue;
    add(new THREE.BoxGeometry(1.0, 1.3, 1.8), M.stone, at(57.5 + D, WTOP + 0.65, phi));
    if (i % 2 === 0) add(new THREE.BoxGeometry(1.04, 0.12, 1.84), M.gold, at(57.5 + D, WTOP + 1.32, phi));
  }
  // ============ ATTIC LIGHTS (upper inner wall above the gallery) ============
  {
    const ar = WI - 0.1, ay0 = YTOP + GH + 1.25;
    add(band(ar - 0.03, WTOP - 0.3, ar - 0.03, WTOP - 0.16, 0, TAU, SEG), M.gCyan, null, 'AtticLights');
    add(band(ar - 0.03, ay0 + 0.18, ar - 0.03, ay0 + 0.26, 0, TAU, SEG), M.gViolet, null, 'AtticLights');
    const lantern = [M.gCyan, M.gViolet, M.gGold], lanternRng = seeded(4242);
    for (let i = 0; i < NB; i++) {
      const mid = (i + 0.5) / NB * TAU, edge = i / NB * TAU, y = ay0 + 1.25;
      add(new THREE.BoxGeometry(0.16, 0.5, 0.55), M.gold, at(ar - 0.27, y - 0.45, mid, mid));
      add(new THREE.ConeGeometry(0.26, 0.35, 6), M.gold, at(ar - 0.55, y - 0.3, mid, mid, 0, RX(PI)));
      const lr = lanternRng(), ls = 0.85 + lanternRng() * 0.3;
      add(new THREE.OctahedronGeometry(0.3), lr < 0.09 ? M.stoneDk : lantern[i % 3], at(ar - 0.55, y + 0.12, mid, mid, 0, new THREE.Matrix4().makeScale(0.75 * ls, 1.35 * ls, 0.75 * ls)), 'AtticLights');
      // thin gold pilaster with a light slit between bays
      add(new THREE.BoxGeometry(0.3, 2.3, 0.12), M.gold, at(ar - 0.05, ay0 + 1.25, edge, edge + PI));
      add(new THREE.BoxGeometry(0.08, 1.7, 0.04), M.gCyan, at(ar - 0.12, ay0 + 1.25, edge, edge + PI), 'AtticLights');
    }
  }
  // exterior arcade (3 stories)
  const stories = [[0, 11], [12, 23], [24, 34]];
  for (const [y0, y1] of stories) {
    ringBlock(WO, WO + 1.3, y1, y1 + 1, 0, TAU, M.marble);
    cornice(WO, y1 - 0.55, [[0, 0], [0.3, 0.12], [0.3, 0.25], [0.7, 0.4], [0.7, 0.5], [1.3, 0.55]], M.marble, 1);
    cornice(WO + 1.3, y1 + 1, [[0, 0], [0.15, 0.08], [-0.05, 0.15]], M.marble, 1);
    add(band(WO + 1.32, y1 + 0.35, WO + 1.32, y1 + 0.6, 0, TAU, SEG), M.gold);
  }
  for (let i = 0; i < NB; i++) {
    const phi = i / NB * TAU, mid = phi + PI / NB;
    const R = Math.PI * (59.2 + D) / NB - 0.55;
    stories.forEach(([y0, y1], si) => {
      column(59.2 + D, y0, y1 - y0, phi, 0.5, M.marble, M.gold, undefined, true);
      arch(R, 0.22, M.gold, at(59.2 + D, y1 - R - 0.5, mid));
      const isGate = si === 0 && i % (NB / 4) === 0;
      add(new THREE.PlaneGeometry(2 * R, y1 - y0 - 1.2), isGate ? M.pCyan : (i * 7 + si * 3) % 5 === 0 ? M.xViolet : M.xDeep, at(WO + 0.04, (y0 + y1) / 2 - 0.4, mid));
    });
  }

  // ============ GALLERY RAIL (full perimeter, openings where the aisles arrive) ============
  {
    const rr = RTOP + 0.2, RH = 1.15, gapA = 0.95 / rr, postStep = 3.2 / rr;
    const aisles = [];
    for (let s = 0; s < 4; s++) for (const f of [1 / 3, 2 / 3]) aisles.push(s * PI / 2 + GAP / 2 + f * SECT);
    aisles.sort((a, b) => a - b);
    for (let k = 0; k < aisles.length; k++) {
      const a0 = aisles[k] + gapA, a1 = (k + 1 < aisles.length ? aisles[k + 1] : aisles[0] + TAU) - gapA, len = a1 - a0;
      const segs = Math.max(8, Math.round(len / TAU * 400));
      add(band(rr, YTOP + RH, rr + 0.18, YTOP + RH, a0, len, segs), M.gold);
      add(band(rr, YTOP + RH - 0.18, rr, YTOP + RH, a0, len, segs), M.gold);
      add(band(rr - 0.01, YTOP + RH * 0.5, rr - 0.01, YTOP + RH * 0.5 + 0.09, a0, len, segs), M.gold);
      add(band(rr - 0.02, YTOP + RH - 0.3, rr - 0.02, YTOP + RH - 0.25, a0, len, segs), M.gCyan);
      const n = Math.max(1, Math.round(len / postStep));
      for (let j = 0; j <= n; j++) {
        const a = a0 + j / n * len, top = polar(rr + 0.09, YTOP + RH, a);
        beam(polar(rr + 0.09, YTOP, a), top, 0.12, 0.12, M.gold);
        if (j === 0 || j === n) add(new THREE.SphereGeometry(0.14, 10, 6), M.gold, T(top.x, top.y + 0.1, top.z));
      }
    }
  }

  // ============ GATES ============
  for (let g = 0; g < 4; g++) {
    const phi = g * PI / 2, PG = 27 + D;
    // corridor light lines
    for (const t of [-2.8, 2.8]) beam(V(0, 0, 0).add(polar(A(21.8) + 2.5, 0.03, phi)).add(V(Math.cos(phi) * t, 0, -Math.sin(phi) * t)),
                                      V(0, 0, 0).add(polar(WI - 1.1, 0.03, phi)).add(V(Math.cos(phi) * t, 0, -Math.sin(phi) * t)), 0.22, 0.04, M.gBlue);
    // pylons
    for (const t of [-1, 1]) {
      add(new THREE.BoxGeometry(2.4, 14, 3.4), M.stone, at(PG, 7, phi, phi, t * 4.6));
      add(new THREE.BoxGeometry(0.25, 11, 0.06), M.gCyan, at(PG - 1.72, 7, phi, phi, t * 4.6));
      add(new THREE.BoxGeometry(2.7, 0.4, 3.7), M.gold, at(PG, 14.2, phi, phi, t * 4.6));
      add(new THREE.ConeGeometry(1.7, 2.6, 4), M.gold, at(PG, 15.7, phi, phi + PI / 4, t * 4.6));
    }
    arch(4.6, 0.38, M.gold, at(PG - 1.3, 10.8, phi));
    arch(4.1, 0.12, M.gCyan, at(PG - 1.4, 10.8, phi));
    // sigil above gate
    // emblem above the gate (faces the arena): crest on N/S gates, Maximus emblem on E/W
    if (g % 2 === 0) crest(14, at(PG - 1.4, 17.4 + CREST_H * 14 / 2, phi, phi + PI), 'Structure', { depth: 0.45, backplate: M.stone });
    else maxEmblem(12.5, at(PG - 1.4, 17.4 + 0.73 * 12.5 / 2, phi, phi + PI), 'Structure', { depth: 0.45, backplate: M.stone });
    // MAXIMUS LAW wordmark on the outside wall above each gate
    {
      const ry = 29, rr = 59.2 + D + 1.7;
      add(new THREE.BoxGeometry(30, 8.6, 0.5), M.stoneDk, at(rr - 0.35, ry, phi));
      add(new THREE.PlaneGeometry(29.2, 7.8), M.pDeep, at(rr - 0.08, ry, phi));
      for (const dy of [-4.3, 4.3]) add(new THREE.BoxGeometry(30.4, 0.35, 0.7), M.goldLit, at(rr - 0.3, ry + dy, phi));
      for (const dx of [-15.1, 15.1]) add(new THREE.BoxGeometry(0.35, 8.95, 0.7), M.goldLit, at(rr - 0.3, ry, phi, phi, dx));
      logo(logos.wordmark?.shapes, 26, 0.45, M.goldLit, at(rr - 0.1, ry, phi), 'Structure');
    }
    // bridge lintel over gate in outer wall + inner door
    add(band(RTOP - 0.1, YTOP - 6, RTOP - 0.1, YTOP - 1.2, phi - GAP / 2, GAP), M.stone);
    // ---- grand doorway: thick carved frame, arched opening, passage portal ----
    {
      const OW = 3.5, RH = 10.5, FD = 2.6, F0 = WI - 0.8; // opening half-width, arch spring height, frame depth, frame front radius
      // arched top block (opening cut out of its underside)
      const top = new THREE.Shape();
      top.moveTo(-DOOR_HW, RH); top.lineTo(-OW, RH); top.absarc(0, RH, OW, PI, 0, true);
      top.lineTo(DOOR_HW, RH); top.lineTo(DOOR_HW, DOOR_TOP); top.lineTo(-DOOR_HW, DOOR_TOP); top.closePath();
      add(new THREE.ExtrudeGeometry(top, { depth: FD, bevelEnabled: false, curveSegments: 24 }), M.stone, at(F0, 0, phi));
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(DOOR_HW - OW, RH, FD), M.stone, at(F0 + FD / 2, RH / 2, phi, phi, s * (OW + DOOR_HW) / 2));
      // the portal (viewer swaps this for an animated endless-passage shader)
      const op = new THREE.Shape();
      op.moveTo(-OW, 0); op.lineTo(-OW, RH); op.absarc(0, RH, OW, PI, 0, true); op.lineTo(OW, 0); op.closePath();
      add(new THREE.ShapeGeometry(op, 24), M.portal, at(F0 + FD - 0.06, 0, phi));
      // gold mouldings
      arch(OW + 0.12, 0.22, M.gold, at(F0 - 0.05, RH, phi));
      arch(OW + 1.0, 0.14, M.gold, at(F0 - 0.05, RH, phi));
      for (const s of [-1, 1]) {
        add(new THREE.BoxGeometry(0.42, RH, 0.42), M.gold, at(F0 - 0.05, RH / 2, phi, phi, s * (OW + 0.12)));
        add(new THREE.BoxGeometry(0.26, RH, 0.26), M.gold, at(F0 - 0.05, RH / 2, phi, phi, s * (OW + 1.0)));
        // cyan trim lining the reveal
        add(new THREE.BoxGeometry(0.08, RH, 0.08), M.gCyan, at(F0 + 0.5, RH / 2, phi, phi, s * (OW - 0.05)));
        add(new THREE.BoxGeometry(0.08, RH, 0.08), M.gViolet, at(F0 + 1.6, RH / 2, phi, phi, s * (OW - 0.05)));
        // pilasters with crystal sconces
        add(new THREE.BoxGeometry(1.1, 15, 0.9), M.marble, at(F0 - 0.45, 7.5, phi, phi, s * 5.5));
        add(new THREE.BoxGeometry(1.4, 0.45, 1.2), M.gold, at(F0 - 0.45, 0.22, phi, phi, s * 5.5));
        add(new THREE.BoxGeometry(1.4, 0.45, 1.2), M.gold, at(F0 - 0.45, 14.8, phi, phi, s * 5.5));
        add(new THREE.ConeGeometry(0.45, 0.9, 6), M.gold, at(F0 - 1.25, 8.6, phi, phi, s * 5.5, RX(PI)));
        add(new THREE.OctahedronGeometry(0.42), M.gCyan, at(F0 - 1.25, 9.4, phi, phi, s * 5.5, new THREE.Matrix4().makeScale(0.8, 1.4, 0.8)));
      }
      arch(OW - 0.05, 0.05, M.gCyan, at(F0 + 0.5, RH, phi));
      arch(OW - 0.05, 0.05, M.gViolet, at(F0 + 1.6, RH, phi));
      // keystone + entablature
      add(new THREE.BoxGeometry(1.3, 1.9, 0.7), M.gold, at(F0 - 0.2, RH + OW + 0.75, phi));
      add(new THREE.OctahedronGeometry(0.34), M.gCyan, at(F0 - 0.6, RH + OW + 0.75, phi, phi, 0, new THREE.Matrix4().makeScale(1, 1.3, 0.5)));
      add(new THREE.BoxGeometry(13.8, 1.3, 1.5), M.stone, at(F0 - 0.5, 15.65, phi));
      for (const y of [15.0, 16.3]) add(new THREE.BoxGeometry(14.0, 0.22, 1.6), M.gold, at(F0 - 0.5, y, phi));
      // threshold
      add(new THREE.BoxGeometry(2 * OW, 0.08, 0.5), M.gold, at(F0 + 0.1, 0.04, phi));
    }
  }

  // ============ TOWERS ============
  for (let s = 0; s < 4; s++) {
    const phi = s * PI / 2 + PI / 4, R = 61.5 + D;
    const tm = (y, ex) => at(R, y, phi, phi, 0, ex);
    add(new THREE.CylinderGeometry(5, 5.6, 44, 32), M.stone, tm(22));
    for (const y of [12, 24, 36]) add(new THREE.TorusGeometry(5.15, 0.32, 8, 48), M.gold, tm(y, RX(PI / 2)));
    for (let k = 0; k < 12; k++) { // window slits
      const a = k / 12 * TAU;
      for (const y of [6, 18, 30]) add(new THREE.BoxGeometry(0.7, 3.6, 0.1), (k + s) % 3 ? M.pViolet : M.gCyan, tm(y, new THREE.Matrix4().makeRotationY(a).multiply(T(0, 0, 5.18))));
    }
    // balcony
    add(new THREE.CylinderGeometry(7.2, 6.2, 1.1, 48), M.marble, tm(44.5));
    add(new THREE.TorusGeometry(7.1, 0.18, 8, 64), M.gold, tm(46.3, RX(PI / 2)));
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), M.gold, tm(45.7, new THREE.Matrix4().makeRotationY(a).multiply(T(0, 0, 7.1)))); }
    add(new THREE.TorusGeometry(6.6, 0.1, 6, 64), M.gBlue, tm(44.0, RX(PI / 2)));
    // upper drum
    add(new THREE.CylinderGeometry(4, 4, 8, 32), M.stone, tm(49));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; add(new THREE.PlaneGeometry(1.6, 5.2), nebulaCycle[k % 5], tm(49, new THREE.Matrix4().makeRotationY(a).multiply(T(0, 0, 4.03)))); }
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; add(new THREE.BoxGeometry(0.5, 8, 0.5), M.gold, tm(49, new THREE.Matrix4().makeRotationY(a).multiply(T(0, 0, 4.0)))); }
    add(new THREE.SphereGeometry(4.3, 32, 16, 0, TAU, 0, PI / 2), M.gold, tm(53));
    add(new THREE.ConeGeometry(0.55, 7, 12), M.gold, tm(60.5));
    add(new THREE.SphereGeometry(0.75, 20, 12), M.gCyan, tm(64.5), 'Crystals');
  }

  // ============ HALO ============
  const HY = 72;
  add(new THREE.TorusGeometry(46 + D, 0.7, 12, 400), M.gold, T(0, HY, 0).multiply(RX(PI / 2)), 'Halo');
  add(new THREE.TorusGeometry(44.2 + D, 0.25, 8, 400), M.gCyan, T(0, HY, 0).multiply(RX(PI / 2)), 'Halo');
  add(new THREE.TorusGeometry(47.8 + D, 0.15, 8, 400), M.gViolet, T(0, HY, 0).multiply(RX(PI / 2)), 'Halo');
  for (let i = 0; i < 20; i++) {
    const phi = i / 20 * TAU;
    add(new THREE.OctahedronGeometry(1.3), i % 2 ? M.gViolet : M.gCyan, at(46 + D, HY, phi, phi, 0, new THREE.Matrix4().makeScale(0.7, 1.6, 0.7)), 'Halo');
    add(new THREE.BoxGeometry(0.35, 0.35, 3.2), M.gold, at(46 + D, HY, phi), 'Halo');
  }


  // ============ BANNERS (upper gallery) ============
  {
    const w = 3.4, topY = YTOP + GH + 0.9, bRng = seeded(777);
    for (let i = 0; i < NB; i++) {
      if (i % 8 !== 4) continue;
      const h = 8.6 + bRng() * 2.6, sway = (bRng() - 0.5) * 0.06, lean = bRng() * 0.05;
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, -h); sh.lineTo(0, -h + 1.8); sh.lineTo(-w / 2, -h); sh.closePath();
      const mid = (i + 0.5) / NB * TAU;
      const bm = (lx, ly, lz, ex) => at(GC - 1.0, topY, mid, mid + PI, 0, RZ(sway).multiply(RX(lean)).multiply(T(lx, ly, lz)).multiply(ex || new THREE.Matrix4()));
      if (i === 36 || i === 100) { add(new THREE.CylinderGeometry(0.12, 0.12, w + 1.0, 8), M.gold, bm(0, 0, 0.05, RZ(PI / 2))); continue; }   // banner taken down
      add(new THREE.ShapeGeometry(sh), M.cloth, bm(0, 0, 0));
      add(new THREE.CylinderGeometry(0.12, 0.12, w + 1.0, 8), M.gold, bm(0, 0, 0.05, RZ(PI / 2)));
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, h - 0.2, 0.06), M.gold, bm(s * (w / 2 - 0.07), -h / 2, 0.04));
      if (i % 16 === 4) {
        logo(logos.vs?.sil, 2.7, 0.04, M.vsBlue, bm(0, -3.9, 0.04), 'Structure', 0, 0);
        logo(logos.vs?.shapes, 2.7, 0.09, M.gold, bm(0, -3.9, 0.04), 'Structure', 0, 0);
      } else maxEmblem(3.0, bm(0, -3.9, 0.04), 'Structure', { depth: 0.09 });
      add(new THREE.BoxGeometry(1.8, 0.1, 0.05), M.gold, bm(0, -5.6, 0.05));
      add(new THREE.ConeGeometry(0.22, 0.8, 8), M.gold, bm(0, -h + 1.4, 0.05, RX(PI)));
    }
  }

  // ============ HOLOGRAM (floating crest, two-sided) ============
  for (const side of [0, PI]) {
    const m = T(0, 46, 0).multiply(new THREE.Matrix4().makeRotationY(side)).multiply(T(0, 0, 0.6));
    crest(34, m, 'Hologram', { depth: 0.8, gold: M.holo, back: M.holoBack });
  }
  add(new THREE.TorusGeometry(19, 0.18, 8, 160), M.gCyan, RX(PI / 2).premultiply(T(0, 31, 0)), 'HoloRing');
  add(new THREE.TorusGeometry(17.4, 0.08, 8, 160), M.gViolet, RX(PI / 2).premultiply(T(0, 31, 0)), 'HoloRing');

  // ============ ENERGY TETHERS (tower orbs -> halo) ============
  for (let s = 0; s < 4; s++) {
    const phi = s * PI / 2 + PI / 4;
    beam(polar(61.5 + D, 64.5, phi), polar(46 + D, 72, phi), 0.22, 0.22, M.gCyan);
    beam(polar(61.5 + D, 64.5, phi + 0.004), polar(46 + D, 72, phi - 0.02), 0.08, 0.08, M.gViolet);
  }

  // ============ FLOATING ISLAND ============
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const nz = (x, y, z) => Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * Math.cos(z * 0.09 + y * 0.05)
    + 0.5 * Math.sin(x * 0.23 + y * 0.19 + z * 0.21) + 0.25 * Math.sin(x * 0.53 - z * 0.47 + y * 0.31);
  const IR = 60 + D + 2.6, IH = 100, IB = 5;
  const islandR = depth => IB + (IR - IB) * Math.pow(1 - depth, 0.55);
  {
    let g = new THREE.CylinderGeometry(IR, IB, IH, 120, 32, false);
    g.translate(0, -0.3 - IH / 2, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const depth = Math.min(1, Math.max(0, (-0.3 - y) / IH));
      if (depth < 0.002) continue;
      const lin = IR + (IB - IR) * depth;
      const w = Math.min(1, depth * 7);
      const k = (islandR(depth) / lin) * (1 + w * 0.15 * nz(x, y, z));
      p.setXYZ(i, x * k, y + w * 5 * nz(z * 1.3, x, y), z * k);
    }
    g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
    add(g, M.rock, null, 'Island');
  }
  add(new THREE.TorusGeometry(IR + 0.4, 0.5, 8, 360), M.gViolet, T(0, -1.6, 0).multiply(RX(PI / 2)), 'Island');
  add(new THREE.TorusGeometry(IR - 1.2, 0.25, 8, 360), M.gCyan, T(0, -4.5, 0).multiply(RX(PI / 2)), 'Island');
  const crystalMats = [M.gCyan, M.gViolet, M.gMagenta, M.gCyan];
  const spike = (pos, dir, len, rad, m, group) => {
    const g = new THREE.ConeGeometry(rad, len, 6);
    g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    add(g, m, new THREE.Matrix4().compose(pos, q, V(1, 1, 1)), group);
  };
  for (let i = 0; i < 90; i++) {
    const a = rnd() * TAU, depth = 0.06 + rnd() * 0.82;
    const r = islandR(depth) * 0.9, y = -0.3 - depth * IH;
    const dir = V(Math.sin(a), -0.35 - rnd() * 0.9, Math.cos(a));
    const len = 3 + rnd() * 9 * (1 - depth * 0.4);
    spike(polar(r, y, a), dir, len, len * 0.16, crystalMats[i % 4], 'Island');
    if (rnd() < 0.5) spike(polar(r, y - 0.5, a + 0.02), dir.clone().add(V(rnd() - 0.5, -0.3, rnd() - 0.5)), len * 0.55, len * 0.1, crystalMats[(i + 1) % 4], 'Island');
  }
  const tip = V(0, -0.3 - IH + 3, 0);
  spike(tip, V(0, -1, 0), 26, 3.4, M.gCyan, 'Island');
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * TAU;
    spike(tip.clone().add(V(Math.sin(a) * 2.5, 2, Math.cos(a) * 2.5)), V(Math.sin(a) * 0.45, -1, Math.cos(a) * 0.45), 10 + rnd() * 9, 1.6, k % 2 ? M.gViolet : M.gMagenta, 'Island');
  }
  // gravity rings
  [[0.22, M.gCyan, 0.06, 0], [0.48, M.gViolet, -0.09, 1.2], [0.72, M.gCyan, 0.12, 2.3]].forEach(([d, m, tilt, rot]) => {
    const r = islandR(d) + 14;
    add(new THREE.TorusGeometry(r, 0.45, 8, 300), m, new THREE.Matrix4().makeRotationY(rot).multiply(T(0, -0.3 - d * IH, 0)).multiply(RZ(tilt)).multiply(RX(PI / 2)), 'GravityRings');
    for (let j = 0; j < 6; j++) {
      const a = j / 6 * TAU;
      add(new THREE.OctahedronGeometry(1.2), M.gold, new THREE.Matrix4().makeRotationY(rot).multiply(T(0, -0.3 - d * IH, 0)).multiply(RZ(tilt)).multiply(T(Math.cos(a) * r, 0, Math.sin(a) * r)), 'GravityRings');
    }
  });
  // asteroids
  for (let i = 0; i < 48; i++) {
    const s = 2 + Math.pow(rnd(), 2) * 9;
    let g = new THREE.IcosahedronGeometry(s, 1);
    const p = g.attributes.position;
    const o = rnd() * 100;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), y = p.getY(j), z = p.getZ(j);
      const k = 1 + 0.28 * nz(x * 6 + o, y * 6, z * 6) / 1.75;
      p.setXYZ(j, x * k, y * k * 0.8, z * k);
    }
    g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
    const a = rnd() * TAU, r = 135 + rnd() * 80, y = -70 + rnd() * 95;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * TAU, rnd() * TAU, rnd() * TAU));
    add(g, M.rock, new THREE.Matrix4().compose(polar(r, y, a), q, V(1, 1, 1)), 'Asteroids');
    if (s > 5) spike(polar(r, y + s * 0.5, a), V(rnd() - 0.5, 1, rnd() - 0.5), s * 0.9, s * 0.14, crystalMats[i % 4], 'Asteroids');
  }


  // ============ STATUES (spear & shield warriors on the wall top) ============
  const limb = (a, b, r0, r1, m, group) => {
    const d = b.clone().sub(a), len = d.length();
    const g = new THREE.CylinderGeometry(r1, r0, len, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
    add(g, m, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1)), group);
  };
  const statue = (base, body, trim, cape, low = false) => {
    const G = low ? 'StatuesLow' : 'Statues', S = 2.9, FY = 1.42;
    const QS = low ? [7, 5] : [12, 9], QC = low ? 7 : 12, QL = low ? 10 : 18, QT = low ? 0.4 : 0.7;   // detail level   // figure ~2.0 tall → ~5.8 m, standing on a 1.42 m pedestal
    const L = (x, y, z, ex) => base.clone().multiply(T(x, y, z)).multiply(ex || new THREE.Matrix4());
    // --- pedestal ---
    add(new THREE.BoxGeometry(2.3, 0.28, 1.95), M.stone, L(0, 0.14, 0), G);
    add(new THREE.BoxGeometry(2.0, 0.06, 1.7), M.gold, L(0, 0.31, 0), G);
    add(new THREE.BoxGeometry(1.8, 0.82, 1.5), M.marble, L(0, 0.75, 0), G);
    add(new THREE.BoxGeometry(1.4, 0.07, 0.04), M.gCyan, L(0, 0.75, 0.76), G);
    add(new THREE.BoxGeometry(2.0, 0.06, 1.7), M.gold, L(0, 1.19, 0), G);
    add(new THREE.BoxGeometry(2.1, 0.2, 1.8), M.marble, L(0, 1.32, 0), G);
    // --- figure helpers (local units: metres of a 2 m figure, +z = facing) ---
    const F = (ex) => L(0, FY, 0, new THREE.Matrix4().makeScale(S, S, S).multiply(ex));
    const P = (x, y, z) => V(x, y, z).applyMatrix4(F(new THREE.Matrix4()));
    const at3 = (x, y, z, ex) => F(T(x, y, z).multiply(ex || new THREE.Matrix4()));
    const ball = (x, y, z, r, m = body, sx = 1, sy = 1, sz = 1) => add(new THREE.SphereGeometry(r, QS[0], QS[1]), m, at3(x, y, z, new THREE.Matrix4().makeScale(sx, sy, sz)), G);
    const seg = (a, b, r0, r1, m = body) => {
      const A = P(...a), B = P(...b), d = B.clone().sub(A), len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
      add(new THREE.CylinderGeometry(r1 * S, r0 * S, len, QC, 1), m, new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, V(1, 1, 1)), G);
    };
    const lathe = (pts, m, ex, segs = 24) => add(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), Math.max(8, Math.round(segs * QL / 24))), m, F(ex || new THREE.Matrix4()), G);
    // --- legs (weight on the right leg, left leg relaxed and forward) ---
    const legs = [[[0.1, 0.96, 0], [0.11, 0.52, 0.0], [0.12, 0.09, -0.02]], [[-0.1, 0.96, 0.01], [-0.14, 0.53, 0.1], [-0.16, 0.1, 0.06]]];
    for (const [hip, knee, ank] of legs) {
      seg(hip, knee, 0.088, 0.062); ball(...knee, 0.064);
      seg(knee, ank, 0.062, 0.04); ball(...ank, 0.042);
      // greaves
      seg([knee[0], knee[1] - 0.02, knee[2] + 0.01], [ank[0], ank[1] + 0.05, ank[2] + 0.005], 0.069, 0.047, trim);
      // sandals
      add(new THREE.BoxGeometry(0.1, 0.045, 0.24), trim, at3(ank[0], 0.022, ank[2] + 0.05), G);
    }
    // --- pteruges (leather strips) over a short tunic ---
    lathe([[0.14, 0.86], [0.2, 0.9], [0.19, 1.0], [0.16, 1.06]], cape, new THREE.Matrix4().makeScale(1, 1, 0.8));
    if (!low) for (let k = 0; k < 16; k++) {
      const a = k / 16 * TAU;
      add(new THREE.BoxGeometry(0.055, 0.17, 0.018), k % 2 ? trim : body,
        at3(Math.sin(a) * 0.185, 0.925, Math.cos(a) * 0.185 * 0.82, new THREE.Matrix4().makeRotationY(a).multiply(RX(-0.18))), G);
    }
    // --- muscled cuirass ---
    lathe([[0.0, 0.98], [0.155, 0.99], [0.165, 1.06], [0.152, 1.13], [0.17, 1.24], [0.2, 1.36], [0.215, 1.45], [0.2, 1.53], [0.13, 1.58], [0.0, 1.6]],
      body, new THREE.Matrix4().makeScale(1, 1, 0.68), 28);
    ball(0.075, 1.4, 0.105, 0.075, body, 1, 0.8, 0.45); ball(-0.075, 1.4, 0.105, 0.075, body, 1, 0.8, 0.45);    // pectorals
    if (!low) for (const y of [1.29, 1.22, 1.15]) for (const x of [-0.04, 0.04]) ball(x, y, 0.1, 0.034, body, 1, 0.75, 0.45);   // abs
    add(new THREE.TorusGeometry(0.162, 0.016, low ? 4 : 6, low ? 16 : 24), trim, at3(0, 1.075, 0, new THREE.Matrix4().makeScale(1, 0.68, 1).multiply(RX(PI / 2))), G);   // belt
    if (!low) add(new THREE.TorusGeometry(0.11, 0.012, 5, 20), trim, at3(0, 1.57, 0, new THREE.Matrix4().makeScale(1, 0.8, 1).multiply(RX(PI / 2))), G);      // collar
    for (const sx of [-1, 1]) {   // layered pauldrons
      ball(sx * 0.215, 1.5, 0, 0.095, trim, 1.1, 0.75, 1);
      ball(sx * 0.235, 1.455, 0, 0.09, body, 1.1, 0.6, 1);
    }
    // --- neck + head + Corinthian helmet ---
    seg([0, 1.57, 0], [0, 1.67, 0.01], 0.05, 0.045);
    ball(0, 1.745, 0.012, 0.098, body, 0.9, 1.06, 1);
    add(new THREE.SphereGeometry(0.114, low ? 10 : 18, low ? 6 : 10, 0, TAU, 0, PI * 0.56), trim, at3(0, 1.755, 0.008), G);           // bowl
    for (const s of [-1, 1])                                                                                   // cheek guards (leave a face slit)
      add(new THREE.CylinderGeometry(0.114, 0.104, 0.14, low ? 5 : 10, 1, true, s > 0 ? 0.32 : PI - 1.5 + 0.32, 1.18), trim, at3(0, 1.69, 0.008), G);
    add(new THREE.CylinderGeometry(0.114, 0.114, 0.14, low ? 6 : 12, 1, true, PI * 0.6, PI * 0.8), trim, at3(0, 1.69, 0.008), G);   // neck guard
    add(new THREE.BoxGeometry(0.022, 0.085, 0.025), trim, at3(0, 1.72, 0.118), G);                             // nose guard
    if (!low) add(new THREE.TorusGeometry(0.116, 0.008, 4, 20, PI), trim, at3(0, 1.755, 0.008, new THREE.Matrix4().makeRotationY(PI / 2).multiply(RX(0)).multiply(new THREE.Matrix4().makeRotationZ(0))), G);
    {   // horsehair crest, front to back
      const sh = new THREE.Shape();
      sh.absarc(0, 0, 0.2, -0.15, PI + 0.55, false); sh.absarc(0, -0.02, 0.13, PI + 0.4, -0.05, true); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: !low, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: low ? 6 : 12 });
      g.translate(0, 0, -0.0225);
      add(g, cape, at3(0, 1.69, -0.01, new THREE.Matrix4().makeRotationY(-PI / 2)), G);
      add(new THREE.BoxGeometry(0.03, 0.04, 0.2), trim, at3(0, 1.87, -0.01), G);
    }
    // --- right arm: holds the spear upright ---
    const rS = [0.25, 1.48, 0], rE = [0.31, 1.25, 0.04], rH = [0.3, 1.19, 0.17];
    seg(rS, rE, 0.058, 0.048); ball(...rE, 0.05); seg(rE, rH, 0.048, 0.036);
    seg([0.308, 1.235, 0.08], [0.302, 1.2, 0.15], 0.05, 0.045, trim);    // bracer
    ball(...rH, 0.045, body, 1, 1.2, 1);
    seg([0.3, 0.02, 0.17], [0.3, 2.45, 0.17], 0.013, 0.013, trim);      // dory shaft
    lathe([[0.0, 2.45], [0.028, 2.5], [0.034, 2.56], [0.02, 2.64], [0.0, 2.71]], trim, T(0.3, 0, 0.17), 10);   // leaf blade
    lathe([[0.0, 0.0], [0.02, 0.06], [0.015, 0.12]], trim, T(0.3, 0, 0.17), 8);                              // butt spike
    // --- left arm: carries the aspis shield ---
    const lS = [-0.25, 1.48, 0], lE = [-0.33, 1.24, 0.06], lH = [-0.27, 1.16, 0.18];
    seg(lS, lE, 0.058, 0.048); ball(...lE, 0.05); seg(lE, lH, 0.048, 0.036); ball(...lH, 0.045);
    {
      const sm = new THREE.Matrix4().makeTranslation(-0.3, 1.12, 0.2).multiply(new THREE.Matrix4().makeRotationY(-0.95)).multiply(RX(-0.08)).multiply(new THREE.Matrix4().makeScale(0.78, 0.78, 0.78));
      lathe([[0.0, 0.075], [0.18, 0.066], [0.32, 0.04], [0.42, 0.006], [0.44, 0.0], [0.42, -0.02], [0.0, -0.02]], body, sm.clone().multiply(RX(PI / 2)), 40);
      add(new THREE.TorusGeometry(0.43, 0.028, low ? 4 : 6, low ? 20 : 32), trim, F(sm.clone().multiply(T(0, 0, 0.004))), G);
      if (!low) add(new THREE.TorusGeometry(0.31, 0.01, 4, 28), trim, F(sm.clone().multiply(T(0, 0, 0.044))), G);
      if (logos.vs && !low) {   // the VS shield as the aspis emblem
        logo(logos.vs.sil, 0.36, 0.012, M.vsBlue, F(sm.clone().multiply(T(0, 0.01, 0.07))), G);
        logo(logos.vs.shapes, 0.36, 0.022, M.gold, F(sm.clone().multiply(T(0, 0.01, 0.07))), G);
      }
    }
    // --- cape: hangs from the shoulders, folds and flares ---
    {
      const g = low ? new THREE.PlaneGeometry(0.52, 1.28, 6, 8) : new THREE.PlaneGeometry(0.52, 1.28, 12, 16), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), v = (0.64 - y) / 1.28;   // 0 at top, 1 at bottom
        const w = 1 + 0.75 * v;
        p.setXYZ(i, x * w, y, -0.03 - 0.16 * Math.sqrt(v) - 0.12 * v * v + Math.sin(x * w * 26 + v * 2) * 0.022 * v - Math.abs(x) * 0.25 * (1 - v));
      }
      g.computeVertexNormals();
      add(g, cape, at3(0, 1.53 - 0.64, -0.13, RX(0.06)), G);
      for (const s of [-1, 1]) ball(s * 0.17, 1.53, -0.1, 0.035, trim);   // cloak clasps
    }
  };
  const sRng = seeded(3131);
  for (let j = 0; j < 16; j++) {
    const phi = statueAt(j), gold = [2, 7, 13].includes(j), cape = [4, 10, 15].includes(j) ? M.capeBlue : M.capeRed;
    const yaw = (sRng() - 0.5) * 0.3, sc = 0.94 + sRng() * 0.12;
    const base = at(57.4 + D, WTOP, phi, phi + PI + yaw).multiply(new THREE.Matrix4().makeScale(sc, sc, sc));
    statue(base, gold ? M.gold : M.statue, gold ? M.statue : M.gold, cape);
    if (opts.lod) statue(base, gold ? M.gold : M.statue, gold ? M.statue : M.gold, cape, true);
  }

  // ============ BIG SCREENS (hung from the halo) ============
  const screenAngles = [PI / 4, 5 * PI / 4];
  for (const c0 of screenAngles) {
    const r = 70, yc = 50, H = 14, span = 34 * DEG, N = 48, G = 'Screens';
    const pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const a = c0 - span / 2 + i / N * span;
      for (const v of [0, 1]) {
        pos.push(r * Math.sin(a), yc - H / 2 + v * H, r * Math.cos(a));
        nor.push(-Math.sin(a), 0, -Math.cos(a));
        uv.push(1 - i / N, v);
      }
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    sg.setIndex(idx);
    add(sg, M.screen, null, G);
    const a0 = c0 - span / 2 - 0.006, sp = span + 0.012;
    add(band(r + 0.6, yc - H / 2 - 0.6, r + 0.6, yc + H / 2 + 0.6, a0, sp, 48), M.stoneDk, null, G);
    for (const y of [yc - H / 2 - 0.6, yc + H / 2 + 0.6]) add(band(r - 0.25, y, r + 0.6, y, a0, sp, 48), M.stoneDk, null, G);
    for (const y of [yc - H / 2 - 0.3, yc + H / 2 + 0.3]) add(band(r - 0.28, y - 0.3, r - 0.28, y + 0.3, a0, sp, 48), M.gold, null, G);
    add(band(r - 0.3, yc - H / 2 - 0.75, r - 0.3, yc - H / 2 - 0.6, a0, sp, 48), M.gCyan, null, G);
    for (const a of [a0, a0 + sp]) {
      add(new THREE.BoxGeometry(0.6, H + 1.8, 0.9), M.gold, at(r + 0.15, yc, a), G);
    }
    for (const f of [-0.42, 0.42]) {
      const a = c0 + f * span;
      beam(polar(r + 0.2, yc + H / 2 + 0.6, a), polar(46 + D, 72, a), 0.12, 0.12, M.gold, G);
      beam(polar(r + 0.2, yc + H / 2 + 0.6, a + 0.003), polar(46 + D, 72, a + 0.003), 0.05, 0.05, M.gCyan, G);
    }
  }


  // ============ SATELLITE PLATFORM ============
  const pivots = {};
  const SA = 0.62 * PI, SP = polar(272, 20, SA), SR = 26;
  const SAT = (x, y, z, ex) => T(SP.x + x, y, SP.z + z).multiply(ex || new THREE.Matrix4());
  {
    const G = 'Satellite';
    add(new THREE.CylinderGeometry(SR, SR - 1.5, 3, 72), M.stone, SAT(0, 18.5, 0), G);
    add(new THREE.CylinderGeometry(SR - 1.2, SR - 1.2, 0.2, 72), M.floor, SAT(0, 20.05, 0), G);
    add(new THREE.TorusGeometry(SR, 0.35, 8, 120), M.gold, SAT(0, 20, 0, RX(PI / 2)), G);
    add(new THREE.TorusGeometry(SR - 1.4, 0.16, 8, 120), M.gCyan, SAT(0, 17.4, 0, RX(PI / 2)), G);
    for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; add(new THREE.BoxGeometry(0.5, 0.25, 0.5), k % 2 ? M.gCyan : M.gGold, SAT(Math.sin(a) * (SR - 0.8), 20.25, Math.cos(a) * (SR - 0.8)), G); }
    // jagged rock underneath
    let rock = new THREE.ConeGeometry(SR - 1, 46, 28, 10); rock.rotateX(PI); rock.translate(0, -23, 0);
    const p = rock.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = Math.min(1, -y / 46);
      const k = 1 + 0.22 * d * (Math.sin(x * 0.4 + y * 0.3) + Math.cos(z * 0.5 - y * 0.2)) * 0.5;
      p.setXYZ(i, x * k, y + d * 3 * Math.sin(x * 0.7 + z * 0.6), z * k);
    }
    rock = rock.index ? rock.toNonIndexed() : rock; rock.computeVertexNormals();
    add(rock, M.rock, SAT(0, 17, 0), G);
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * TAU + 0.3, r = 10 + (k % 3) * 4, y = 4 - (k % 4) * 7;
      const g2 = new THREE.ConeGeometry(1.1, 9 + (k % 3) * 3, 6); g2.translate(0, -(9 + (k % 3) * 3) / 2, 0);
      add(g2, [M.gCyan, M.gViolet, M.gMagenta][k % 3], SAT(Math.sin(a) * r, y, Math.cos(a) * r, new THREE.Matrix4().makeRotationZ(0.35 * Math.cos(a)).multiply(new THREE.Matrix4().makeRotationX(-0.35 * Math.sin(a)))), G);
    }
    // pedestal
    add(new THREE.CylinderGeometry(3.2, 4.2, 8, 24), M.marble, SAT(0, 24, 0), G);
    add(new THREE.TorusGeometry(3.9, 0.2, 8, 40), M.gold, SAT(0, 21.2, 0, RX(PI / 2)), G);
    // comms masts with beacons
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + PI / 4, r = SR - 5;
      add(new THREE.CylinderGeometry(0.25, 0.45, 18, 8), M.gold, SAT(Math.sin(a) * r, 29, Math.cos(a) * r), G);
      for (const h of [24, 30, 35]) add(new THREE.TorusGeometry(1.0, 0.08, 6, 20), M.gold, SAT(Math.sin(a) * r, h, Math.cos(a) * r, RX(PI / 2)), G);
      add(new THREE.SphereGeometry(0.55, 12, 8), M.beacon, SAT(Math.sin(a) * r, 38.4, Math.cos(a) * r), G);
    }
    // solar arrays
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU, r = 15;
      add(new THREE.BoxGeometry(7, 0.25, 4.2), M.solar, SAT(Math.sin(a) * r, 21.6, Math.cos(a) * r, new THREE.Matrix4().makeRotationY(a).multiply(RX(-0.45))), G);
      add(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 6), M.gold, SAT(Math.sin(a) * r, 20.7, Math.cos(a) * r), G);
    }
    // energy tether back to the colosseum island
    beam(polar(104, -1, SA), polar(SP.length() - SR + 1, 18.6, SA), 0.3, 0.3, M.gCyan, G);
    beam(polar(104, -1.6, SA + 0.002), polar(SP.length() - SR + 1, 18, SA + 0.002), 0.14, 0.14, M.gViolet, G);
    // the dish (its own group so the viewer can turn it)
    const D2 = 'SatDish', f = 12, RD = 22, tilt = -0.72;
    const turn = T(SP.x, 0, SP.z).multiply(new THREE.Matrix4().makeRotationY(SA + PI));
    const Dm = turn.clone().multiply(T(0, 41, 0)).multiply(RX(tilt));
    add(new THREE.CylinderGeometry(6, 6, 1, 32), M.gold, turn.clone().multiply(T(0, 28.5, 0)), D2);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.2, 13, 2.2), M.marble, turn.clone().multiply(T(s * 5, 35, 0)), D2);
    add(new THREE.CylinderGeometry(0.8, 0.8, 11, 16), M.gold, turn.clone().multiply(T(0, 41, 0)).multiply(new THREE.Matrix4().makeRotationZ(PI / 2)), D2);
    const pts = []; for (let i = 0; i <= 16; i++) { const r = i / 16 * RD; pts.push(new THREE.Vector2(r, r * r / (4 * f))); }
    add(new THREE.LatheGeometry(pts, 64), M.dish, Dm.clone(), D2);
    add(new THREE.TorusGeometry(RD, 0.35, 8, 96), M.gold, Dm.clone().multiply(T(0, RD * RD / (4 * f), 0)).multiply(RX(PI / 2)), D2);
    add(new THREE.TorusGeometry(RD, 0.12, 6, 96), M.gCyan, Dm.clone().multiply(T(0, RD * RD / (4 * f) + 0.3, 0)).multiply(RX(PI / 2)), D2);
    for (const rr of [8, 15]) add(new THREE.TorusGeometry(rr, 0.12, 6, 64), M.gold, Dm.clone().multiply(T(0, rr * rr / (4 * f) + 0.05, 0)).multiply(RX(PI / 2)), D2);
    const focal = new THREE.Vector3(0, f, 0).applyMatrix4(Dm);
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU, rim = new THREE.Vector3(Math.cos(a) * (RD - 0.5), (RD - 0.5) ** 2 / (4 * f), Math.sin(a) * (RD - 0.5)).applyMatrix4(Dm);
      beam(rim, focal, 0.35, 0.35, M.gold, D2);
    }
    add(new THREE.ConeGeometry(1.4, 2.6, 16), M.gold, Dm.clone().multiply(T(0, f + 0.6, 0)).multiply(RX(PI)), D2);
    add(new THREE.SphereGeometry(0.9, 16, 10), M.gCyan, Dm.clone().multiply(T(0, f - 0.9, 0)), D2);
    pivots[D2] = new THREE.Vector3(SP.x, 0, SP.z);
    var satInfo = { pos: SP.clone(), radius: SR, angle: SA, focal: focal.clone(), axis: new THREE.Vector3(0, 1, 0).transformDirection(Dm) };
  }

  // ============ SPACEPORT (floating landing strip) ============
  const PA = 1.12 * PI, PC = polar(640, -35, PA);
  const portM = T(PC.x, PC.y, PC.z).multiply(new THREE.Matrix4().makeRotationY(PA));
  const PT = (x, y, z, ex) => portM.clone().multiply(T(x, y, z)).multiply(ex || new THREE.Matrix4());
  {
    const G = 'Spaceport', L = 420, W = 110, RZ0 = -12;
    add(new THREE.BoxGeometry(L, 8, W), M.stone, PT(0, -4, 0), G);
    add(new THREE.BoxGeometry(L - 16, 0.2, W - 14), M.floor, PT(0, 0.1, 0), G);
    for (const z of [-W / 2, W / 2]) add(new THREE.BoxGeometry(L, 0.8, 1.2), M.gold, PT(0, 0.2, z), G);
    for (const x of [-L / 2, L / 2]) add(new THREE.BoxGeometry(1.2, 0.8, W), M.gold, PT(x, 0.2, 0), G);
    add(new THREE.BoxGeometry(L + 2, 0.3, 0.5), M.gCyan, PT(0, -6.5, W / 2 + 0.4), G);
    add(new THREE.BoxGeometry(L + 2, 0.3, 0.5), M.gCyan, PT(0, -6.5, -W / 2 - 0.4), G);
    // runway
    add(new THREE.BoxGeometry(390, 0.12, 36), M.stoneDk, PT(0, 0.26, RZ0), G);
    for (let x = -180; x <= 180; x += 24) add(new THREE.BoxGeometry(11, 0.05, 0.9), M.gGold, PT(x, 0.34, RZ0), G);
    for (const side of [-1, 1]) for (let x = -190; x <= 190; x += 10) add(new THREE.BoxGeometry(0.7, 0.5, 0.7), x % 20 === 0 ? M.gCyan : M.gGold, PT(x, 0.5, RZ0 + side * 18.6), G);
    for (const end of [-1, 1]) {
      for (let k = -7; k <= 7; k++) add(new THREE.BoxGeometry(0.8, 0.3, 1.6), M.gCyan, PT(end * 196, 0.4, RZ0 + k * 2.3), G);
      for (let j = 1; j <= 5; j++) add(new THREE.BoxGeometry(0.9, 0.9, 0.9), M.strobe, PT(end * (204 + j * 9), 1 + j * 0.2, RZ0), G);
      // big threshold chevrons
      for (let k = -3; k <= 3; k++) add(new THREE.BoxGeometry(14, 0.05, 1.8), M.gold, PT(end * 180, 0.34, RZ0 + k * 4.4), G);
    }
    // jagged rock underside
    for (let k = 0; k < 5; k++) {
      let g2 = new THREE.ConeGeometry(48 - (k % 2) * 8, 70 + (k % 3) * 18, 7, 6); g2.rotateX(PI); g2.translate(0, -(70 + (k % 3) * 18) / 2 - 8, 0);
      const p = g2.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const d = Math.min(1, (-y - 8) / 90); p.setXYZ(i, x * (1 + 0.2 * d * Math.sin(y * 0.2 + k)), y, z * (1 + 0.2 * d * Math.cos(x * 0.15 + k))); }
      g2 = g2.index ? g2.toNonIndexed() : g2; g2.computeVertexNormals();
      add(g2, M.rock, PT(-160 + k * 80, 0, (k % 2 ? 10 : -10), new THREE.Matrix4().makeScale(1, 1, 0.9)), G);
      add(new THREE.ConeGeometry(2.2, 18, 6).translate(0, -9, 0), [M.gCyan, M.gViolet][k % 2], PT(-160 + k * 80, -70 - (k % 3) * 14, 0), G);
    }
    // control tower
    add(new THREE.CylinderGeometry(3.5, 5.5, 32, 20), M.marble, PT(70, 16, 34), G);
    for (const y of [8, 16, 24]) add(new THREE.TorusGeometry(4.6, 0.2, 6, 30), M.gold, PT(70, y, 34, RX(PI / 2)), G);
    add(new THREE.CylinderGeometry(8, 6, 6, 24), M.stone, PT(70, 35, 34), G);
    add(new THREE.CylinderGeometry(8.05, 6.8, 2.2, 24, 1, true), M.gCyan, PT(70, 35.4, 34), G);
    add(new THREE.ConeGeometry(8.4, 4, 24), M.gold, PT(70, 40, 34), G);
    add(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), M.gold, PT(70, 46, 34), G);
    add(new THREE.SphereGeometry(0.6, 10, 8), M.beacon, PT(70, 50.3, 34), G);
    // hangars
    for (const hx of [-120, -70]) {
      add(new THREE.CylinderGeometry(15, 15, 34, 28, 1, true, 0, PI).rotateZ(PI / 2).rotateY(PI / 2), M.marble, PT(hx, 0, 34), G);
      for (const zz of [-14, 0, 14]) add(new THREE.TorusGeometry(15.05, 0.35, 6, 28, PI).rotateY(PI / 2), M.gold, PT(hx, 0, 34 + zz), G);
      add(new THREE.CircleGeometry(14.6, 28, 0, PI), M.pDeep, PT(hx, 0, 17.05), G);
      add(new THREE.TorusGeometry(14.7, 0.2, 6, 28, PI), M.gCyan, PT(hx, 0, 16.9), G);
    }
    // landing pad with the crest
    add(new THREE.CircleGeometry(18, 64), M.pDeep, PT(140, 0.3, 32, RX(-PI / 2)), G);
    add(new THREE.RingGeometry(17.4, 18.2, 96), M.gold, PT(140, 0.32, 32, RX(-PI / 2)), G);
    add(new THREE.RingGeometry(15.6, 15.9, 96), M.gCyan, PT(140, 0.33, 32, RX(-PI / 2)), G);
    crest(24, PT(140, 0.36, 32, RX(-PI / 2)), G, { depth: 0.1 });
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; add(new THREE.BoxGeometry(0.8, 0.5, 0.8), M.gGold, PT(140 + Math.cos(a) * 19.5, 0.5, 32 + Math.sin(a) * 19.5), G); }
    var portInfo = { center: PC.clone(), angle: PA, runwayZ: RZ0, padX: 140, padZ: 32, deckY: PC.y + 0.3 };
  }


  // ============ STORY PROPS ============
  {
    const PW = 26 + D;                    // podium wall radius
    // ---- weapon racks flanking every gate (arena side) ----
    for (let g = 0; g < 4; g++) for (const s of [-1, 1]) {
      const phi = g * PI / 2, tx = s * 8.6, rr = PW - 1.2;
      const L = (x, y, z, ex) => at(rr, 0, phi, phi + PI, 0, T(tx * -1 + x, y, z)).multiply(ex || new THREE.Matrix4());
      for (const x of [-1.3, 1.3]) add(new THREE.BoxGeometry(0.18, 2.6, 0.18), M.wood, L(x, 1.3, 0));
      for (const y of [0.5, 2.3]) add(new THREE.BoxGeometry(2.8, 0.14, 0.2), M.wood, L(0, y, 0));
      add(new THREE.BoxGeometry(2.9, 0.12, 0.7), M.wood, L(0, 0.06, 0.15));
      for (let k = 0; k < 4; k++) {        // spears leaning in the rack
        const x = -0.9 + k * 0.6;
        add(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 5), M.gold, L(x, 1.7, -0.08, RX(0.08 + (k % 2) * 0.04)));
        add(new THREE.ConeGeometry(0.08, 0.32, 5), M.marble, L(x, 3.5, -0.22, RX(0.1)));
      }
      for (const x of [-0.65, 0.65]) {     // shields hanging on the rack
        add(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), M.marble, L(x, 1.3, 0.2, RX(PI / 2)));
        add(new THREE.TorusGeometry(0.55, 0.04, 4, 20), M.gold, L(x, 1.3, 0.25));
      }
    }

    // ---- commentator booth (cantilevered off the podium, sector 1) ----
    {
      const phi = PI / 4, y0 = Y0 + 0.2;
      const B = (r, y, x, ex) => at(r, y, phi, phi, x, ex);
      add(new THREE.BoxGeometry(10, 0.45, 5), M.stone, B(PW - 2.3, y0, 0));
      add(new THREE.BoxGeometry(10, 3.4, 0.3), M.stone, B(PW + 0.05, y0 + 1.9, 0));
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.3, 3.4, 5), M.stone, B(PW - 2.3, y0 + 1.9, s * 4.85));
      add(new THREE.BoxGeometry(10.6, 0.4, 5.6), M.marble, B(PW - 2.4, y0 + 3.75, 0));
      add(new THREE.BoxGeometry(10.6, 0.16, 0.18), M.gold, B(PW - 5.15, y0 + 3.6, 0));
      add(new THREE.PlaneGeometry(9.4, 2.7), M.boothGlass, B(PW - 4.75, y0 + 1.75, 0, new THREE.Matrix4().makeRotationY(PI).multiply(RX(-0.18))));
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 3.0, 0.14), M.gold, B(PW - 4.8, y0 + 1.75, s * 4.7));
      add(new THREE.BoxGeometry(8.6, 0.14, 0.9), M.wood, B(PW - 3.8, y0 + 1.15, 0));                    // desk
      for (const x of [-2.2, 2.2]) {
        add(new THREE.BoxGeometry(1.1, 0.7, 0.06), M.gCyan, B(PW - 3.6, y0 + 1.65, x, new THREE.Matrix4().makeRotationY(PI)));   // monitors
        add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), M.cable, B(PW - 3.5, y0 + 1.5, x + 0.8));           // mic stands
        add(new THREE.SphereGeometry(0.1, 8, 6), M.cable, B(PW - 3.6, y0 + 1.85, x + 0.8));
      }
      add(new THREE.BoxGeometry(1.4, 0.4, 0.1), M.beacon, B(PW - 5.2, y0 + 4.2, 3.6));                    // ON AIR light
      for (const s of [-1, 1]) beam(polar(PW - 4.4, y0 - 0.2, phi + s * 0.055), polar(PW - 0.1, 2.2, phi + s * 0.055), 0.25, 0.25, M.gold);   // struts
      if (logos.vs) {
        logo(logos.vs.sil, 2.6, 0.08, M.vsBlue, at(PW - 5.25, y0 + 5.3, phi, phi + PI), 'Structure');
        logo(logos.vs.shapes, 2.6, 0.16, M.gold, at(PW - 5.25, y0 + 5.3, phi, phi + PI), 'Structure');
      }
    }

    // ---- Maximus Law VIP suite (opposite side, sector 3): a small temple front built out from the podium ----
    {
      const phi = PI * 5 / 4, y0 = Y0 + 0.25, FR = PW - 5.4;     // FR = front edge radius
      const B = (r, y, x, ex) => at(r, y, phi, phi, x, ex);
      const W = 12.4, Dp = PW - FR;                                // width, depth
      // stepped corbels carry the suite out over the moat
      for (const x of [-5.2, -1.75, 1.75, 5.2]) for (let k = 0; k < 3; k++)
        add(new THREE.BoxGeometry(0.7, 0.55, Dp - 0.6 - k * 1.3), M.marble, B(PW - (Dp - 0.6 - k * 1.3) / 2 - 0.1, y0 - 0.55 - k * 0.55, x));
      // floor slab + gold fascia + carpet
      add(new THREE.BoxGeometry(W, 0.55, Dp + 0.2), M.marble, B(PW - Dp / 2, y0 - 0.02, 0));
      add(new THREE.BoxGeometry(W + 0.2, 0.16, 0.2), M.gold, B(FR - 0.05, y0 - 0.2, 0));
      add(new THREE.BoxGeometry(W - 1, 0.04, Dp - 0.8), M.velvet, B(PW - Dp / 2 - 0.1, y0 + 0.27, 0));
      // side + back walls with gold pilasters
      add(new THREE.BoxGeometry(W, 4.6, 0.35), M.stone, B(PW + 0.05, y0 + 2.5, 0));
      for (const s of [-1, 1]) {
        add(new THREE.BoxGeometry(0.4, 4.6, Dp), M.stone, B(PW - Dp / 2, y0 + 2.5, s * (W / 2 - 0.2)));
        add(new THREE.BoxGeometry(0.46, 0.18, Dp + 0.05), M.gold, B(PW - Dp / 2, y0 + 4.75, s * (W / 2 - 0.2)));
        add(new THREE.BoxGeometry(0.06, 3.2, 0.06), M.gGold, B(PW - Dp / 2, y0 + 2.4, s * (W / 2 - 0.44)));   // warm wall light
      }
      for (const x of [-4, 0, 4]) add(new THREE.BoxGeometry(0.4, 4.4, 0.12), M.gold, B(PW - 0.15, y0 + 2.4, x));
      // front columns (classical) and architrave
      for (const x of [-5.7, -1.9, 1.9, 5.7]) column(FR + 0.35, y0 + 0.27, 4.5, phi + x / FR, 0.26);
      add(new THREE.BoxGeometry(W + 0.4, 0.5, 0.8), M.marble, B(FR + 0.35, y0 + 5.0, 0));
      add(new THREE.BoxGeometry(W + 0.5, 0.12, 0.9), M.gold, B(FR + 0.35, y0 + 4.7, 0));
      // roof + triangular pediment with the Maximus emblem in it
      add(new THREE.BoxGeometry(W + 0.6, 0.35, Dp + 0.8), M.marble, B(PW - Dp / 2 + 0.1, y0 + 5.42, 0));
      {
        const sh = new THREE.Shape(); sh.moveTo(-(W + 0.6) / 2, 0); sh.lineTo((W + 0.6) / 2, 0); sh.lineTo(0, 2.3); sh.closePath();
        add(new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false }), M.marble, B(FR - 0.05, y0 + 5.6, 0));
        const inner = new THREE.Shape(); inner.moveTo(-(W - 0.8) / 2, 0); inner.lineTo((W - 0.8) / 2, 0); inner.lineTo(0, 1.75); inner.closePath();
        add(new THREE.ShapeGeometry(inner), M.velvet, B(FR - 0.07, y0 + 5.82, 0, new THREE.Matrix4().makeRotationY(PI)));
        for (const s of [-1, 1]) {    // raking gold cornice
          const a = V(s * (W + 0.6) / 2, 0, 0), b = V(0, 2.3, 0);
          const m = B(FR - 0.12, y0 + 5.6, 0);
          beam(a.clone().applyMatrix4(m), b.clone().applyMatrix4(m), 0.2, 0.2, M.gold);
        }
        add(new THREE.ConeGeometry(0.28, 0.7, 6), M.gold, B(FR + 0.2, y0 + 8.15, 0));            // acroterion
        for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.2, 0.5, 6), M.gold, B(FR + 0.2, y0 + 5.95, s * (W / 2 + 0.1)));
        maxEmblem(2.1, at(FR - 0.12, y0 + 6.55, phi, phi + PI), 'Structure', { depth: 0.1 });
      }
      // balustrade between the columns
      add(new THREE.BoxGeometry(W - 0.4, 0.14, 0.42), M.marble, B(FR + 0.35, y0 + 0.36, 0));
      add(new THREE.BoxGeometry(W - 0.4, 0.16, 0.48), M.gold, B(FR + 0.35, y0 + 1.36, 0));
      const baluster = new THREE.LatheGeometry([[0.07, 0], [0.11, 0.12], [0.06, 0.3], [0.12, 0.62], [0.06, 0.8], [0.09, 0.88]].map(([r, y]) => new THREE.Vector2(r, y)), 7);
      for (let k = 0; k < 22; k++) { const x = -5.5 + k * 0.524; if (Math.abs(Math.abs(x) - 1.9) < 0.3 || Math.abs(Math.abs(x) - 5.7) < 0.3) continue; add(baluster.clone(), M.marble, B(FR + 0.35, y0 + 0.43, x)); }
      // two tiers of velvet seats with gold arms
      for (const [row, rr, ry] of [[0, FR + 2.0, 0], [1, FR + 3.6, 0.55]]) {
        if (row === 1) add(new THREE.BoxGeometry(W - 1, 0.55, 1.6), M.marble, B(rr, y0 + 0.55, 0));
        for (let k = 0; k < 5; k++) {
          const x = -4.0 + k * 2.0;
          add(new THREE.BoxGeometry(1.25, 0.42, 1.05), M.velvet, B(rr, y0 + 0.55 + ry + 0.21, x));
          add(new THREE.BoxGeometry(1.25, 1.05, 0.22), M.velvet, B(rr + 0.5, y0 + 0.55 + ry + 0.72, x, RX(0.12)));
          for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.32, 0.95), M.gold, B(rr, y0 + 0.55 + ry + 0.55, x + s * 0.65));
        }
      }
      // little table + goblets, hanging lanterns
      add(new THREE.CylinderGeometry(0.45, 0.35, 0.08, 14), M.gold, B(FR + 1.0, y0 + 1.0, 0));
      add(new THREE.CylinderGeometry(0.06, 0.1, 0.7, 8), M.gold, B(FR + 1.0, y0 + 0.62, 0));
      for (const x of [-0.18, 0.2]) add(new THREE.LatheGeometry([[0, 0], [0.06, 0.01], [0.015, 0.03], [0.015, 0.14], [0.07, 0.2], [0.08, 0.3]].map(([r, y]) => new THREE.Vector2(r, y)), 8), M.gold, B(FR + 1.0, y0 + 1.05, x));
      for (const x of [-3.8, 3.8]) {
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), M.gold, B(FR + 1.6, y0 + 4.75, x));
        add(new THREE.OctahedronGeometry(0.26), M.gGold, B(FR + 1.6, y0 + 4.1, x, new THREE.Matrix4().makeScale(0.8, 1.4, 0.8)));
      }
      // tied-back drapes at the outer columns
      for (const s of [-1, 1]) {
        const g = new THREE.PlaneGeometry(1.2, 4.1, 6, 10), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = (2.05 - y) / 4.1; const pinch = 1 - 0.65 * Math.exp(-Math.pow((v - 0.62) * 5, 2)); p.setXYZ(i, x * pinch + s * 0.25 * (1 - pinch), y, Math.sin(x * 9) * 0.06); }
        g.computeVertexNormals();
        add(g, M.capeBlue, B(FR + 0.6, y0 + 2.6, s * 5.15, new THREE.Matrix4().makeRotationY(PI)));
        add(new THREE.TorusGeometry(0.16, 0.04, 4, 12), M.gold, B(FR + 0.6, y0 + 1.6, s * 5.15));
      }
    }

    // ---- power cables from the big screens to the outer wall ----
    for (const a0 of screenAngles) for (const da of [-0.13, 0.13]) {
      const a = a0 + da;
      const curve = new THREE.CatmullRomCurve3([polar(70.4, 42.6, a), polar(78, 34.5, a + da * 0.15), polar(90, 33.8, a + da * 0.25), polar(WI - 0.2, 38.2, a + da * 0.3)]);
      add(new THREE.TubeGeometry(curve, 28, 0.13, 5, false), M.cable);
    }

    // ---- camera jib cranes at the arena edge (arms swing in the viewer) ----
    [PI * 0.72, PI * 1.72].forEach((ca, k) => {
      const G = 'Crane' + k, br = 61.8, gy = 1.65, colTop = gy + 6.2;
      const head = polar(br, colTop + 0.55, ca);
      const Lb = (x, y, z, ex) => at(br, gy, ca, ca, x, T(0, y, z).multiply(ex || new THREE.Matrix4()));
      // three-leg dolly with wheels
      for (let l = 0; l < 3; l++) {
        const a = l / 3 * TAU + 0.3, fx = Math.sin(a) * 2.3, fz = Math.cos(a) * 2.3;
        beam(V(0, 0.75, 0).applyMatrix4(Lb(0, 0, 0)), V(fx, 0.35, fz).applyMatrix4(Lb(0, 0, 0)), 0.2, 0.14, M.craneM);
        add(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12), M.cable, Lb(fx, 0.25, fz, RZ(PI / 2)));
        add(new THREE.BoxGeometry(0.22, 0.12, 0.3), M.craneM, Lb(fx, 0.42, fz));
      }
      add(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 12), M.stoneDk, Lb(0, 0.75, 0));
      // telescoping column
      add(new THREE.CylinderGeometry(0.2, 0.22, 3.2, 10), M.craneM, Lb(0, 2.6, 0));
      add(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 10), M.gold, Lb(0, 4.2, 0));
      add(new THREE.CylinderGeometry(0.16, 0.18, 2.4, 10), M.craneM, Lb(0, 5.4, 0));
      add(new THREE.CylinderGeometry(0.38, 0.38, 0.35, 14), M.stoneDk, Lb(0, 6.55, 0));
      // ---- rotating part (pivots at the column head) ----
      const H = new THREE.Matrix4().makeTranslation(head.x, head.y, head.z).multiply(new THREE.Matrix4().makeRotationY(ca + PI)).multiply(RX(-0.1));
      const P = (x, y, z) => V(x, y, z).applyMatrix4(H);
      const HM = (x, y, z, ex) => H.clone().multiply(T(x, y, z)).multiply(ex || new THREE.Matrix4());
      add(new THREE.BoxGeometry(0.75, 0.55, 0.9), M.stoneDk, HM(0, 0, 0), G);              // swivel head
      // lattice (truss) arm from z=-4 to z=15
      const z0 = -4.2, z1 = 15, segN = 12, rails = [[-0.32, 0.3], [0.32, 0.3], [-0.32, -0.3], [0.32, -0.3]];
      for (const [x, y] of rails) beam(P(x, y + 0.4, z0), P(x * 0.7, y * 0.7 + 0.4, z1), 0.13, 0.13, M.craneM, G);
      beam(P(0, 0.4, z0), P(0, 0.4, z1), 0.2, 0.26, M.stoneDk, G);   // solid spine so the arm reads at a distance
      for (let i = 0; i < segN; i++) {
        const za = z0 + (z1 - z0) * i / segN, zb = z0 + (z1 - z0) * (i + 1) / segN, ka = 1 - 0.3 * i / segN, kb = 1 - 0.3 * (i + 1) / segN;
        const up = i % 2 ? 1 : -1;
        beam(P(-0.32 * ka, 0.3 * ka + 0.4, za), P(0.32 * kb, 0.3 * kb + 0.4, zb), 0.07, 0.07, M.craneM, G);
        beam(P(-0.32 * ka, -0.3 * ka + 0.4, za), P(-0.32 * kb, 0.3 * kb + 0.4, zb), 0.07, 0.07, M.craneM, G);
        beam(P(0.32 * ka, up * 0.3 * ka + 0.4, za), P(0.32 * kb, -up * 0.3 * kb + 0.4, zb), 0.07, 0.07, M.craneM, G);
      }
      add(new THREE.BoxGeometry(0.1, 0.1, 17), M.gold, HM(0, 0.76, 5.2), G);              // accent rail
      // counterweight stack
      for (let w = 0; w < 4; w++) add(new THREE.BoxGeometry(1.1, 0.24, 0.7), w % 2 ? M.cable : M.stoneDk, HM(0, -0.15 - w * 0.27, -3.9), G);
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), M.craneM, HM(0, -0.5, -3.9), G);
      // remote pan/tilt head + broadcast camera (hangs below the arm tip, looks along the arm)
      {
        const C = (x, y, z, ex) => HM(x, y, z, ex);
        // drop post + pan motor
        // tip mount: solid end plate tying the truss rails together, with the drop post running up into it
        add(new THREE.BoxGeometry(0.62, 0.72, 0.26), M.craneM, C(0, 0.38, 15.0), G);
        add(new THREE.BoxGeometry(0.66, 0.08, 0.3), M.gold, C(0, 0.02, 15.0), G);
        for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.05, 0.5, 0.5), M.craneM, C(s * 0.29, 0.3, 14.82), G);   // cheek plates
        add(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 10), M.craneM, C(0, -0.05, 15.1), G);
        add(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 16), M.stoneDk, C(0, -0.25, 15.1), G);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 16), M.gold, C(0, -0.19, 15.1), G);
        // L-bracket: horizontal arm + one-sided tilt plate (side-mounted, like a real remote head)
        add(new THREE.BoxGeometry(0.42, 0.05, 0.12), M.craneM, C(0.14, -0.34, 15.1), G);
        add(new THREE.BoxGeometry(0.05, 0.42, 0.22), M.craneM, C(0.33, -0.53, 15.1), G);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), M.stoneDk, C(0.29, -0.62, 15.1, RZ(PI / 2)), G);   // tilt motor
        // camera body (slightly tilted down), rounded shoulder-camera profile
        const cam = (x, y, z, ex) => C(0.02, -0.62, 15.1, RX(0.18).multiply(new THREE.Matrix4().makeScale(1.35, 1.35, 1.35)).multiply(T(x, y, z)).multiply(ex || new THREE.Matrix4()));
        add(new THREE.CapsuleGeometry(0.11, 0.38, 4, 10).rotateX(PI / 2), M.camBody, cam(0, 0, 0), G);              // main body
        add(new THREE.BoxGeometry(0.2, 0.17, 0.42), M.camBody, cam(0, -0.04, -0.02), G);
        add(new THREE.BoxGeometry(0.21, 0.04, 0.3), M.craneM, cam(0, -0.13, 0.0), G);                        // base plate
        add(new THREE.BoxGeometry(0.16, 0.12, 0.1), M.stoneDk, cam(0, 0.0, -0.3), G);                         // battery
        add(new THREE.BoxGeometry(0.22, 0.012, 0.05), M.gold, cam(0, 0.115, 0.05), G);                        // brand stripe
        // carry handle
        add(new THREE.BoxGeometry(0.03, 0.03, 0.26), M.craneM, cam(0, 0.2, 0.02), G);
        for (const z of [-0.1, 0.14]) add(new THREE.BoxGeometry(0.03, 0.08, 0.03), M.craneM, cam(0, 0.15, z), G);
        // viewfinder on a little arm
        add(new THREE.BoxGeometry(0.03, 0.03, 0.12), M.craneM, cam(-0.1, 0.13, 0.12), G);
        add(new THREE.BoxGeometry(0.1, 0.075, 0.13), M.stoneDk, cam(-0.17, 0.13, 0.1), G);
        add(new THREE.PlaneGeometry(0.075, 0.05), M.gCyan, cam(-0.17, 0.13, 0.031, new THREE.Matrix4().makeRotationY(PI)), G);
        // zoom lens: tapered barrel with grip rings, front element, sunshade
        const lens = new THREE.LatheGeometry([[0.0, 0], [0.075, 0], [0.078, 0.06], [0.085, 0.07], [0.085, 0.22], [0.095, 0.24], [0.095, 0.32], [0.105, 0.34], [0.105, 0.44], [0.0, 0.44]]
          .map(([r, y]) => new THREE.Vector2(r, y)), 18).rotateX(PI / 2);
        add(lens, M.cable, cam(0, 0.0, 0.3), G);
        for (const z of [0.42, 0.56, 0.66]) add(new THREE.TorusGeometry(0.093 + (z - 0.42) * 0.07, 0.008, 4, 18), M.craneM, cam(0, 0.0, z), G);
        add(new THREE.CircleGeometry(0.09, 18), M.boothGlass, cam(0, 0.0, 0.745), G);
        add(new THREE.CylinderGeometry(0.13, 0.11, 0.1, 18, 1, true).rotateX(PI / 2), M.cable, cam(0, 0.0, 0.79), G);   // sunshade
        add(new THREE.BoxGeometry(0.05, 0.07, 0.14), M.stoneDk, cam(0.11, -0.02, 0.42), G);                  // zoom servo
        // tally lights (front + back)
        add(new THREE.SphereGeometry(0.022, 8, 6), M.beacon, cam(0.06, 0.1, 0.2), G);
        add(new THREE.SphereGeometry(0.022, 8, 6), M.beacon, cam(0.06, 0.06, -0.36), G);
      }
      // operator monitor, hung from the arm on a bracket
      add(new THREE.BoxGeometry(0.04, 0.42, 0.04), M.craneM, HM(0, 0.0, 14.55), G);
      add(new THREE.BoxGeometry(0.48, 0.36, 0.08), M.stoneDk, HM(0, -0.32, 14.58), G);
      add(new THREE.PlaneGeometry(0.42, 0.3), M.gCyan, HM(0, -0.32, 14.535, new THREE.Matrix4().makeRotationY(PI)), G);
      // dangling cable from the head back along the arm
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(0.25, -0.62, 14.95), P(0.2, -0.3, 14.6), P(0, -0.9, 12), P(0, -0.6, 6), P(0, -1.1, 2), P(0, -0.2, -0.2)]), 30, 0.035, 4, false), M.cable, null, G);
      pivots[G] = head.clone();
    });
  }

  // ---------- merge ----------
  // Viewer only: cut ring-shaped meshes into angular wedges (sharing one vertex buffer) so the
  // renderer can skip the wedges that are off-screen. The exported model stays in one piece.
  const SLICE = new Set(['Structure', 'Statues', 'StatuesLow', 'AtticLights', 'Flames', 'Island', 'Crystals', 'Halo', 'GravityRings', 'Asteroids']);
  const WEDGES = 8;
  function sliceByAngle(geo) {
    const idx = geo.index.array, pos = geo.attributes.position.array, lists = Array.from({ length: WEDGES + 1 }, () => []);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, cc = idx[i + 2] * 3;
      const x = (pos[a] + pos[b] + pos[cc]) / 3, z = (pos[a + 2] + pos[b + 2] + pos[cc + 2]) / 3;
      const k = Math.hypot(x, z) < 34 ? WEDGES : Math.floor(((Math.atan2(x, z) + PI) / TAU) * WEDGES) % WEDGES;
      lists[k].push(idx[i], idx[i + 1], idx[i + 2]);
    }
    const out = [], box = new THREE.Box3(), v = new THREE.Vector3();
    for (const list of lists) {
      if (!list.length) continue;
      const g = new THREE.BufferGeometry();
      for (const [name, attr] of Object.entries(geo.attributes)) g.setAttribute(name, attr);   // shared: uploaded once
      const max = geo.attributes.position.count;
      g.setIndex(new THREE.BufferAttribute(max > 65535 ? new Uint32Array(list) : new Uint16Array(list), 1));
      box.makeEmpty();
      for (const j of list) box.expandByPoint(v.fromArray(pos, j * 3));
      g.boundingBox = box.clone(); g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      out.push(g);
    }
    return out;
  }
  const root = new THREE.Group();
  root.name = 'IntergalacticColosseum';
  for (const [group, map] of Object.entries(bins)) {
    const g = new THREE.Group(); g.name = group;
    for (const [m, geos] of map) {
      const merged = mergeGeometries(geos, false);
      if (pivots[group]) merged.translate(-pivots[group].x, -pivots[group].y, -pivots[group].z);
      const glowy = m.emissiveIntensity > 0 && m.color.getHex() === 0;
      const parts = opts.slice && SLICE.has(group) ? sliceByAngle(merged) : [merged];
      parts.forEach((geo, k) => {
        const mesh = new THREE.Mesh(geo, m);
        mesh.name = parts.length > 1 ? `${group}_${m.name}_${k}` : `${group}_${m.name}`;
        mesh.castShadow = !glowy; mesh.receiveShadow = true;
        g.add(mesh);
      });
    }
    if (pivots[group]) g.position.copy(pivots[group]);
    root.add(g);
  }
  const aisles = [];
  for (let s = 0; s < 4; s++) for (const f of [1 / 3, 2 / 3]) aisles.push(s * PI / 2 + GAP / 2 + f * SECT);
  const info = { sat: satInfo, port: portInfo, R0, RUN, RISE, Y0, STEPS, GAP, SECT, RTOP, YTOP, aisles, screenAngles, towerR: 61.5 + D, haloR: 46 + D };
  return { root, materials: M, info };
}
