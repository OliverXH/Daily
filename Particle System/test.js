var SEPARATION = 100, AMOUNTX = 1, AMOUNTY = 1;

var container, stats;
var camera, scene, controls, renderer;

var particles, count = 0;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 10;

    scene = new THREE.Scene();


    //

    var numParticles = AMOUNTX * AMOUNTY;

    var positions = new Float32Array(numParticles * 3);
    var scales = new Float32Array(numParticles);

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    // geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    var material = new THREE.ShaderMaterial({

        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent

    });

    //

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.movementSpeed = 100;  //镜头移速
    controls.lookSpeed = 0.125;  //视角改变速度
    controls.lookVertical = true;  //是否允许视角上下改变

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//



//

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function render() {

    camera.lookAt(scene.position);


    particles.geometry.attributes.position.needsUpdate = true;
    // particles.geometry.attributes.scale.needsUpdate = true;

    renderer.render(scene, camera);

}