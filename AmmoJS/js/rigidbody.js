/* -------------- */
/* Setup */

/* Set up RigidBody world */
function MAIN_create_world(scene) {
    /* try to get whatever RigidBody world that might be representing this already */
    let rbw = new RigidBodyWorld();

    /* sanity checks
     * - there must be a valid scene to add world to
     * - there mustn't be a sim world using this group already
     */
    if (scene == null) {
        return;
    }

    /* set default settings */
    // rbw.effector_weights = MAIN_effector_add_weights(null);

    // rbw.ltime = PSFRA;

    rbw.time_scale = 1.0;

    rbw.steps_per_second = 60;      /* Bullet default (60 Hz) */
    rbw.num_solver_iterations = 10; /* 10 is bullet default */

    // rbw.shared.pointcache = MAIN_ptcache_add(rbw.shared.ptcaches);
    // rbw.shared.pointcache.step = 1;

    /* return this sim world */
    return rbw;
}


/* Add rigid body settings to the specified object */
function MAIN_create_object(scene, ob, type) {
    let rbo = new RigidBodyOb();
    rbw = scene.rigidbody_world;

    /* sanity checks
     * - rigidbody world must exist
     * - object must exist
     * - cannot add rigid body if it already exists
     */
    if (ob == null || (ob.rigidbody_object != null)) {
        return null;
    }

    /* set default settings */
    rbo.type = type;

    rbo.mass = 1.0;

    rbo.friction = 0.5;    /* best when non-zero. 0.5 is Bullet default */
    rbo.restitution = 0.5; /* best when zero. 0.0 is Bullet default */

    rbo.margin = 0.04; /* 0.04 (in meters) is Bullet default */

    rbo.lin_sleep_thresh = 0.4; /* 0.4 is half of Bullet default */
    rbo.ang_sleep_thresh = 0.5; /* 0.5 is half of Bullet default */

    rbo.lin_damping = 0.04;
    rbo.ang_damping = 0.1;

    rbo.col_groups = 1;

    /* use triangle meshes for passive objects
     * use convex hulls for active objects since dynamic triangle meshes are very unstable
     */
    if (type == 0) {    /* ACTIVE */
        rbo.shape = Shape.CONVEXH;  /* CONVEXH */
    }
    else {
        rbo.shape = Shape.TRIMESH;  /* TRIMESH */
    }

    // rbo.mesh_source = RBO_MESH_DEFORM;

    /* set initial transform */
    rbo.pos = {
        x: ob.position.x,
        y: ob.position.y,
        z: ob.position.z
    };
    rbo.orn = {
        x: ob.quaternion.x,
        y: ob.quaternion.y,
        z: ob.quaternion.z,
        w: ob.quaternion.w
    };

    /* flag cache as outdated */
    // MAIN_rigidbody_cache_reset(rbw);
    rbo.flag |= (Ob_Flag.NEEDS_VALIDATE | Ob_Flag.NEEDS_RESHAPE);

    /* return this object */
    return rbo;
}



/* -------------- */
/* Utilities */

/** 
 * Get RigidBody world for the given scene, creating one if needed
 * @param {Scene} scene 
 */
function MAIN_get_world(scene) {
    /* sanity check */
    if (scene == null) {
        return null;
    }

    return scene.rigidbody_world;
}

function rigidbody_add_object_to_scene(scene, ob) {
    /* Add rigid body world and group if they don't exist for convenience */
    let rbw = MAIN_get_world(scene);
    if (rbw == null) {
        rbw = MAIN_create_world(scene);
        if (rbw == null) {
            return false;
        }

        MAIN_validate_sim_world(scene, rbw, false);
        scene.rigidbody_world = rbw;
    }

    /* Add object to rigid body group. */
    rbw.group.push(ob);

    // console.log(rbw.group);

    return true;
}

/* create and add to rigidbody world */
function MAIN_add_object(scene, ob, type) {
    if (ob.type != 'Mesh') {
        console.error("Can't add Rigid Body to non mesh object");
        return;
    }

    /* Add object to rigid body world in scene. */
    if (!rigidbody_add_object_to_scene(scene, ob)) {
        console.error("Can't create Rigid Body world");
        return;
    }

    /* make rigidbody object settings */
    if (ob.rigidbody_object == null) {
        ob.rigidbody_object = MAIN_create_object(scene, ob, type);
    }

    ob.rigidbody_object.type = type;
    ob.rigidbody_object.flag |= Ob_Flag.NEEDS_VALIDATE;
}

/* ************************************** */
/* Setup Utilities - Validate Sim Instances */

/* get the appropriate evaluated mesh based on rigid body mesh source */
function rigidbody_get_mesh(ob) {

    const index = ob.geometry.index !== null ? ob.geometry.index : undefined;
    const attributes = ob.geometry.attributes;
    const scale = ob.scale;

    if (attributes.position === undefined) {

        console.error('THREE.Geometry.fromBufferGeometry(): Position attribute required for conversion.');
        return;

    }

    const position = attributes.position;

    let vertices = [];
    let faces = [];

    for (let i = 0; i < position.count; i++) {

        vertices.push({
            x: scale.x * position.getX(i),
            y: scale.y * position.getY(i),
            z: scale.z * position.getZ(i)
        });

    }

    if (index !== undefined) {

        for (let i = 0; i < index.count; i += 3) {

            faces.push({
                a: index.getX(i),
                b: index.getX(i + 1),
                c: index.getX(i + 2)
            });

        }

    } else {

        for (let i = 0; i < position.count; i += 3) {

            faces.push({
                a: i,
                b: i + 1,
                c: i + 2
            });

        }
    }

    return {
        vertices,
        faces
    }
}

/* create collision shape of mesh - convex hull */
function rigidbody_get_convexhull_from_mesh(ob, margin) {

    let shape = null;
    let vertices;
    let totvert = 0;

    if (ob.type == 'Mesh') {

        let mesh = rigidbody_get_mesh(ob);

        vertices = mesh.vertices;

        totvert = vertices.length;

    }
    else {
        console.error("cannot make Convex Hull collision shape for non-Mesh object");
    }

    if (totvert) {
        shape = newConvexHull(vertices, margin);
    }
    else {
        console.error("no vertices to define Convex Hull collision shape with");
    }

    return shape;
}

/* create collision shape of mesh - triangulated mesh
 * returns null if creation fails.
 */
function rigidbody_get_trimesh_from_mesh(ob) {

    let shape = null; /* rbCollisionShape */
    let faces, vertices;
    let totvert = 0;

    if (ob.type == 'Mesh') {

        let mesh = rigidbody_get_mesh(ob);

        faces = mesh.faces;
        vertices = mesh.vertices;

        totvert = vertices.length;

    }
    else {
        console.error("cannot make Convex Hull collision shape for non-Mesh object");
    }

    if (totvert) {
        shape = newTrimesh(vertices, faces);
    }
    else {
        console.error("no vertices to define Convex Hull collision shape with");
    }

    return shape;
}

/**
 * @param {Mesh} object 
 * @param {Boolean} rebuild 
 * @returns {Boolean} 
 */
let rigidbody_validate_sim_shape = function (ob, rebuild) {

    let rbo = ob.rigidbody_object;

    let new_shape = null;
    let bb = null;
    let size = [1.0, 1.0, 1.0];
    let radius = 1.0;
    let height = 1.0;
    let capsule_height;
    let hull_margin = 0.0;
    let can_embed = true;
    let has_volume;

    /* sanity check */
    if (rbo == void 0) {
        return false;
    }

    /* don't create a new shape if we already have one and don't want to rebuild it */
    if (rbo.physics_shape && !rebuild) {
        return false;
    }

    /* get object dimensions without scaling */
    ob.geometry.computeBoundingBox();
    bb = ob.geometry.boundingBox;
    if (bb) {
        size[0] = (bb.max.x - bb.min.x);
        size[1] = (bb.max.y - bb.min.y);
        size[2] = (bb.max.z - bb.min.z);
    }

    if (rbo.shape == 2 || rbo.shape == 3 || rbo.shape == 4) {
        /* take radius as largest x/y dimension, and height as z-dimension */
        radius = Math.max(size[0], size[1]);
        height = size[2];
    } else if (rbo.shape == 1) {
        radius = Math.max(size[0], size[1], size[2]);
    }

    /* create new shape */
    switch (rbo.shape) {
        case 0/* BOX */:
            new_shape = new_box(size[0], size[1], size[2]);
            break;

        case 1/* SPHERE */:
            new_shape = new_sphere(radius);
            break;

        case 2/* CAPSULE */:
            capsule_height = (height - radius) * 2.0;
            new_shape = new_capsule(radius, (capsule_height > 0.0) ? capsule_height : 0.0);
            break;
        case 3/* CYLINDER */:
            new_shape = new_cylinder(radius, height);
            break;
        case 4/* CONE */:
            new_shape = new_cone(radius, height * 2.0);
            break;

        case 5/* CONVEXH */:
            /* try to emged collision margin */
            has_volume = (Math.min(size[0], size[1], size[2]) > 0.0);

            if (!(rbo.flag & Ob_Flag.USE_MARGIN) && has_volume) {
                hull_margin = 0.04;
            }

            new_shape = rigidbody_get_convexhull_from_mesh(ob, hull_margin, can_embed);

            if (!(rbo.flag & Ob_Flag.USE_MARGIN)) {
                rbo.margin = (can_embed && has_volume) ? 0.04 : 0.0; /* RB_TODO ideally we shouldn't directly change the margin here */
            }
            break;
        case 6/* TRIMESH */:
            // console.log("Trimesh");
            new_shape = rigidbody_get_trimesh_from_mesh(ob);
            break;
    }

    /* use box shape if we can't fall back to old shape */
    if (new_shape == null && rbo.shared.physics_shape == null) {
        new_shape = newBox(size[0], size[1], size[2]);
    }

    /* assign new collision shape if creation was successful */
    if (new_shape) {
        if (rbo.shared.physics_shape) {
            deleteShape(rbo.shared.physics_shape);
        }
        rbo.shared.physics_shape = new_shape;
        setMargin(rbo.shared.physics_shape, 0.005/* rbo.margin */);
    }

}

function calc_volume(ob, r_vol) { }

function calc_center_of_mass(ob, r_center) { }


/* --------------------- */

/**
 * Create physics sim representation of object given RigidBody settings
 * @param {RigidBodyWorld} rbw 
 * @param {Object} ob 
 * @param {Boolean} rebuild Even if an instance already exists, replace it
 */
function rigidbody_validate_sim_object(rbw, ob, rebuild) {
    let rbo = (ob) ? ob.rigidbody_object : null;
    let loc;
    let rot;

    /* sanity checks:
     * - object doesn't have RigidBody info already: then why is it here?
     */
    if (rbo == null) {
        return false;
    }

    /* make sure collision shape exists */
    /* FIXME we shouldn't always have to rebuild collision shapes when rebuilding objects,
     * but it's needed for constraints to update correctly. */
    if (rbo.shared.physics_shape == null || rebuild) {
        rigidbody_validate_sim_shape(ob, true);
    }

    if (rbo.shared.physics_object) {
        RB_dworld_remove_body(rbw.shared.physics_world, rbo.shared.physics_object);
    }
    if (!rbo.shared.physics_object || rebuild) {
        /* remove rigid body if it already exists before creating a new one */
        if (rbo.shared.physics_object) {
            deletBody(rbo.shared.physics_object);
        }

        loc = ob.position;
        rot = ob.quaternion;

        rbo.shared.physics_object = newBody(rbo.shared.physics_shape, loc, rot);

        setFriction(rbo.shared.physics_object, rbo.friction);
        setRestitution(rbo.shared.physics_object, rbo.restitution);

        setDamping(rbo.shared.physics_object, rbo.lin_damping, rbo.ang_damping);
        setSleepThresh(
            rbo.shared.physics_object, rbo.lin_sleep_thresh, rbo.ang_sleep_thresh);
        setActivationState(rbo.shared.physics_object,
            rbo.flag & Ob_Flag.USE_DEACTIVATION);

        if (rbo.type == Type.PASSIVE || rbo.flag & Ob_Flag.START_DEACTIVATED) {
            deactivate(rbo.shared.physics_object);
        }

        /* ob.protectflag */
        /* enum {
            OB_LOCK_LOCX = 1 << 0,
            OB_LOCK_LOCY = 1 << 1,
            OB_LOCK_LOCZ = 1 << 2,
            OB_LOCK_LOC = OB_LOCK_LOCX | OB_LOCK_LOCY | OB_LOCK_LOCZ,
            OB_LOCK_ROTX = 1 << 3,
            OB_LOCK_ROTY = 1 << 4,
            OB_LOCK_ROTZ = 1 << 5,
            OB_LOCK_ROT = OB_LOCK_ROTX | OB_LOCK_ROTY | OB_LOCK_ROTZ,
            OB_LOCK_SCALEX = 1 << 6,
            OB_LOCK_SCALEY = 1 << 7,
            OB_LOCK_SCALEZ = 1 << 8,
            OB_LOCK_SCALE = OB_LOCK_SCALEX | OB_LOCK_SCALEY | OB_LOCK_SCALEZ,
            OB_LOCK_ROTW = 1 << 9,
            OB_LOCK_ROT4D = 1 << 10,
        }; */
        // setLinearFactor(rbo.shared.physics_object,
        //     (ob.protectflag & OB_LOCK_LOCX) == 0,
        //     (ob.protectflag & OB_LOCK_LOCY) == 0,
        //     (ob.protectflag & OB_LOCK_LOCZ) == 0);
        // setAngularFactor(rbo.shared.physics_object,
        //     (ob.protectflag & OB_LOCK_ROTX) == 0,
        //     (ob.protectflag & OB_LOCK_ROTY) == 0,
        //     (ob.protectflag & OB_LOCK_ROTZ) == 0);

        setMass(rbo.shared.physics_object, rbo.mass);
        setKinematicState(rbo.shared.physics_object, rbo.flag & Ob_Flag.KINEMATIC || rbo.flag & Ob_Flag.DISABLED);

        // console.log(rbo.shared.physics_object.body.getCollisionFlags());
    }

    if (rbw && rbw.shared.physics_world) {
        addBody(rbw.shared.physics_world, rbo.shared.physics_object, rbo.col_groups);
    }
}

/* --------------------- */

/**
 * Create physics sim world given RigidBody world settings
 * @note this does NOT update object references that the scene uses,in case those aren't ready yet!
 */
function MAIN_validate_sim_world(scene, rbw, rebuild) {
    /* sanity checks */
    if (rbw == null) {
        return false;
    }

    /* create new sim world */
    if (rebuild || rbw.shared.physics_world == null) {
        if (rbw.shared.physics_world) {
            RB_dworld_delete(rbw.shared.physics_world);
        }
        if (scene.physics_settings == null) {
            /* ------------------------------------------- */
            /* Global/Common Physics Settings */

            scene.physics_settings = {
                gravity: [0, -9.81, 0],
                flag: null,
                quick_cache_step: null,
                rt: null
            }
        }
        rbw.shared.physics_world = RB_dworld_new(scene.physics_settings.gravity);
    }

    // RB_dworld_set_solver_iterations(rbw.shared.physics_world, rbw.num_solver_iterations);
    // RB_dworld_set_split_impulse(rbw.shared.physics_world, rbw.flag & RBW_FLAG_USE_SPLIT_IMPULSE);
}


/**
 * Update selected objects
 * @param {*} depsgraph 
 * @param {*} scene 
 * @param {*} rbw 
 * @param {*} ob 
 * @param {*} rbo 
 */
function rigidbody_update_sim_ob(depsgraph, scene, rbw, ob, rbo) {
    let loc;
    let rot;
    let scale;

    /* only update if rigid body exists */
    if (rbo.shared.physics_object == null) {
        return;
    }

    let /* ViewLayer * */ view_layer = DEG_get_input_view_layer(depsgraph);
    let /* Base * */ base = BKE_view_layer_base_find(view_layer, ob);
    const is_selected = base ? (base.flag & BASE_SELECTED) != 0 : false;

    if (rbo.shape == RB_SHAPE_TRIMESH && rbo.flag & Ob_Flag.USE_DEFORM) {
        let mesh = ob.runtime.mesh_deform_eval;
        if (mesh) {
            let mvert = mesh.mvert;
            let totvert = mesh.totvert;
            let bb = BKE_object_boundbox_get(ob);

            RB_shape_trimesh_update(rbo.shared.physics_shape,
                mvert,
                totvert,
                sizeof(MVert),
                bb.vec[0],
                bb.vec[6]);
        }
    }

    mat4_decompose(loc, rot, scale, ob.obmat);

    /* update scale for all objects */
    setScale(rbo.shared.physics_object, scale);
    /* compensate for embedded convex hull collision margin */
    if (!(rbo.flag & RBO_FLAG_USE_MARGIN) && rbo.shape == Shape.CONVEXH) {
        setMargin(rbo.shared.physics_shape, rbo.margin * Math.min(scale[0], scale[1], scale[2]));
    }

    /* Make transformed objects temporarily kinmatic
     * so that they can be moved by the user during simulation. */
    if (is_selected && (G.moving & G_TRANSFORM_OBJ)) {
        setKinematicState(rbo.shared.physics_object, true);
        setMass(rbo.shared.physics_object, 0.0);
    }

    /* update rigid body location and rotation for kinematic bodies */
    if (rbo.flag & RBO_FLAG_KINEMATIC || (is_selected && (G.moving & G_TRANSFORM_OBJ))) {
        activate(rbo.shared.physics_object);
        setTransform(rbo.shared.physics_object, loc, rot);
    }
    /* update influence of effectors - but don't do it on an effector */
    /* only dynamic bodies need effector update */
    else if (rbo.type == RBO_TYPE_ACTIVE && ((ob.pd == null) || (ob.pd.forcefield == PFIELD_null))) {
        let /* EffectorWeights * */ effector_weights = rbw.effector_weights;
        let /* EffectedPoint */ epoint;
        let /* ListBase * */ effectors;

        /* get effectors present in the group specified by effector_weights */
        effectors = BKE_effectors_create(depsgraph, ob, null, effector_weights);
        if (effectors) {
            let eff_force = [0.0, 0.0, 0.0];
            let eff_loc, eff_vel;

            /* create dummy 'point' which represents last known position of object as result of sim */
            /* XXX: this can create some inaccuracies with sim position,
             * but is probably better than using un-simulated values? */
            getPosition(rbo.shared.physics_object, eff_loc);
            getLinearVelocity(rbo.shared.physics_object, eff_vel);

            pd_point_from_loc(scene, eff_loc, eff_vel, 0, epoint);

            /* Calculate net force of effectors, and apply to sim object:
             * - we use 'central force' since apply force requires a "relative position"
             *   which we don't have... */
            BKE_effectors_apply(effectors, null, effector_weights, epoint, eff_force, null);
            if (G.f & G_DEBUG) {
                printf("\tapplying force (%f,%f,%f) to '%s'\n",
                    eff_force[0],
                    eff_force[1],
                    eff_force[2],
                    ob.id.name + 2);
            }
            /* activate object in case it is deactivated */
            if (!is_zero_v3(eff_force)) {
                RB_body_activate(rbo.shared.physics_object);
            }
            RB_body_apply_central_force(rbo.shared.physics_object, eff_force);
        }
        else if (G.f & G_DEBUG) {
            printf("\tno forces to apply to '%s'\n", ob.id.name + 2);
        }

        /* cleanup */
        BKE_effectors_free(effectors);
    }
    /* NOTE: passive objects don't need to be updated since they don't move */

    /* NOTE: no other settings need to be explicitly updated here,
     * since RNA setters take care of the rest :)
     */
}

/**
 * Updates and validates world, bodies and shapes.
 *
 * \param rebuild: Rebuild entire simulation
 */
function rigidbody_update_simulation(scene, rbw, rebuild) {

    // let ctime = DEG_get_ctime(

    /* update world */
    /* Note physics_world can get null when undoing the deletion of the last object in it (see
     * T70667). 
     */
    if (rebuild || rbw.shared.physics_world == null) {
        MAIN_validate_sim_world(scene, rbw, rebuild);
    }

    // rigidbody_update_sim_world(scene, rbw);

    /* XXX TODO For rebuild: remove all constraints first.
    * Otherwise we can end up deleting objects that are still
    * referenced by constraints, corrupting bullet's internal list.
    *
    * Memory management needs redesign here, this is just a dirty workaround.
    */
    /* if (rebuild && rbw.constraints) {

        rbw.constraints.forEach(function (ob) {
            console.log(ob);

            let rbc = ob.rigidbody_constraint;
            if (rbc && rbc.physics_constraint) {
                RB_dworld_remove_constraint(rbw.shared.physics_world, rbc.physics_constraint);
                RB_constraint_delete(rbc.physics_constraint);
                rbc.physics_constraint = null;
            }
        });

    } */

    /* update objects */
    rbw.group.forEach(function (ob) {
        // console.log(ob);

        if (ob.type == 'Mesh') {
            /* validate that we've got valid object set up here... */
            let rbo = ob.rigidbody_object;
            /* Update transformation matrix of the object
            * so we don't get a frame of lag for simple animations. */
            // BKE_object_where_is_calc_time(scene, ob, ctime);

            /* TODO remove this whole block once we are sure we never get null rbo here anymore. */
            /* This cannot be done in CoW evaluation context anymore... */
            if (rbo == null) {
                console.error(!"CoW object part of RBW object collection without RB object data, should not happen.");
                /* Since this object is included in the sim group but doesn't have
                * rigid body settings (perhaps it was added manually), add!
                * - assume object to be active? That is the default for newly added settings...
                */
                ob.rigidbody_object = MAIN_create_object(scene, ob, Type.ACTIVE);
                rigidbody_validate_sim_object(rbw, ob, true);

                rbo = ob.rigidbody_object;
            }
            else {
                /* perform simulation data updates as tagged */
                /* refresh object... */
                if (rebuild) {
                    /* World has been rebuilt so rebuild object */
                    /* TODO(Sybren): rigidbody_validate_sim_object() can call rigidbody_validate_sim_shape(),
                    * but neither resets the .NEEDS_RESHAPE flag nor
                    * calls RB_body_set_collision_shape().
                    * This results in the collision shape being created twice, which is unnecessary. */
                    rigidbody_validate_sim_object(rbw, ob, true);
                }
                else if (rbo.flag & Ob_Flag.NEEDS_VALIDATE) {
                    rigidbody_validate_sim_object(rbw, ob, false);
                }
                /* refresh shape... */
                // if (rbo.flag & Ob_Flag.NEEDS_RESHAPE) {
                //     /* mesh/shape data changed, so force shape refresh */
                //     rigidbody_validate_sim_shape(ob, true);
                //     /* now tell RB sim about it */
                //     /* XXX: we assume that this can only get applied for active/passive shapes
                //     * that will be included as rigidbodies. */
                //     RB_body_set_collision_shape(rbo.shared.physics_object, rbo.shared.physics_shape);
                // }
            }

            /* represent that validate or reshape is no longer needed for the rigidbody_object */
            rbo.flag &= ~(Ob_Flag.NEEDS_VALIDATE | Ob_Flag.NEEDS_RESHAPE);

            /* update simulation object... */
            // rigidbody_update_sim_ob(scene, rbw, ob, rbo);
        }
    });

    /* update constraints */
    if (rbw.constraints == null) { /* no constraints, move on */
        return;
    }

    // rbw.constraints.forEach((ob) => {
    //     /* validate that we've got valid object set up here... */
    //     let rbc = ob.rigidbody_constraint;
    //     /* Update transformation matrix of the object
    //     * so we don't get a frame of lag for simple animations. */
    //     BKE_object_where_is_calc_time(scene, ob, ctime);

    //     /* TODO remove this whole block once we are sure we never get null rbo here anymore. */
    //     /* This cannot be done in CoW evaluation context anymore... */
    //     if (rbc == null) {
    //         console.error(!"CoW object part of RBW constraints collection without RB constraint data, should not happen.");
    //         /* Since this object is included in the group but doesn't have
    //         * constraint settings (perhaps it was added manually), add!
    //         */
    //         ob.rigidbody_constraint = MAIN_create_constraint(scene, ob, RBC_TYPE_FIXED);
    //         rigidbody_validate_sim_constraint(rbw, ob, true);

    //         rbc = ob.rigidbody_constraint;
    //     }
    //     else {
    //         /* perform simulation data updates as tagged */
    //         if (rebuild) {
    //             /* World has been rebuilt so rebuild constraint */
    //             rigidbody_validate_sim_constraint(rbw, ob, true);
    //         }
    //         else if (rbc.flag & RBC_FLAG_NEEDS_VALIDATE) {
    //             rigidbody_validate_sim_constraint(rbw, ob, false);
    //         }
    //     }
    // });
}

function MAIN_check_sim_running(rbw, ctime) {
    return (rbw && (rbw.flag & RBW_FLAG_MUTED) == 0 && ctime > rbw.shared.pointcache.startframe);
}

/* Sync rigid body and object transformations */
function MAIN_sync_transforms(ob, ctime) {
    let rbo = ob.rigidbody_object;

    /* keep original transform for kinematic and passive objects */
    // if (ELEM(NULL, rbw, rbo) || rbo.flag & RBO_FLAG_KINEMATIC || rbo.type == RBO_TYPE_PASSIVE) {
    //     return;
    // }

    /* use rigid body transform after cache start frame if objects is not being transformed */
    // if (MAIN_check_sim_running(rbw, ctime) && !(ob.base_flag & BASE_SELECTED && G.moving & G_TRANSFORM_OBJ)) {

    if (rbo.type == Type.ACTIVE) {

        let pos = getPosition(rbo.shared.physics_object);
        let qua = getOrientation(rbo.shared.physics_object);

        ob.position.set(pos.x(), pos.y(), pos.z());
        ob.quaternion.set(qua.x(), qua.y(), qua.z(), qua.w());

        // PTCACHE_DATA_FROM(data, BPHYS_DATA_LOCATION, rbo.pos);
        // PTCACHE_DATA_FROM(data, BPHYS_DATA_ROTATION, rbo.orn);
    }
    // }
    // /* otherwise set rigid body transform to current obmat */
    // else {
    //     mat4_to_loc_quat(rbo.pos, rbo.orn, ob.obmat);
    // }
}

/* Used when canceling transforms - return rigidbody and object to initial states */
function MAIN_aftertrans_update(ob) {

    let rbo = ob.rigidbody_object;

    // console.log(rbo);

    /* return rigid body and object to their initial states */
    ob.position.copy(rbo.pos);
    ob.quaternion.copy(rbo.orn);

    if (rbo.shared.physics_object) {

        setLinearVelocity(rbo.shared.physics_object, [0, 0, 0]);
        setAngularVelocity(rbo.shared.physics_object, [0, 0, 0]);

        /* allow passive objects to return to original transform */
        if (rbo.type == Type.PASSIVE) {
            setKinematicState(rbo.shared.physics_object, true);
        }
        setTransform(rbo.shared.physics_object, rbo.pos, rbo.orn);
    }
    /* RB_TODO update rigid body physics object's loc/rot for dynamic objects here as well
     * (needs to be done outside bullet's update loop). */
}

/* Run RigidBody simulation for the specified physics world */
function MAIN_do_simulation(scene) {
    let timestep;
    let rbw = scene.rigidbody_world;

    /* don't try to run the simulation if we don't have a world yet but allow reading baked cache */
    // if (rbw.shared.physics_world == null) {
    //     return;
    // }
    // else if (rbw.objects == null) {
    //     rigidbody_update_ob_array(rbw);
    // }

    /* update and validate simulation */
    /* Create physics sim representation of object given RigidBody settings */
    rigidbody_update_simulation(scene, rbw, false);

    /* calculate how much time elapsed since last step in seconds */
    timestep = 1.0 / 60 * rbw.time_scale;
    /* Step simulation by the requested timestep,
     * steps per second are adjusted to take time scale into account. */
    stepSimulation(rbw.shared.physics_world,
        timestep,
        10,
        1.0 / rbw.steps_per_second * Math.min(rbw.time_scale, 1.0));

    // rigidbody_object_update(scene);
}

function build_rigidworld(scene) {

    let rbw = scene.rigidbody_world;
    // let scene_cow = get_cow_datablock(scene);

    /* Objects - simulation participants. */
    if (rbw.group !== null) {

        // build_collection(null, rbw.group);

        rbw.group.forEach(function (object) {

            /* Create operation for flushing results. */
            /* Object's transform component - where the rigidbody operation
             * lives. */
            MAIN_sync_transforms(object);

        });

    }
}

function aftertrans_update(scene) {

    let rbw = scene.rigidbody_world;

    /* Objects - simulation participants. */
    if (rbw.group !== null) {

        // build_collection(null, rbw.group);

        rbw.group.forEach(function (object) {

            /* restore rigid body transform */
            if (object.rigidbody_object/*  && canceled */) {
                /* Create operation for flushing results. */
                /* Object's transform component - where the rigidbody operation
                 * lives. */
                MAIN_aftertrans_update(object);
            }
        });

    }

}








function rigidbody_object_update(scene) {
    let rbw = scene.rigidbody_world;
    rbw.group.forEach(function (ob) {

        if (ob && ob.rigidbody_object) {
            let rbo = ob.rigidbody_object;

            if (rbo.type == Type.ACTIVE) {

                let pos = getPosition(rbo.shared.physics_object);
                let qua = getOrientation(rbo.shared.physics_object);

                ob.position.set(pos.x(), pos.y(), pos.z());
                ob.quaternion.set(qua.x(), qua.y(), qua.z(), qua.w());

                // PTCACHE_DATA_FROM(data, BPHYS_DATA_LOCATION, rbo.pos);
                // PTCACHE_DATA_FROM(data, BPHYS_DATA_ROTATION, rbo.orn);
            }
        }

    });
}