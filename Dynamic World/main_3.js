import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js"
import DW from "./js/dw.module.js";
import addRigidBody from "./js/addRigidBody.js";

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let engine = new DW.Engine();
let scene = engine.scene;
let world = engine.world;
// world.allowSleep = false;

//======================================================================
let texture = textureLoader.load("assert/Landscape.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(50, 50);
const plane_meah = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: texture,
        // side: THREE.DoubleSide
    })
);
plane_meah.receiveShadow = true;
scene.add(plane_meah);

let plane = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane()
    // shape: plane_shape
});
// plane.position.set(0, 0, -1);
// plane.position.copy(planeBody.position);
world.addBody(plane);

//======================================================================

//  Add a ramp
var rampShape = new CANNON.Box(new CANNON.Vec3(20.0, 10.0, 0.05));
var rampBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 20.0, 3.5)
});
rampBody.addShape(rampShape);
// world.add(rampBody);
rampBody.quaternion.setFromEuler(0, 0.2, 0.5 * Math.PI, 'ZYX');

var geo = new THREE.BoxGeometry(40.0, 20.0, 0.1);
var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color: 0x666666
}));
// scene.add(mesh);
mesh.position.copy(rampBody.position);
mesh.quaternion.copy(rampBody.quaternion);

// Another ramp
rampBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, -20.0, 3.5)
});
rampBody.addShape(rampShape);
// world.add(rampBody);
rampBody.quaternion.setFromEuler(0, 0.2, -0.5 * Math.PI, 'ZYX');

mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color: 0x666666
}));
// scene.add(mesh);
mesh.position.copy(rampBody.position);
mesh.quaternion.copy(rampBody.quaternion);

//======================================================================

gltfLoader.load(
    "assert/slope.glb",
    (glb) => {
        // console.log(glb.scene.children);

        let land = glb.scene;

        glb.scene.traverse((child)=>{
            scene.add(child);
        })

        // glb.scene.children[0].position.set(0, 0, 0);
        // scene.add(land);

        // land.children[0].material = new THREE.MeshLambertMaterial({
        //     color: 0xFFFFFF,
        //     map: texture
        // });

        // land.children.forEach(mesh => {
        //     let rigid_body = addRigidBody(mesh);
        //     world.addBody(rigid_body);
        // });

        // let rigid_body = addRigidBody(glb.scene.children[0]);
        // world.addBody(rigid_body);

    }
);

engine.runRenderLoop();
