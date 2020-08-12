let start = document.getElementById('start');
start.addEventListener('click', initStart);

let option = document.getElementById('option');
option.addEventListener('click', initOption);

let help = document.getElementById('help');
help.addEventListener('click', initHelp);

let selectBox = document.getElementsByName('button');
for (var i = 0; i < selectBox.length; i++) {
  // console.log(selectBox[i]);
  selectBox[i].addEventListener('mouseover', () => {
    var soundURL = jsfxr([0, 0.08, 0.18, , , 0.65, , 1, 1, , , 0.94, 1, , , , -0.3, 1, 1, , , 0.3, 0.5, 0.35]);
    var audio_player = new Audio();
    audio_player.src = soundURL;
    audio_player.play();
  });
  selectBox[i].addEventListener('click', () => {
    var soundURL = jsfxr([0, , 0.18, , , 1, , -1, 1, , , , , , , , , , 1, , , 0.64, , 0.35]);
    var audio_player = new Audio();
    audio_player.src = soundURL;
    audio_player.play();
  });
}


function initStart() {
  //

  var overlay = document.getElementById('overlay');
  overlay.remove();

  //

  const scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0xffffff, 0.005, 100); //打开雾化效果，(颜色，近处属性值，远处属性值)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1.0,
    1000
  );
  //设置相机的位置
  camera.up.z = 1;
  camera.up.x = 0;
  camera.up.y = 0;
  // camera.position.set(8, 10, 0);
  // camera.lookAt(scene.position);

  const renderer = new THREE.WebGLRenderer({
    // canvas: canvas,
    antialias: true,
  });
  // const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xeeeeee);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; //此处是告诉renderer我们需要阴影。
  document.body.appendChild(renderer.domElement);

  // const controls = new THREE.FirstPersonControls(camera, renderer.domElement);
  // controls.movementSpeed = 1000;
  // controls.lookSpeed = 0.1;

  const keyControl = new KeyControls();

  //添加光源
  const pointLight = new THREE.PointLight(0xffffff, 1),
    ambientLight = new THREE.AmbientLight(0x0c0c0c);

  pointLight.position.set(0, 55, 50); //设置位置
  pointLight.castShadow = true;
  scene.add(pointLight);
  scene.add(ambientLight);

  //创建一个平面
  const planeGeometry = new THREE.PlaneGeometry(260, 260);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x4F565F,
    // reflectivity: 2,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  scene.add(plane);

  const axesHelper = new THREE.AxesHelper(50);
  scene.add(axesHelper);

  const loader = new THREE.GLTFLoader();
  loader.load(
    'models/baoting.glb',
    (gltf) => {
      // console.log(gltf.scene);

      gltf.scene.children[2].castShadow = true;
      gltf.scene.rotateX(Math.PI * 0.5);
      gltf.scene.rotateY(Math.PI * 0.5);
      scene.add(gltf.scene);
    }
  );

  let roler = null;
  let player = new THREE.Object3D();
  player.position.set(-20, 0, 0);
  // camera.position.set(-10, 0, 12);
  // player.add(camera);
  scene.add(player);

  camera.position.set(-10, 0, 62);

  loader.load(
    'models/roler.glb',
    (gltf) => {
      roler = gltf.scene;
      roler.rotateX(Math.PI * 0.5);
      roler.children[0].castShadow = true;
      roler.children[1].castShadow = true;
      player.add(roler);

      camera.lookAt(new THREE.Vector3(player.position.x, player.position.y, player.position.z + 10));

      animate();
    }
  );

  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2(1, 1);
  let move = false;

  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mousedown', () => {
    event.preventDefault();
    move = true;
  }, false);
  document.addEventListener('mouseup', () => {
    event.preventDefault();
    move = false;
  }, false);

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  function onMouseMove(event) {
    // console.log('move');

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  }


  let clock = new THREE.Clock();
  let speed = 0.4;
  let xDirection = 0,
    yDirection = 0;
  let deltaX = 0,
    deltaY = 0;
  let theta = 0;
  let point = 0;

  function Theta() {

    if (keyControl.forward) {
      xDirection = 1;
    } else if (keyControl.backward) {
      xDirection = -1;
    } else {
      xDirection = 0
    }

    if (keyControl.left) {
      yDirection = 1;
    } else if (keyControl.right) {
      yDirection = -1;
    } else {
      yDirection = 0;
    }

    theta = Math.atan2(yDirection, xDirection);
  }

  // console.log(scene.children);

  function animate() {

    raycaster.setFromCamera(mouse, camera);

    let intersection = raycaster.intersectObject(plane);
    // let intersection = raycaster.intersectObjects(scene.children);

    // console.log(intersection[0]);

    if (move) {
      point = intersection[0].point;
    }

    deltaX = point.x - player.position.x;
    deltaY = point.y - player.position.y;
    theta = Math.atan2(deltaY, deltaX);

    // console.log(deltaY, deltaX);
    // time = Math.sqrt(((deltaX * deltaX) + (deltaY * deltaY)) / (speed * speed));
    if (((deltaX * deltaX) + (deltaY * deltaY)) > 0.1) {
      speed = 0.4;
      roler.rotation.y = theta;
      player.position.x += speed * Math.cos(theta);
      player.position.y += speed * Math.sin(theta);
    }


    // gsap.to(player.position, {
    //   duration: time * 1000000,
    //   x: point.x
    // });
    // gsap.to(player.position, {
    //   duration: time * 1000000,
    //   y: point.y
    // });


    Theta();

    if (keyControl.forward || keyControl.backward || keyControl.left || keyControl.right) {
      speed = 0.2;
      roler.rotation.y = theta;
    } else {
      speed = 0;
      roler.rotation.y = roler.rotation.y;
    }



    player.position.x += speed * Math.cos(theta);
    player.position.y += speed * Math.sin(theta);

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

}

function initOption() {

}

function initHelp() {

}