let engine = new DW.Engine();
let scene = engine.scene;
let world = engine.world;

/*
//添加辅助线
const axisHelper = new THREE.AxisHelper(800);
scene.add(axisHelper);
*/


/**
 * download
 */
(function () {

    let link = document.createElement("a");
    link.style.zIndex = "20";
    link.style.position = "absolute";
    link.style.top = "20px";
    link.style.left = "20px";
    let btn = document.createElement('button');
    btn.innerHTML = "Save as picture";
    btn.style.fontSize = "20px";
    link.appendChild(btn);
    document.body.appendChild(link);

    link.addEventListener('click', downLoad);

    function downLoad() {
        let canvas = engine.renderer.domElement;

        link.download = "myimage.png";
        link.href = canvas.toDataURL("image/png");

        console.log(link);

        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link); // 下载之后把创建的元素删除
    }

})();

//添加立方体
const geometry = new THREE.BoxGeometry(5, 5, 5);
const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, 0);
mesh.castShadow = true;
scene.add(mesh);

//添加平面
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI * 0.5;
plane.position.set(0, 0, 0);
plane.receiveShadow = true;
// scene.add(plane);

engine.runRenderLoop();


