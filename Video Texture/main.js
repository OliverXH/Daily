var initScene, render, renderer, scene, camera, controls, broad;
let plane = {}, ball = {};
let video, texture;
var timeStep = 1 / 60;

document.getElementById('start').addEventListener('click', initScene);

function initScene() {
    document.getElementById('start').remove();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    //告诉渲染器需要阴影效果 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 默认的是，没有设置的这个清晰 THREE.PCFShadowMap 
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );
    camera.position.set(80, 100, 40);
    // camera.position.set(0, -18, 20);
    camera.up.set(0, 0, 1);
    // camera.lookAt(scene.position);
    camera.lookAt(new THREE.Vector3(0, 0, 206));
    // scene.add(camera);

    //Add a light source
    scene.add(new THREE.AmbientLight(0x444444));

    let light = new THREE.PointLight(0xffffff);
    light.position.set(30, 60, 40);

    //告诉平行光需要开启阴影投射 
    light.castShadow = true;

    scene.add(light);


    video = document.getElementById('video');
    video.play();

    texture = new THREE.VideoTexture(video);


    //plane
    plane.mesh = new THREE.Mesh(
        new THREE.BoxGeometry(300, 300, 1),
        new THREE.MeshPhongMaterial({
            color: 0xaaaaaa
        })
    );
    plane.mesh.position.z = -15.5;
    plane.mesh.receiveShadow = true;
    scene.add(plane.mesh);

    //broad
    let mats = [];
    // let geometry = new THREE.BoxGeometry(48, 1, 27);
    let geometry = new THREE.BoxGeometry(48, 1, 36);

    for (var i = 0; i < 6; i++) {
        let material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffffff)
        });
        mats.push(material);
    }

    mats.push(new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: texture,
    }));

    broad = new THREE.Mesh(
        geometry,
        mats
    );

    geometry.faces[4].materialIndex = 6;
    geometry.faces[5].materialIndex = 6;

    broad.rotation.y = Math.PI;
    broad.castShadow = true;
    scene.add(broad);

    // console.log(broad);


    //立方体 
    var cubeGeometry = new THREE.CubeGeometry(10, 10, 8);
    var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ffff });

    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.x = 35;
    cube.position.y = 15;
    cube.position.z = -5;
    
    cube.castShadow = true;
    scene.add(cube);

    //controller
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = 1.6;
    controls.update();

    //EventListener
    function handleClick(e) {

    }

    function handleReset(e) {

    }

    // document.getElementById('start').addEventListener('click', handleClick);
    // document.getElementById('reset').addEventListener('click', handleReset);

    /*
     * Events to fire upon window resizing.
    */
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render();
};

function render() {

    controls.update();

    renderer.render(scene, camera); // render the scene
    requestAnimationFrame(render);
};