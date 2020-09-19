import * as THREE from "../threejs/build/three.module.js";
import { OrbitControls } from "../threejs/jsm/controls/OrbitControls.js";
import { TransformControls } from "../threejs/jsm/controls/TransformControls.js";
import * as dat from "../dat.gui/dat.gui.module.js";

/** 
 * Ammo.js as a physics engine
*/

let Engine = (function () {

    function Engine() {

        // this.world = null;
        this.environment = null;
        this.camera = null;
        this.renderer = null;
        this.control = null;
        this.raycaster = null;
        this.mouse = null;

        //create clock for timing
        this.clock = new THREE.Clock();

        this._activeRenderLoops = [];

        this.antialias = false;

        Engine._initScene.bind(this)();
        Engine._initGUI.bind(this)();
        Engine._initControl.bind(this)();

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    Engine._initScene = function () {
        let options = {
            antialias: false,
            allowSleep: false,
            Shadows: true,
            // gravity: new CANNON.Vec3(0, 0, -10),
            message: 'Select an object to start',
            save_as_picture: function () {
                let link = document.createElement("a");

                document.body.appendChild(link);

                let canvas = this.renderer.domElement;

                link.download = "myimage.png";
                link.href = canvas.toDataURL("image/png");

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }.bind(this),
        }

        this.options = options;

        this.environment = new THREE.Scene();
        this.scene = new THREE.Scene();
        this.environment.add(this.scene);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(10, 8, 8);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.antialias,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xbfd1e5);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = this.options.Shadows;
        this.renderer.shadowMapSoft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        //添加辅助线
        let helper = new THREE.GridHelper(400, 100);
        helper.rotateX(Math.PI / 2);
        // helper.material.opacity = 0.75;
        helper.material.transparent = true;
        // this.environment.add(helper);

        //添加光源
        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
        // refreshHemiIntensity();
        hemiLight.color.setHSL(0.59, 0.4, 0.6);
        hemiLight.groundColor.setHSL(0.095, 0.2, 0.75);
        hemiLight.position.set(0, 50, 0);
        this.environment.add(hemiLight);

        let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-100, 100, 50);
        directionalLight.castShadow = true;
        let d = 15
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;

        directionalLight.shadow.camera.near = 2;
        directionalLight.shadow.camera.far = 500;

        directionalLight.shadow.mapSize.x = 2048;
        directionalLight.shadow.mapSize.y = 2048;

        let sunTarget = new THREE.Object3D();
        directionalLight.target = this.environment;
        this.environment.add(sunTarget, directionalLight);

        this.environment.add(new THREE.CameraHelper(directionalLight.shadow.camera));

        // let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50);
        // this.environment.add(directionalLightHelper);

        // this.environment.fog = new THREE.FogExp2(0x000000, 0.01);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

    }

    Engine._initGUI = function () {

        this.gui = new dat.GUI();

        this.settings = this.gui.addFolder('Settings');
        // let gravity = this.settings.addFolder('Gravity');
        // gravity.add(this.options.gravity, 'x');
        // gravity.add(this.options.gravity, 'y');
        // gravity.add(this.options.gravity, 'z');
        this.settings.add(this.options, 'allowSleep').name('Allow Sleep').onChange((enabled) => {
            if (enabled) {
                this.world.allowSleep = true;
            } else {
                this.world.allowSleep = false;
                console.log('false');
            }
        });

        this.settings.add(this.options, 'antialias').name('Antialias').onChange((enabled) => {
            if (enabled) {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: true,
                //     preserveDrawingBuffer: true
                // });

                console.log('true');
            } else {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: false,
                //     preserveDrawingBuffer: true
                // });

                console.log('false');
            }

        });

        this.settings.add(this.options, 'Shadows')
            .onChange((enabled) => {
                if (enabled) {
                    console.log(this.renderer.shadowMap.enabled);
                    this.renderer.shadowMap.enabled = true;
                    // this.csm.lights.forEach((light) => {
                    //     light.castShadow = true;
                    // });
                }
                else {
                    console.log(this.renderer.shadowMap.enabled);
                    this.renderer.shadowMap.enabled = false;
                    // this.csm.lights.forEach((light) => {
                    //     light.castShadow = false;
                    // });
                }
            });
        this.gui.add(this.options, 'message');
        this.gui.add(this.options, 'save_as_picture').name('Save as image');

        this.config = {
            // Selected Object
            objectType: "null",
            materialType: "MATERIAL_TYPE_DIFFUSE",
            materialColor: "#ffffff",
            materialColorTexture: 0,
            materialEmission: "#000000",
            materialEmissionTexture: 0,
            materialRoughness: 0.2,
            materialRoughnessTexture: 0,
            materialRefractiveIndex: 1.6,

            fitToGround: function () {
                editor.fitToGroundSelectedObject();
            },
            remove: function () {
                editor.removeSelectedObject();
            },
        }

        let selectedObjectFolder = this.gui.addFolder("Selected Object");
        selectedObjectFolder.add(this.config, 'objectType', {
            null: "null",
            sphere: "sphere",
            box: "aabb",
        }).name('Type').onChange(function (value) {
            // editor.updateSelectedObject(value, true, "type");
        }).listen();

        selectedObjectFolder.open();

    }

    Engine._initControl = function () {

        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        // this.control.enableDamping = true;
        // this.control.dampingFactor = 0.05;
        // this.control.maxPolarAngle = 1.5;
        this.control.update();

        window.addEventListener('keydown', (event) => {
            // console.log(event.keyCode);

            switch (event.keyCode) {
                case 110:
                    if (this.transformControls.object) {
                        let position = new THREE.Vector3();
                        position.copy(this.transformControls.object.position);
                        this.control.target = position;
                    }
                    break;
            }

        });

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.environment.add(this.transformControls);

        /**
         * Select Controls
        */

        (function (_canvas, _camera, _scene) {

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            let onDownPosition = new THREE.Vector2();
            let onUpPosition = new THREE.Vector2();

            let transformControls = this.transformControls;

            transformControls.addEventListener('dragging-changed', (event) => {

                this.control.enabled = !event.value;    // 禁用 OrbitControls

            });

            /** 
             * 处理Transform Controls 的移动
            */
            function handleMove() {
                let position = new THREE.Vector3();
                let quat = new THREE.Vector4();
                position.copy(transformControls.object.position);
                quat.copy(transformControls.object.quaternion);

                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                let motionState = new Ammo.btDefaultMotionState(transform);

                transformControls.object.body.setMotionState(motionState);
            }

            /** 
             * 更改模式
            */
            window.addEventListener('keydown', (event) => {
                // console.log(event.keyCode);
                switch (event.keyCode) {
                    case 84: // Translate
                        transformControls.setMode('translate');
                        break;
                    case 82: // Rotate
                        transformControls.setMode('rotate');
                        break;
                }
            });

            document.body.addEventListener('mousedown', onMouseDown, false);
            // document.body.addEventListener('touchstart', onTouchStart, false);

            function onMouseDown(event) {

                // event.preventDefault();

                onDownPosition = getMousePosition(_canvas, event.clientX, event.clientY);

                document.addEventListener('mouseup', onMouseUp, false);

            }

            function onMouseUp(event) {

                onUpPosition = getMousePosition(_canvas, event.clientX, event.clientY);

                handleClick();

                document.removeEventListener('mouseup', onMouseUp, false);

            }

            function getMousePosition(dom, x, y) {

                let rect = dom.getBoundingClientRect();

                let p_x = (x - rect.left) / rect.width,
                    p_y = (y - rect.top) / rect.height;

                return new THREE.Vector2(p_x, p_y);

            }

            // object picking

            function getIntersects(point, objects) {

                mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

                raycaster.setFromCamera(mouse, _camera);

                return raycaster.intersectObjects(objects);

            }

            function getObject(object) {
                let returnObject;

                if (object.parent.type == 'Scene') {
                    returnObject = object;
                } else if (object.parent.type == 'Group') {
                    returnObject = getObject(object.parent);
                }

                return returnObject;
            }

            function handleClick() {

                if (onDownPosition.distanceTo(onUpPosition) === 0) {

                    transformControls.detach();

                    let objectCollections = [];

                    _scene.traverse((child) => {
                        if (child.children.length == 0)
                            objectCollections.push(child);
                    });

                    // console.log(objectCollections);

                    let intersects = getIntersects(onUpPosition, objectCollections);

                    if (intersects.length > 0) {

                        // let object = getObject(intersects[0].object);
                        let object = intersects[0].object;

                        transformControls.attach(object);

                    }

                }

            }
        }).bind(this)(this.renderer.domElement, this.camera, this.scene);

    }

    Engine.prototype.enabledPhysics = function (gravity) {

        this._physicsEngine = new DW.PhysicsEngine(gravity);
        this.world = this._physicsEngine.world;

    }

    Engine.prototype.isPhysicsEnabled = function () {
        return this.world !== undefined;
    };

    Engine.prototype.stopRenderLoop = function (renderFunction) {
        if (!renderFunction) { // 停止全部
            this._activeRenderLoops = [];
            return;
        }
        var index = this._activeRenderLoops.indexOf(renderFunction);
        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
        }
    };

    Engine._updatePhysics = function () {
        let tmpTrans = new Ammo.btTransform();

        let deltaTime = this.clock.getDelta();

        // Step world
        this.world.stepSimulation(deltaTime, 10);

        this.scene.traverse((child) => {
            if (void 0 !== child.body) {
                if (this.transformControls.dragging && this.transformControls.object == child) {
                    let position = new THREE.Vector3();
                    let quat = new THREE.Vector4();
                    position.copy(this.transformControls.object.position);
                    quat.copy(this.transformControls.object.quaternion);

                    let transform = new Ammo.btTransform();
                    transform.setIdentity();
                    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
                    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

                    this.transformControls.object.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
                    this.transformControls.object.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));

                    let motionState = new Ammo.btDefaultMotionState(transform);

                    this.transformControls.object.body.setMotionState(motionState);
                    this.transformControls.object.body.activate();
                } else {
                    // Update rigid bodies
                    let objAmmo = child.body;
                    let ms = objAmmo.getMotionState();
                    if (ms) {
                        ms.getWorldTransform(tmpTrans);
                        let p = tmpTrans.getOrigin();
                        let q = tmpTrans.getRotation();
                        child.position.set(p.x(), p.y(), p.z());
                        child.quaternion.set(q.x(), q.y(), q.z(), q.w());
                    }
                }
            }
        });


    }

    Engine.prototype._renderLoop = function () {

        this.renderer.render(this.environment, this.camera);

        this.control.update();

        this.scene.traverse((child) => {
            if (child.type == 'Mesh') {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        if (this.isPhysicsEnabled)
            Engine._updatePhysics.bind(this)();

        if (this._activeRenderLoops.length > 0) {

            for (var index = 0; index < this._activeRenderLoops.length; index++) {
                var renderFunction = this._activeRenderLoops[index];
                renderFunction();
            }

        }

        window.requestAnimationFrame(this._boundRenderFunction);

    };

    /** 
     * Render the scene
     * @param {Function} renderFunction - additional function
    */
    Engine.prototype.runRenderLoop = function (renderFunction) {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) { // 若在 this._activeRenderLoops 中存在
            return;
        }
        if (renderFunction)
            this._activeRenderLoops.push(renderFunction);

        this._boundRenderFunction = this._renderLoop.bind(this);

        window.requestAnimationFrame(this._boundRenderFunction);
    };

    Engine.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return Engine;


})();

// let PhysicsEngine = (function(){

//     function PhysicsEngine(){

//     }

// })();

// let PhysicsEngine = Engine._physicsEngine;

let PhysicsEngine = (function () {

    /** 
     * Initializes the ammoJS plugin
     *
     * // ammo.js
     * var Ammo = function(Ammo) {
     *     Ammo = Ammo || {};
     *     ....
     * }
     *
    */
    function PhysicsEngine(gravity) {
        let ammoJSPlugin = Ammo;

        this.ammoJSPlugin = {};

        if (typeof ammoJSPlugin === "function") {
            Ammo(this.ammoJSPlugin).then(function () { });
            // Ammo().then(PhysicsEngine.init.bind(this)(gravity));
            console.log(Ammo);
        } else {
            this.ammoJSPlugin = ammoJSPlugin;
        }

        if (!this.isSupported()) {
            console.error("AmmoJS is not available. Please make sure you included the js file.");
            return;
        }

        this._timeStep = 1 / 60;
        this._fixedTimeStep = 1 / 60;
        this._maxSteps = 5;

        this._collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this._dispatcher = new Ammo.btCollisionDispatcher(this._collisionConfiguration);
        this._overlappingPairCache = new Ammo.btDbvtBroadphase();
        this._solver = new Ammo.btSequentialImpulseConstraintSolver();
        this._softBodySolver = new Ammo.btDefaultSoftBodySolver();

        // this.world = new Ammo.btSoftRigidDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration, this._softBodySolver);

        gravity = gravity || new Ammo.btVector3(0, -9.8, 0);

        this.world = new Ammo.btDiscreteDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration);
        this.world.setGravity(gravity);
    }

    /**
     * If this plugin is supported
     * @returns true if its supported
     */
    PhysicsEngine.prototype.isSupported = function () {
        return this.ammoJSPlugin !== undefined;
    };

    /**
     * Sets the gravity of the physics world (m/(s^2))
     * @param {Ammo.btVector3} gravity Gravity to set
     */
    PhysicsEngine.prototype.setGravity = function (gravity) {
        this.world.setGravity(gravity);
        this.world.getWorldInfo().set_m_gravity(gravity);
    };

    /**
     * Amount of time to step forward on each frame (only used if useDeltaForWorldStep is false in the constructor)
     * @param timeStep timestep to use in seconds
     */
    PhysicsEngine.prototype.setTimeStep = function (timeStep) {
        this._timeStep = timeStep;
    };

    /**
     * Increment to step forward in the physics engine (If timeStep is set to 1/60 and fixedTimeStep is set to 1/120 the physics engine should run 2 steps per frame) (Default: 1/60)
     * @param fixedTimeStep fixedTimeStep to use in seconds
     */
    PhysicsEngine.prototype.setFixedTimeStep = function (fixedTimeStep) {
        this._fixedTimeStep = fixedTimeStep;
    };

    /**
     * Sets the maximum number of steps by the physics engine per frame (Default: 5)
     * @param maxSteps the maximum number of steps by the physics engine per frame
     */
    PhysicsEngine.prototype.setMaxSteps = function (maxSteps) {
        this._maxSteps = maxSteps;
    };

    /**
     * Gets the current timestep (only used if useDeltaForWorldStep is false in the constructor)
     * @returns the current timestep in seconds
     */
    PhysicsEngine.prototype.getTimeStep = function () {
        return this._timeStep;
    };

    // Ammo's behavior when maxSteps > 0 does not behave as described in docs
    // @see http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
    //
    // When maxSteps is 0 do the entire simulation in one step
    // When maxSteps is > 0, run up to maxStep times, if on the last step the (remaining step - fixedTimeStep) is < fixedTimeStep, the remainder will be used for the step. (eg. if remainder is 1.001 and fixedTimeStep is 1 the last step will be 1.001, if instead it did 2 steps (1, 0.001) issues occuered when having a tiny step in ammo)
    // Note: To get deterministic physics, timeStep would always need to be divisible by fixedTimeStep
    PhysicsEngine.prototype._stepSimulation = function (timeStep, maxSteps, fixedTimeStep) {
        if (timeStep === void 0) { timeStep = 1 / 60; }
        if (maxSteps === void 0) { maxSteps = 10; }
        if (fixedTimeStep === void 0) { fixedTimeStep = 1 / 60; }
        if (maxSteps == 0) {
            this.world.stepSimulation(timeStep, 0);
        }
        else {
            while (maxSteps > 0 && timeStep > 0) {
                if (timeStep - fixedTimeStep < fixedTimeStep) {
                    this.world.stepSimulation(timeStep, 0);
                    timeStep = 0;
                }
                else {
                    timeStep -= fixedTimeStep;
                    this.world.stepSimulation(fixedTimeStep, 0);
                }
                maxSteps--;
            }
        }
    };

    PhysicsEngine.prototype.generatePhysicsBodyFromModel = function (model, type, params) {

        let collisionShape = new THREE.Group();

        model.traverse((child) => {
            if (child.hasOwnProperty('userData')) {

                if (child.userData.hasOwnProperty('data')) {
                    if (child.userData.data == 'collision' || child.userData.data == 'physics') {

                        child.visible = visible || false;

                        collisionShape.add(child.clone());

                    }
                }
            }
        });

        return this.generatePhysicsBody(collisionShape, type, params);
    }

    /**
     * Creates a physics body using the plugin
     * @param {Mesh} mesh
     * @param {Object} params the info to create the physics body on
     */
    PhysicsEngine.prototype.generatePhysicsBody = function (mesh, type, params) {
        let mass = params.mass || 0;
        let restitution = params.restitution || 0.4;
        let friction = params.friction || 0.8;

        let collisionShape = new THREE.Group();

        mesh.traverse((child) => {
            if (child.hasOwnProperty('userData')) {

                if (child.userData.hasOwnProperty('data')) {
                    if (child.userData.data == 'collision' || child.userData.data == 'physics') {

                        child.visible = params.visible || false;

                        collisionShape.add(child.clone());

                    }
                }
            }
        });

        if (collisionShape.children.length !== 0) {
            mesh = collisionShape;
        }

        let colShape = this._createShape(mesh, false);

        let body;

        switch (type) {
            case 'soft':
                console.warn('SoftBody is not currently supported');
                break;

            case 'rigid':
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
                transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));

                let motionState = new Ammo.btDefaultMotionState(transform);

                let localInertia = new Ammo.btVector3(0, 0, 0);

                if (mass !== 0) {
                    colShape.calculateLocalInertia(mass, localInertia);
                }

                let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
                body = new Ammo.btRigidBody(rbInfo);
                body.setRestitution(restitution);
                body.setFriction(friction);

                break;
        }

        return body;
    }
	
	PhysicsEngine.prototype.generateHeightFieldFromImage = function (img, width, depth, minHeight, maxHeight){
				
		let _canvas = document.createElement('canvas'),
		ctx = _canvas.getContext('2d');
		
		_canvas.width = width;
		_canvas.height = depth;
		ctx.drawImage(img, 0, 0, width, depth);
		
		const data = ctx.getImageData(0, 0, width, depth).data;
		
		let imageData = new Float32Array(width * depth);
		
		for (let i = 0; i < imageData.length; i++) {
			
			imageData[i] = data[4 * i] / 255;
			
		}
		
		return this.generateHeightField(imageData, width, depth, minHeight, maxHeight);
	}
	
	PhysicsEngine.prototype.generateHeightField = function (data, width, depth, minHeight, maxHeight){
	
	let hRange = maxHeight - minHeight;
	
	let geometry = new THREE.PlaneBufferGeometry( width, depth, width - 1, depth - 1 );
	geometry.rotateX( - Math.PI / 2 );

	let vertices = geometry.attributes.position.array;

	for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

		// j + 1 because it is the y component that we modify
		vertices[ j + 1 ] = data[ i ] * hRange - hRange / 2;;

	}
	geometry.computeVertexNormals();
	
	let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC7C7C7 } );
	let mesh = new THREE.Mesh( geometry, groundMaterial );
	mesh.receiveShadow = true;
	//mesh.castShadow = true;
	
	
	// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
	const heightScale = 1.0;
	
	// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
	const upAxis = 1.0;
	
	// height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
	const heightDataType = 'PHY_FLOAT';
	
	// Set this to your needs (inverts the triangles)
	const flipQuadEdges = false;	
	
	// Creates height data buffer in Ammo heap
	let ammoHeightData = Ammo._malloc(4.0 * width * depth);

	// Copy the javascript height data array to the Ammo one.
	let p = 0;
	let p2 = 0;
	
	for ( let j = 0; j < depth; j ++ ) {
		for ( let i = 0; i < width; i ++ ) {
			
			let height = data[ p ] * hRange + minHeight;

			// write 32-bit float data to memory
			Ammo.HEAPF32[ ammoHeightData + p2 >> 2 ] = height;

			p ++;

			// 4 bytes/float
			p2 += 4;
		}
	}
	
	let heightFieldShape = new Ammo.btHeightfieldTerrainShape(width, depth, ammoHeightData, heightScale, minHeight, maxHeight, upAxis, heightDataType, flipQuadEdges);
	
	let mass = 0;
	
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(0, (maxHeight + minHeight) / 2, 0));
	transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
	let motionState = new Ammo.btDefaultMotionState(transform);
	let localInertia = new Ammo.btVector3(0, 0, 0);

	if (mass !== 0) {
		heightFieldShape.calculateLocalInertia(mass, localInertia);
	}

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, heightFieldShape, localInertia);
	let body = new Ammo.btRigidBody(rbInfo);
	// body.setRestitution(restitution);
	// body.setFriction(friction);

	mesh.body = body;
	return mesh;

	/* return {
		mesh,
		body
	}; */
}

    // adds all verticies (including child verticies) to the convex hull shape
    PhysicsEngine.prototype._addHullVerts = function (btConvexHullShape, topLevelMesh, mesh) {
        let geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

        let scale = mesh.scale;

        // console.log(geometry);

        let triangleCount = geometry.vertices.length;

        let vertex = new Ammo.btVector3(0, 0, 0);

        for (let i = 0; i < geometry.vertices.length; i++) {
            let a = scale.x * geometry.vertices[i].x;
            let b = scale.y * geometry.vertices[i].y;
            let c = scale.z * geometry.vertices[i].z;

            vertex.setValue(a, b, c);

            btConvexHullShape.addPoint(vertex, true);
        }

        mesh.children.forEach(function (childMesh) {
            triangleCount += this._addHullVerts(btConvexHullShape, topLevelMesh, childMesh);
        });

        return triangleCount;
    }

    /** 
     * Create Collision Shape 
     * @param {Object3D} object
     * @param {Boolean} ignoreChildren whether to ignore the children
    */
    PhysicsEngine.prototype._createShape = function (object, ignoreChildren) {

        let returnShape;

        if (ignoreChildren === void 0) { ignoreChildren = false; }

        if (!ignoreChildren) {
            let meshChildren = object.children;

            returnShape = new Ammo.btCompoundShape();

            let childrenAdded = 0;

            meshChildren.forEach((childMesh) => {
                // console.log(childMesh);

                let shape = this._createShape(childMesh);

                let scale = childMesh.parent.scale;

                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(childMesh.position.x * scale.x, childMesh.position.y * scale.y, childMesh.position.z * scale.z));
                transform.setRotation(new Ammo.btQuaternion(childMesh.quaternion.x, childMesh.quaternion.y, childMesh.quaternion.z, childMesh.quaternion.w));

                returnShape.addChildShape(transform, shape);

                childrenAdded++;
            });

            if (childrenAdded > 0) {
                // Add parents shape as a child if present
                if (object.type == 'Mesh') {
                    var shape = this._createShape(object, true);
                    if (shape) {
                        let transform = new Ammo.btTransform();
                        transform.setIdentity();
                        transform.setOrigin(new Ammo.btVector3(0, 0, 0));
                        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
                        returnValue.addChildShape(transform, shape);
                    }
                }
                return returnShape;
            }
            else {
                // If no children with impostors create the actual shape below instead
                Ammo.destroy(returnShape);
                returnShape = null;
            }
        }

        if (object.geometry.parameters !== void 0) {
            switch (object.geometry.type) {
                case 'BoxGeometry':
                case 'BoxBufferGeometry':
                    returnShape = new Ammo.btBoxShape(new Ammo.btVector3(object.geometry.parameters.width * 0.5, object.geometry.parameters.height * 0.5, object.geometry.parameters.depth * 0.5));
                    break;
                case 'CircleGeometry':
                case 'CircleBufferGeometry':
                    console.warn('CircleGeometry is not currently supported');
                    break;
                case 'ConeGeometry':
                case 'ConeBufferGeometry':
                    console.warn('ConeGeometry is not currently supported');
                    break;
                case 'CylinderGeometry':
                case 'CylinderBufferGeometry':
                    if (object.geometry.parameters.radiusTop == object.geometry.parameters.radiusBottom)
                        returnShape = new Ammo.btCylinderShape(new Ammo.btVector3(object.geometry.parameters.radiusTop, object.geometry.parameters.height * 0.5, object.geometry.parameters.radiusTop));
                    else
                        console.warn('The radius is not equal');
                    break;
                case 'PlaneGeometry':
                case 'PlaneBufferGeometry':
                    returnShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 0.0);
                    break;
                case 'SphereGeometry':
                case 'SphereBufferGeometry':
                    returnShape = new Ammo.btSphereShape(object.geometry.parameters.radius);
                    break;
            }
        } else {
            // ConvexHull

            let convexShape = new Ammo.btConvexHullShape();
            let triangleCount = this._addHullVerts(convexShape, object, object);
            if (triangleCount == 0) {
                // Cleanup Unused Convex Hull Shape
                returnShape = new Ammo.btCompoundShape();
            }
            else {
                returnShape = convexShape;
            }

            returnShape.setMargin(0.01);
        }
        return returnShape;
    }

    PhysicsEngine.prototype.addConstraint = function (mainBody, connectedBody, type, constraintData) {

        let constraint;

        switch (type) {
            case 'HingeConstraint':
                if (!constraintData.mainAxis) {
                    constraintData.mainAxis = new Ammo.btVector3(0, 0, 0);
                }
                if (!constraintData.connectedAxis) {
                    constraintData.connectedAxis = new Ammo.btVector3(0, 0, 0);
                }
                var mainAxis = new Ammo.btVector3(constraintData.mainAxis.x, constraintData.mainAxis.y, constraintData.mainAxis.z);
                var connectedAxis = new Ammo.btVector3(constraintData.connectedAxis.x, constraintData.connectedAxis.y, constraintData.connectedAxis.z);
                constraint = new Ammo.btHingeConstraint(mainBody, connectedBody, new Ammo.btVector3(constraintData.mainPivot.x, constraintData.mainPivot.y, constraintData.mainPivot.z), new Ammo.btVector3(constraintData.connectedPivot.x, constraintData.connectedPivot.y, constraintData.connectedPivot.z), mainAxis, connectedAxis);
                break;

            case 'DistanceConstraint':
                break;

        }

        this.world.addConstraint(constraint, constraintData.collision);

        // return constraint;
    }

    return PhysicsEngine;

})();

let DW = {
    Engine,
    PhysicsEngine,
};

export default DW;