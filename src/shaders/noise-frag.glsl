#version 300 es

precision highp float;

uniform vec2 u_Resolution;

vec3 uCameraPosition = vec3(0, 0, 2);

vec3 spherePos = vec3(0, 0, 0);
float sphereRadius = 1.f;

out vec4 outColor;

float density(vec3 pos){
	return max(1.f - length(pos - spherePos), 0.f);
}

float rayMarch(vec3 start, vec3 dir, float stepSize, float end){
	float totalDensity = 0.f;

	vec3 currentPos = start;

	for(float i = 0.f; i<floor(end/stepSize); i += 1.f){
		totalDensity += density(currentPos);
		currentPos += stepSize * dir;
	}

	return totalDensity;
}

void main()
{
	float aspectRatio = u_Resolution.x/u_Resolution.y;
	float xRange = 2.f * tan(1.f);
	float yRange = xRange / aspectRatio;
    vec2 uv = gl_FragCoord.xy/u_Resolution;

    float xDir = -xRange/2.f + uv.x * xRange;
    float yDir = -yRange/2.f + uv.y * yRange;
    vec3 rayDir = normalize(vec3(xDir, yDir, -1.f));
    vec3 rayPos = uCameraPosition;

    vec3 color = rayMarch(rayPos, rayDir, 0.5, 1000.f) * vec3(1);

    outColor = vec4(color, 1);
}