import * as THREE from "./three.module.js";
import {OrbitControls} from "./OrbitControls.js";
import {GLTFLoader} from "./GLTFLoader.js";
import { GUI } from './lil-gui.module.min.js';

var sun, earth, controls, sun, hemiLight, sun_material;
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

const objectives = {
    "sun": true,
    "earth": false
}

const params = {
    bulbPower: Object.keys( bulbLuminousPowers )[ 4 ],
    hemiIrradiance: Object.keys( hemiLuminousIrradiances )[ 0 ],
    lookAt: Object.keys( objectives )[ 0 ],
    exposure: 0.68,
    stop: true
};
const AU = 3;
const R = 1;
// const T = 365.25; // Periodo/ cada frame es un dia
var w = 0.017214206; // 2pi/T
const exc = 0.01671022; // Excentricidad
const a = 1;
const b = Math.sqrt(1-exc*exc);

// earths radius = 6,378km
// suns radius = 695,700km
const eROversR = 8378/69500;

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
    camera.position.z = 4;
    camera.position.x = 3;
    camera.position.y = 4;

    // make axis
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,3), 0x0000ff );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,3,0), 0x00ff00 );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(3,0,0), 0xff0000 );

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
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // crear "luz solar"
    const sun_geometry = new THREE.SphereGeometry( R, 100, 100 );
    sun = new THREE.PointLight( 0xffee88, 1, 100, 2 );
    sun_material = new THREE.MeshStandardMaterial( {
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    } );
    sun.add( new THREE.Mesh( sun_geometry, sun_material ) );
    sun.position.set( 0, 0, 0 );
    sun.castShadow = true;
    scene.add( sun );

    hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
    scene.add( hemiLight );

    // crear la tierra
    const earth_material = new THREE.MeshBasicMaterial( {
        // map:earth_texture, 
        color: 0xffffff,
        roughness: 0.5,
        metalness: 1.0
    });
    var geometry_sphere = new THREE.SphereGeometry( .2, 100, 100 );

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(  './images/earth.jpg' , function ( map ) {
        map.anisotropy = 4;
        map.encoding = THREE.sRGBEncoding;
        earth_material.metalnessMap = map;
        earth_material.needsUpdate = true;
    } );
    // const earth_texture = new THREE.TextureLoader().load( './images/earth.jpg' );
    earth = new THREE.Mesh( geometry_sphere, earth_material );
    earth.position.set( 0, 0, -AU );
    earth.castShadow = true;
    scene.add( earth );

    // earths' path
    const curve = new THREE.EllipseCurve(
        0,  exc,          
        a*AU, b*AU, 
        0, 2*Math.PI,
        false
    );
    const n = 50;
    const points = curve.getPoints( n );
    for (let i = 0; i < points.length; i++) {
        points[i] = new THREE.Vector3(points[i].x, 0, points[i].y);
    }
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const gris = new THREE.LineBasicMaterial( { color: 0x202020 } );
    const ellipse = new THREE.Line( geometry, gris );
    scene.add( ellipse );

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
    gui.add( params, 'lookAt', Object.keys( objectives ));
    gui.add( params, 'exposure', 0, 1 );
    gui.add( params, 'stop');
    gui.open();

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

animate(); 
function animate() {
    requestAnimationFrame( animate );
    controls.update();

    if (!params.stop) {
        total_time += 1;
        earth.rotation.y += 0.01;
        earth.position.x = a*AU*Math.sin(w*total_time);
        earth.position.z = b*AU*Math.cos(w*total_time + Math.PI);
        time_label.textContent = "time : " + total_time + "dias";
    }

    if ( objectives[params.lookAt] ){ // mirando al sol
        camera.lookAt( 0, 0, 0);
    } else { // mirando a la tierra
        camera.lookAt( earth.position.x, earth.position.y, earth.position.z);
    }
    render();
}

function render(){
    sun.power = bulbLuminousPowers[ params.bulbPower ];
    sun_material.emissiveIntensity = sun.intensity / Math.pow( 0.02, 2.0 );
    hemiLight.intensity = hemiLuminousIrradiances[ params.hemiIrradiance ];
    renderer.render(scene, camera);
}
