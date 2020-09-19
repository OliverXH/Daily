
/** 
 * brief Types and defines for representing Rigid Body entities
*/

/** 
 * scene.rigidbody_world: RigidBodyWorld
 * 
 * object.rigidbody_object: RigidBodyOb
 * object.rigidbody_constraint: RigidBodyCon
*/

function RigidBodyWorld() {
    /* Sim World Settings ------------------------------------------------------------- */
    /** Effectors info. */
    this.effector_weights;

    /** Group containing objects to use for Rigid Bodies. */
    this.group = [];
    /** Array to access group objects by index, only used at runtime. */
    this.objects = [];

    /** Group containing objects to use for Rigid Body Constraint.s*/
    this.constraints = [];

    this._pad;
    /** Last frame world was evaluated for (internal). */
    this.ltime;

    /** This pointer is shared between all evaluated copies. */
    this.shared = {
        /* cache */
        pointcache: null,
        ptcaches: null,

        /* References to Physics Sim objects. Exist at runtime only ---------------------- */
        /** Physics sim world (i.e. btDiscreteDynamicsWorld). */
        physics_world: null
    };
    /** Moved to shared->pointcache. */
    // this.pointcache DNA_DEPRECATED;
    /** Moved to shared->ptcaches. */
    // this.ptcaches DNA_DEPRECATED;
    /** Number of objects in rigid body group. */
    this.numbodies;

    /** Number of simulation substeps steps taken per frame. */
    this.substeps_per_frame;
    /** Number of constraint solver iterations made per simulation step. */
    this.num_solver_iterations;

    /** (eRigidBodyWorld_Flag) settings for this RigidBodyWorld. Represents the current state */
    this.flag;
    /** Used to speed up or slow down the simulation. */
    this.time_scale;
}

/* Flags for RigidBodyWorld */
let World_Flag = {
    /* should sim world be skipped when evaluating (user setting) */
    MUTED: (1 << 0),
    /* sim data needs to be rebuilt */
    /* NEEDS_REBUILD = (1 << 1), */ /* UNUSED */
    /* usse split impulse when stepping the simulation */
    USE_SPLIT_IMPULSE: (1 << 2),
}

function RigidBodyOb() {
    /* General Settings for this RigidBodyOb */
    /** (eRigidBodyOb_Type) role of RigidBody in sim . */
    this.type;
    /** (eRigidBody_Shape) collision shape to use. */
    this.shape;

    /** (eRigidBodyOb_Flag). Represents the current state */
    this.flag;
    /** Collision groups that determines which rigid bodies can collide with each other. */
    this.col_groups;
    /** (eRigidBody_MeshSource) mesh source for mesh based collision shapes. */
    this.mesh_source;
    this._pad;

    /* Physics Parameters */
    /** How much object 'weighs' (i.e. absolute 'amount of stuff' it holds). */
    this.mass;

    /** Resistance of object to movement. */
    this.friction;
    /** How 'bouncy' object is when it collides. */
    this.restitution;

    /** Tolerance for detecting collisions. */
    this.margin;

    /** Damping for linear velocities. */
    this.lin_damping;
    /** Damping for angular velocities. */
    this.ang_damping;

    /** Deactivation threshold for linear velocities. */
    this.lin_sleep_thresh;
    /** Deactivation threshold for angular velocities. */
    this.ang_sleep_thresh;

    /** Rigid body orientation. */
    this.orn;
    /** Rigid body position. */
    this.pos;
    this._pad1;

    /** This pointer is shared between all evaluated copies. */
    this.shared = {
        /* References to Physics Sim objects. Exist at runtime only */
        /** Physics object representation (i.e. btRigidBody). */
        physics_object: null,
        /** Collision shape used by physics sim (i.e. btCollisionShape). */
        physics_shape: null
    };
}

let Type = {
    /* active geometry participant in simulation. is directly controlled by sim */
    ACTIVE: 0,
    /* passive geometry participant in simulation. is directly controlled by animsys */
    PASSIVE: 1,
}

/* Flags for RigidBodyOb */
let Ob_Flag = {
    /* rigidbody is kinematic (controlled by the animation system) */
    KINEMATIC: (1 << 0),
    /* rigidbody needs to be validated (usually set after duplicating and not hooked up yet) */
    NEEDS_VALIDATE: (1 << 1),
    /* rigidbody shape needs refreshing (usually after exiting editmode) */
    NEEDS_RESHAPE: (1 << 2),
    /* rigidbody can be deactivated */
    USE_DEACTIVATION: (1 << 3),
    /* rigidbody is deactivated at the beginning of simulation */
    START_DEACTIVATED: (1 << 4),
    /* rigidbody is not dynamically simulated */
    DISABLED: (1 << 5),
    /* collision margin is not embedded (only used by convex hull shapes for now) */
    USE_MARGIN: (1 << 6),
    /* collision shape deforms during simulation (only for passive triangle mesh shapes) */
    USE_DEFORM: (1 << 7),
}

let Shape = {
    /** Simple box (i.e. bounding box). */
    BOX: 0,
    /** Sphere. */
    SPHERE: 1,
    /** Rounded "pill" shape (i.e. calcium tablets). */
    CAPSULE: 2,
    /** Cylinder (i.e. pringles can). */
    CYLINDER: 3,
    /** Cone (i.e. party hat). */
    CONE: 4,

    /** Convex hull (minimal shrinkwrap encompassing all verts). */
    CONVEXH: 5,
    /** Triangulated mesh. */
    TRIMESH: 6,

    /* concave mesh approximated using primitives */
    COMPOUND: 7,
}


function RigidBodyCon() {
    /** First object influenced by the constraint. */
    this.ob1;
    /** Second object influenced by the constraint. */
    this.ob2;

    /* General Settings for this RigidBodyCon */
    /** (eRigidBodyCon_Type) role of RigidBody in sim . */
    this.type;
    /** Number of constraint solver iterations made per simulation step. */
    this.num_solver_iterations;

    /** (eRigidBodyCon_Flag). */
    this.flag;

    /** Breaking impulse threshold. */
    this.breaking_threshold;
    /** Spring implementation to use. */
    this.spring_type;
    this._pad;



    /* References to Physics Sim object. Exist at runtime only */
    /** Physics object representation (i.e. btTypedConstraint). */
    this.physics_constraint;
}