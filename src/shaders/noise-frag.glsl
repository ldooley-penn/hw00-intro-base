#version 300 es

precision highp float;

uniform vec2 u_Resolution;

uniform mat4 u_View;

uniform float u_Time;

vec3 uCameraPosition = vec3(0, 0, 1);

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

bool inCloudBox(vec3 pos) {
    vec3 minimum = vec3(-0.5, -0.5, -0.5);
    vec3 maximum = vec3(0.5, 0.5, 0.5);
    // step returns 0 if less than edge, 1 if greater than
    // we want pos to be greater than the bottom and less than the top,
    // which would give us a value of 1 here
    vec3 s = step(minimum, pos) - step(maximum, pos);
    return s.x * s.y * s.z > 0.f;
}

float density(vec3 pos) {
    if(!inCloudBox(pos)){
        return 0.f;
    }
    float scale = 0.25f;
    float amplitude = 1.f;

    float noiseValue = 0.f;

    noiseValue += amplitude * noise(pos, scale);
    scale *= 0.5f;
    amplitude *= 0.5f;
    for(int i = 0; i<1; i++){
        // subtract out details for sharper edges
        noiseValue -= amplitude * noise(pos, scale);
        scale *= 0.5f;
        amplitude *= 0.5f;
    }

    noiseValue = smoothstep(0.f, 1.f, 1.f - noiseValue);
    return noiseValue;
}

float rayMarch(vec3 start, vec3 dir, float stepSize, float maxDistance){
	float totalDensity = 0.f;
	vec3 currentPos = start;
	for(int i = 0; i<int(maxDistance/stepSize); i++){
	    currentPos += stepSize * dir;
		totalDensity += density(currentPos) * stepSize;
	}
	return totalDensity;
}

vec3 getCloudColor(vec3 pos, vec3 dir) {
    float totalDensity = rayMarch(pos, dir, 0.05f, 3.f);
    float transmittance = 1.f - exp(-totalDensity);
    return vec3(transmittance);
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

    // I am keeping a fixed camera position for now
    rayDir = (u_View * vec4(rayDir, 0.f)).xyz;

    vec3 color = getCloudColor(rayPos, rayDir);

    outColor = vec4(color, 1);
}