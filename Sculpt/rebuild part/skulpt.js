/**
 * @fileOverview A JavaScript/GLSL sculpting script for sculpting Three.js meshes
 * @author Skeel Lee <skeel@skeelogy.com>
 * @version 1.0.2
 *
 * @example
 * //How to setup a GPU Skulpt:
 *
 * //create a plane for sculpting
 * var TERRAIN_SIZE = 10;
 * var TERRAIN_RES = 256;
 * var terrainGeom = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_RES - 1, TERRAIN_RES - 1);
 * terrainGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
 * var terrainMesh = new THREE.Mesh(terrainGeom, null);  //a custom material will be assigned later when using SKULPT.GpuSkulpt
 * scene.add(terrainMesh);
 *
 * //create a GpuSkulpt instance
 * var gpuSkulpt = new SKULPT.GpuSkulpt({
 *     renderer: renderer,
 *     mesh: terrainMesh,
 *     size: TERRAIN_SIZE,
 *     res: TERRAIN_RES
 * });
 *
 * //update every frame
 * renderer.clear();
 * gpuSkulpt.update(dt);  //have to do this after clear but before render
 * renderer.render(scene, camera);
 *
 * @example
 * //How to sculpt:
 *
 * //get sculpt position and show/hide cursor
 * var sculptPosition = getSculptPosition();  //do ray-intersection tests, for example, to determine where the user is clicking on the plane
 * if (sculptPosition) {
 *     gpuSkulpt.updateCursor(sculptPosition);
 *     gpuSkulpt.showCursor();
 * } else {
 *     gpuSkulpt.hideCursor();
 * }
 *
 * //sculpt
 * var sculptType = SKULPT.ADD;
 * var sculptAmount = 1.0;
 * gpuSkulpt.sculpt(sculptType, sculptPosition, sculptAmount);
 *
 * @example
 * //How to clear sculpts:
 *
 * //clear sculpts
 * gpuSkulpt.clear();
 *
 * @example
 * //How to change sculpt brush parameters:
 *
 * //change brush size
 * var brushSize = 1.0;
 * gpuSkulpt.setBrushSize(brushSize);
 *
 * //change brush amount
 * var brushAmount = 1.0;
 * gpuSkulpt.setBrushAmount(brushAmount);
 *
 * @example
 * //How to load sculpt data from an img:
 *
 * //get image data from canvas
 * var canvas = document.createElement('canvas');
 * var context = canvas.getContext('2d');
 * var img = document.getElementById('yourImageId');
 * context.drawImage(img, 0, 0, TERRAIN_RES, TERRAIN_RES);
 * var terrainImageData = context.getImageData(0, 0, TERRAIN_RES, TERRAIN_RES).data;
 *
 * //load sculpt using image data
 * var height = 1.0;
 * var midGreyIsLowest = false;
 * gpuSkulpt.loadFromImageData(terrainImageData, height, midGreyIsLowest);
 */

/**
 * @namespace
 */
var SKULPT = SKULPT || { version: '2.0.0' };
console.log('Using SKULPT ' + SKULPT.version);

/**
 * Creates a GpuSkulpt instance for sculpting
 * @constructor
 * @param {object} options Options
 * @param {THREE.WebGLRenderer} options.renderer Three.js WebGL renderer
 * @param {THREE.Mesh} options.mesh Three.js mesh for sculpting
 * @param {number} options.size size of mesh
 * @param {number} options.res resolution of mesh
 * @param {number} [options.proxyRes] resolution of proxy mesh
 */
SKULPT.GpuSkulpt = function (options) {
	var __three = THREE;
	
	if(__three == undefined){
		console.error("Three.js未添加");
		return;
	}

    if (typeof options.mesh === 'undefined') {
        throw new Error('mesh not specified');
    }
    this.__mesh = options.mesh;
    if (typeof options.renderer === 'undefined') {
        throw new Error('renderer not specified');
    }
    this.__renderer = options.renderer;
    if (typeof options.size === 'undefined') {
        throw new Error('size not specified');
    }
    this.__size = options.size;
    this.__halfSize = this.__size / 2.0;
    if (typeof options.res === 'undefined') {
        throw new Error('res not specified');
    }
    this.__res = options.res;
    this.__proxyRes = options.proxyRes || this.__res;

    this.__actualToProxyRatio = this.__res / this.__proxyRes;
    this.__gridSize = this.__size / this.__res;
    this.__texelSize = 1.0 / this.__res;

    this.__imageProcessedData = new Float32Array(4 * this.__res * this.__res);

    this.__isSculpting = false;
    this.__sculptUvPos = new THREE.Vector2();

    this.__cursorHoverColor = new THREE.Vector3(0.4, 0.4, 0.4);
    this.__cursorAddColor = new THREE.Vector3(0.3, 0.5, 0.1);
    this.__cursorRemoveColor = new THREE.Vector3(0.5, 0.2, 0.1);

    this.__shouldClear = false;

    this.__linearFloatRgbParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        format: THREE.RGBFormat,
        stencilBuffer: false,
        depthBuffer: false,
        type: THREE.FloatType
    };

    this.__nearestFloatRgbParams = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        format: THREE.RGBFormat,
        stencilBuffer: false,
        depthBuffer: false,
        type: THREE.FloatType
    };

    this.__nearestFloatRgbaParams = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: false,
        type: THREE.FloatType
    };

    this.__pixelByteData = new Uint8Array(this.__res * this.__res * 4);
    this.__proxyPixelByteData = new Uint8Array(this.__proxyRes * this.__proxyRes * 4);

    this.__callbacks = {};

    this.__init();
};
SKULPT.GpuSkulpt.prototype.__shaders = {

    vert: {

        passUv: [

            // Pass-through vertex shader for passing interpolated UVs to fragment shader
			// 通过 顶点着色器 将插值UV传递到 片段着色器
			
            "varying vec2 vUv;",

            "void main() {",
                "vUv = vec2(uv.x, uv.y);",
				//"vUv = ux;",
                "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"

        ].join('\n'),

        heightMap: [
			// 高度图

            //Vertex shader that displaces vertices in local Y based on a texture
            // 顶点着色器，基于纹理来替换局部顶点的Y值，该着色器用来处理外部导入的图片

            "uniform sampler2D uTexture;",		// 采样，返回vec4(r, 0.0, 0.0, 1.0)，其中 0.0 <= r <= 255.0
            "uniform vec2 uTexelSize;",         // 纹素比例  1.0 / this.__res  [texel - 纹理元素，可以称为纹素]
            "uniform vec2 uTexelWorldSize;",    // 纹素大小，this.__size / this.__res
            "uniform float uHeightMultiplier;", // 乘数

            "varying vec3 vViewPos;",
            "varying vec3 vViewNormal;",
            "varying vec2 vUv;",
			"varying vec3 vPosition;",
			"varying vec3 vNormal;",
			// 均为视点坐标系下的值			

            // THREE.ShaderChunk['shadowmap_pars_vertex'],

            "void main() {",

				"	vUv = uv;",
				"	vPosition = (modelViewMatrix * vec4( position, 1.0 )).xyz;",
				"	vNormal = normalMatrix * normal;",

                // displace y based on texel value
                // 纹素值取代Y值
                "vec4 t = texture2D(uTexture, vUv) * uHeightMultiplier;",
                "vec3 displacedPos = vec3(position.x, t.r, position.z);",   // 取代后该点坐标值 uniform vec3 position

                //find normal
				// 用于计算该点的法向量，首先求出相邻点的坐标
                "vec2 du = vec2(uTexelSize.r, 0.0);",
                "vec2 dv = vec2(0.0, uTexelSize.g);",   // 纹素 uv 值
				
                "vec3 vecPosU = vec3(displacedPos.x + uTexelWorldSize.r,",  // positive(+)	指向该点 U+ 方向上相邻的点的向量
                                    "texture2D(uTexture, vUv + du).r * uHeightMultiplier,",
                                    "displacedPos.z) - displacedPos;",
                "vec3 vecNegU = vec3(displacedPos.x - uTexelWorldSize.r,",  // negative(-)	指向该点 U- 方向上相邻点的向量
                                    "texture2D(uTexture, vUv - du).r * uHeightMultiplier,",
                                    "displacedPos.z) - displacedPos;",
                "vec3 vecPosV = vec3(displacedPos.x,",						// 指向该点 V+ 方向上相邻点的向量
                                    "texture2D(uTexture, vUv + dv).r * uHeightMultiplier,",
                                    "displacedPos.z - uTexelWorldSize.g) - displacedPos;",
                "vec3 vecNegV = vec3(displacedPos.x,",						// 指向该点 V- 方向上相邻点的向量
                                    "texture2D(uTexture, vUv - dv).r * uHeightMultiplier,",
                                    "displacedPos.z + uTexelWorldSize.g) - displacedPos;",
									
				// 叉乘计算该点相邻面的法向量，再相加，得该点的法向量，之后再单位化
                "vViewNormal = normalize(normalMatrix * 0.25 * (cross(vecPosU, vecPosV) + cross(vecPosV, vecNegU) + cross(vecNegU, vecNegV) + cross(vecNegV, vecPosU)));",

                "vec4 worldPosition = modelMatrix * vec4(displacedPos, 1.0);",  // 使用替代后的位置
                "vec4 viewPos = modelViewMatrix * vec4(displacedPos, 1.0);",
                "vViewPos = viewPos.rgb;",

                "gl_Position = projectionMatrix * viewPos;",
				// 顶点的位置属性就这样存储在图片中

                // THREE.ShaderChunk['shadowmap_vertex'],	// ？用来产生阴影

            "}"

        ].join('\n')

    },

    frag: {
		
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

        skulpt: [

            //Fragment shader for sculpting

            "uniform sampler2D uBaseTexture;",      // 采样外部图片
            "uniform sampler2D uSculptTexture1;",   // 采样外部图片
            "uniform vec2 uTexelSize;",			// 单个纹素的大小（在UV中的占比）
            "uniform int uIsSculpting;",        // 进行雕刻
            "uniform int uSculptType;",         // 类型：增/减
            "uniform float uSculptAmount;",     // 数量
            "uniform float uSculptRadius;",     // 半径
            "uniform vec2 uSculptPos;",         // 位置	范围[0.0, 1.0]

            "varying vec2 vUv;",

            "float add(vec2 uv) {",
                "float len = length(uv - vec2(uSculptPos.x, 1.0 - uSculptPos.y));",     // 该点处的UV坐标 与 雕刻工具中心 之间的距离，注意此处uSculptPos的Z轴方向与V轴方向相反
                "return uSculptAmount * smoothstep(uSculptRadius, 0.0, len);",      // 平滑
            "}",

            "void main() {",

                // r channel: height
				// r通道

                // read base texture
				// 读取初始纹理值
                "vec4 tBase = texture2D(uBaseTexture, vUv);",   

                // read texture from previous step
				// 读取上一步的纹理值
                "vec4 t1 = texture2D(uSculptTexture1, vUv);",   

                // add sculpt
				// 雕刻
                "if (uIsSculpting == 1) {",
                    "if (uSculptType == 1) {",  //add
                        "t1.r += add(vUv);",
                    "} else if (uSculptType == 2) {",  //remove
                        "t1.r -= add(vUv);",
                        "t1.r = max(0.0, tBase.r + t1.r) - tBase.r;",	// 最小值为 0.0
                    "}",
                "}",

                // write out to texture for next step
				// 写出到下一步的纹理，"uniform sampler2D uSculptTexture1;" 进行采样
                "gl_FragColor = t1;",
            "}"

        ].join('\n'),

        combineTextures: [	//组合纹理

            // Fragment shader to combine textures
			// 用于组合纹理的片段着色器

            "uniform sampler2D uTexture1;",
            "uniform sampler2D uTexture2;",

            "varying vec2 vUv;",

            "void main() {",
            "	gl_FragColor = texture2D(uTexture1, vUv) + texture2D(uTexture2, vUv);",	// 颜色值相加
            "}"

        ].join('\n'),

        setColor: [

            // Fragment shader to set colors on a render target
			// 用于在渲染目标上设置颜色的片段着色器

            "uniform vec4 uColor;",

            "void main() {",
                "gl_FragColor = uColor;",
            "}"

        ].join('\n'),

        scaleAndFlipV: [

            // Fragment shader to scale and flip a texture
			// 用于缩放和翻转纹理的片段着色器

            "uniform sampler2D uTexture;",
            "uniform float uScale;",

            "varying vec2 vUv;",

            "void main() {",
                "vec2 scaledAndFlippedUv = vec2(vUv.x * uScale, 1.0 - (vUv.y * uScale));",	// 缩放和翻转后的uv值
                "gl_FragColor = texture2D(uTexture, scaledAndFlippedUv);",
            "}"

        ].join('\n'),

        encodeFloat: [	// 对浮点数进行编码

            // Fragment shader that encodes float value in input R channel to 4 unsigned bytes in output RGBA channels
			// 片段着色器，将输入R通道中的浮点值编码为输出RGBA通道中的4个无符号字节
			
            // Most of this code is from original GLSL codes from Piotr Janik, only slight modifications are done to fit the needs of this script
			// 这段代码的大部分来自Piotr Janik的原始GLSL代码，只做了一些细微的修改以适应此脚本的需要
            // http://concord-consortium.github.io/lab/experiments/webgl-gpgpu/script.js
			
            // Using method 1 of the code.
			// 使用代码的方法1

            "uniform sampler2D uTexture;",
            "uniform vec4 uChannelMask;",	// 通道掩码

            "varying vec2 vUv;",

            "float shift_right(float v, float amt) {",
                "v = floor(v) + 0.5;",
                "return floor(v / exp2(amt));",
            "}",

            "float shift_left(float v, float amt) {",
                "return floor(v * exp2(amt) + 0.5);",	// exp2(amt) : 2的amt次方
            "}",

            "float mask_last(float v, float bits) {",
                "return mod(v, shift_left(1.0, bits));",
            "}",

            "float extract_bits(float num, float from, float to) {",
                "from = floor(from + 0.5);",
                "to = floor(to + 0.5);",
                "return mask_last(shift_right(num, from), to - from);",
            "}",

            "vec4 encode_float(float val) {",

                "if (val == 0.0) {",
                    "return vec4(0, 0, 0, 0);",
                "}",

                "float sign = val > 0.0 ? 0.0 : 1.0;",
                "val = abs(val);",
                "float exponent = floor(log2(val));",
                "float biased_exponent = exponent + 127.0;",
                "float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0;",

                "float t = biased_exponent / 2.0;",
                "float last_bit_of_biased_exponent = fract(t) * 2.0;",
                "float remaining_bits_of_biased_exponent = floor(t);",

                "float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0;",
                "float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0;",
                "float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0;",
                "float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0;",

                "return vec4(byte4, byte3, byte2, byte1);",
            "}",

            "void main() {",
                "vec4 t = texture2D(uTexture, vUv);",
                "gl_FragColor = encode_float(dot(t, uChannelMask));",
            "}"

        ].join('\n'),

        lambertCursor: [

            // Fragment shader that does basic lambert shading.
			// 执行基本Lambert着色的片段着色器。
			
            // This is the version that overlays a circular cursor patch.
			// 这是覆盖圆形光标补丁的版本。

            "uniform vec3 uBaseColor;",
            "uniform vec3 uAmbientLightColor;",
            "uniform float uAmbientLightIntensity;",

            "uniform int uShowCursor;",
            "uniform vec2 uCursorPos;",
            "uniform float uCursorRadius;",
            "uniform vec3 uCursorColor;",

            "varying vec3 vViewPos;",
            "varying vec3 vViewNormal;",
            "varying vec2 vUv;",

            "#if NUM_DIR_LIGHTS > 0",
                "uniform vec3 directionalLightColor[ NUM_DIR_LIGHTS ];",
                "uniform vec3 directionalLightDirection[ NUM_DIR_LIGHTS ];",
            "#endif",

            // THREE.ShaderChunk['shadowmap_pars_fragment'],

            "void main() {",

                //ambient component
                "vec3 ambient = uAmbientLightColor * uAmbientLightIntensity;",

                //diffuse component
                "vec3 diffuse = vec3(0.0);",

                "#if NUM_DIR_LIGHTS > 0",

                    "for (int i = 0; i < NUM_DIR_LIGHTS; i++) {",
                        "vec4 lightVector = viewMatrix * vec4(directionalLightDirection[i], 0.0);",
                        "float normalModulator = dot(normalize(vViewNormal), normalize(lightVector.xyz));",
                        "diffuse += normalModulator * directionalLightColor[i];",
                    "}",

                "#endif",

                //combine components to get final color
                "vec3 finalColor = uBaseColor * (ambient + diffuse);",

                //mix in cursor color
                "if (uShowCursor == 1) {",
                    "float len = length(vUv - vec2(uCursorPos.x, 1.0 - uCursorPos.y));",
                    "finalColor = mix(finalColor, uCursorColor, smoothstep(uCursorRadius, 0.0, len));",	// uCursorColor占比
                "}",

                "gl_FragColor = vec4(finalColor, 1.0);",

                // THREE.ShaderChunk['shadowmap_fragment'],

            "}"

        ].join('\n')

    }

};
/**
 * Gets the color of the cursor in hover mode
 * @return {THREE.Vector3} A vector that represents the color of the cursor in hover mode
 */
SKULPT.GpuSkulpt.prototype.getCursorHoverColor = function (r, g, b) {
    return this.__cursorHoverColor;
};
/**
 * Sets the color of the cursor in hover mode
 * @param {number} r Red floating-point value between 0 and 1, inclusive
 * @param {number} g Green floating-point value between 0 and 1, inclusive
 * @param {number} b Blue floating-point value between 0 and 1, inclusive
 */
SKULPT.GpuSkulpt.prototype.setCursorHoverColor = function (r, g, b) {
    this.__cursorHoverColor.copy(r, g, b);
};
/**
 * Gets the color of the cursor in add mode
 * @return {THREE.Vector3} A vector that represents the color of the cursor in add mode
 */
SKULPT.GpuSkulpt.prototype.getCursorAddColor = function (r, g, b) {
    return this.__cursorAddColor;
};
/**
 * Sets the color of the cursor in add mode
 * @param {number} r Red floating-point value between 0 and 1, inclusive
 * @param {number} g Green floating-point value between 0 and 1, inclusive
 * @param {number} b Blue floating-point value between 0 and 1, inclusive
 */
SKULPT.GpuSkulpt.prototype.setCursorAddColor = function (r, g, b) {
    this.__cursorAddColor.copy(r, g, b);
};
/**
 * Gets the color of the cursor in remove mode
 * @return {THREE.Vector3} A vector that represents the color of the cursor in remove mode
 */
SKULPT.GpuSkulpt.prototype.getCursorRemoveColor = function (r, g, b) {
    return this.__cursorRemoveColor;
};
/**
 * Sets the color of the cursor in remove mode
 * @param {number} r Red floating-point value between 0 and 1, inclusive
 * @param {number} g Green floating-point value between 0 and 1, inclusive
 * @param {number} b Blue floating-point value between 0 and 1, inclusive
 */
SKULPT.GpuSkulpt.prototype.setCursorRemoveColor = function (r, g, b) {
    this.__cursorRemoveColor.copy(r, g, b);
};
SKULPT.GpuSkulpt.prototype.__init = function () {

    this.__checkExtensions();	// 检查扩展 "OES_texture_float"，"OES_texture_float_linear"
    this.__setupRttScene();		// 包括 正交相机，平面几何体

    // setup a reset material for clearing render targets
	// 设置用于清除渲染目标的重置材质
    this.__clearMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { type: 'v4', value: new THREE.Vector4() }
        },
        vertexShader: this.__shaders.vert['passUv'],
        fragmentShader: this.__shaders.frag['setColor']
    });

    this.__setupRttRenderTargets();
    this.__setupShaders();
    this.__setupVtf();

    // create a DataTexture, with filtering type based on whether linear filtering is available
	// 创建一个DataTexture，其过滤类型基于线性过滤（THREE.LinearFilter）是否可用
	
	// 官方文档解释：
	// In order to use the types THREE.FloatType and THREE.HalfFloatType, the WebGL implementation 
	// must support the respective extensions OES_texture_float and OES_texture_half_float. In order 
	// to use THREE.LinearFilter for component-wise, bilinear interpolation of the texels based on 
	// these types, the WebGL extensions OES_texture_float_linear or OES_texture_half_float_linear must also be present.
	
	// DataTexture( data, width, height, format, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, encoding )
    if (this.__supportsTextureFloatLinear) {
        //use linear with mipmapping
        this.__imageDataTexture = new THREE.DataTexture(null, this.__res, this.__res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
        this.__imageDataTexture.generateMipmaps = true;
    } else {
        //resort to nearest filter only, without mipmapping
        this.__imageDataTexture = new THREE.DataTexture(null, this.__res, this.__res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        this.__imageDataTexture.generateMipmaps = false;
    }
};
SKULPT.GpuSkulpt.prototype.__checkExtensions = function (renderer) {
    var context = this.__renderer.getContext();

    // determine floating point texture support
	// 确定浮点纹理是否支持
    // https://www.khronos.org/webgl/public-mailing-list/archives/1306/msg00002.html

    // get floating point texture support
	// 获取浮点纹理支持
    if (!context.getExtension('OES_texture_float')) {
        var msg = 'Not support for floating point textures. Extension not available: OES_texture_float';
        alert(msg);
        throw new Error(msg);
    }

    //get floating point linear filtering support
    this.__supportsTextureFloatLinear = context.getExtension('OES_texture_float_linear') !== null;
    console.log('Texture float linear filtering support: ' + this.__supportsTextureFloatLinear);

    //get vertex texture support
    if (!context.getParameter(context.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) {
        var msg = 'Vertex textures not supported on your graphics card';
        alert(msg);
        throw new Error(msg);
    }
};
SKULPT.GpuSkulpt.prototype.__setupShaders = function () {

    this.__skulptMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uBaseTexture: { type: 't', value: null },
            uSculptTexture1: { type: 't', value: null },
            uTexelSize: { type: 'v2', value: new THREE.Vector2(this.__texelSize, this.__texelSize) },
            uTexelWorldSize: { type: 'v2', value: new THREE.Vector2(this.__size / this.__res, this.__size / this.__res) },
            uIsSculpting: { type: 'i', value: 0 },
            uSculptType: { type: 'i', value: 0 },
            uSculptPos: { type: 'v2', value: new THREE.Vector2() },
            uSculptAmount: { type: 'f', value: 0.05 },
            uSculptRadius: { type: 'f', value: 0.0 }
        },
        vertexShader: this.__shaders.vert['passUv'],
        fragmentShader: this.__shaders.frag['skulpt']
    });

    this.__combineTexturesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture1: { type: 't', value: null },
            uTexture2: { type: 't', value: null }
        },
        vertexShader: this.__shaders.vert['passUv'],
        fragmentShader: this.__shaders.frag['combineTextures']
    });

    this.__rttEncodeFloatMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: null },
            uChannelMask: { type: 'v4', value: new THREE.Vector4() }
        },
        vertexShader: this.__shaders.vert['passUv'],
        fragmentShader: this.__shaders.frag['encodeFloat']
    });

    this.__rttProxyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: null },
            uScale: { type: 'f', value: 0 }
        },
        vertexShader: this.__shaders.vert['passUv'],
        fragmentShader: this.__shaders.frag['scaleAndFlipV']
    });

    this.__channelVectors = {
        'r': new THREE.Vector4(1, 0, 0, 0),
        'g': new THREE.Vector4(0, 1, 0, 0),
        'b': new THREE.Vector4(0, 0, 1, 0),
        'a': new THREE.Vector4(0, 0, 0, 1)
    };
};
/**
 * Sets up the render-to-texture scene (2 render targets for accumulative feedback)
 * 设置 渲染到纹理 场景（用2个渲染目标进行累计反馈），渲染结果存入纹理中
 */
SKULPT.GpuSkulpt.prototype.__setupRttScene = function () {
	// 包括 正交相机，平面几何体
	// 该场景被渲染至 render target 中，不会显示在 canvass 上

    // create a RTT scene
    this.__rttScene = new THREE.Scene();

    // create an orthographic RTT camera
    var far = 10000;
    var near = -far;
    this.__rttCamera = new THREE.OrthographicCamera(-this.__halfSize, this.__halfSize, this.__halfSize, -this.__halfSize, near, far);
    // 正交相机，视野范围[-10000, 10000]

    // create a quad which we will use to invoke the shaders
    // 创建一个四边形，我们将使用它来调用着色器
    this.__rttQuadGeom = new THREE.PlaneGeometry(this.__size, this.__size);
    this.__rttQuadMesh = new THREE.Mesh(this.__rttQuadGeom, this.__skulptMaterial);
    this.__rttScene.add(this.__rttQuadMesh);
};
SKULPT.GpuSkulpt.prototype.__setupRttRenderTargets = function () {
	// 该方法共创建了 6 个 WebGLRenderTarget 对象

	// 官方文档解释：
	// render target是一个缓冲，就是在这个缓冲中，显卡为正在后台渲染的场景绘 
	// 制像素。它用于不同的效果，例如用于在一个图像显示在屏幕上之前先做一些处理。
	
	// 定制自己的渲染目标，渲染的图像结果保存到该对象，或者说保存到GPU自定义帧缓冲区中，不会显示到canvas画布上
	
    // create RTT render targets (we need two to do feedback)
	// 创建RTT渲染目标（我们需要两个来进行反馈）
    if (this.__supportsTextureFloatLinear) {
        this.__rttRenderTarget1 = new THREE.WebGLRenderTarget(this.__res, this.__res, this.__linearFloatRgbParams);
    } else {
        this.__rttRenderTarget1 = new THREE.WebGLRenderTarget(this.__res, this.__res, this.__nearestFloatRgbParams);
    }
    this.__rttRenderTarget1.texture.generateMipmaps = false;
    this.__clearRenderTarget(this.__rttRenderTarget1, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)
	
    this.__rttRenderTarget2 = this.__rttRenderTarget1.clone();
    this.__clearRenderTarget(this.__rttRenderTarget2, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)

    // create a RTT render target for storing the combine results of all layers
	// 创建用于存储所有图层合并结果的RTT渲染目标
    this.__rttCombinedLayer = this.__rttRenderTarget1.clone();
    this.__clearRenderTarget(this.__rttCombinedLayer, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)

    // create RTT render target for storing proxy terrain data
	// 创建用于存储代理地形数据的RTT渲染目标
    if (this.__supportsTextureFloatLinear) {
        this.__rttProxyRenderTarget = new THREE.WebGLRenderTarget(this.__proxyRes, this.__proxyRes, this.__linearFloatRgbParams);
    } else {
        this.__rttProxyRenderTarget = new THREE.WebGLRenderTarget(this.__proxyRes, this.__proxyRes, this.__nearestFloatRgbParams);
    }
    this.__rttProxyRenderTarget.texture.generateMipmaps = false;
    this.__clearRenderTarget(this.__rttProxyRenderTarget, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)

    // create another RTT render target encoding float to 4-byte data
	// 创建另一个RTT渲染目标，将浮点数编码为4字节数据
    this.__rttFloatEncoderRenderTarget = new THREE.WebGLRenderTarget(this.__res, this.__res, this.__nearestFloatRgbaParams);
    this.__rttFloatEncoderRenderTarget.texture.generateMipmaps = false;
    this.__clearRenderTarget(this.__rttFloatEncoderRenderTarget, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)
};
/**
 * 将this.__rttQuadMesh.material设置为(r, g, b, a)颜色值，间接做到清除renderTarget的目的
 */
SKULPT.GpuSkulpt.prototype.__clearRenderTarget = function (renderTarget, r, g, b, a) {
    this.__rttQuadMesh.material = this.__clearMaterial;
    this.__clearMaterial.uniforms['uColor'].value.set(r, g, b, 1.0);
    this.__renderer.setRenderTarget(renderTarget);
    this.__renderer.render(this.__rttScene, this.__rttCamera);
	// 渲染结果的RGBA像素数据存储到了WebGL渲染目标对象renderTarget中
};

// Sets up the vertex-texture-fetch for the given mesh
// 为给定网格设置顶点纹理提取
SKULPT.GpuSkulpt.prototype.__setupVtf = function () {
    this.__mesh.material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            // THREE.UniformsLib['shadowmap'],
            {
                uTexture: { type: 't', value: null },
                uTexelSize: { type: 'v2', value: new THREE.Vector2(1.0 / this.__res, 1.0 / this.__res) },
                uTexelWorldSize: { type: 'v2', value: new THREE.Vector2(this.__gridSize, this.__gridSize) },
                uHeightMultiplier: { type: 'f', value: 1.0 },
                uBaseColor: { type: 'v3', value: new THREE.Vector3(0.6, 0.8, 0.0) },
                uShowCursor: { type: 'i', value: 0 },
                uCursorPos: { type: 'v2', value: new THREE.Vector2() },
                uCursorRadius: { type: 'f', value: 0.0 },
                uCursorColor: { type: 'v3', value: new THREE.Vector3() }
            }
        ]),
        vertexShader: this.__shaders.vert['heightMap'],
        // fragmentShader: this.__shaders.frag['lambertCursor'],
		fragmentShader: this.__shaders.frag['mate'],
        lights: true
    });
};
/**
 * Updates the skulpt<br/><strong>NOTE:  This needs to be called every frame, after renderer.clear() and before renderer.render(...)</strong>
 * 更新雕刻数据
 * @param {number} dt Elapsed time since previous frame
 */
SKULPT.GpuSkulpt.prototype.update = function (dt) {

    //have to set flags from other places and then do all steps at once during update

    // clear sculpts if necessary
	// 是否清除已雕刻数据
    if (this.__shouldClear) {
        this.__rttQuadMesh.material = this.__clearMaterial;
        this.__clearMaterial.uniforms['uColor'].value.set(0.0, 0.0, 0.0, 0.0);
        this.__renderer.setRenderTarget(this.__rttRenderTarget1);
        this.__renderer.render(this.__rttScene, this.__rttCamera);
        this.__renderer.setRenderTarget(this.__rttRenderTarget2);
        this.__renderer.render(this.__rttScene, this.__rttCamera);
        this.__shouldClear = false;
        this.__updateCombinedLayers = true;
    }

    // do the main sculpting
	// 雕刻的主要内容
    if (this.__isSculpting) {
		// console.log(this.__renderer);
		
        this.__rttQuadMesh.material = this.__skulptMaterial;		// 更新 this.__rttQuadMesh 的材质
        this.__skulptMaterial.uniforms['uBaseTexture'].value = this.__imageDataTexture;		// 使用创建的 THREE.DataTexture 对象，初始化时 data 为 null
        this.__skulptMaterial.uniforms['uSculptTexture1'].value = this.__rttRenderTarget2.texture;
        this.__skulptMaterial.uniforms['uIsSculpting'].value = this.__isSculpting;
        this.__skulptMaterial.uniforms['uSculptPos'].value.copy(this.__sculptUvPos);
        this.__renderer.setRenderTarget(this.__rttRenderTarget1);
        this.__renderer.render(this.__rttScene, this.__rttCamera);
        this.__swapRenderTargets();
        this.__isSculpting = false;
        this.__updateCombinedLayers = true;
    }

    //combine layers into one
    if (this.__updateCombinedLayers) {  //this can be triggered somewhere else without sculpting
		// console.log("combine layers into one");
		
        this.__rttQuadMesh.material = this.__combineTexturesMaterial;
        this.__combineTexturesMaterial.uniforms['uTexture1'].value = this.__imageDataTexture;
        this.__combineTexturesMaterial.uniforms['uTexture2'].value = this.__rttRenderTarget2.texture;
        this.__renderer.setRenderTarget(this.__rttCombinedLayer);
        this.__renderer.render(this.__rttScene, this.__rttCamera);
        this.__updateCombinedLayers = false;

        // need to rebind rttCombinedLayer to uTexture
		// 需要将rttCombinedLayer重新绑定到uTexture
		// 此处对 uniform 进行更新，顶点着色器中更新顶点数据
        this.__mesh.material.uniforms['uTexture'].value = this.__rttCombinedLayer.texture;

        //check for the callback of type 'update'
        if (this.__callbacks.hasOwnProperty('update')) {
            var renderCallbacks = this.__callbacks['update'];
            var i, len;
            for (i = 0, len = renderCallbacks.length; i < len; i++) {
                renderCallbacks[i]();
            }
        }
    }
	
	this.__renderer.setRenderTarget(null);
};
SKULPT.GpuSkulpt.prototype.__swapRenderTargets = function () {
    var temp = this.__rttRenderTarget1;
    this.__rttRenderTarget1 = this.__rttRenderTarget2;
    this.__rttRenderTarget2 = temp;
    // this.__skulptMaterial.uniforms['uSculptTexture1'].value = this.__rttRenderTarget2;
};
/**
 * Sets brush size
 * @param {number} size Brush size
 */
SKULPT.GpuSkulpt.prototype.setBrushSize = function (size) {
    var normSize = size / (this.__size * 2.0);
    this.__skulptMaterial.uniforms['uSculptRadius'].value = normSize;
    this.__mesh.material.uniforms['uCursorRadius'].value = normSize;
};
/**
 * Sets brush amount
 * @param {number} amount Brush amount
 */
SKULPT.GpuSkulpt.prototype.setBrushAmount = function (amount) {
    this.__skulptMaterial.uniforms['uSculptAmount'].value = amount;
};
/**
 * Loads terrain heights from image data
 * @param  {array} data Image data from canvas
 * @param  {number} amount Height multiplier
 * @param  {boolean} midGreyIsLowest Whether mid grey is considered the lowest part of the image
 */
SKULPT.GpuSkulpt.prototype.loadFromImageData = function (data, amount, midGreyIsLowest) {

    //convert data from Uint8ClampedArray to Float32Array so that DataTexture can use
    var normalizedHeight;
    var min = 99999;
    var i, len;
    for (i = 0, len = this.__imageProcessedData.length; i < len; i++) {
        if (midGreyIsLowest) {
            normalizedHeight = Math.abs(data[i] / 255.0 - 0.5);
        } else {
            normalizedHeight = data[i] / 255.0;
        }
        this.__imageProcessedData[i] = normalizedHeight * amount;

        //store min
        if (this.__imageProcessedData[i] < min) {
            min = this.__imageProcessedData[i];
        }
    }

    //shift down so that min is at 0
    for (i = 0, len = this.__imageProcessedData.length; i < len; i++) {
        this.__imageProcessedData[i] -= min;
    }

    //assign data to DataTexture
    this.__imageDataTexture.image.data = this.__imageProcessedData;
    this.__imageDataTexture.needsUpdate = true;
    this.__skulptMaterial.uniforms['uBaseTexture'].value = this.__imageDataTexture;
    this.__combineTexturesMaterial.uniforms['uTexture1'].value = this.__imageDataTexture;
    // this.__mesh.material.uniforms['uBaseTexture'].value = this.__imageDataTexture;
    this.__updateCombinedLayers = true;
};
/**
 * Sculpt the terrain
 * @param  {enum} type Sculpt operation type: SKULPT.GpuSkulpt.ADD, SKULPT.GpuSkulpt.REMOVE
 * @param  {THREE.Vector3} position World-space position to sculpt at
 * @param  {number} amount Amount to sculpt
 */
SKULPT.GpuSkulpt.prototype.sculpt = function (type, position, amount) {
	// console.log(type);
	
    this.__skulptMaterial.uniforms['uSculptType'].value = type;
    this.__isSculpting = true;
    this.__sculptUvPos.x = (position.x + this.__halfSize) / this.__size;
    this.__sculptUvPos.y = (position.z + this.__halfSize) / this.__size;
    if (type === 1) {
        this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorAddColor);
    } else if (type === 2) {
        this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorRemoveColor);
    }
};
/**
 * Clears all sculpts
 */
SKULPT.GpuSkulpt.prototype.clear = function () {
    this.__shouldClear = true;
};
/**
 * Updates the cursor position
 * @param  {THREE.Vector3} position World-space position to update the cursor to
 */
SKULPT.GpuSkulpt.prototype.updateCursor = function (position) {
    this.__sculptUvPos.x = (position.x + this.__halfSize) / this.__size;
    this.__sculptUvPos.y = (position.z + this.__halfSize) / this.__size;
    this.__mesh.material.uniforms['uCursorPos'].value.set(this.__sculptUvPos.x, this.__sculptUvPos.y);
    this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorHoverColor);
};
/**
 * Shows the sculpt cursor
 */
SKULPT.GpuSkulpt.prototype.showCursor = function () {
    this.__mesh.material.uniforms['uShowCursor'].value = 1;
};
/**
 * Hides the sculpt cursor
 */
SKULPT.GpuSkulpt.prototype.hideCursor = function () {
    this.__mesh.material.uniforms['uShowCursor'].value = 0;
};
/**
 * Gets the sculpt texture that is used for displacement of mesh
 * @return {THREE.WebGLRenderTarget} Sculpt texture that is used for displacement of mesh
 */
SKULPT.GpuSkulpt.prototype.getSculptDisplayTexture = function () {
    return this.__rttCombinedLayer.texture;
};

// Returns the pixel unsigned byte data for the render target texture (readPixels() can only return unsigned byte data)
// 返回渲染目标纹理的像素无符号字节数据(readPixels()只能返回无符号字节数据)
SKULPT.GpuSkulpt.prototype.__getPixelByteDataForRenderTarget = function (renderTarget, pixelByteData, width, height) {

	console.log("get pixel byte data from render target");
	
	// The first method of encoding floats based on: 
	// https://github.com/cscheid/facet/blob/master/src/shade/bits/encode_float.js
	//
	// After rendering to RGBA, UNSIGNED_BYTE texture just call gl.readPixels with
	// an Uint8Array array and cast it to Float32Array.
	// 渲染到RGBA之后，unsign_byte纹理只需使用Uint8Array数组调用gl.readPixels并将其强制转换为Float32Array。
	// e.g.:
	// var output = new Uint8Array(size);
	// (render to RGBA texture)
	// gl.readPixels(..., output);
	// var result = new Float32Array(output.buffer);
	//
	// 'result' array should be filled with float values.
	//
	
    // I need to read in pixel data from WebGLRenderTarget but there seems to be no direct way.
	// 我需要从WebGLRenderTarget读取像素数据，但似乎没有直接的方法。
    // Seems like I have to do some native WebGL stuff with readPixels().
	// 似乎我必须使用readPixels()执行一些原生WebGL内容。

    var gl = this.__renderer.getContext();
	
	var properties = new THREE.WebGLProperties();
	var renderTargetProperties = properties.get( renderTarget );	

    // bind texture to gl context
	// 将纹理绑定到 gl 上下文
	// 
	// 将给定的WebGLFramebuffer绑定到目标。
	
    // gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.__webglFramebuffer);
	gl.bindFramebuffer( gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer );

    // attach texture	附加纹理
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTarget.__webglTexture, 0);

    // read pixels
	// WebGL API的WebGLRenderingContext.readPixels()方法将像素块从当前颜色帧缓冲区的
	// 指定矩形读取到ArrayBufferView对象中。
	// https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/readPixels
	// 
	// void gl.readPixels(x, y, width, height, format, type, pixels); 
	//
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelByteData);

    //unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

};
SKULPT.GpuSkulpt.prototype.__getPixelEncodedByteData = function (renderTarget, pixelByteData, channelId, width, height) {

	console.log("encode byte data");

    // encode the float data into an unsigned byte RGBA texture
	// 将浮点数据编码为无符号字节RGBA纹理
    this.__rttQuadMesh.material = this.__rttEncodeFloatMaterial;
    this.__rttEncodeFloatMaterial.uniforms['uTexture'].value = renderTarget.texture;
    this.__rttEncodeFloatMaterial.uniforms['uChannelMask'].value.copy(this.__channelVectors[channelId]);
    this.__renderer.setRenderTarget(this.__rttFloatEncoderRenderTarget);
    this.__renderer.render(this.__rttScene, this.__rttCamera);

    this.__getPixelByteDataForRenderTarget(this.__rttFloatEncoderRenderTarget, pixelByteData, width, height);
};
/**
 * Gets float data for every pixel of the terrain texture<br/><strong>NOTE: This is an expensive operation.</strong>
 * @return {Float32Array} Float data of every pixel of the terrain texture
 */
SKULPT.GpuSkulpt.prototype.getPixelFloatData = function () {
	
	console.log("get pixel float data");

    //get the encoded byte data first
    this.__getPixelEncodedByteData(this.__rttCombinedLayer, this.__pixelByteData, 'r', this.__res, this.__res);

    //cast to float
    var pixelFloatData = new Float32Array(this.__pixelByteData.buffer);
    return pixelFloatData;
};
/**
 * Gets float data for every pixel of the proxy terrain texture<br/><strong>NOTE: This is an expensive operation.</strong>
 * @return {Float32Array} Float data of every pixel of the proxy terrain texture
 */
SKULPT.GpuSkulpt.prototype.getProxyPixelFloatData = function () {

    //render to proxy render target
    this.__rttQuadMesh.material = this.__rttProxyMaterial;
    this.__rttProxyMaterial.uniforms['uTexture'].value = this.__rttCombinedLayer.texture;
    this.__rttProxyMaterial.uniforms['uScale'].value = this.__actualToProxyRatio;
    this.__renderer.setRenderTarget(this.__rttProxyRenderTarget);
    this.__renderer.render(this.__rttScene, this.__rttCamera);

    //get the encoded byte data first
    this.__getPixelEncodedByteData(this.__rttProxyRenderTarget, this.__proxyPixelByteData, 'r', this.__proxyRes, this.__proxyRes);

    //cast to float
    var pixelFloatData = new Float32Array(this.__proxyPixelByteData.buffer);
    return pixelFloatData;
};
/**
 * Adds callback function that are executed at specific times
 * @param {string} type Type of callback: 'update' (only choice available now)
 * @param {function} callbackFn Callback function
 */
SKULPT.GpuSkulpt.prototype.addCallback = function (type, callbackFn) {
    if (!this.__callbacks.hasOwnProperty(type)) {
        this.__callbacks[type] = [];
    }
    if (callbackFn) {
        if (typeof callbackFn === 'function') {
            this.__callbacks[type].push(callbackFn);
        } else {
            throw new Error('Specified callbackFn is not a function');
        }
    } else {
        throw new Error('Callback function not defined');
    }
};

/**
 * Add sculpt operation
 * @const
 */
SKULPT.ADD = 1;
/**
 * Remove sculpt operation
 * @const
 */
SKULPT.REMOVE = 2;
