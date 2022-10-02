import * as THREE from "./three.module.js";
import {OrbitControls} from "./OrbitControls.js";
import {GLTFLoader} from "./GLTFLoader.js";
// import {DRACOLoader} from "./DRACOLoader.js";
import { GUI } from './lil-gui.module.min.js';
import { applyBoxUV } from './magic_uv.js';
import { calculateB, calculateF } from "./mathemagicas.js";


var light, earth, controls, light, hemiLight, light_material, sun, uvMapSize, sun_geometry, cube;
var bboxSize = new THREE.Vector3(0,0,0);
var sat_PSP, sat_SHIP, sat_SO;
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

var mixer;
const clock = new THREE.Clock();

class Orbit {
  constructor(eccentricity, mayor_radius, angular_frequency) {
    this.e = eccentricity
    this.a = mayor_radius;
    this.b = mayor_radius*Math.sqrt( 1 - eccentricity*eccentricity );
    this.w = angular_frequency;
  }
}

// const hemiLuminousIrradiances = {
//     '0.0001 lx (Moonless Night)': 0.0001,
//     '0.002 lx (Night Airglow)': 0.002,
// };

const objectives = {
    "sun": true,
    "earth": false
}

const params = {
    bulbPower: Object.keys( bulbLuminousPowers )[ 0 ],
    lookAt: Object.keys( objectives )[ 0 ],
    stop: true
};
const R = 1;
const AU = 0.1*215.0321557*R;

// const T = 365.25; // Periodo/ cada frame es un dia
// var w = 0.017214206; // 2pi/T
const e_orbit = new Orbit(0.017214206, AU, 0.017214206)


// earths radius = 6,378km
// suns radius = 695,700km
// const eROversR = 8378/69500;


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

    const textureLoader = new THREE.TextureLoader();
    // make axis
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,3), 0x0000ff );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(0,3,0), 0x00ff00 );
    makeVector( new THREE.Vector3(0,0,0), new THREE.Vector3(3,0,0), 0xff0000 );

    // sat_PSP.position.y = 1;
    // sat_SHIP.position.y = 1;
    // sat_PSP.position.z =-1;

    // controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.tick = () => controls.update();
    // controls.minDistance = 1;
    // controls.maxDistance = 10;

    // crear "luz solar"
    const light_geometry = new THREE.SphereGeometry( R-0.1, 100, 100 );
    light = new THREE.PointLight( 0xffee88, 1, 100, 2 );
    light_material = new THREE.MeshPhongMaterial( {
        emissive: 0xffffff,
        emissiveIntensity: 1.1,
        color: 0xffffff,
        opacity: 0.0,
        transparent: true
    } );
    textureLoader.load(  './images/sun_02.jpg' , function ( map ) {
        // map.anisotropy = 1;
        // map.encoding = THREE.sRGBEncoding;
        light_material.map = map;
        // light_material.needsUpdate = true;
    } );
    light.add( new THREE.Mesh( light_geometry, light_material ) );
    light.position.set( 0, 0, 0 );
    light.castShadow = true;
    scene.add( light );

    var light_02 = new THREE.PointLight( 0xffee88, 1, 100, 2 );
    light_02.add( new THREE.Mesh( new THREE.SphereGeometry(0.01, 20, 20), light_material ) );
    light_02.position.set( 0, 2, 0 );
    scene.add( light_02 );

    hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
    scene.add( hemiLight );

    // crear el sol
    var sun_material = new THREE.MeshBasicMaterial( {
        // emissive: 0x000000,
        // emissiveIntensity: 0.1,
        map: textureLoader.load('./images/sun_02.jpg'),
        // transparent: true,
        // opacity: 1.0,
    });
    sun_geometry = new THREE.SphereGeometry( R, 100, 100 );
    sun_geometry.computeBoundingBox();
    sun_geometry.boundingBox.getSize( bboxSize );
    uvMapSize = Math.min(bboxSize.x, bboxSize.y, bboxSize.z);
    sun = new THREE.Mesh( sun_geometry, sun_material );
    sun.position.set( 0, 0, 0 );
    scene.add( sun );

    let boxGeometry = new THREE.BoxBufferGeometry(uvMapSize, uvMapSize, uvMapSize);
    let cubeMaterial = sun_material.clone();
    cubeMaterial.opacity = 1;
    cube = new THREE.Mesh(boxGeometry, cubeMaterial);
    // scene.add(cube)


    // crear la tierra
    const earth_material = new THREE.MeshPhongMaterial( {
        // map:earth_texture, 
        color: 0xffffff,
        roughness: 0.5,
        metalness: 1.0
    });
    var geometry_sphere = new THREE.SphereGeometry( .2, 100, 100 );
    textureLoader.load(  './images/earth.jpg' , function ( map ) {
        map.anisotropy = 4;
        map.encoding = THREE.sRGBEncoding;
        earth_material.map = map;
        earth_material.needsUpdate = true;
    } );
    // const earth_texture = new THREE.TextureLoader().load( './images/earth.jpg' );
    earth = new THREE.Mesh( geometry_sphere, earth_material );
    earth.position.set( 0, 0, -AU );
    scene.add( earth );

    // earths' path
    const curve = new THREE.EllipseCurve(
        0,  e_orbit.e,          
        e_orbit.a, e_orbit.b, 
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


    function createBFields(n2, v0, ds) {
        var points = [];
        points.push( new THREE.Vector3(v0.x, v0.y, v0.z) );
        for (let i = 1; i < n2; i++) {
            var v_prev = new THREE.Vector3(points[i-1].x, points[i-1].y, points[i-1].z);
            var v = v_prev.addScaledVector(calculateB(R, points[i-1]), ds);
            points.push( new THREE.Vector3(v.x, v.y, v.z) );
        }
        const g_curve = new THREE.BufferGeometry().setFromPoints( points );
        const morado = new THREE.LineBasicMaterial( { color: 0x770099 } );
        const field = new THREE.Line( g_curve, morado );
        scene.add(field);
    }

    // dibujar las lineas
    for (let dr = R+0.2; dr < 2*R; dr+=R) {
        for (let dtheta = 0; dtheta<2*Math.PI; dtheta+=0.1) {
            var v1 = new THREE.Vector3( dr*Math.cos(dtheta), 0, dr*Math.sin(dtheta));
            createBFields(2000, v1, 0.15);
            createBFields(2000, v1,-0.15);
        }
    }

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    // gui
    const gui = new GUI();
    gui.add( params, 'bulbPower', Object.keys( bulbLuminousPowers ) );
    gui.add( params, 'lookAt', Object.keys( objectives ));
    gui.add( params, 'stop');
    gui.open();

    window.addEventListener( 'resize', onWindowResize );

    // const dracoLoader = new THREE.DRACOLoader();
    // loader.setDRACOLoader(dracoLoader);
    const loader = new GLTFLoader();
    loader.load( './objs/PSP.glb', function ( gltf ) {
        // gltf.scene.scale.set( new THREE.Vector3(0.2, 0.2, 0.2) );
        // gltf.scene.position.z = -2*R;
    	scene.add( gltf.scene );
        sat_PSP = gltf.scene.children[0];
        mixer = new THREE.AnimationMixer(sat_PSP);
        mixer.clipAction(gltf.animations[0]).play();
        animate();
    });
    // loader.load( './objs/ship.glb', function ( gltf ) {
    // 	scene.add( gltf.scene );
    //     sat_SHIP = gltf.scene.children[0];
    //     mixer = new THREE.AnimationMixer(sat_SHIP);
    //     mixer.clipAction(gltf.animations[0]).play();
    //     animate();
    // });
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

animate(); 
function animate() {
    requestAnimationFrame( animate );

    const delta = clock.getDelta();
    mixer.update(delta);

    // sat_SHIP.position.y = 1;
    // console.log(sat_PSP);
    sat_PSP.scale.set( new THREE.Vector3(0.2,0.2,0.2) );
    // sat_PSP.position.z = -5;
    // sat_PSP.rotation.y += 0.01;
    // sat_PSP.scale = new THREE.Vector3( 0.1,0.1,0.1);
    // sat_PSP.scale.set( new THREE.Vector3( 2, 2, 2 ) );
    // sat_PSP.setSize = 0.1, 0.1, 0.1 ;

    if (!params.stop) {
        total_time += 1;
        earth.rotation.y += 0.01;
        earth.position.x = e_orbit.a*Math.sin(e_orbit.w*total_time);
        earth.position.z = e_orbit.b*Math.cos(e_orbit.w*total_time + Math.PI);
        time_label.textContent = "time : " + total_time + "dias";
    }

    var temp = cube.matrix.invert();
    applyBoxUV(sun_geometry, temp, uvMapSize);
    sun_geometry.attributes.uv.needsUpdate = true;

    updateControls();
    render();
}


function updateControls() {
    controls.update();

    if ( objectives[params.lookAt] ){ // mirando al sol
        camera.lookAt( 0, 0, 0);
        // controls.position = sun.position;
        // camera.position.set( new THREE.Vector3(0,0,0) );
    } else { // mirando a la tierra
        camera.lookAt( earth.position.x, earth.position.y, earth.position.z );
        // controls.position = earth.position;
        // camera.position.set( earth.position );
       // camera.position.set( new THREE.Vector3(earth.position.x, earth.position.y, earth.position.z) );
    }
}

function render(){
    renderer.toneMappingExposure = Math.pow( 1, 5.0 );
    light.castShadow = true;
    renderer.shadowMap.enabled = true;

    light.power = bulbLuminousPowers[ params.bulbPower ];
    light_material.emissiveIntensity = 0.02;//sun.intensity / Math.pow( 0.02, 2.0 );
    hemiLight.intensity = 0.001;

    renderer.render(scene, camera);
}
