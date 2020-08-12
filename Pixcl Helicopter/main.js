let scene, camera, renderer;
let light, ambientLight;
let gridHelper;
let controls;
let objLoader, textureLoader;
let map;
let keyPressed = false, isPlaying = false;

class Map {
    constructor() {
        this.body = null;
        this.speed = 0.7;
        this.level = 0; // max 30
        this.counter = 0;

        this.levelFrequency = 2000;
        this.levelIncrement = 1100;

        this.fullWidth = 400;
        this.fullHeight = 250;
        this.wallBlockWidth = 2;
        this.wallBlockThickness = 20;
        this.wallBlocksArray = [];
        this.collideMeshList = [];

        this.sineWaveCounter = 0;     // 频率
        this.sineWaveIncrease = 0;    // 增量

        this.isPlaying = false;
    }

    init() {
        this.sineWaveIncrease = Math.PI * 2 / (400 - (this.level * 30));
        console.log('Game Start');

        let wallBlock = {};   // 墙
        wallBlock.topBlock = {};
        wallBlock.bottomBlock = {};

        this.reduction = (this.level * 10);         // 随着等级增加，高度的减小量，每增加一级，高度减 
        let prevHeight = 180 - this.reduction;    // 前一个间隙的高度

        for (let i = 0; i < (this.fullWidth / this.wallBlockWidth); i++) {
            let newHeight = this.getNewHeightValue(prevHeight);
            let newYPos = this.getNewYPosValue(newHeight);

            let xPos = i * this.wallBlockWidth - this.fullWidth / 2;
            let yPos = newYPos;
            let height = newHeight;

            this.createWall(xPos, yPos, height);

            prevHeight = newHeight;
        }

        // console.log(this.wallBlocksArray[0].topBlock.mesh.geometry, this.wallBlocksArray[0].bottomBlock.mesh.geometry.parameters);

    }

    createWall(xPos, yPos, height) {
        let wallBlock = {};   // 墙
        wallBlock.xPos = xPos;
        wallBlock.yPos = yPos;
        wallBlock.height = height;
        wallBlock.topBlock = {};
        wallBlock.bottomBlock = {};

        wallBlock.topBlock.height = 0.5 * (this.fullHeight - height) - yPos;
        wallBlock.bottomBlock.height = 0.5 * (this.fullHeight - height) + yPos;
        // console.log(yPos, height + wallBlock.topBlock.height + wallBlock.bottomBlock.height);

        wallBlock.topBlock.yPos = 0.5 * (this.fullHeight - wallBlock.topBlock.height);
        wallBlock.bottomBlock.yPos = -0.5 * (this.fullHeight - wallBlock.bottomBlock.height);

        wallBlock.topBlock.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(this.wallBlockWidth, wallBlock.topBlock.height, this.wallBlockThickness),
            new THREE.MeshLambertMaterial({ color: 0xff4444 })
        );
        wallBlock.bottomBlock.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(this.wallBlockWidth, wallBlock.bottomBlock.height, this.wallBlockThickness),
            new THREE.MeshLambertMaterial({ color: 0x79CB12 })
        );

        wallBlock.topBlock.mesh.position.set(xPos, wallBlock.topBlock.yPos, 0);
        wallBlock.bottomBlock.mesh.position.set(xPos, wallBlock.bottomBlock.yPos, 0);

        scene.add(wallBlock.topBlock.mesh);
        scene.add(wallBlock.bottomBlock.mesh);

        this.collideMeshList.push(wallBlock.topBlock.mesh, wallBlock.bottomBlock.mesh);

        this.wallBlocksArray.push(wallBlock);
    }

    render() {

        /*--o render - UPDATE VIEW
        Applying the new body variable to our view to draw the sprite on the context;
        */

        // if ((this.body.x % this.wallBlockWidth) === 0 && this.body.x !== 0 && this.isPlaying) {
        if (this.isPlaying) {
            this.paint(true);
        } else {
            this.paint(false);
        }
    }

    update() {
        if (this.isPlaying) {

            this.body.position.x += this.speed;

            if ((this.counter % this.levelFrequency) === 0) {
                this.level++;
                this.levelFrequency += this.levelIncrement;

                this.speed += 0.02
                console.log(this.level);
            }

            this.counter += 2;
        }
    }

    paint(isWithNewWall) {

        if (isWithNewWall) {

            if (this.body.position.x - this.wallBlocksArray[0].topBlock.mesh.position.x > this.fullWidth / 2) {
                scene.remove(this.wallBlocksArray[0].topBlock.mesh);
                scene.remove(this.wallBlocksArray[0].bottomBlock.mesh);
                this.wallBlocksArray.shift();

                this.collideMeshList.shift();
                this.collideMeshList.shift();


                var lastWallBlockObj = this.wallBlocksArray[this.wallBlocksArray.length - 1];

                let newHeight = this.getNewHeightValue(lastWallBlockObj.height);
                let newYPos = this.getNewYPosValue(newHeight);

                let xPos = lastWallBlockObj.xPos + this.wallBlockWidth;
                let yPos = newYPos;
                let height = newHeight;

                this.createWall(xPos, yPos, height);

                /*
                this.lastYPos = newYPos;
                this.lastHeight = newHeight;
                */
            }
        }
    }

    getNewHeightValue(preHeightValue) {   // 前一个间隙的高度
        this.reduction = (this.level * 8);  // 按等级降低间隙高度

        let increment = 2; // 增量
        let newHeightValue; // 新间隙的高度

        if (preHeightValue >= (this.fullHeight - 120) - this.reduction) {            // 当前等级下的大于最大值
            newHeightValue = preHeightValue - increment;
        } else if (preHeightValue < (this.fullHeight - 140) - this.reduction) {     // 当前等级下的小于最小值
            newHeightValue = preHeightValue + increment;
        } else {                                                                    // 当前等级下的最大值与最小值之间
            newHeightValue = ((Math.random() * 1) > 0.5) ? preHeightValue + increment : preHeightValue - increment;
        }
        return newHeightValue;
    }

    getNewYPosValue(height) {
        var yPos = Math.sin(this.sineWaveCounter) * 30;
        // yPos = yPos * (this.fullHeight - 20) / 16;
        this.sineWaveCounter += 0.04;

        // yPos -= (height / 20);

        // var yPos = 0;

        return yPos;
    }

}

window.onload = init;

function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1.0,
        5000
    );
    camera.position.set(0, 0, 120);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // renderer.setClearColor(0xeeeeee);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas').appendChild(renderer.domElement);

    /*
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add(listener);

    // create a global audio source
    var sound = new THREE.Audio(listener);

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load('bgm.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        // sound.play();

        // start();
    });
    */

    light = new THREE.PointLight(0xffffff, 0.6);
    light.position.set(0, 30, 0);
    camera.add(light);
    camera.position.set(-6, 12, 12);
    camera.lookAt(scene.position);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    gridHelper = new THREE.GridHelper(50, 10);
    scene.add(gridHelper);

    map = new Map();
    map.init();

    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.minDistance = 5;



    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    objLoader = new THREE.OBJLoader();
    textureLoader = new THREE.TextureLoader();
    objLoader.load(
        'models/VL_Prop_Chopper.obj',
        (obj) => {

            obj.children[0].rotateX(-Math.PI * 0.5);
            obj.children[0].rotateZ(Math.PI * 0.5);
            obj.children[0].material = new THREE.MeshLambertMaterial({ color: 0x4B5161 });

            // console.log(obj.children[0]);
            obj.add(camera);
            scene.add(obj);

            let collideBox = new THREE.Mesh(
                new THREE.BoxGeometry(3.16, 14.44, 3.08),
                new THREE.MeshBasicMaterial({ color: 0xF8F80D, wireframe: true })
            );
            collideBox.visible = false;
            collideBox.position.set(0, 0.733, 1.564);
            obj.children[0].add(collideBox);

            let physics = {};
            let speed = 0;
            let theta = 0;
            physics.gravity = -0.04;


            map.body = obj;
            document.getElementById('start').addEventListener('click', () => {
                map.isPlaying = true;

                camera.position.set(0, 0, 100);
                camera.lookAt(obj.position);

                document.getElementById('start').remove();
            });

            function hitTest() {
                /**
                 * 
                 *  功能：检测 movingCube 是否与数组 collideMeshList 中的元素发生了碰撞
                 * 
                 */
                // console.log(obj.children[0].children[0]);
                let originPoint = obj.children[0].children[0].position.clone();

                for (let i = 0; i < obj.children[0].children[0].geometry.vertices.length; i++) {
                    // 顶点原始坐标
                    let localVertex = obj.children[0].children[0].geometry.vertices[i].clone();
                    // 顶点经过变换后的坐标
                    let globalVertex = localVertex.applyMatrix4(obj.children[0].children[0].matrixWorld).applyMatrix4(obj.children[0].matrixWorld);
                    // 获得由中心指向顶点的方向向量
                    let directionVector = globalVertex.sub(obj.children[0].children[0].position);

                    // 将方向向量单位化
                    let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                    // 检测射线与多个物体的相交情况
                    let collisionResults = ray.intersectObjects(map.collideMeshList);
                    // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
                    if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                        // crash = true;   // crash 是一个标记变量
                        console.log('碰撞')
                    }
                }
            }

            window.addEventListener("keydown", onKeyDown, false);
            window.addEventListener("touchstart", (e) => { keyPressed = true; }, false);
            window.addEventListener("keyup", onKeyUp, false);
            window.addEventListener("touchend", (e) => { keyPressed = false; }, false);

            function onKeyDown(e) {
                switch (e.keyCode) {
                    case 32:    // space
                        keyPressed = true;
                        break;
                };
            }

            function onKeyUp(e) {
                switch (e.keyCode) {
                    case 32:
                        keyPressed = false;
                        break;
                };
            }

            function updatePhysics() {
                // if (!isPlaying) return;
                // console.log(keyPressed);
                // y coordinate
                if (keyPressed)
                    speed -= physics.gravity;
                else
                    speed += physics.gravity;

                // rotation
                theta = Math.atan2(speed, 200);
                obj.children[0].rotation.y = -theta * 180 / Math.PI;

                obj.position.y += speed;
                // console.log(speed);
            }

            function render() {
                // controls.update();
                if (map.isPlaying) {
                    map.render();
                    map.update();

                    // hitTest();

                    updatePhysics();
                }                

                requestAnimationFrame(render);
                renderer.render(scene, camera)
            }

            render();

        }
    );

}


