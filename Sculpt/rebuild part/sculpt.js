let GPUSculpt = function (options) {

	this.renderer = options.renderer;
	this.mesh = options.mesh;

	this._size = options.size;
	this._halfSize = this._size / 2.0;

	this._res = options.res;

	this.isSculpting = false;
	this._sculptUvPos = new THREE.Vector2();

	this.init();
}

GPUSculpt.shaders = {
	vertex: {
		passUv: [

			// Pass-through vertex shader for passing interpolated UVs to fragment shader
			// 通过 顶点着色器 将插值UV传递到 片段着色器

			"varying vec2 vUv;",

			"void main() {",
			"	vUv = uv;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
			"}"

		].join('\n'),

		heightMap: [
			"uniform sampler2D texture;",
			"uniform float height;",

			"varying vec3 vPosition;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"void main(){",
			"	vUv = uv;",
			"	vPosition = (modelViewMatrix * vec4( position, 1.0 )).xyz;",
			"	vNormal = normalMatrix * normal;",

			"	vec4 temp = texture2D(texture, uv) * height;",
			"	vec3 displacedPos = vec3(position.x, temp.r, position.z);",

			"	gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);",
			"}"
		].join('\n')
	},

	fragment: {
		mate: [
			"varying vec3 vPosition;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"void main(){",
			// Lighting constants
			"	vec3 light_pos = (viewMatrix * vec4(20.0, 20.0, 20.0, 1.0)).xyz;",
			"	const vec4 ambient = vec4(0.1, 0.1, 0.2, 1.0);",
			"	const vec4 diffuse_albedo = vec4(1.0, 1.0, 1.0, 1.0);",
			"	const vec4 specular_albedo = vec4(1.0, 1.0, 1.0, 1.0);",
			"	const float specular_power = 200.0;",

			"	vec3 N = normalize(vNormal);",
			"	vec3 V = normalize(-vPosition);",
			"	vec3 L = normalize(light_pos - vPosition);",
			"	vec3 R = reflect(-L, N);",

			"	vec4 diffuse = max(0.0, dot(N, L)) * diffuse_albedo;",

			"	vec4 specular = pow( max(0.0, dot(R, V)), specular_power ) * specular_albedo;",

			"	gl_FragColor = ambient + diffuse ;",
			"}"
		].join('\n'),

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
			"	return 0.03 * smoothstep(brushRadius, 0.0, len);",

			// "	float len = length(uv - vec2(uSculptPos.x, 1.0 - uSculptPos.y));",
			// "	return uSculptAmount * smoothstep(uSculptRadius, 0.0, len);",
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
		].join('\n'),

		combineTextures: [	//组合纹理

			// Fragment shader to combine textures
			// 用于组合纹理的片段着色器

			"uniform sampler2D texture1;",
			"uniform sampler2D texture2;",

			"varying vec2 vUv;",

			"void main() {",
			// "	gl_FragColor = texture2D(texture1, vUv) + texture2D(texture2, vUv);",	// 颜色值相加
			"	gl_FragColor = vec4(20.0, 0.0, 0.0, 1.0);",	
			"}"

		].join('\n'),

		setColor: [

			// Fragment shader to set colors on a render target
			// 用于在渲染目标上设置颜色的片段着色器

			"uniform vec4 color;",

			"void main() {",
			"	gl_FragColor = color;",
			"}"

		].join('\n')
	}
}

GPUSculpt.prototype.init = function () {
	GPUSculpt._checkExtensions.bind(this)();

	GPUSculpt._setupMesh.bind(this)();
	GPUSculpt._setupShaders.bind(this)();
	GPUSculpt._setupInvisibleScene.bind(this)();
	GPUSculpt._setupInvisibleRenderTarget.bind(this)();
}

GPUSculpt._checkExtensions = function () {
	const context = this.renderer.getContext();

	// determine floating point texture support
	// 确定浮点纹理是否支持
	// https://www.khronos.org/webgl/public-mailing-list/archives/1306/msg00002.html

	// get floating point texture support
	// 获取浮点纹理支持
	if (!context.getExtension('OES_texture_float')) {
		let msg = 'Not support for floating point textures. Extension not available: OES_texture_float';
		alert(msg);
		throw new Error(msg);
	}

	//get floating point linear filtering support
	this.supportsTextureFloatLinear = context.getExtension('OES_texture_float_linear') !== null;
	console.log('Texture float linear filtering support: ' + this.supportsTextureFloatLinear);

	//get vertex texture support
	if (!context.getParameter(context.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) {
		let msg = 'Vertex textures not supported on your graphics card';
		alert(msg);
		throw new Error(msg);
	}
};

GPUSculpt._setupMesh = function () {
	this.mesh.material = new THREE.ShaderMaterial({
		uniforms: {
			texture: { value: null },
			height: { value: 1 }
		},
		vertexShader: GPUSculpt.shaders.vertex['heightMap'],
		fragmentShader: GPUSculpt.shaders.fragment['mate'],
	});
}

GPUSculpt._setupShaders = function () {
	this._sculptMaterial = new THREE.ShaderMaterial({
		uniforms: {
			brushPosition: { value: new THREE.Vector2() },
			brushRadius: { value: 0.5 },
			brushAmount: { value: 0.03 },
			baseTexture: { value: null },
			sculptTexture: { value: null },
			isSculpting: { value: 0 },
			sculptType: { value: 0 }
		},
		vertexShader: GPUSculpt.shaders.vertex['passUv'],
		fragmentShader: GPUSculpt.shaders.fragment['sculpt'],
	});

	this._clearMaterial = new THREE.ShaderMaterial({
		uniforms: {
			color: { type: 'v4', value: new THREE.Vector4() }
		},
		vertexShader: GPUSculpt.shaders.vertex['passUv'],
		fragmentShader: GPUSculpt.shaders.fragment['setColor']
	});

	this._combineTexturesMaterial = new THREE.ShaderMaterial({
		uniforms: {
			texture1: { value: null },
			texture2: { value: null }
		},
		vertexShader: GPUSculpt.shaders.vertex['passUv'],
		fragmentShader: GPUSculpt.shaders.fragment['combineTextures']
	});
}

GPUSculpt._createImageData = function () {
	if (this.supportsTextureFloatLinear) {
		//use linear with mipmapping
		this.imageDataTexture = new THREE.DataTexture(null, this._res, this._res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
		this.imageDataTexture.generateMipmaps = true;
	} else {
		//resort to nearest filter only, without mipmapping
		this.imageDataTexture = new THREE.DataTexture(null, this._res, this._res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
		this.imageDataTexture.generateMipmaps = false;
	}
}

GPUSculpt._setupInvisibleScene = function () {
	this._invScene = new THREE.Scene();

	let far = 10000;
	let near = -far;
	this._invCamera = new THREE.OrthographicCamera(-this._halfSize, this._halfSize, this._halfSize, -this._halfSize, near, far);

	this._invPlaneGeo = new THREE.PlaneGeometry(this._size, this._size);
	this._invPlane = new THREE.Mesh(this._invPlaneGeo, this._clearMaterial);
	this._invScene.add(this._invPlane);
}

GPUSculpt._setupInvisibleRenderTarget = function () {
	if (this.supportsTextureFloatLinear) {
		this._invRenderTarget1 = new THREE.WebGLRenderTarget(this._res, this._res, this._linearFloatRgbParams);
	} else {
		this._invRenderTarget1 = new THREE.WebGLRenderTarget(this._res, this._res, this._nearestFloatRgbParams);
	}
	this._invRenderTarget1.texture.generateMipmaps = false;
	GPUSculpt._clearRenderTarget.bind(this)(this._invRenderTarget1, 0.0, 0.0, 0.0, 0.0);

	this._invRenderTarget2 = this._invRenderTarget1.clone();
	GPUSculpt._clearRenderTarget.bind(this)(this._invRenderTarget2, 0.0, 0.0, 0.0, 0.0);

	// 用于存储所有图层的合并结果
	this._invCombinedLayer = this._invRenderTarget1.clone();
	GPUSculpt._clearRenderTarget.bind(this)(this._invCombinedLayer, 0.0, 0.0, 0.0, 0.0);
}

GPUSculpt._clearRenderTarget = function (renderTarget, r, g, b, a) {
	this._invPlane.material = this._clearMaterial;
	this._clearMaterial.uniforms['color'].value.set(r, g, b, a);
	this.renderer.setRenderTarget(renderTarget);
	this.renderer.render(this._invScene, this._invCamera);
	// 渲染结果的RGBA像素数据存储到了WebGL渲染目标对象renderTarget中
};

GPUSculpt._swapRenderTarget = function () {
	let temp = this._invRenderTarget1;
	this._invRenderTarget1 = this._invRenderTarget2;
	this._invRenderTarget2 = temp;
	// this._skulptMaterial.uniforms['uSculptTexture1'].value = this._invRenderTarget2;
};

GPUSculpt.prototype.sculpt = function (type, position, amount) {
	this._sculptMaterial.uniforms['sculptType'].value = type;
	this.isSculpting = true;
	this._sculptUvPos.x = (position.x + this._halfSize) / this._size;
	this._sculptUvPos.y = (position.z + this._halfSize) / this._size;
}

GPUSculpt.prototype.update = function () {

	if (this.isSculpting) {
		this._sculptMaterial.uniforms['baseTexture'].value = this.imageDataTexture;
		this._sculptMaterial.uniforms['sculptTexture'].value = this._invRenderTarget2.texture;
		this._sculptMaterial.uniforms['isSculpting'].value = this.isSculpting;
		this._sculptMaterial.uniforms['brushPosition'].value.copy(this._sculptUvPos);

		// console.log(this._sculptMaterial.uniforms['']);

		this._invPlane.material = this._sculptMaterial;

		this.renderer.setRenderTarget(this._invRenderTarget1);
		this.renderer.render(this._invScene, this._invCamera);
		GPUSculpt._swapRenderTarget.bind(this)();
		this.isSculpting = false;
		this._updateCombinedLayers = true;

	}

	if (this._updateCombinedLayers) {
		this._combineTexturesMaterial.uniforms['texture1'].value = this.imageDataTexture;
		this._combineTexturesMaterial.uniforms['texture2'].value = this._invRenderTarget2.texture;

		this._invPlane.material = this._combineTexturesMaterial;

		this.renderer.setRenderTarget(this._invCombinedLayer);
		this.renderer.render(this._invScene, this._invCamera);

		this._updateCombinedLayers = false;

		this.mesh.material.uniforms['texture'].value = this._invCombinedLayer.texture;
	}

	this.renderer.setRenderTarget(null);
}

/**
 * Add sculpt operation
 * @const
 */
GPUSculpt.ADD = 1;
/**
 * Remove sculpt operation
 * @const
 */
GPUSculpt.REMOVE = 2;