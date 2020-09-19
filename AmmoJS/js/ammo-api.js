
/* Dynamics World */
function rbDynamicsWorld() {

    this.dynamicsWorld = null;
    this.collisionConfiguration = null;
    this.dispatcher = null;
    this.pairCache = null;
    this.constraintSolver = null;
    this.filterCallback = null;

};

/* Rigid Body */
function rbRigidBody() {

    this.body = null;
    this.col_groups = null;

};

/* Collision Shape */
function rbCollisionShape() {

    this.cshape = null;
    this.mesh = null;

};

/* Mesh Data (for Collision Shapes of Meshes) */
function rbMeshData() {

    this.indexArray = null;
    this.vertices = null;
    this.triangles = null;
    this.num_vertices = null;
    this.num_triangles = null;

};

/* Constraint */
function rbConstraint() {


};



/* ********************************** */
/* Dynamics World Methods */

/* Setup ---------------------------- */
/**
 * @param {btVector3} gravity 
 */
function RB_dworld_new(gravity) {

    let world = new rbDynamicsWorld();

    /* collision detection/handling */
    world.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();

    world.dispatcher = new Ammo.btCollisionDispatcher(world.collisionConfiguration);
    // registerAlgorithm(world.dispatcher);

    world.pairCache = new Ammo.btDbvtBroadphase();

    // world.filterCallback = new rbFilterCallback();
    // world.pairCache.getOverlappingPairCache().setOverlapFilterCallback(world.filterCallback);

    /* constraint solving */
    world.constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();

    /* world */
    world.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(world.dispatcher, world.pairCache, world.constraintSolver, world.collisionConfiguration);

    setGravity(world, gravity);

    return world;
}

function RB_dworld_delete(world) {
    /* bullet doesn't like if we free these in a different order */
    world.dynamicsWorld = null;
    world.constraintSolver = null;
    world.pairCache = null;
    world.dispatcher = null;
    world.collisionConfiguration = null;
    world.filterCallback = null;
    world = null;
}

/* Settings ------------------------- */

/* Gravity */
function getGravity(world) {

    return world.dynamicsWorld.getGravity();

}

function setGravity(world, gravity) {

    world.dynamicsWorld.setGravity(new Ammo.btVector3(gravity[0], gravity[1], gravity[2]));

}

/* Constraint Solver */
function setSoTeTiterations(world, numSolveTiterations) {

    let info = world.dynamicsWorld.getSolverInfo();

    info.m_numIterations = numSolveTiterations;
}

/* Split Impulse */
function setImpulse(world, split_impulse) {
    let info = world.dynamicsWorld.getSolverInfo();

    info.mSplitTpulse = split_impulse;
}

/* Simulation ----------------------- */

function stepSimulation(world, timeStep, maxSubSteps, timeSubStep) {
    world.dynamicsWorld.stepSimulation(timeStep, maxSubSteps, timeSubStep);
}

/* ********************************** */
/* Rigid Body Methods */

/* Setup ---------------------------- */

function addBody(world, object, col_groups) {
    let body = object.body;
    object.col_groups = col_groups;

    world.dynamicsWorld.addRigidBody(body);
}

function removeBody(world, object) {
    let body = object.body;

    world.dynamicsWorld.removeRigidBody(body);
}

/* ............ */

function newBody(shape, loc, rot) {
    let object = new rbRigidBody();

    /* current transform */
    let trans = new Ammo.btTransform();
    trans.setIdentity();
    trans.setOrigin(new Ammo.btVector3(loc.x, loc.y, loc.z));
    trans.setRotation(new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w));

    /* create motionstate, which is necessary for interpolation (includes reverse playback) */
    let motionState = new Ammo.btDefaultMotionState(trans);

    /* make rigidbody */
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(1.0, motionState, shape.cshape);

    object.body = new Ammo.btRigidBody(rbInfo);

    // object.body.setUserPointer(object);

    return object;
}

function deleteBody(object) {
    let body = object.body;

    /* motion state */
    let ms = body.getMotionState();
    if (ms)
        delete ms;

    /* collision shape is done elsewhere... */

    /* body itself */

    /* manually remove constraint refs of the rigid body, normally this happens when removing
     * constraints from the world
     * but since we delete everything when the world is rebult, we need to do it manually here */
    for (let i = body.getNumConstraintRefs() - 1; i >= 0; i--) {
        let con = body.getConstraintRef(i);
        body.removeConstraintRef(con);
    }

    delete body;
    delete object;
}

/* Settings ------------------------- */

function setCollisionShape(object, shape) {
    let body = object.body;

    /* set new collision shape */
    body.setCollisionShape(shape.cshape);

    /* recalculate inertia, since that depends on the collision shape... */
    setMass(object, getMass(object));
}

/* ............ */

function getMass(object) {
    let body = object.body;

    /* there isn't really a mass setting, but rather 'inverse mass'
     * which we convert back to mass by taking the reciprocal again
     */
    let value = body.getInvMass();

    if (value)
        value = 1.0 / value;

    return value;
}

function setMass(object, value) {
    let body = object.body;
    let localInertia = new Ammo.btVector3(0, 0, 0);

    /* calculate new inertia if non-zero mass */
    if (value) {
        let shape = body.getCollisionShape();
        shape.calculateLocalInertia(value, localInertia);
    }

    body.setMassProps(value, localInertia);
    body.updateInertiaTensor();
}

function getFriction(object) {
    let body = object.body;
    return body.getFriction();
}

function setFriction(object, value) {
    let body = object.body;
    body.setFriction(value);
}

function getRestitution(object) {
    let body = object.body;
    return body.getRestitution();
}

function setRestitution(object, value) {
    let body = object.body;
    body.setRestitution(value);
}

function getLinearDamping(object) {
    let body = object.body;
    return body.getLinearDamping();
}

function setLinearDamping(object, value) {
    setDamping(object, value, getLinearDamping(object));
}

function getAngularDamping(object) {
    let body = object.body;
    return body.getAngularDamping();
}

function setAngularDamping(object, value) {
    setDamping(object, getLinearDamping(object), value);
}

function setDamping(object, linear, angular) {
    let body = object.body;
    body.setDamping(linear, angular);
}

function getLinearSleepThresh(object) {
    let body = object.body;
    return body.getLinearSleepingThreshold();
}

function setLinearSleepThresh(object, value) {
    setSleepThresh(object, value, getAngularSleepThresh(object));
}

function getAngularSleepThresh(object) {
    let body = object.body;
    return body.getAngularSleepingThreshold();
}

function setAngularSleepThresh(object, value) {
    setSleepThresh(object, getLinearSleepThresh(object), value);
}

function setSleepThresh(object, linear, angular) {
    let body = object.body;
    body.setSleepingThresholds(linear, angular);
}

/* ............ */

function getLinearVelocity(object) {
    let body = object.body;

    return body.getLinearVelocity();
}

function setLinearVelocity(object, value) {
    let body = object.body;

    body.setLinearVelocity(new Ammo.btVector3(value[0], value[1], value[2]));
}

function getAngularVelocity(object) {
    let body = object.body;

    return body.getAngularVelocity();
}

function setAngularVelocity(object, value) {
    let body = object.body;

    body.setAngularVelocity(new Ammo.btVector3(value[0], value[1], value[2]));
}

function setLinearFactor(object, x, y, z) {
    let body = object.body;
    body.setLinearFactor(new Ammo.btVector3(x, y, z));
}

function setAngularFactor(object, x, y, z) {
    let body = object.body;
    body.setAngularFactor(new Ammo.btVector3(x, y, z));
}

/* ............ */

function setKinematicState(object, kinematic) {
    let body = object.body;
    if (kinematic)
        body.setCollisionFlags(body.getCollisionFlags() | 2 /* CF_KINEMATIC_OBJECT */);
    else
        body.setCollisionFlags(body.getCollisionFlags() & ~2 /* CF_KINEMATIC_OBJECT */);
}

/* ............ */
//island management, m_activationState1
// #define ACTIVE_TAG 1
// #define ISLAND_SLEEPING 2
// #define WANTS_DEACTIVATION 3
// #define DISABLE_DEACTIVATION 4
// #define DISABLE_SIMULATION 5
function setActivationState(object, use_deactivation) {
    let body = object.body;
    if (use_deactivation)
        body.forceActivationState(1/* ACTIVE_TAG */);
    else
        body.setActivationState(4/* DISABLE_DEACTIVATION */);
}
function activate(object) {
    let body = object.body;
    body.setActivationState(1/* ACTIVE_TAG */);
}
function deactivate(object) {
    let body = object.body;
    body.setActivationState(2/* ISLAND_SLEEPING */);
}

/* ............ */

/* Simulation ----------------------- */

/* The transform matrices Blender uses are OpenGL-style matrices,
 * while Bullet uses the Right-Handed coordinate system style instead.
 */

function getTransformMatrix(object) {
    let body = object.body;
    let ms = body.getMotionState();

    let trans = new Ammo.btTransform();
    ms.getWorldTransform(trans);

    let m_out = new Ammo.btScalar();
    trans.getOpenGLMatrix(m_out);

    return m_out;
}

/**
 * 
 * @param {rbRigidBody} object 
 * @param {Vector3} loc 
 * @param {Quaternion} rot 
 */
function setTransform(object, loc, rot) {
    let body = object.body;
    // let ms = body.getMotionState();

    /* set transform matrix */
    let trans = new Ammo.btTransform();
    trans.setOrigin(new Ammo.btVector3(loc.x, loc.y, loc.z));
    trans.setRotation(new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w));

    let ms = new Ammo.btDefaultMotionState(trans);

    // ms.setWorldTransform(trans);

    body.setMotionState(ms);
}

function setScale(object, scale) {
    let body = object.body;

    /* apply scaling factor from matrix above to the collision shape */
    let cshape = body.getCollisionShape();
    if (cshape) {
        cshape.setLocalScaling(btVector3(scale[0], scale[1], scale[2]));

        /* GIimpact shapes have to be updated to take scaling into account */
        // if (cshape.getShapeType() == GIMPACT_SHAPE_PROXYTYPE)
        //     cshape.updateBound();
    }
}

/* ............ */
/* Read-only state info about status of simulation */

function getPosition(object) {
    let body = object.body;

    return body.getWorldTransform().getOrigin();
}

function getOrientation(object) {
    let body = object.body;

    return body.getWorldTransform().getRotation();
}

/* ............ */
/* Overrides for simulation */

function applyCentralForce(object, value) {
    let body = object.body;

    body.applyCentralForce(btVector3(value[0], value[1], value[2]));
}


/* ********************************** */
/* Collision Shape Methods */

/* Setup (Standard Shapes) ----------- */

function newBox(x, y, z) {

    shape = new rbCollisionShape;
    shape.cshape = new Ammo.btBoxShape(btVector3(x, y, z));
    shape.mesh = null;
    return shape;
}

function newSphere(radius) {

    shape = new rbCollisionShape;
    shape.cshape = new Ammo.btSphereShape(radius);
    shape.mesh = null;
    return shape;
}

function newCapsule(radius, height) {

    shape = new rbCollisionShape;
    shape.cshape = new Ammo.btCapsuleShapeZ(radius, height);
    shape.mesh = null;
    return shape;
}

function newCone(radius, height) {

    shape = new rbCollisionShape;
    shape.cshape = new Ammo.btConeShapeZ(radius, height);
    shape.mesh = null;
    return shape;
}

function newCylinder(radius, height) {

    shape = new rbCollisionShape;
    shape.cshape = new Ammo.btCylinderShapeZ(btVector3(radius, radius, height));
    shape.mesh = null;
    return shape;
}

/* Setup (Convex Hull) ------------ */

/**
 * 
 * @param {Array} vertices 
 * @param {Number} margin 
 */
function newConvexHull(vertices, margin) {

    let shape = new rbCollisionShape();
    let hull_shape = new Ammo.btConvexHullShape();

    for (let i = 0, l = vertices.length; i < l; i++) {

        hull_shape.addPoint(new Ammo.btVector3(vertices[i].x, vertices[i].y, vertices[i].z), true);

    }

    hull_shape.setMargin(margin);
    // console.log(hull_shape.getMargin());

    shape.cshape = hull_shape;
    shape.mesh = null;
    shape.compoundChilds = 0;
    shape.compoundChildShapes = null;

    return shape;
}

/* Setup (Triangle Mesh) ---------- */

/**
 * 
 * @param {rbMeshData} mesh 
 */
function newTrimesh(vertices, faces) {

    const ammoMesh = new Ammo.btTriangleMesh(true, true);

    for (let i = 0, l = faces.length; i < l; i++) {
        let a = faces[i].a;
        let b = faces[i].b;
        let c = faces[i].c;
        ammoMesh.addTriangle(
            new Ammo.btVector3(vertices[a].x, vertices[a].y, vertices[a].z),
            new Ammo.btVector3(vertices[b].x, vertices[b].y, vertices[b].z),
            new Ammo.btVector3(vertices[c].x, vertices[c].y, vertices[c].z),
            false
        );
    }

    let shape = new rbCollisionShape();

    /* triangle-mesh we create is a BVH wrapper for triangle mesh data (for faster lookups) */
    // RB_TODO perhaps we need to allow saving out this for performance when rebuilding?
    shape.cshape = new Ammo.btBvhTriangleMeshShape(ammoMesh, true, true);
    shape.mesh = null;
    shape.compoundChilds = 0;
    shape.compoundChildShapes = null;

    return shape;
}



/* Cleanup --------------------------- */

function deleteShape(shape) {
    shape = null;
}

/* Settings --------------------------- */

function getMargin(shape) {
    return shape.cshape.getMargin();
}

function setMargin(shape, value) {
    shape.cshape.setMargin(value);
}

/* ********************************** */
/* Constraints */
