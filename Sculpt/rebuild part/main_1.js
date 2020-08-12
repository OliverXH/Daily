/**
 * 
 */
let clock = new THREE.Clock();

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true
});
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT);
camera.position.set(5, 10, 10);
scene.add(camera);

let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(30, 10, 50);
directionalLight.castShadow = true;
let d = 15
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
directionalLight.shadow.mapSize.x = 1024;
directionalLight.shadow.mapSize.y = 1024;
scene.add(directionalLight);

/**
 * controls
 */
const controls = new THREE.OrbitControls(camera, renderer.domElement);

/*
 * Events to fire upon window resizing.
 */
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
let box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshPhongMaterial({
        color: 0xff0000
    })
);
box.position.y = 4;
scene.add(box);

/** 
 * Shaders
*/
let Shaders = {
    vertex: {
        passUv: [

            "varying vec2 vUv;",

            "void main() {",
            "	vUv = uv;",
            "	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"

        ].join('\n')
    },

    fragment: {
        sculpt: [

            "uniform vec2 brushPosition;",
            "uniform float brushRadius;",
            "uniform float brushAmount;",

            "uniform sampler2D baseTexture;",
            "uniform sampler2D sculptTexture;",

            "uniform int isSculpting;",
            "uniform int sculptType;",

            "varying vec2 vUv;",

            "float add(vec2 uv){",
            "	float len = length(uv - vec2(brushPosition.x, 1.0 - brushPosition.y));",
            "	return brushAmount * smoothstep(brushRadius, 0.0, len);",
            "}",

            "void main(){",
            "	vec4 base = texture2D(baseTexture, vUv);",
            "	vec4 previous = texture2D(sculptTexture, vUv);",

            // 雕刻
            "	if (isSculpting == 1) {",
            "		if (sculptType == 1) {",  //add
            "			previous.r += add(vUv);",
            "		} else if (sculptType == 2) {",  //remove
            "			previous.r -= add(vUv);",
            // "		previous.r = max(0.0, base.r + previous.r) - base.r;",	// 最小值为 base
            "		}",
            "	}",

            "	gl_FragColor = previous;",
            "}"
        ].join('\n')
    }
}

let SIZE = 10,
    SEGMENTS = 256;

var planeGeometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
planeGeometry.rotateX(-Math.PI / 2);
var plane = new THREE.Mesh(planeGeometry, null);
scene.add(plane);

plane.material = new THREE.ShaderMaterial({
    uniforms: {
        brushPosition: { value: new THREE.Vector2() },
        brushRadius: { value: 1.5 },
        brushAmount: { value: 0.03 },
        baseTexture: { value: null },
        sculptTexture: { value: null },
        isSculpting: { value: false },
        sculptType: { value: 0 }
    },
    vertexShader: Shaders.vertex['passUv'],
    fragmentShader: Shaders.fragment['sculpt']
});

let renderTarget1 = new THREE.WebGLRenderTarget(SIZE, SIZE, {
    format: THREE.RGBFormat,			// default
    stencilBuffer: false,
    depthBuffer: false,
    type: THREE.FloatType
});


let rayCaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();

let intersectPoint = new THREE.Vector2();

let sculpting = false;

window.addEventListener('keydown', (event) => {
    // console.log(event.keyCode);
    if (event.keyCode == 83) {

        sculpting = true;
        controls.enabled = false;

    }
});
window.addEventListener('keyup', (event) => {
    // console.log(event.keyCode);
    if (event.keyCode == 83) {

        sculpting = false;
        controls.enabled = true;

    }
});

document.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(e) {

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);

    if (sculpting) {

        intersectPoint = getPosition(e);

    }
}

function onMouseMove(e) {
    if (sculpting) {

        intersectPoint = getPosition(e);

    }
}

function onMouseUp(e) {

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
}

function getPosition(e) {

    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    rayCaster.setFromCamera(mouse, camera);

    let intersectInfo = rayCaster.intersectObject(plane);

    //get intersection point
    if (intersectInfo && intersectInfo[0]) {
        // console.log(intersectInfo[0]);
        return intersectInfo[0].point;
    }

    return null;
}

function render() {
    controls.update();

    let dt = clock.getDelta();

    if(sculpting){
        if(intersectPoint){
            
        }
    }

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    requestAnimationFrame(render);
}

render();
