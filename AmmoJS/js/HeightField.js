import * as THREE from "../lib/three.module.js";

function imageToData(img, size){
	
	let w, h;
	
	if( size!== void 0){
		w = h = size;
	}else{
		w = img.width;
		h = img.height;
	}
	
	let _canvas = document.createElement('canvas'),
	ctx = _canvas.getContext('2d');
	
	_canvas.width = w;
	_canvas.height = h;
	ctx.drawImage(img, 0, 0, w, h);
	
	const data = ctx.getImageData(0, 0, w, h).data;
	
	let imageData = new Float32Array(w * h);
	
	for (let i = 0; i < imageData.length; i++) {
		
		imageData[i] = data[4 * i] / 255;
		
	}
	
	// console.log(imageData);
	
	return imageData;
}

function generateHeightField(data, width, depth, minHeight, maxHeight){
	
	let hRange = maxHeight - minHeight;
	
	let geometry = new THREE.PlaneBufferGeometry( width, depth, width - 1, depth - 1 );
	geometry.rotateX( - Math.PI / 2 );

	let vertices = geometry.attributes.position.array;

	for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

		// j + 1 because it is the y component that we modify
		vertices[ j + 1 ] = data[ i ] * hRange - hRange / 2;

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
	
	// btHeightfieldTerrainShape (int heightStickWidth, int heightStickLength, const void *heightfieldData, btScalar heightScale, btScalar minHeight, btScalar maxHeight, int upAxis, PHY_ScalarType heightDataType, bool flipQuadEdges)
	let heightFieldShape = new Ammo.btHeightfieldTerrainShape(width, depth, ammoHeightData, heightScale, minHeight, maxHeight, upAxis, heightDataType, flipQuadEdges);
	
	// btHeightfieldTerrainShape(int heightStickWidth, int heightStickLength, const void* heightfieldData, btScalar maxHeight, int upAxis, bool useFloatData, bool flipQuadEdges);
	// let heightFieldShape = new Ammo.btHeightfieldTerrainShape(heightStickWidth, heightStickLength, heightfieldData, maxHeight, upAxis, useFloatData, flipQuadEdges);

	let mass = 0;
	
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	// transform.setOrigin(new Ammo.btVector3(0, (maxHeight + minHeight) / 2, 0));
	transform.setOrigin(new Ammo.btVector3(0, 0, 0));
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

	// mesh.body = body;

	mesh.body = body;
	return mesh;

	/* return {
		mesh,
		body
	}; */
}

export {imageToData, generateHeightField};



