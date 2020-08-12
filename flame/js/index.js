const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  45, window.innerWidth / window.innerHeight,
  0.1, 2000);
camera.position.set(0, 0, 10);


let rig = new THREE.Group();
rig.add(camera);

scene.add(rig);

var texture = new THREE.TextureLoader().load(
  "./Rough.jpg",
  function () { console.log("loaded"); },
  undefined,
  function (e) { console.log("error", e); }
);
texture.crossOrigin = ""; //"anonymous";

let plane = new THREE.PlaneGeometry(100, 100, 100, 100)
let planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x999999, roughness: 0.8,

  displacementMap: texture,
  displacementScale: 2,
  displacementBias: -1.4,
  map: texture,
});
let groundMesh = new THREE.Mesh(plane, planeMaterial);
groundMesh.rotateX(-90 * THREE.Math.DEG2RAD);
groundMesh.position.y = -2;
scene.add(groundMesh);

class fire {

  constructor(density = 150, height = 8, r = 0.2) {

    this.object = new THREE.Group();

    this.fireballs = [];

    this.height = height;
    this.radius = r;

    var texture = new THREE.TextureLoader().load(
      "./Tendrils.png",
      function () { console.log("loaded"); },
      undefined,
      function (e) { console.log("error", e); }
    );
    texture.crossOrigin = ""; //"anonymous";

    this.fireMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        blend: { value: 1.0 },
        blendPattern: { type: "t", value: texture }
      },
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.light = new THREE.PointLight(0xFF5500, 1, 100)
    this.light.position.set(0, 0.4, 0);
    this.lightIntensity = Math.random() * 5;

    this.object.add(this.light);
    // this.fireMaterial = new THREE.MeshStandardMaterial(0x661100);

    for (var i = 0; i < density; i++) {
      let geometry = new THREE.SphereGeometry(1, 32, 32);
      let mat = this.fireMaterial.clone();
      mat.uniforms.blendPattern.value = texture;
      mat.needsUpdate = true;
      let sphere = new THREE.Mesh(geometry, mat);
      sphere.position.y = Math.random() * height;
      sphere.position.x = (0.5 - Math.random()) * this.radius;
      sphere.position.z = (0.5 - Math.random()) * this.radius;
      sphere.rotateX(Math.random() * 5);
      sphere.rotateZ(Math.random() * 5);
      sphere.rotateY(Math.random() * 5);
      sphere.dirX = ((0.5 - Math.random()) * 0.02);
      sphere.dirY = 0.02;
      sphere.dirZ = ((0.5 - Math.random()) * 0.02);

      this.fireballs.push(sphere);
    }

    this.object.add(...this.fireballs);

  }

  update() {

    this.fireballs.forEach(ball => {

      ball.position.y += ball.dirY;
      ball.position.x += Math.sin(ball.position.y) * ball.dirX;
      ball.position.z += Math.cos(ball.position.y) * ball.dirZ;
      if (ball.position.y > this.height) {
        ball.position.y = Math.random() * 0.1;
        ball.position.x = (0.5 - Math.random()) * this.radius;
        ball.position.z = (0.5 - Math.random()) * this.radius;
      }

      let p = 0.1 + (ball.position.y / this.height);
      ball.rotateX((1.2 - p) * 0.01);
      ball.rotateZ((1.2 - p) * 0.01);
      ball.rotateY((1.2 - p) * 0.01)
      ball.scale.set(p, p, p);
      ///ball.opacity = p;
      ball.material.uniforms.blend.value = p;
      //ball.material.needsUpdate = true;
    })

    this.light.intensity += (this.lightIntensity - this.light.intensity) * 0.02;

    if (Math.random() > 0.8) {
      this.lightIntensity = Math.random() * 5;
    }

  }
  env(val, envelope = [0., 0., 0.1, 1., 1., 0.]) {

    function lerp(v0, v1, t) {
      return v0 * (1 - t) + v1 * t
    }

  }

}

let f = new fire();
f.object.position.y = -2;

scene.add(f.object)

// let cubeGeometry = new THREE.CubeGeometry(2, 2)
// let cubeMaterial = new THREE.MeshStandardMaterial();

// let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

// scene.add(cubeMesh)



let light = new THREE.PointLight(0xffffff, 1, 100)
light.position.set(10, 10, 20);

scene.add(light);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize)

let mx = 0;
let my = 0;


window.addEventListener("mousemove", (e) => {

  mx = -(0.5 - (e.clientX / window.innerWidth)) * 2.;
  my = -(0.8 - (e.clientY / window.innerHeight)) * 2.;


})
var targetIntensity = Math.random() * 5;
function draw() {
  requestAnimationFrame(draw)
  f.update();
  rig.rotation.y += (mx * 5 - rig.rotation.y) * 0.2;
  rig.rotation.x += (my * 0.02 - rig.rotation.x) * 0.2;

  camera.rotation.z += (mx * 0.5 - camera.rotation.z) * 0.2;
  camera.rotation.y += (-mx - camera.rotation.y) * 0.1;
  camera.rotation.x += (my * -0.2 - camera.rotation.x) * 0.1;
  camera.position.z += ((7 + (my * 3)) - camera.position.z) * 0.2;
  camera.position.y += (my - camera.position.y) * 0.2;

  //f.object.rotateY(0.01)
  // mesh.rotateX(0.01);
  // mesh.rotateY(0.02);
  // mesh.rotateZ(0.03)
  renderer.render(scene, camera);
}

resize();
draw();