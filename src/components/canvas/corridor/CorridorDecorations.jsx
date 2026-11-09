import { useMemo, useState, useRef, useEffect } from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { isTouchDevice } from '../../../utils/deviceDetect';
/**
 * CorridorDecorations - Dekoracje korytarza.
 * 
 * Proste płaskie plane'y z teksturami - styl rysunkowy 2D w świecie 3D.
 * 
 * Korytarz (per segment, 80 units):
 *   Drzwi: relZ -18 (left), -32 (right), -48 (left), -62 (right)
 *   corridorWidth: ~3.5 per side
 *   corridorHeight: 3.5
 *   Bezpieczne strefy dekoracji: -5 do -15, -20 do -30, -34 do -46, -50 do -60, -64 do -75
 */

// Globalne zmienne dla useFrame, aby uniknąć alokacji pamięci w każdej klatce i zapobiec ścinkom (GC stalls)
const tempPos = new THREE.Vector3();
const tempRot = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempCamDir = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempQuat = new THREE.Quaternion();


const CABIN_SKETCH_URL = '/fonts/CabinSketch-Regular.ttf';

const PictureContent = ({ imagePath, imagePaintedPath, width, height, isPainted }) => {
    const texture = useTexture(imagePath);
    // Render nothing if no painted path, but we still call the hook unconditionally to respect hook rules
    const paintedTexture = useTexture(imagePaintedPath || imagePath);

    const materialRef = useRef();

    useEffect(() => {
        if (!materialRef.current || !imagePaintedPath) return;

        if (isPainted) {
            gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
    }, [isPainted, imagePaintedPath]);

    return (
        <group position={[0, 0, 0.01]}> {/* Lekko przed ramką */}
            {imagePaintedPath && (
                <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color={'#F6F0E5'}
                        map={paintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                {imagePaintedPath ? (
                    <revealMaterial color={'#F6F0E5'}
                        ref={materialRef}
                        map={texture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                        uProgress={0.0}
                    />
                ) : (
                    <meshBasicMaterial color={'#F6F0E5'}
                        map={texture}
                        transparent={true}
                        alphaTest={0.1} // KLUCZOWE: Naprawia przezroczystość (wycina tło)
                        side={THREE.DoubleSide}
                        roughness={0.5}
                    />
                )}
            </mesh>
        </group>
    );
};

const InspectableFrame = ({ frame, wallX, frameTexture, framePaintedTexture, CABIN_SKETCH_URL, setCameraOverride }) => {
    const { camera, viewport } = useThree();
    const groupRef = useRef();
    const frameMaterialRef = useRef();
    const framePaintedRef = useRef();
    const compileFramesRef = useRef(0);
    const hideDelayRef = useRef();

    // Zapisujemy oryginalną pozycję i rotację na ścianie
    const originalPos = useMemo(() => new THREE.Vector3(
        frame.side === 'left' ? -wallX + (frame.offsetFromWall || 0) : wallX - (frame.offsetFromWall || 0),
        frame.y,
        frame.z
    ), [frame, wallX]);

    const originalRot = useMemo(() => new THREE.Euler(
        0, frame.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0
    ), [frame.side]);

    const [isHovered, setIsHovered] = useState(false);
    const [isInspected, setIsInspected] = useState(false);

    // Sprawdzamy czy to urządzenie dotykowe (telefon/tablet) by całkowicie wyłączyć efekt hover i podnieść wydajność
    const isTouch = useMemo(() => isTouchDevice(), []);
    // Zostawiamy też stary mechanizm żeby odłączyć na ekstremalnie wąskich ekranach w ogóle inspected
    const isMobile = viewport.width < 5 || viewport.aspect < 0.8 || isTouch;

    // Kiedy komponent znika, na wszelki wypadek wyłączamy override
    useEffect(() => {
        return () => {
            if (isInspected) {
                if (setCameraOverride) setCameraOverride(false);
                window.dispatchEvent(new CustomEvent('inspectChange', { detail: false }));
            }
        };
    }, [isInspected, setCameraOverride]);

    useEffect(() => {
        if (isHovered && !isMobile) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
    }, [isHovered, isMobile]);

    useEffect(() => {
        if (!frameMaterialRef.current) return;

        const shouldBePainted = isHovered || isInspected;

        if (shouldBePainted) {
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (framePaintedRef.current) framePaintedRef.current.visible = true;

            gsap.to(frameMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(frameMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });

            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (framePaintedRef.current) framePaintedRef.current.visible = false;
            });
        }

        return () => {
            if (hideDelayRef.current) hideDelayRef.current.kill();
        };
    }, [isHovered, isInspected]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        if (compileFramesRef.current < 2) {
            compileFramesRef.current++;
            if (compileFramesRef.current === 2) {
                if (!isHovered && !isInspected && framePaintedRef.current) {
                    framePaintedRef.current.visible = false;
                }
            }
        }

        if (isInspected) {
            // Pozycja przed kamerą (bliżej)
            camera.getWorldDirection(tempCamDir);

            // Obliczamy responsywny dystans (fluid responsive)
            // Gdy aspekt (szerokość/wysokość) jest mniejszy (wąskie ekrany np. laptopy max 1.3), odsuwamy obraz dalej (np. 2.2)
            // Gdy aspekt jest duży (ultrawide, 16:9 ~ 1.77), przysuwamy obraz bliżej (np. 1.5)
            // clamp(1.5, 2.8)
            const baseDistance = 1.3;
            // Im mniejszy aspekt (węższy ekran), tym większa odległość
            const aspectOffset = Math.max(0, 1.8 - viewport.aspect) * 1.5;
            const distance = Math.min(2.8, Math.max(1.5, baseDistance + aspectOffset));

            // Punkt tuż przed kamerą (zwiększony dynamicznie - im więcej, tym dalej)
            tempPos.copy(camera.position).add(tempCamDir.multiplyScalar(distance));

            // Rotacja zwracająca obraz bezpośrednio do kamery
            tempRot.copy(camera.quaternion);

            // Efekt "3D Karty" na podstawie myszki
            const tiltX = -state.pointer.y * 0.3;
            const tiltY = state.pointer.x * 0.3;
            tempEuler.set(tiltX, tiltY, 0);
            tempQuat.setFromEuler(tempEuler);

            tempRot.multiply(tempQuat);

            // Lekko powiększamy obraz dla detalu
            tempScale.set(1.2, 1.2, 1.2);
        } else {
            // Powrót na ścianę
            tempPos.copy(originalPos);
            tempRot.setFromEuler(originalRot);
            tempScale.set(1, 1, 1);
        }

        // Płynna interpolacja (lerp/slerp) w każdym oknie renderowania
        const factor = delta * 6;
        groupRef.current.position.lerp(tempPos, factor);
        groupRef.current.quaternion.slerp(tempRot, factor);
        groupRef.current.scale.lerp(tempScale, factor);
    });

    return (
        <group
            ref={groupRef}
            position={originalPos}
            rotation={originalRot}
        >
            {/* INVISIBLE HITBOX to catch pointer events smoothly and prevent raycaster from jumping between meshes */}
            <mesh
                position={[0, 0, 0.05]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isMobile) return; // Całkowite wyłączenie na mobile
                    setIsInspected((prev) => {
                        const next = !prev;
                        if (setCameraOverride) setCameraOverride(next); // Blokowanie / odblokowanie poruszania kamerą
                        window.dispatchEvent(new CustomEvent('inspectChange', { detail: next }));
                        return next;
                    });
                    setIsHovered(false);
                }}
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    if (!isInspected && !isMobile) setIsHovered(true);
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                }}
            >
                <planeGeometry args={[frame.width, frame.height]} />
                <meshBasicMaterial color={'#F6F0E5'} transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* RAMKA PAINTED (behind sketch) */}
            {!isTouch && (
                <mesh ref={framePaintedRef} position={[0, 0, -0.001]} scale={[0.98, 0.98, 1]}>
                    <planeGeometry args={[frame.width, frame.height]} />
                    <meshBasicMaterial color={'#F6F0E5'}
                        map={framePaintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}

            {/* RAMKA SKETCH OVERLAY (front) */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[frame.width, frame.height]} />
                <revealMaterial color={'#F6F0E5'}
                    ref={frameMaterialRef}
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.9}
                    uProgress={0.0}
                />
            </mesh>

            {/* OBRAZEK WEWNĄTRZ */}
            {frame.image && (
                <PictureContent
                    imagePath={frame.image}
                    imagePaintedPath={!isTouch ? frame.imagePainted : null}
                    width={frame.imageWidth || frame.width * 0.7}
                    height={frame.imageHeight || frame.height * 0.7}
                    isPainted={isHovered || isInspected}
                />
            )}

            {/* PODPIS */}
            {frame.signature && (
                <Text
                    position={[
                        frame.signatureX !== undefined ? frame.signatureX : (frame.width / 2 - 0.1),
                        frame.signatureY !== undefined ? frame.signatureY : (-frame.height / 2 + 0.15),
                        0.02
                    ]}
                    fontSize={frame.signatureSize || 0.12}
                    font={CABIN_SKETCH_URL}
                    color={frame.signatureColor || "#333333"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {frame.signature}
                </Text>
            )}
        </group>
    );
};

const CorridorDecorations = ({ segmentLength, zOffset, corridorWidth = 4, corridorHeight = 3.5, zClip = 100000, setCameraOverride }) => {

    const wallX = corridorWidth / 2 - 0.01;
    const floorY = -corridorHeight / 2;
    const ceilingY = corridorHeight / 2;

    // =============================================
    // TEKSTURY DEKORACJI
    // =============================================
    const frameTexture = useTexture('/textures/corridor/ramkanazdjecieduza.webp');
    const framePaintedTexture = useTexture('/textures/corridor/ramkanazdjecieduza_painted.webp');
    const standingFrameTexture = useTexture('/textures/corridor/ramkanazdjeciemala.webp');
    const grateTexture = useTexture('/textures/corridor/kratkawentylacyjna.webp');

    // --- Ceiling Lights (punkty światła) ---
    // Tekstury lamp
    const lampGrilleTexture = useTexture('/textures/corridor/kratanalampy.webp');
    // lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.RepeatWrapping; 
    // lampGrilleTexture.repeat.set(1, 1);

    const lampSideTexture = useTexture('/textures/corridor/bokilampy.webp');
    lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.RepeatWrapping;
    // Dopasowanie UV dla długiego boku
    lampSideTexture.repeat.set(1, 1);

    const lights = useMemo(() => {
        const items = [];
        // ===== REGULACJA ŚWIATEŁ =====
        const LIGHT_SPACING = 15;      // Odstęp między lampami
        const LIGHT_START_OFFSET = -5;  // Start z zapasem od początku (bo tam są drzwi poprzedniego segmentu)

        const startZ = zOffset + LIGHT_START_OFFSET;
        const endZ = zOffset - segmentLength + 10; // Zapas od końca (SegmentDoors jest na -75)

        for (let z = startZ; z > endZ; z -= LIGHT_SPACING) {
            items.push({ z });
        }
        return items;
    }, [segmentLength, zOffset]);

    // =============================================
    // RAMKI NA ZDJĘCIA (PICTURE FRAMES)
    // =============================================
    // Płaskie plane'y na ścianach z teksturą ramki.
    // Wewnątrz ramki można później dodać plakaty/zdjęcia.
    //
    // USTAWIENIA DO RĘCZNEJ REGULACJI:
    // - z: pozycja Z (gdzie na osi korytarza), obliczana jako zOffset - wartość
    // - side: 'left' lub 'right'
    // - width/height: rozmiar ramki
    // - y: pozycja Y (wysokość na ścianie, 0 = środek)
    const frames = useMemo(() => [
        {
            z: zOffset - 10,         // Między startem a Gallery (relZ -5 do -15)
            side: 'right',
            width: 2.5,              // Szerokość ramki
            height: 2.5 / 1.785,     // Legacy ratio 3200x1792
            y: 0.3,                  // Wysokość na ścianie
            id: 'frame-1',
            // Custom setup for "rysuneknaobraz1.png"
            image: '/textures/corridor/rysuneknaobraz1.webp',
            imageWidth: 1.1,
            imageHeight: 1.1,
            offsetFromWall: 0.1, // Przesunięcie bliżej środka korytarza (0.1 unit)
        },
        {
            z: zOffset - 25,         // Między Gallery a Studio (relZ -20 do -30)
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.2,
            id: 'frame-2',
            image: '/textures/corridor/rysuneknaobrazek3.webp',
            imageWidth: 1.7,
            imageHeight: 1,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 40,         // Między Studio a About (relZ -34 do -46)
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.25,
            id: 'frame-3',
            signature: "The difference between genius\nand stupidity is that genius\nhas its limits.\n\n— Commonly attributed to Einstein",
            signatureX: 0,
            signatureY: 0,
            signatureSize: 0.12,
            signatureColor: '#333333'
        },
        {
            z: zOffset - 55,         // Między About a Connect (relZ -50 do -60)
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.35,
            id: 'frame-4',
            signature: "It always seems impossible\nuntil it’s done.\n\n— Nelson Mandela",
            signatureX: 0,
            signatureY: 0,
            signatureSize: 0.12,
            signatureColor: '#333333'
        },
    ], [zOffset]);

    // =============================================
    // STOLIK (TABLE)
    // =============================================
    const woodTexture = useTexture('/textures/corridor/texturadrewnadonozekbiurka.webp');
    const tableTopTexture = useTexture('/textures/corridor/gorastolika.webp');

    // Tekstury szafki
    const cabinetFrontTexture = useTexture('/textures/corridor/szafkaprzod.webp');
    const cabinetRestTexture = useTexture('/textures/corridor/szafkaprzodgora.webp');

    // Klonujemy teksturę dla nóg, żeby ją obrócić (bo user mówi że jest poziomo a ma być pionowo)
    const legTexture = useMemo(() => {
        const tex = woodTexture.clone();
        tex.rotation = Math.PI / 2;
        tex.center.set(0.5, 0.5);
        return tex;
    }, [woodTexture]);

    // Konfiguracja stolika
    // Obrócony 90° i przyciągnięty do lewej ściany
    const tableConfig = useMemo(() => ({
        z: zOffset - 35,          // Pozycja Z (strefa między Studio a About)
        width: 2.0,               // Szerokość blatu (po obrocie: wzdłuż ściany)
        depth: 0.8,               // Głębokość blatu (po obrocie: od ściany w korytarz)
        height: 1.0,              // Wysokość całkowita
        legRadius: 0.08,          // Grubość nóg
        topThickness: 0.08,       // Grubość blatu
        x: -wallX + 0.42,         // Przy lewej ścianie (depth/2 + mały gap)
    }), [zOffset, wallX]);

    return (
        <group>
            {/* === LAMPY SUFITOWE === */}
            {lights.filter(light => light.z <= zClip).map((light, i) => {
                // Konfiguracja tekstur wewnątrz pętli (lub poza, ale upewnijmy się co do wrappingu)
                lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.ClampToEdgeWrapping;
                lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.ClampToEdgeWrapping; // Boki też clamp, żeby nie było pasków

                return (
                    <group key={`light-${i}`} position={[0, ceilingY, light.z]}>
                        {/* Obudowa lampy - podłużny prostokąt 3D */}
                        {/* GŁÓWNA BRYŁA */}
                        <mesh position={[0, -0.03, 0]}>
                            <boxGeometry args={[2.0, 0.06, 0.5]} />

                            {/* Short sides (Right/Left) */}
                            <meshBasicMaterial attach="material-0" color={'#B88957'} roughness={0.6} />
                            <meshBasicMaterial attach="material-1" color="#e8e8e8" roughness={0.6} />

                            {/* Top (Hidden) */}
                            <meshBasicMaterial attach="material-2" color={'#B88957'} roughness={0.8} />

                            {/* Bottom - Grille Texture 
                                Używamy przezroczystości, żeby odsłonić wewnętrzne światło.
                                Sama krata jest ciemna/metaliczna.
                            */}
                            <meshBasicMaterial
                                attach="material-3"
                                map={lampGrilleTexture}
                                transparent={true}
                                alphaTest={0.1}
                                side={THREE.DoubleSide}
                                color={'#F6F0E5'}
                                roughness={0.5}
                            />

                            {/* Long sides (Front/Back) - Side Texture */}
                            <meshBasicMaterial color={'#F6F0E5'} attach="material-4" map={lampSideTexture} roughness={0.6} />
                            <meshBasicMaterial color={'#F6F0E5'} attach="material-5" map={lampSideTexture} roughness={0.6} />
                        </mesh>

                        {/* WEWNĘTRZNE ŚWIATŁO (LIGHT PANEL) 
                            Siedzi WYŻEJ w obudowie, żeby kratka pod spodem była widoczna.
                        */}
                        <mesh
                            position={[0, -0.059, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[1.9, 0.4]} />
                            <meshBasicMaterial
                                color={'#FFFDF7'}
                                toneMapped={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* RZECZYWISTE ŹRÓDŁO ŚWIATŁA (PointLight) - WYLACZONE */}
                        {/* <pointLight
                            position={[0, -1.5, 0]}
                            distance={6}
                            intensity={0.8}
                            color="#ffffff"
                            decay={2}
                        /> */}
                    </group>
                );
            })}

            {/* === STOLIK (obrócony 90°, przy lewej ścianie) === */}
            <group position={[tableConfig.x, floorY, tableConfig.z]} rotation={[0, Math.PI / 2, 0]}>
                {/* Nogi stolika */}
                {[
                    [-tableConfig.width / 2 + 0.1, -tableConfig.depth / 2 + 0.1],
                    [tableConfig.width / 2 - 0.1, -tableConfig.depth / 2 + 0.1],
                    [-tableConfig.width / 2 + 0.1, tableConfig.depth / 2 - 0.1],
                    [tableConfig.width / 2 - 0.1, tableConfig.depth / 2 - 0.1],
                ].map((pos, i) => (
                    <mesh key={`leg-${i}`} position={[pos[0], tableConfig.height / 2, pos[1]]}>
                        <boxGeometry args={[tableConfig.legRadius * 2, tableConfig.height, tableConfig.legRadius * 2]} />
                        <meshBasicMaterial color={'#8B5738'} map={legTexture} roughness={0.8} />
                    </mesh>
                ))}

                {/* Blat stolika */}
                <mesh position={[0, tableConfig.height + tableConfig.topThickness / 2, 0]}>
                    <boxGeometry args={[tableConfig.width, tableConfig.topThickness, tableConfig.depth]} />
                    <meshBasicMaterial color={'#A46B43'} attach="material-0" map={woodTexture} /> {/* Right */}
                    <meshBasicMaterial color={'#A46B43'} attach="material-1" map={woodTexture} /> {/* Left */}
                    <meshBasicMaterial color={'#C78D59'} attach="material-2" map={tableTopTexture} roughness={0.5} /> {/* Top */}
                    <meshBasicMaterial attach="material-3" color={'#F6F0E5'} />   {/* Bottom */}
                    <meshBasicMaterial color={'#A46B43'} attach="material-4" map={woodTexture} /> {/* Front */}
                    <meshBasicMaterial color={'#A46B43'} attach="material-5" map={woodTexture} /> {/* Back */}
                </mesh>

                {/* Small three-dimensional flowering plant */}
                <group position={[0, tableConfig.height + tableConfig.topThickness, 0]}>
                    <mesh position={[0, 0.11, 0]}>
                        <cylinderGeometry args={[0.105, 0.08, 0.22, 10]} />
                        <meshBasicMaterial color="#A65E3E" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.225, 0]}>
                        <cylinderGeometry args={[0.088, 0.088, 0.015, 10]} />
                        <meshBasicMaterial color="#453025" roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.36, 0]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
                        <meshBasicMaterial color="#397D43" />
                    </mesh>
                    {Array.from({ length: 6 }, (_, i) => {
                        const angle = i * Math.PI / 3;
                        return (
                            <mesh key={i} position={[Math.cos(angle) * 0.095, 0.33 + (i % 2) * 0.07, Math.sin(angle) * 0.095]} rotation={[0, -angle, -0.45]} scale={[0.12, 0.035, 0.055]}>
                                <sphereGeometry args={[1, 8, 6]} />
                                <meshBasicMaterial color={i % 2 ? '#4C9D54' : '#70B95E'} roughness={0.9} />
                            </mesh>
                        );
                    })}
                    <mesh position={[0, 0.52, 0]} scale={[0.07, 0.07, 0.07]}>
                        <sphereGeometry args={[1, 10, 8]} />
                        <meshBasicMaterial color="#E5A1B5" />
                    </mesh>
                </group>
            </group>

            {/* =============================================
                RAMKI NA ZDJĘCIA NA ŚCIANACH
                =============================================
                Każda ramka to płaski plane z teksturą "ramka na zdjecie.png".
                Są przyczepione do ścian na przemian (lewa/prawa).
                
                Żeby zmienić pozycję/rozmiar konkretnej ramki,
                edytuj odpowiedni obiekt w tablicy 'frames' powyżej.
            */}
            {frames.map((frame) => (
                <InspectableFrame
                    key={frame.id}
                    frame={frame}
                    wallX={wallX}
                    frameTexture={frameTexture}
                    framePaintedTexture={framePaintedTexture}
                    CABIN_SKETCH_URL={CABIN_SKETCH_URL}
                    setCameraOverride={setCameraOverride}
                />
            ))}

            {/* === SZAFKA (CABINET) === */}
            {/* Prosty box jako placeholder, naprzeciwko drzwi About (Left -48) -> więc szafka na Right -51 */}
            <mesh
                position={[wallX - 0.26, floorY + 0.5, zOffset - 51]}
            // X: wallX - (depth/2) - mały margin
            // Y: floorY + (height/2)
            // Z: zOffset - 51 (blisko drzwi About)
            >
                {/* Wymiary: X=0.5 (głębokość od ściany), Y=1.0 (wysokość), Z=0.8 (szerokość wzdłuż ściany) */}
                <boxGeometry args={[0.5, 1.0, 1.0 * 0.8]} />
                {/* 
                    Materials for BoxGeometry:
                    0: Right (+x) - Wall side
                    1: Left (-x) - Corridor side (FRONT of cabinet) -> szafkaprzod.png
                    2: Top (+y) -> szafkaprzodgora.png
                    3: Bottom (-y) -> szafkaprzodgora.png (as requested)
                    4: Front (+z) -> szafkaprzodgora.png (side)
                    5: Back (-z) -> szafkaprzodgora.png (side)
                */}
                <meshBasicMaterial color={'#F6F0E5'} attach="material-0" map={cabinetRestTexture} />
                <meshBasicMaterial color={'#F6F0E5'} attach="material-1" map={cabinetFrontTexture} />
                <meshBasicMaterial color={'#F6F0E5'} attach="material-2" map={cabinetRestTexture} />
                <meshBasicMaterial color={'#F6F0E5'} attach="material-3" map={cabinetRestTexture} />
                <meshBasicMaterial color={'#F6F0E5'} attach="material-4" map={cabinetRestTexture} />
                <meshBasicMaterial color={'#F6F0E5'} attach="material-5" map={cabinetRestTexture} />
            </mesh>

            {/* === STOJĄCA RAMKA NA SZAFCE (STANDING FRAME) === */}
            {/* Stoi na szafce: Y = floorY + 1.0 (wysokość szafki) + połowa wysokości ramki */}
            <mesh
                position={[wallX - 0.26, floorY + 1.0 + 0.2, zOffset - 51]}
                rotation={[0, -Math.PI / 2 + 0.2, 0]} // Lekki obrót, żeby nie stała idealnie prosto
            >
                <planeGeometry args={[0.3, 0.3 / 0.777]} />
                <meshBasicMaterial color={'#F6F0E5'}
                    map={standingFrameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>


            {/* Three-dimensional potted tree: terracotta pot, dark soil, brown trunk and green foliage */}
            <group position={[-wallX + 0.8, floorY, zOffset - 58]}>
                <mesh position={[0, 0.34, 0]}>
                    <cylinderGeometry args={[0.34, 0.25, 0.68, 12]} />
                    <meshBasicMaterial color="#A65E3E" roughness={0.95} />
                </mesh>
                <mesh position={[0, 0.69, 0]}>
                    <cylinderGeometry args={[0.32, 0.32, 0.035, 12]} />
                    <meshBasicMaterial color="#493025" roughness={1} />
                </mesh>
                <mesh position={[0, 1.18, 0]}>
                    <cylinderGeometry args={[0.075, 0.095, 1.05, 9]} />
                    <meshBasicMaterial color="#65412D" roughness={1} />
                </mesh>
                {[
                    [0, 1.65, 0, 0.56, '#3F8E4C'],
                    [-0.34, 1.53, 0.08, 0.43, '#58A85A'],
                    [0.33, 1.57, -0.1, 0.44, '#4D9C50'],
                    [0, 2.03, 0.02, 0.47, '#6BB966'],
                    [-0.17, 1.9, -0.28, 0.34, '#367C43'],
                    [0.21, 1.89, 0.27, 0.36, '#76BF68']
                ].map(([x, y, z, radius, color], i) => (
                    <mesh key={i} position={[x, y, z]} scale={[1, 0.82, 0.85]}>
                        <icosahedronGeometry args={[radius, 1]} />
                        <meshBasicMaterial color={color} roughness={0.95} flatShading />
                    </mesh>
                ))}
            </group>

            {/* === KRATKI WENTYLACYJNE (VENTILATION GRATES) === */}
            {/* Generujemy kratkę na przeciwległej ścianie dla każdego obrazu */}
            {frames.map((frame, i) => {
                const isFrameLeft = frame.side === 'left';
                const grateSide = isFrameLeft ? 'right' : 'left';

                return (
                    <mesh
                        key={`grate-${i}`}
                        position={[
                            grateSide === 'left' ? -wallX + 0.01 : wallX - 0.01,
                            ceilingY - 0.6, // Wysoko, tak jak ta pierwsza
                            frame.z // Ta sama pozycja Z co obrazu
                        ]}
                        rotation={[0, grateSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[0.8, 0.8 / 1.968]} />
                        <meshBasicMaterial color={'#F6F0E5'}
                            map={grateTexture}
                            transparent={true}
                            alphaTest={0.1}
                            side={THREE.DoubleSide}
                            roughness={0.8}
                        />
                    </mesh>
                );
            })}

        </group >
    );
};

export default CorridorDecorations;
