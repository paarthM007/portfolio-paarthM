import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const CLOUD_LAYOUT = [
    [-7, 2, -12], [6, 3, -18], [-5, -1, -25], [8, 0, -32],
    [-9, 4, -40], [4, 2, -48], [-3, -2, -56], [10, 3, -64],
    [-8, 0, -72], [3, 4, -80], [8, -1, -88], [-4, 2, -96],
];

function Cloud({ position, scale = 1 }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[-0.65, 0, 0]}>
                <sphereGeometry args={[0.9, 12, 10]} />
                <meshStandardMaterial color="#dce8f6" roughness={1} />
            </mesh>
            <mesh position={[0.15, 0.25, 0]}>
                <sphereGeometry args={[1.15, 12, 10]} />
                <meshStandardMaterial color="#f2f6fc" roughness={1} />
            </mesh>
            <mesh position={[0.9, -0.05, 0.05]}>
                <sphereGeometry args={[0.75, 12, 10]} />
                <meshStandardMaterial color="#d5e2f2" roughness={1} />
            </mesh>
        </group>
    );
}

function Aircraft() {
    return (
        <group position={[0, -1.15, 1.2]} rotation={[0.02, 0, 0]}>
            {/* Fuselage */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.85]}>
                <cylinderGeometry args={[0.2, 0.32, 3.2, 16]} />
                <meshStandardMaterial color="#cbd9ec" metalness={0.35} roughness={0.42} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 0, -2.55]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.2, 0.65, 16]} />
                <meshStandardMaterial color="#7fc8dc" metalness={0.3} roughness={0.35} />
            </mesh>
            {/* Main wings */}
            <mesh position={[0, -0.02, -0.8]}>
                <boxGeometry args={[5.8, 0.1, 0.85]} />
                <meshStandardMaterial color="#e5edf8" metalness={0.25} roughness={0.5} />
            </mesh>
            {/* Tailplane and fin */}
            <mesh position={[0, 0.12, 0.62]}>
                <boxGeometry args={[2, 0.08, 0.55]} />
                <meshStandardMaterial color="#a8a4d8" metalness={0.2} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.48, 0.72]}>
                <boxGeometry args={[0.1, 0.72, 0.62]} />
                <meshStandardMaterial color="#8fb9dc" metalness={0.2} roughness={0.45} />
            </mesh>
            {/* Cockpit canopy */}
            <mesh position={[0, 0.25, -1.45]} scale={[1, 0.65, 1]}>
                <sphereGeometry args={[0.42, 20, 14]} />
                <meshPhysicalMaterial color="#78b9d5" roughness={0.15} metalness={0.15} transparent opacity={0.82} />
            </mesh>
            {/* Wing navigation lights */}
            <mesh position={[-2.85, 0.02, -0.8]}>
                <sphereGeometry args={[0.075, 10, 8]} />
                <meshBasicMaterial color="#8bd8e8" />
            </mesh>
            <mesh position={[2.85, 0.02, -0.8]}>
                <sphereGeometry args={[0.075, 10, 8]} />
                <meshBasicMaterial color="#b9a9ed" />
            </mesh>
        </group>
    );
}

const FlightRoom = ({ showRoom, onReady, isExiting, isWarmup = false }) => {
    const cloudRefs = useRef([]);
    const elapsed = useRef(0);
    const readyFrames = useRef(0);
    const readySent = useRef(false);
    const aircraftRef = useRef();

    useEffect(() => {
        readyFrames.current = 0;
        readySent.current = false;
    }, [showRoom]);

    useFrame((_, delta) => {
        if (!showRoom || isExiting) return;

        elapsed.current += Math.min(delta, 0.04);
        readyFrames.current += 1;

        if (!readySent.current && readyFrames.current > 3) {
            readySent.current = true;
            onReady?.();
        }

        cloudRefs.current.forEach((cloud, index) => {
            if (!cloud) return;
            cloud.position.z += delta * (isWarmup ? 0 : 2.6);
            if (cloud.position.z > 5) {
                cloud.position.z = -100;
                cloud.position.x = CLOUD_LAYOUT[index][0];
                cloud.position.y = CLOUD_LAYOUT[index][1];
            }
        });

        if (aircraftRef.current) {
            aircraftRef.current.rotation.z = Math.sin(elapsed.current * 0.45) * 0.018;
            aircraftRef.current.rotation.x = Math.sin(elapsed.current * 0.3) * 0.012;
        }
    });

    return (
        <group>
            <ambientLight intensity={1.25} color="#e5efff" />
            <directionalLight position={[8, 12, 5]} intensity={1.7} color="#fff2dc" />
            <pointLight position={[0, 4, -12]} intensity={0.7} color="#83cce0" distance={32} />

            {/* Soft sun glow */}
            <mesh position={[-13, 9, -70]}>
                <sphereGeometry args={[3.2, 24, 20]} />
                <meshBasicMaterial color="#f8e8c8" />
            </mesh>

            {/* Cool blue sky dome */}
            <mesh position={[0, 0, -40]}>
                <sphereGeometry args={[112, 32, 20]} />
                <meshBasicMaterial color="#b9d4ec" side={THREE.BackSide} />
            </mesh>

            {/* Distant horizon */}
            <mesh position={[0, -8, -58]}>
                <sphereGeometry args={[92, 32, 16]} />
                <meshBasicMaterial color="#a9c7df" side={THREE.BackSide} />
            </mesh>

            {CLOUD_LAYOUT.map((position, index) => (
                <group key={index} position={position} ref={(node) => { cloudRefs.current[index] = node; }}>
                    <Cloud position={[0, 0, 0]} scale={0.9 + (index % 3) * 0.22} />
                </group>
            ))}

            <group ref={aircraftRef}>
                <Aircraft />
            </group>

            <group position={[0, 2.8, -13]}>
                <Text fontSize={0.38} color="#28445f" anchorX="center" letterSpacing={0.12}>
                    FLIGHT DECK
                </Text>
                <Text position={[0, -0.48, 0]} fontSize={0.16} color="#49647e" anchorX="center">
                    A little flight above the ordinary
                </Text>
            </group>
        </group>
    );
};

export default FlightRoom;
