varying vec3 vNormal;
varying vec3 vPositionNormal;
void main() 
{
	vNormal = normalize( normalMatrix * normal ); 
	vPositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);	// 转换到视图空间
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );	// 转换到屏幕坐标系
}

// --- fragment shader a.k.a. pixel shader ---
uniform vec3 glowColor;
uniform float b;
uniform float p;
uniform float s;
varying vec3 vNormal;
varying vec3 vPositionNormal;
void main() 
{
	float a = pow( b + s * abs(dot(vNormal, vPositionNormal)), p );
	gl_FragColor = vec4( glowColor, a );
}

// -------------------------------------------

void main(void){
	vec3 glowColor = vec3(0.0, 1.0, 1.0);
	
	// Support vectors
	vec3 P = vec3(fPosition);
	vec3 N = normalize(fNormal);
	vec3 V = normalize(-P);

	float p = 2.0;
	float scale = -1.0;
	float bias = 1.0;

	float a = pow(bias + scale*abs(dot(N, V)), p);	// pow 返回输入值的指定次幂
	gl_FragColor = vec4(glowColor, a); 
}
