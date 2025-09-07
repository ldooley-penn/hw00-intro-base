#version 300 es

precision highp float;

uniform vec2 u_Resolution;

uniform float u_Time;

vec3 uCameraPosition = vec3(0, 0, 2);

vec3 spherePos = vec3(0, 0, 0);
float sphereRadius = 1.f;

out vec4 outColor;

// Credit to https://www.ronja-tutorials.com/post/024-white-noise/
float random3x1(vec3 pos, vec3 seedVector) {
    vec3 smallValue = sin(pos);
    float value = dot(smallValue, seedVector);
    value = fract(sin(value) * 143758.5453);
    // Remap from [-1, 1] to [0, 1]
    value = (value + 1.f)/2.f;
    return value;
}

vec3 random3x3(vec3 pos){
    return vec3(
        random3x1(pos, vec3(12.989, 78.233, 37.719)),
        random3x1(pos, vec3(39.346, 11.135, 83.155)),
        random3x1(pos, vec3(73.156, 52.235, 09.151))
    );
}

float noise(vec3 pos, float scale) {
    vec3 scaledPos = pos/scale;
    vec3 originalCell = floor(scaledPos);

    float minDistance = 100.f;
    for(int dx = -1; dx < 2; dx++) {
        for(int dy = -1; dy < 2; dy++) {
            for(int dz = -1; dz < 2; dz++) {
                vec3 dCell = vec3(float(dx), float(dy), float(dz));
                vec3 currentCell = originalCell + dCell;

                vec3 currentCellVoronoiCenter = currentCell + random3x3(currentCell);
                minDistance = min(minDistance, distance(currentCellVoronoiCenter, scaledPos));
            }
        }
    }

    return minDistance;
}

float density(vec3 pos) {
    float noiseValue = noise(pos, 0.1);
    noiseValue = smoothstep(0.f, 2.f, 1.f - noiseValue);
    return noiseValue;
}

float rayMarch(vec3 start, vec3 dir, float stepSize, int iterations){
	float totalDensity = 0.f;
	vec3 currentPos = start;
	for(int i = 0; i<iterations; i++){
	    currentPos += stepSize * dir;
		totalDensity += density(currentPos);
	}
	return totalDensity;
}

void main()
{
	float aspectRatio = u_Resolution.x/u_Resolution.y;
	float xRange = 2.f * tan(0.5f);
	float yRange = xRange / aspectRatio;
    vec2 uv = gl_FragCoord.xy/u_Resolution;

    float xDir = -xRange/2.f + uv.x * xRange;
    float yDir = -yRange/2.f + uv.y * yRange;
    vec3 rayDir = normalize(vec3(xDir, yDir, -1.f));
    vec3 rayPos = uCameraPosition;

    //vec3 color = rayMarch(rayPos, rayDir, 0.5, 1) * vec3(1);

    vec3 color = vec3(density(vec3(uv, u_Time/10.f)));

    outColor = vec4(color, 1);
}