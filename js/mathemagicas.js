import * as THREE from "./three.module.js";

function calculateB(R, v){
    const r = Math.sqrt( v.x*v.x + v.y*v.y + v.z*v.z );
    const c = R*R*R/(3*r*r*r);
    const phi = Math.atan2( v.x, v.z );
    const theta = Math.atan2( v.y, Math.sqrt(v.z*v.z+v.x*v.x) );
    const a = Math.cos(theta);
    const b = Math.sin(theta);
    const d = Math.sin(phi);
    const e = Math.cos(phi);

    const x = c*3*a*b*e;
    const y = c*(2*a*a-b*b);
    const z = c*3*a*b*d;
    return new THREE.Vector3(x,y,z);
}

function calculateF(v){
    const phi = Math.atan2( v.x, v.z );
    const x = Math.cos(phi);
    const z =-Math.sin(phi);
    return new THREE.Vector3(x, 0, z);
}

export {calculateB, calculateF}
