import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let layoutGroup, floatGroup, staticTiltGroup, scrollSpinGroup, mouseSpinGroup, regionRotGroup, standUpGroup;
let scene, camera, renderer;
let isInteractionActive = false;

let morphGeometries = [];
let grainClones = [];
let grainCloneData = [];
let explosionStarted = false;
let logoParts = { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null };
let logoPartsInitialPos = {};
let logoPartsScatteredPos = {};
let logoPartsScrollPos = {};
let mapSphereMat = null;
let mapSphereMaxAlpha = 50;
let mapSphereRef = null;
let regionTargetRot = null; // { x, y } target rotation for map sphere
let regionDefaultRot = null; // saved default rotation

const DESKTOP_MAX_RENDER_DPR = 1.25;
const MOBILE_MAX_RENDER_DPR = 1.1;
const MAP_SPHERE_SEGMENTS = 48;
const MAP_TEXTURE_WIDTH = 1024;
const GRAIN_PARTICLE_COUNT = 400;
const LOGO_ENTRY_GAP = 8.5;
const LOGO_SCROLL_GAP = 10;
const MOBILE_MODEL_SCALE = 0.72;
const TABLET_MODEL_SCALE = 0.82;

// ========================================================
// REGION COORDINATES — adjust lat/lon values to fine-tune
// lat: vertical (-90 to 90), lon: horizontal (-180 to 180)
// ========================================================
const REGION_COORDS = {
    americas:  { lat: -5,  lon: -10 },
    asia:      { lat: -5,  lon: 110 },
    emea:      { lat: -5,  lon: 60 }
};

export function getGrainData() {
    return { grainCloneData, standUpGroup: standUpGroup };
}

let throwInitialized = false;

function getResponsiveModelScale() {
    if (window.innerWidth <= 540) return MOBILE_MODEL_SCALE;
    if (window.innerWidth <= 900) return TABLET_MODEL_SCALE;

    return 1;
}

function applyUnlitMaterial(object3D) {
    object3D.traverse((node) => {
        if (!node.isMesh || !node.material) return;

        const source = node.material;
        node.material = new THREE.MeshBasicMaterial({
            color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
            map: source.map || null,
            vertexColors: Boolean(node.geometry?.attributes?.color),
            transparent: source.transparent,
            opacity: source.opacity ?? 1,
            side: source.side
        });
    });
}

function setLogoPartOpacity(part, opacity) {
    part.traverse((child) => {
        if (!child.material) return;

        child.material.opacity = opacity;
        child.material.transparent = opacity < 1;
    });
}

export function throwGrainsRight(progress) {
    if (!grainCloneData.length) return;

    // Réinitialiser si on revient à progress = 0 (scroll vers le haut)
    if (progress <= 0 && throwInitialized) {
        throwInitialized = false;
        // Reparenter les graines dans standUpGroup (retour à leur groupe d'origine)
        grainCloneData.forEach((data) => {
            if (data.reparented) {
                scene.remove(data.mesh);
                standUpGroup.add(data.mesh);
                data.mesh.position.copy(data.sphPos);
                data.mesh.rotation.set(data.origRotation.x, data.origRotation.y, data.origRotation.z);
                data.reparented = false;
            }
            data.mesh.visible = true;
            data.mesh.traverse(node => {
                if (node.material) {
                    node.material.opacity = 1;
                    node.material.transparent = false;
                }
            });
        });
        return;
    }

    if (!throwInitialized && progress > 0) {
        throwInitialized = true;
        // Compute sphere center in world coords
        standUpGroup.updateWorldMatrix(true, false);
        const sphereCenter = new THREE.Vector3();
        standUpGroup.getWorldPosition(sphereCenter);
        sphereCenter.y -= 7;

        grainCloneData.forEach((data) => {
            data.mesh.visible = true;
            // Sauvegarder la rotation d'origine
            data.origRotation = { x: data.mesh.rotation.x, y: data.mesh.rotation.y, z: data.mesh.rotation.z };
            // Calculer la position monde actuelle de la graine
            data.mesh.updateWorldMatrix(true, false);
            const worldPos = new THREE.Vector3();
            data.mesh.getWorldPosition(worldPos);
            // Reparenter dans la scène directement (coordonnées monde)
            standUpGroup.remove(data.mesh);
            scene.add(data.mesh);
            data.mesh.position.copy(worldPos);
            data.reparented = true;
            worldPos.y -= 7;
            // Compress start positions toward sphere center for tighter initial cluster
            data.worldStart = new THREE.Vector3(
                sphereCenter.x + (worldPos.x - sphereCenter.x) * 0.3,
                sphereCenter.y + (worldPos.y - sphereCenter.y) * 0.3,
                sphereCenter.z + (worldPos.z - sphereCenter.z) * 0.3
            );
            // Cible : bas-gauche → haut-droit, wider spread at end, closer to camera
            data.throwTarget = new THREE.Vector3(
                worldPos.x + 25 + Math.random() * 20,
                worldPos.y + 12 + Math.random() * 10,
                worldPos.z + 3 + Math.random() * 3
            );
            data.throwSpin = (Math.random() - 0.5) * Math.PI * 6;
            data.throwStartRot = {
                x: data.mesh.rotation.x,
                z: data.mesh.rotation.z
            };
        });
    }

    grainCloneData.forEach((data) => {
        if (progress <= 0 || !data.throwTarget || !data.worldStart) return;
        data.mesh.visible = true;
        const t = Math.min(progress, 1);
        const spread = Math.pow(t, 0.6);
        const startX = data.worldStart.x;
        const startY = data.worldStart.y;
        const startZ = data.worldStart.z;
        const x = startX + (data.throwTarget.x - startX) * spread;
        const y = startY + (data.throwTarget.y - startY) * spread;
        const z = startZ + (data.throwTarget.z - startZ) * spread;
        data.mesh.position.set(x, y, z);
        data.mesh.rotation.x = data.throwStartRot.x + data.throwSpin * t;
        data.mesh.rotation.z = data.throwStartRot.z + data.throwSpin * t * 0.7;
        if (t > 0.5) {
            const fadeT = (t - 0.5) / 0.5;
            data.mesh.traverse(node => {
                if (node.material) {
                    node.material.opacity = Math.max(0, 0.9 * (1 - fadeT));
                    node.material.transparent = true;
                }
            });
        }
    });
}

export function init3D(onModelLoaded) {
    const container = document.getElementById('webgl-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: (window.devicePixelRatio || 1) <= 1.5
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.innerWidth <= 900 ? MOBILE_MAX_RENDER_DPR : Math.min(window.devicePixelRatio || 1, DESKTOP_MAX_RENDER_DPR));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xefede1, 5);
    directionalLight.position.set(13, 13, 13);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xefede1, 0.8);
    directionalLight2.position.set(-13, -11, 13);
    scene.add(directionalLight2);
    const directionalLight3 = new THREE.DirectionalLight(0xefede1, 0.6);
    directionalLight3.position.set(9, 13, -13);
    scene.add(directionalLight3);

    layoutGroup = new THREE.Group(); scene.add(layoutGroup);
    floatGroup = new THREE.Group(); layoutGroup.add(floatGroup);

    staticTiltGroup = new THREE.Group();
    staticTiltGroup.rotation.z = 0; staticTiltGroup.rotation.x = 0;
    floatGroup.add(staticTiltGroup);

    scrollSpinGroup = new THREE.Group(); staticTiltGroup.add(scrollSpinGroup);

    mouseSpinGroup = new THREE.Group(); scrollSpinGroup.add(mouseSpinGroup);

    regionRotGroup = new THREE.Group(); mouseSpinGroup.add(regionRotGroup);
    window.__regionRotGroup = regionRotGroup;
    standUpGroup = new THREE.Group(); regionRotGroup.add(standUpGroup);

    const loader = new GLTFLoader();
    loader.load((window.__themeUri || '') + '/assets/mesh/seed-3d-model.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.5 / maxDim;

        const logoMeshes = [];
        const partNameToKey = {
            topleft: 'topLeft',
            top_left: 'topLeft',
            top: 'topLeft',
            topright: 'topRight',
            top_right: 'topRight',
            bottomleft: 'bottomLeft',
            bottom_left: 'bottomLeft',
            bottomright: 'bottomRight',
            bottom_right: 'bottomRight'
        };

        model.traverse((child) => {
            if (child.isMesh) {
                const name = child.name || '';
                const normalizedName = name.replace(/[\s.-]/g, '').toLowerCase();
                const partKey = partNameToKey[normalizedName];

                if (partKey && !logoParts[partKey]) {
                    const clonedMesh = child.clone();
                    applyUnlitMaterial(clonedMesh);
                    logoParts[partKey] = clonedMesh;
                    clonedMesh.name = 'mesh_' + partKey;
                    standUpGroup.add(clonedMesh);
                } else if (name.match(/Curve\.?00[1-8]|Curve00[1-8]/)) {
                    logoMeshes.push(child);
                }
            }
        });

        const partOrder = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        logoMeshes.forEach((mesh, index) => {
            if (index >= partOrder.length) return;

            const partKey = partOrder[index];

            if (logoParts[partKey]) return;

            const clonedMesh = mesh.clone();
            applyUnlitMaterial(clonedMesh);
            logoParts[partKey] = clonedMesh;
            clonedMesh.name = 'mesh_' + partKey;
            standUpGroup.add(clonedMesh);
        });

        const scaledCenter = center.clone().multiplyScalar(scale);
        standUpGroup.children.forEach(c => {
            c.scale.set(scale, scale, scale);
            c.position.sub(scaledCenter);
        });

        const visualCenters = {};
        const logoCenter = new THREE.Vector3();
        const loadedLogoParts = Object.entries(logoParts).filter(([, part]) => Boolean(part));
        loadedLogoParts.forEach(([key, part]) => {
            const partBox = new THREE.Box3().setFromObject(part);
            const partCenter = partBox.getCenter(new THREE.Vector3());
            visualCenters[key] = partCenter;
            logoCenter.add(partCenter);
        });
        logoCenter.divideScalar(Math.max(loadedLogoParts.length, 1));

        for (const [key, part] of Object.entries(logoParts)) {
            if (part) {
                logoPartsInitialPos[key] = part.position.clone();

                const direction = (visualCenters[key] || logoPartsInitialPos[key]).clone().sub(logoCenter);
                if (direction.lengthSq() < 0.0001) {
                    const fallbackDirections = {
                        topLeft: new THREE.Vector3(-1, 1, 0),
                        topRight: new THREE.Vector3(1, 1, 0),
                        bottomLeft: new THREE.Vector3(-1, -1, 0),
                        bottomRight: new THREE.Vector3(1, -1, 0)
                    };
                    direction.copy(fallbackDirections[key] || new THREE.Vector3(1, 0, 0));
                }
                direction.normalize();

                logoPartsScatteredPos[key] = logoPartsInitialPos[key].clone().addScaledVector(direction, LOGO_ENTRY_GAP);
                logoPartsScrollPos[key] = logoPartsInitialPos[key].clone().addScaledVector(direction, LOGO_SCROLL_GAP);
                part.position.copy(logoPartsScatteredPos[key]);
                setLogoPartOpacity(part, 0);
            }
        }

        // Centrer layoutGroup à (0,0,0) pour éviter le saut
        layoutGroup.position.set(0, 0, 0);
        layoutGroup.scale.set(0, 0, 0);

        updateLayout();

        // Appeler onModelLoaded dès que le mesh principal est prêt
        if (onModelLoaded) onModelLoaded();

        // Load map texture inside the sphere
        loadMapSphere(standUpGroup);

        // Différer le chargement des petits grains pour ne pas saccader le loader
        // On attend 3s (après l'animation hero) avant de charger
        setTimeout(() => {
            const loaderBD = new GLTFLoader();
            loaderBD.load((window.__themeUri || '') + '/assets/mesh/soufflet-malt-bd-petite.glb', (gltfBD) => {
                model.traverse((child) => {
                    if (child.isMesh) {
                        loadGrainParticles(gltfBD, child);
                    }
                });
            });
        }, 3000);
    }, undefined, () => {
        if (onModelLoaded) onModelLoaded();
    });

    return { layoutGroup, scrollSpinGroup, morphGeometries, updateMorph, updateLogoMorph, floatGroup, mouseSpinGroup, regionRotGroup, isInteractionActive, renderer, scene, camera, standUpGroup };
}

function loadGrainParticles(gltfBD, originalChild) {
    const modelBD = gltfBD.scene;
    const boxBD = new THREE.Box3().setFromObject(modelBD);
    const centerBD = boxBD.getCenter(new THREE.Vector3());
    const sizeBD = boxBD.getSize(new THREE.Vector3());
    const scaleBD = 5.5 / Math.max(sizeBD.x, sizeBD.y, sizeBD.z);

    const customGrainMaterialSmooth = new THREE.MeshStandardMaterial({
        color: 0xC9A559,
        metalness: 0,
        roughness: 1,
        vertexColors: true,
        flatShading: false,
        transparent: true,
        opacity: 0.9
    });
    const customGrainMaterialFlat = new THREE.MeshStandardMaterial({
        color: 0xC9A559,
        metalness: 0,
        roughness: 1,
        vertexColors: true,
        flatShading: true,
        transparent: true,
        opacity: 0.9
    });

    let vertexColorsApplied = false;
    modelBD.traverse((childBD) => {
        if (childBD.isMesh && childBD.geometry && !vertexColorsApplied) {
            vertexColorsApplied = true;
            const geo = childBD.geometry;
            const posAttr = geo.attributes.position;
            const count = posAttr.count;
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            for (let i = 0; i < count; i++) {
                const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
                if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            }
            const rangeX = maxX - minX, rangeY = maxY - minY, rangeZ = maxZ - minZ;
            let mainAxis = 'y', mainMin = minY, mainRange = rangeY;
            if (rangeX > rangeY && rangeX > rangeZ) { mainAxis = 'x'; mainMin = minX; mainRange = rangeX; }
            if (rangeZ > rangeX && rangeZ > rangeY) { mainAxis = 'z'; mainMin = minZ; mainRange = rangeZ; }

            const colors = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                let val;
                if (mainAxis === 'x') val = posAttr.getX(i);
                else if (mainAxis === 'y') val = posAttr.getY(i);
                else val = posAttr.getZ(i);
                const t = 1 - (val - mainMin) / (mainRange || 1);
                let brightness;
                if (t < 0.1) {
                    brightness = 0.3;
                } else if (t < 0.2) {
                    brightness = 0.3 + (t - 0.1) / 0.1 * 0.7;
                } else {
                    brightness = 1.0;
                }
                colors[i * 3] = brightness;
                colors[i * 3 + 1] = brightness;
                colors[i * 3 + 2] = brightness;
            }
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
    });

    modelBD.traverse((childBD) => {
        if (childBD.isMesh && !grainClones.length) {
            for (let i = 0; i < GRAIN_PARTICLE_COUNT; i++) {
                const clonedMesh = childBD.clone();
                const scaleX = 0.15 + Math.random() * 0.1;
                const scaleY = 0.15 + Math.random() * 0.1;
                const scaleZ = 0.15 + Math.random() * 0.1;
                clonedMesh.scale.set(scaleX, scaleY, scaleZ);
                clonedMesh.position.copy(originalChild.position);
                clonedMesh.position.x += (Math.random() - 0.5) * 0.6;
                clonedMesh.position.y += (Math.random() - 0.5) * 0.6;
                clonedMesh.position.z += (Math.random() - 0.5) * 0.6;
                clonedMesh.rotation.x = Math.random() * Math.PI * 2;
                clonedMesh.rotation.y = Math.random() * Math.PI * 2;
                clonedMesh.rotation.z = Math.random() * Math.PI * 2;
                const isFlat = Math.random() < 0.3;
                clonedMesh.traverse(node => {
                    if (node.isMesh) {
                        node.material = isFlat ? customGrainMaterialFlat : customGrainMaterialSmooth;
                    }
                });

                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);
                const explRadius = 5 + Math.random() * 3;
                const explPos = new THREE.Vector3(
                    explRadius * Math.sin(phi) * Math.cos(theta),
                    explRadius * Math.sin(phi) * Math.sin(theta),
                    explRadius * Math.cos(phi)
                );

                const u2 = Math.random(), v2 = Math.random();
                const theta2 = 2 * Math.PI * u2, phi2 = Math.acos(2 * v2 - 1);
                const r = 4.0;
                const sphPos = new THREE.Vector3(
                    r * Math.sin(phi2) * Math.cos(theta2),
                    r * Math.sin(phi2) * Math.sin(theta2),
                    r * Math.cos(phi2)
                );

                grainClones.push(clonedMesh);
                grainCloneData.push({
                    mesh: clonedMesh,
                    origPos: originalChild.position.clone(),
                    explPos: explPos,
                    sphPos: sphPos
                });
            }
        }
    });
}

function loadMapSphere(parentGroup) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        // Force high-res render for SVG (default may be tiny)
        const texW = MAP_TEXTURE_WIDTH;
        const texH = Math.round(texW * (img.height / img.width)) || 1024;
        const canvas = document.createElement('canvas');
        canvas.width = texW;
        canvas.height = texH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, texW, texH);
        const imageData = ctx.getImageData(0, 0, texW, texH);
        const data = imageData.data;

        // Only opaque pixels (continents) → gold semi-transparent; transparent bg stays transparent
        for (let i = 0; i < data.length; i += 4) {
            const origAlpha = data[i + 3];
            if (origAlpha < 10) {
                // Transparent pixel (SVG background) → keep fully transparent
                data[i + 3] = 0;
            } else {
                // Filled pixel (continent) → gold semi-transparent
                data[i]     = 216;  // R (gold)
                data[i + 1] = 180;  // G (gold)
                data[i + 2] = 82;   // B (gold)
                data[i + 3] = Math.floor((origAlpha / 255) * 60); // ~24% opacity
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.SphereGeometry(3.7, MAP_SPHERE_SEGMENTS, MAP_SPHERE_SEGMENTS);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.FrontSide,
            blending: THREE.NormalBlending
        });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.renderOrder = -1;
        sphere.visible = false;
        mapSphereMat = mat;
        mapSphereRef = sphere;
        parentGroup.add(sphere);
        window.__mapSphere = sphere;
    };
    img.src = (window.__themeUri || '') + '/assets/images/map-vecto.svg';
}

// Rotate the whole sphere (grains + map) to show a specific region
export function rotateSphereToRegion(regionKey) {
    if (!regionRotGroup) return;
    if (!regionDefaultRot) {
        regionDefaultRot = { x: regionRotGroup.rotation.x, y: regionRotGroup.rotation.y };
    }
    if (!regionKey) {
        regionTargetRot = { x: regionDefaultRot.x, y: regionDefaultRot.y };
        return;
    }
    const coords = REGION_COORDS[regionKey];
    if (!coords) return;
    const lonRad = -(coords.lon * Math.PI) / 180;
    const latRad = (coords.lat * Math.PI) / 180;
    regionTargetRot = { x: latRad, y: lonRad };
}

// Call this every frame to smoothly interpolate sphere rotation
export function updateMapSphereRotation() {
    if (!regionRotGroup || !regionTargetRot) return;
    const lerp = 0.05;
    regionRotGroup.rotation.x += (regionTargetRot.x - regionRotGroup.rotation.x) * lerp;
    regionRotGroup.rotation.y += (regionTargetRot.y - regionRotGroup.rotation.y) * lerp;
}

export function updateLayout() {
    if (!layoutGroup || window.scrollY > 10) return;

    if (standUpGroup) {
        const modelScale = getResponsiveModelScale();
        standUpGroup.scale.set(modelScale, modelScale, modelScale);
    }

    if (window.innerWidth <= 900) {
        layoutGroup.position.set(0, -0.2, 0);
    } else {
        layoutGroup.position.set(2.7, 0, 0);
    }
}

export function updateLogoMorph(val) {
    const opacity = Math.min(Math.max((val - 0.35) / 0.65, 0), 1);

    for (const [key, part] of Object.entries(logoParts)) {
        if (!part || !logoPartsInitialPos[key]) continue;

        const centeredPos = logoPartsInitialPos[key];
        const scatteredPos = logoPartsScatteredPos[key] || centeredPos;
        const scrollPos = logoPartsScrollPos[key] || scatteredPos;

        if (val <= 1) {
            part.position.lerpVectors(scatteredPos, centeredPos, val);
        } else {
            const scrollVal = Math.min(val - 1, 1);
            part.position.lerpVectors(centeredPos, scrollPos, scrollVal);
        }

        setLogoPartOpacity(part, opacity);
    }
}

export function updateMorph(val) {
    updateLogoMorph(1 + Math.min(val / 2, 1));

    const grainOpacity = Math.min(Math.max(val / 0.6, 0), 1) * 0.9;
    const logoOpacity = Math.max(0, 1 - Math.min(val / 2, 1));

    for (const [, part] of Object.entries(logoParts)) {
        if (!part) continue;
        setLogoPartOpacity(part, logoOpacity);
    }

    if (val <= 1) {
        if (!explosionStarted) {
            explosionStarted = true;
            grainCloneData.forEach(data => {
                standUpGroup.add(data.mesh);
            });
        }
        grainCloneData.forEach(data => {
            const t = val;
            data.mesh.visible = val > 0.02;
            data.mesh.traverse(node => {
                if (node.material) {
                    node.material.opacity = grainOpacity;
                    node.material.transparent = true;
                }
            });
            data.mesh.position.lerpVectors(data.origPos, data.explPos, t);
        });
    } else if (val > 1 && val <= 2) {
        const reconstitVal = val - 1;
        grainCloneData.forEach(data => {
            data.mesh.visible = true;
            data.mesh.traverse(node => {
                if (node.material) {
                    node.material.opacity = 0.9;
                    node.material.transparent = true;
                }
            });
            data.mesh.position.lerpVectors(data.explPos, data.sphPos, reconstitVal);
        });
    } else if (val > 2) {
        grainCloneData.forEach(data => {
            data.mesh.visible = true;
            data.mesh.position.copy(data.sphPos);
        });
    }

    // Map sphere: fade in only when grains form the sphere (val 1.5 → 2)
    if (window.__mapSphere && mapSphereMat) {
        if (val >= 2) {
            window.__mapSphere.visible = true;
            mapSphereMat.opacity = 1;
        } else if (val > 1.5) {
            window.__mapSphere.visible = true;
            mapSphereMat.opacity = (val - 1.5) / 0.5;
        } else {
            window.__mapSphere.visible = false;
            mapSphereMat.opacity = 0;
        }
    }
}
