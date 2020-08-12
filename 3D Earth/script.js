const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  1.0,
  5000
);
//设置相机的位置
camera.up.z = 1;
camera.up.x = 0;
camera.up.y = 0;
camera.position.set(30, 25, 17);
scene.add(camera);

let renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setClearColor(0xeeeeee);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; //此处是告诉renderer我们需要阴影。
document.body.appendChild(renderer.domElement);

/*
 * galaxy
 */
//background images
const cubeLoader = new THREE.CubeTextureLoader();
const texture = cubeLoader.load([
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_ft.jpg",
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_bk.jpg",
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_up.jpg",
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_dn.jpg",
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_rt.jpg",
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/skybox/kenon_star/kenon_star_lf.jpg"
]);
scene.background = texture;

/*
 * light
 */
const light = new THREE.PointLight(0xffeac4, 1, 5000);
light.castShadow = true;
light.position.set(0, 400, 100);
scene.add(light);
// camera.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambient);

/*
 * Events to fire upon window resizing.
 */
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.minDistance = 25;
/*
 * earth
 */
let loader = new THREE.TextureLoader();
let group = new THREE.Group();
let earthTex = loader.load(
  "src/2k_earth_daymap.jpg"
);
const normalMap = loader.load(
  "src/2k-earth-normal-map.png"
);
const specularMap = loader.load(
  "src/2k-earth-specular-map.png"
);
let earthGeo = new THREE.SphereGeometry(20, 128, 128);
let earthMat = new THREE.MeshPhongMaterial({
  map: earthTex,
  normalMap: normalMap,
  normalScale: new THREE.Vector2(10, 10),
  specularMap: specularMap,
  specular: "#222222",
});
let earth = new THREE.Mesh(earthGeo, earthMat);
earth.castShadow = true;
earth.receiveShadow = true;
earth.rotateX((Math.PI * 67.5) / 180);
group.add(earth);


/*
 * cloud
 */
let cloudTexture = loader.load(
  "src/2k_earth_clouds.jpg"
);
let cloudGeo = new THREE.SphereGeometry(20.01, 128, 128);
let cloudMat = new THREE.MeshPhongMaterial({
  alphaMap: cloudTexture,
  transparent: true,
  displacementMap: cloudTexture,
  displacementScale: 0,
});
let cloud = new THREE.Mesh(cloudGeo, cloudMat);
cloud.castShadow = true;
cloud.receiveShadow = true;
cloud.rotation.x = (Math.PI * 67.5) / 180;
// cloud.rotateX(Math.PI * 0.5);
group.add(cloud);

// console.log(cloud);


/*
 * moon
 */
let moonTex = loader.load(
  "https://xh-bucket01.oss-cn-shenzhen.aliyuncs.com/earth/02/moon2020.jpg"
);

let moonGeo = new THREE.SphereGeometry(6, 128, 128);
let moonMat = new THREE.MeshLambertMaterial({
  map: moonTex
});
let moon = new THREE.Mesh(moonGeo, moonMat);
moon.castShadow = true;
moon.receiveShadow = true;
moon.rotateX(Math.PI * 0.5);
moon.position.set(120, 0, 0);
group.add(moon);
scene.add(group);

group.position.set(0, 0, 0);
camera.lookAt(group.position);

const options = {
  lightColor: 0xffffff,
  speedUp: 4,
  x: 8,
  y: 8,
  specular: 0x111111,
  displacementScale: 0,
  displacementBias: 0,
};

let gui = new dat.GUI();
let f01 = gui.addFolder('Cloud');
let f02 = gui.addFolder('Earth');
let f03 = gui.addFolder('Scene');


f01.add(options, 'displacementScale', 0, 1).onChange((value) => {
  cloud.material.displacementScale = value;
});
f01.add(options, 'displacementBias', 0, 10).onChange((value) => {
  cloud.material.displacementBias = value;
})

f02.add(options, "x", 8, 20).onChange((value) => {
  earth.material.normalScale.x = value;
});;
f02.add(options, "y", 8, 20).onChange((value) => {
  earth.material.normalScale.y = value;
});
f02.addColor(options, 'specular').onChange((value) => {
  // console.log(specularMap);
  earth.material.specular = new THREE.Color(value);
})

f03.addColor(options, "lightColor");
f03.add(options, "speedUp", 1, 8);


function render() {
  light.color = new THREE.Color(options.lightColor);
  // light.
  // earth.rotation.y += 0.001;
  // cloud.rotation.y += 0.003;
  window.requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();