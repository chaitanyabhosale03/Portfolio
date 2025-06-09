  let gl, program, frameCount = 0, lastTime = 0;
        let modelMatrix = new Float32Array(16);
        let viewMatrix = new Float32Array(16);
        let projectionMatrix = new Float32Array(16);
        let normalMatrix = new Float32Array(9);
        let animationTime = 0;
        let isAnimating = true;
        
        // Vertex shader source
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat3 uNormalMatrix;
            
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
                vPosition = worldPosition.xyz;
                vNormal = normalize(uNormalMatrix * aNormal);
                
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
            }
        `;
        
        // Fragment shader source
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform vec3 uLightPosition;
            uniform vec3 uLightColor;
            uniform float uLightIntensity;
            uniform vec3 uCameraPosition;
            uniform vec3 uObjectColor;
            
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightPosition - vPosition);
                vec3 viewDir = normalize(uCameraPosition - vPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                
                // Ambient
                float ambientStrength = 0.2;
                vec3 ambient = ambientStrength * uLightColor;
                
                // Diffuse
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = diff * uLightColor * uLightIntensity;
                
                // Specular
                float specularStrength = 0.5;
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                vec3 specular = specularStrength * spec * uLightColor;
                
                vec3 result = (ambient + diffuse + specular) * uObjectColor;
                gl_FragColor = vec4(result, 1.0);
            }
        `;
        
        // Geometry data
        const cubeVertices = new Float32Array([
            // Front face
            -1, -1,  1,  0,  0,  1,
             1, -1,  1,  0,  0,  1,
             1,  1,  1,  0,  0,  1,
            -1,  1,  1,  0,  0,  1,
            // Back face
            -1, -1, -1,  0,  0, -1,
            -1,  1, -1,  0,  0, -1,
             1,  1, -1,  0,  0, -1,
             1, -1, -1,  0,  0, -1,
            // Top face
            -1,  1, -1,  0,  1,  0,
            -1,  1,  1,  0,  1,  0,
             1,  1,  1,  0,  1,  0,
             1,  1, -1,  0,  1,  0,
            // Bottom face
            -1, -1, -1,  0, -1,  0,
             1, -1, -1,  0, -1,  0,
             1, -1,  1,  0, -1,  0,
            -1, -1,  1,  0, -1,  0,
            // Right face
             1, -1, -1,  1,  0,  0,
             1,  1, -1,  1,  0,  0,
             1,  1,  1,  1,  0,  0,
             1, -1,  1,  1,  0,  0,
            // Left face
            -1, -1, -1, -1,  0,  0,
            -1, -1,  1, -1,  0,  0,
            -1,  1,  1, -1,  0,  0,
            -1,  1, -1, -1,  0,  0,
        ]);
        
        const cubeIndices = new Uint16Array([
            0,  1,  2,    0,  2,  3,    // front
            4,  5,  6,    4,  6,  7,    // back
            8,  9,  10,   8,  10, 11,   // top
            12, 13, 14,   12, 14, 15,   // bottom
            16, 17, 18,   16, 18, 19,   // right
            20, 21, 22,   20, 22, 23,   // left
        ]);
        
        function initGL() {
            const canvas = document.getElementById('glCanvas');
            gl = canvas.getContext('webgl');
            
            if (!gl) {
                alert('WebGL not supported');
                return;
            }
            
            gl.clearColor(0.1, 0.1, 0.2, 1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            
            // Create shaders
            const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
            
            // Create program
            program = createProgram(vertexShader, fragmentShader);
            gl.useProgram(program);
            
            // Create buffers
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
            
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);
            
            // Setup attributes
            const positionAttrib = gl.getAttribLocation(program, 'aPosition');
            const normalAttrib = gl.getAttribLocation(program, 'aNormal');
            
            gl.enableVertexAttribArray(positionAttrib);
            gl.enableVertexAttribArray(normalAttrib);
            
            gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 24, 12);
            
            setupControls();
            render();
        }
        
        function createShader(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            
            return shader;
        }
        
        function createProgram(vertexShader, fragmentShader) {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program linking error:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            
            return program;
        }
        
        function setupControls() {
            const controls = ['rotX', 'rotY', 'zoom', 'lightX', 'lightY', 'lightZ', 'lightIntensity', 'objectScale'];
            
            controls.forEach(id => {
                const slider = document.getElementById(id);
                const display = document.getElementById(id + 'Value');
                
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (id.includes('rot')) {
                        display.textContent = value + '°';
                    } else {
                        display.textContent = value.toFixed(1);
                    }
                });
            });
        }
        
        function render(currentTime = 0) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            // Update FPS
            frameCount++;
            if (frameCount % 60 === 0) {
                const fps = Math.round(1000 / (deltaTime || 16));
                document.getElementById('fpsCounter').textContent = `FPS: ${fps}`;
            }
            
            if (isAnimating) {
                animationTime += deltaTime * 0.001;
            }
            
            // Clear canvas
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            // Get control values
            const rotX = parseFloat(document.getElementById('rotX').value);
            const rotY = parseFloat(document.getElementById('rotY').value);
            const zoom = parseFloat(document.getElementById('zoom').value);
            const lightX = parseFloat(document.getElementById('lightX').value);
            const lightY = parseFloat(document.getElementById('lightY').value);
            const lightZ = parseFloat(document.getElementById('lightZ').value);
            const lightIntensity = parseFloat(document.getElementById('lightIntensity').value);
            const objectScale = parseFloat(document.getElementById('objectScale').value);
            const autoRotate = document.getElementById('autoRotate').checked;
            const wireframe = document.getElementById('wireframe').checked;
            
            // Create matrices
            mat4Identity(modelMatrix);
            mat4Scale(modelMatrix, objectScale, objectScale, objectScale);
            
            if (autoRotate) {
                mat4RotateY(modelMatrix, animationTime);
                mat4RotateX(modelMatrix, animationTime * 0.7);
            }
            
            // View matrix (camera)
            mat4Identity(viewMatrix);
            mat4Translate(viewMatrix, 0, 0, -zoom);
            mat4RotateX(viewMatrix, rotX * Math.PI / 180);
            mat4RotateY(viewMatrix, rotY * Math.PI / 180);
            
            // Projection matrix
            mat4Perspective(projectionMatrix, 45 * Math.PI / 180, 800/600, 0.1, 100);
            
            // Normal matrix
            mat3FromMat4(normalMatrix, modelMatrix);
            mat3Inverse(normalMatrix);
            mat3Transpose(normalMatrix);
            
            // Set uniforms
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelMatrix'), false, modelMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uViewMatrix'), false, viewMatrix);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
            gl.uniformMatrix3fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);
            
            gl.uniform3f(gl.getUniformLocation(program, 'uLightPosition'), lightX, lightY, lightZ);
            gl.uniform3f(gl.getUniformLocation(program, 'uLightColor'), 1.0, 1.0, 1.0);
            gl.uniform1f(gl.getUniformLocation(program, 'uLightIntensity'), lightIntensity);
            gl.uniform3f(gl.getUniformLocation(program, 'uCameraPosition'), 0, 0, zoom);
            gl.uniform3f(gl.getUniformLocation(program, 'uObjectColor'), 0.8, 0.3, 0.6);
            
            // Draw multiple objects
            drawObject(0, 0, 0, [0.8, 0.3, 0.6]);
            drawObject(-3, 0, 0, [0.3, 0.8, 0.6]);
            drawObject(3, 0, 0, [0.6, 0.8, 0.3]);
            drawObject(0, 3, 0, [0.8, 0.6, 0.3]);
            drawObject(0, -3, 0, [0.3, 0.6, 0.8]);
            
            requestAnimationFrame(render);
        }
        
        function drawObject(x, y, z, color) {
            // Save current model matrix
            const savedMatrix = new Float32Array(modelMatrix);
            
            // Apply object-specific transformation
            mat4Translate(modelMatrix, x, y, z);
            
            // Update uniforms
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelMatrix'), false, modelMatrix);
            gl.uniform3f(gl.getUniformLocation(program, 'uObjectColor'), color[0], color[1], color[2]);
            
            // Draw
            gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
            
            // Restore matrix
            modelMatrix.set(savedMatrix);
        }
        
        // Matrix functions
        function mat4Identity(out) {
            out.fill(0);
            out[0] = out[5] = out[10] = out[15] = 1;
        }
        
        function mat4Translate(mat, x, y, z) {
            mat[12] += x;
            mat[13] += y;
            mat[14] += z;
        }
        
        function mat4Scale(mat, x, y, z) {
            mat[0] *= x; mat[1] *= x; mat[2] *= x; mat[3] *= x;
            mat[4] *= y; mat[5] *= y; mat[6] *= y; mat[7] *= y;
            mat[8] *= z; mat[9] *= z; mat[10] *= z; mat[11] *= z;
        }
        
        function mat4RotateX(mat, angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            const temp = new Float32Array(16);
            temp.set(mat);
            
            mat[4] = temp[4] * c + temp[8] * s;
            mat[5] = temp[5] * c + temp[9] * s;
            mat[6] = temp[6] * c + temp[10] * s;
            mat[7] = temp[7] * c + temp[11] * s;
            mat[8] = temp[8] * c - temp[4] * s;
            mat[9] = temp[9] * c - temp[5] * s;
            mat[10] = temp[10] * c - temp[6] * s;
            mat[11] = temp[11] * c - temp[7] * s;
        }
        
        function mat4RotateY(mat, angle) {
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            const temp = new Float32Array(16);
            temp.set(mat);
            
            mat[0] = temp[0] * c - temp[8] * s;
            mat[1] = temp[1] * c - temp[9] * s;
            mat[2] = temp[2] * c - temp[10] * s;
            mat[3] = temp[3] * c - temp[11] * s;
            mat[8] = temp[8] * c + temp[0] * s;
            mat[9] = temp[9] * c + temp[1] * s;
            mat[10] = temp[10] * c + temp[2] * s;
            mat[11] = temp[11] * c + temp[3] * s;
        }
        
        function mat4Perspective(out, fovy, aspect, near, far) {
            const f = 1.0 / Math.tan(fovy / 2);
            const nf = 1 / (near - far);
            
            out.fill(0);
            out[0] = f / aspect;
            out[5] = f;
            out[10] = (far + near) * nf;
            out[11] = -1;
            out[14] = (2 * far * near) * nf;
        }
        
        function mat3FromMat4(out, mat4) {
            out[0] = mat4[0]; out[1] = mat4[1]; out[2] = mat4[2];
            out[3] = mat4[4]; out[4] = mat4[5]; out[5] = mat4[6];
            out[6] = mat4[8]; out[7] = mat4[9]; out[8] = mat4[10];
        }
        
        function mat3Inverse(mat) {
            const a00 = mat[0], a01 = mat[1], a02 = mat[2];
            const a10 = mat[3], a11 = mat[4], a12 = mat[5];
            const a20 = mat[6], a21 = mat[7], a22 = mat[8];
            
            const b01 = a22 * a11 - a12 * a21;
            const b11 = -a22 * a10 + a12 * a20;
            const b21 = a21 * a10 - a11 * a20;
            
            const det = a00 * b01 + a01 * b11 + a02 * b21;
            
            if (!det) return;
            
            const invDet = 1.0 / det;
            
            mat[0] = b01 * invDet;
            mat[1] = (-a22 * a01 + a02 * a21) * invDet;
            mat[2] = (a12 * a01 - a02 * a11) * invDet;
            mat[3] = b11 * invDet;
            mat[4] = (a22 * a00 - a02 * a20) * invDet;
            mat[5] = (-a12 * a00 + a02 * a10) * invDet;
            mat[6] = b21 * invDet;
            mat[7] = (-a21 * a00 + a01 * a20) * invDet;
            mat[8] = (a11 * a00 - a01 * a10) * invDet;
        }
        
        function mat3Transpose(mat) {
            const temp = mat[1];
            mat[1] = mat[3];
            mat[3] = temp;
            
            const temp2 = mat[2];
            mat[2] = mat[6];
            mat[6] = temp2;
            
            const temp3 = mat[5];
            mat[5] = mat[7];
            mat[7] = temp3;
        }
        
        function resetCamera() {
            document.getElementById('rotX').value = 20;
            document.getElementById('rotY').value = 30;
            document.getElementById('zoom').value = 8;
            document.getElementById('rotXValue').textContent = '20°';
            document.getElementById('rotYValue').textContent = '30°';
            document.getElementById('zoomValue').textContent = '8.0';
        }
        
        function toggleAnimation() {
            isAnimating = !isAnimating;
        }
        
        // Initialize when page loads
        window.addEventListener('load', initGL);