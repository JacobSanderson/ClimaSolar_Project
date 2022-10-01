import * as THREE from "./three.module.js";
import {OrbitControls} from "./OrbitControls.js";
import {GLTFLoader} from "./GLTFLoader.js";
import { GUI } from './lil-gui.module.min.js';


var earth, controls, bulbLight, hemiLight;
const bulbLuminousPowers = {
    '110000 lm (1000W)': 110000,
    '3500 lm (300W)': 3500,
    '1700 lm (100W)': 1700,
    '800 lm (60W)': 800,
    '400 lm (40W)': 400,
    '180 lm (25W)': 180,
    '20 lm (4W)': 20,
    'Off': 0
};
const hemiLuminousIrradiances = {
    '0.0001 lx (Moonless Night)': 0.0001,
    '0.002 lx (Night Airglow)': 0.002,
    '0.5 lx (Full Moon)': 0.5,
    '3.4 lx (City Twilight)': 3.4,
    '50 lx (Living Room)': 50,
    '100 lx (Very Overcast)': 100,
    '350 lx (Office Room)': 350,
    '400 lx (Sunrise/Sunset)': 400,
    '1000 lx (Overcast)': 1000,
    '18000 lx (Daylight)': 18000,
    '50000 lx (Direct Sun)': 50000
};
const params = {
    bulbPower: Object.keys( bulbLuminousPowers )[ 4 ],
    hemiIrradiance: Object.keys( hemiLuminousIrradiances )[ 0 ]
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var time_label = document.getElementById("time");
var total_time = 0.0;

// const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
function makeVector( origin, vec, color ) {
    var points = [];
    points.push( origin );
    points.push( new THREE.Vector3( vec.x - origin.x, vec.y - origin.y, vec.z - origin.z ) );
    var geometry_2 = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry_2, new THREE.LineBasicMaterial( {color: color}) );
    scene.add( line );
}

init();
function init() {
    camera.position.z = 2.5;

    // make axis
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), 0x0000ff );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,1,0), 0x00ff00 );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), 0xff0000 );

    // const loader = new GLTFLoader();
    // console.log("pase por aqui 01");
    // loader.load( '../objs/ship.glb', function ( gltf ) {
    // 	scene.add( gltf.scene );
    // }, undefined, function ( error ) {
    // 	console.error( error );
    //     console.log("ayuda");
    // } );

    // controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.tick = () => controls.update();

    // crear "luz solar"
    const bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
    bulbLight = new THREE.PointLight( 0x0000ff, 10, 100, 10 );
    var bulbMat = new THREE.MeshStandardMaterial( {
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    } );
    bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
    bulbLight.position.set( 0, 0, 0 );
    scene.add( bulbLight );
    hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
    scene.add( hemiLight );

    // crear la tierra
    const texture = new THREE.TextureLoader().load( './images/earth.jpg' );
    const earth_material = new THREE.MeshBasicMaterial( { map: texture } );
    var geometry_sphere = new THREE.SphereGeometry( .4, 100, 100 );
    earth = new THREE.Mesh( geometry_sphere, earth_material );
    earth.position.set( 0, 0, -2 );
    scene.add( earth );

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    // gui
    const gui = new GUI();
    gui.add( params, 'hemiIrradiance', Object.keys( hemiLuminousIrradiances ) );
    gui.add( params, 'bulbPower', Object.keys( bulbLuminousPowers ) );
    gui.open();

    window.addEventListener( 'resize', onWindowResize );
}
*
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

animate();
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );

    earth.rotation.y += 0.01;
    controls.update();

    total_time += 0.1;
    time_label.textContent = "time : " + String(total_time) + "s";
    render();
}

function render(){
    bulbLight.power = bulbLuminousPowers[ params.bulbPower ];
    bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow( 0.02, 2.0 );
    hemiLight.intensity = hemiLuminousIrradiances[ params.hemiIrradiance ];
    renderer.render(scene, camera);
}
