///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    /**
        
        Global NanoGL module. For convenience, all WebGL enums are stored
        as properties of NanoGL (e.g. NanoGL.FLOAT, NanoGL.ONE_MINUS_SRC_ALPHA).
        
        @namespace NanoGL
    */
    var NanoGL = window.NanoGL = {};

    (function() {
        // Absorb all GL enums for convenience
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        
        if (!gl) {
            return;
        }

        for (var enumName in gl) {
            if (enumName.match(/^[A-Z_]+$/) && typeof(gl[enumName]) === "number") {
                NanoGL[enumName] = gl[enumName];
            }
        }

    })();

    NanoGL.DUMMY_OBJECT = {};

    /**
        Create a NanoGL app. The app is the primary entry point to NanoGL. It stores
        the canvas, the WebGL context and all WebGL state.

        @function NanoGL.createApp
        @param {DOMElement} canvas The canvas on which to create the WebGL context.
        @param {Object} [contextAttributes] Context attributes to pass when calling getContext().
    */
    NanoGL.createApp = function(canvas, contextAttributes) {
        return new NanoGL.App(canvas, contextAttributes);
    };

})();

;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    /**
        Primary entry point to NanoGL. An app will store all parts of the WebGL
        state and manage draw calls.

        @class
        @param {DOMElement} canvas The canvas on which to create the WebGL context.
        @param {Object} [contextAttributes] Context attributes to pass when calling getContext().
        @prop {DOMElement} canvas The canvas on which this app drawing.
        @prop {WebGLRenderingContext} gl The WebGL context.
        @prop {number} maxDrawBuffers The maximum number of available draw buffers.
        @prop {boolean} drawBuffersEnabled Whether the WEBGL_draw_buffers extension is enabled.
        @prop {boolean} depthTexturesEnabled Whether the WEBGL_depth_texture extension is enabled.
        @prop {boolean} floatTexturesEnabled Whether the OES_texture_float extension is enabled.
        @prop {boolean} linearFloatTexturesEnabled Whether the OES_texture_float_linear extension is enabled.
    */
    NanoGL.App = function App(canvas, contextAttributes) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", contextAttributes) || canvas.getContext("experimental-webgl", contextAttributes);
        this.width = this.gl.drawingBufferWidth;
        this.height = this.gl.drawingBufferHeight;
        this.currentDrawCalls = null;

        this.currentState = {
            program: null
        };

        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        
        this.gl.viewport(0, 0, this.width, this.height);    
        
        this.drawBuffersExtension = null;
        
        this.maxDrawBuffers = 1;
        this.drawBuffersEnabled = false;
        this.depthTexturesEnabled = false;
        this.floatTexturesEnabled = false;
        this.linearFloatTexturesEnabled = false;
    };

    /**
        Set the clear mask bits to use when calling clear().
        E.g. app.clearMask(NanoGL.COLOR_BUFFER_BIT).

        @method
        @param {GLEnum} mask
    */
    NanoGL.App.prototype.clearMask = function(mask) {
        this.clearBits = mask;

        return this;
    };

    /**
        Set the clear color.

        @method
        @param {number} r Red channel.
        @param {number} g Green channel.
        @param {number} b Blue channel.
        @param {number} a Alpha channel.
    */
    NanoGL.App.prototype.clearColor = function(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);

        return this;
    };

    /**
        Clear the canvas

        @method
    */
    NanoGL.App.prototype.clear = function() {
        this.gl.clear(this.clearBits);

        return this;
    };

    /**
        Set the list of draw calls to use when calling draw().

        @method
        @param {Array} drawCallList Array of DrawCall objects.
        @see DrawCall
    */
    NanoGL.App.prototype.drawCalls = function(drawCallList) {
        this.currentDrawCalls = drawCallList;

        return this;
    };

    /**
        Bind a framebuffer to the WebGL context.

        @method
        @param {Framebuffer} framebuffer The Framebuffer object to bind.
        @see Framebuffer
    */
    NanoGL.App.prototype.framebuffer = function(framebuffer) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer.framebuffer);

        return this;
    };

    /**
        Switch back to the default framebuffer (i.e. draw to the screen).

        @method
    */
    NanoGL.App.prototype.defaultFramebuffer = function() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return this;
    };

    /**
        Set the depth range.

        @method
        @param {number} near Minimum depth value. 
        @param {number} far Maximum depth value.
    */
    NanoGL.App.prototype.depthRange = function(near, far) {
        this.gl.depthRange(near, far);

        return this;
    };

    /**
        Enable depth testing.

        @method
    */
    NanoGL.App.prototype.depthTest = function() {
        this.gl.enable(this.gl.DEPTH_TEST);

        return this;
    };

    /**
        Disable depth testing.

        @method
    */
    NanoGL.App.prototype.noDepthTest = function() {
        this.gl.disable(this.gl.DEPTH_TEST);

        return this;
    };

    /**
        Enable writing to the z buffer.

        @method
    */
    NanoGL.App.prototype.depthMask = function() {
        this.gl.depthMask(true);

        return this;
    };

    /**
        Disable writing to the z buffer.

        @method
    */
    NanoGL.App.prototype.noDepthMask = function() {
        this.gl.depthMask(false);

        return this;
    };

    /**
        Enable blending.

        @method
    */
    NanoGL.App.prototype.blend = function() {
        this.gl.enable(this.gl.BLEND);

        return this;
    };

    /**
        Disable blending

        @method
    */
    NanoGL.App.prototype.noBlend = function() {
        this.gl.disable(this.gl.BLEND);

        return this;
    };

    /**
        Set the depth test function. E.g. app.depthFunc(NanoGL.LEQUAL).

        @method
        @param {GLEnum} func The depth testing function to use.
    */
    NanoGL.App.prototype.depthFunc = function(func) {
        this.gl.depthFunc(func);

        return this;
    };

    /**
        Set the blend function. E.g. app.blendFunc(NanoGL.ONE, NanoGL.ONE_MINUS_SRC_ALPHA).

        @method
        @param {GLEnum} src The source blending weight.
        @param {GLEnum} dest The destination blending weight.
    */
    NanoGL.App.prototype.blendFunc = function(src, dest) {
        this.gl.blendFunc(src, dest);

        return this;
    };

    /**
        Set the blend function, with separate weighting for color and alpha channels. 
        E.g. app.blendFuncSeparate(NanoGL.ONE, NanoGL.ONE_MINUS_SRC_ALPHA, NanoGL.ONE, NanoGL.ONE).

        @method
        @param {GLEnum} csrc The source blending weight for the RGB channels.
        @param {GLEnum} cdest The destination blending weight for the RGB channels.
        @param {GLEnum} asrc The source blending weight for the alpha channel.
        @param {GLEnum} adest The destination blending weight for the alpha channel.
    */
    NanoGL.App.prototype.blendFuncSeparate = function(csrc, cdest, asrc, adest) {
        this.gl.blendFuncSeparate(csrc, cdest, asrc, adest);

        return this;
    };

    /**
        Enable backface culling.

        @method
    */
    NanoGL.App.prototype.cullBackfaces = function() {
        this.gl.enable(this.gl.CULL_FACE);

        return this;
    };

    /**
        Disable backface culling.

        @method
    */
    NanoGL.App.prototype.drawBackfaces = function() {
        this.gl.disable(this.gl.CULL_FACE);

        return this;
    };

    /**
        Enable the WEBGL_draw_buffers extension. Allows multiple render targets
        to be drawn in a single draw call, which will be stored in the colorTextures
        array of a Framebuffer object.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.drawBuffers = function() {
        this.drawBuffersExtension = this.gl.getExtension("WEBGL_draw_buffers");
        
        if (this.drawBuffersExtension) {
            this.maxDrawBuffers = this.gl.getParameter(this.drawBuffersExtension.MAX_DRAW_BUFFERS_WEBGL);
            this.drawBuffersEnabled = true;
        } else {
            console.warn("Extension WEBGL_draw_buffers unavailable. Cannot enable draw buffers.");
        }
        
        return this;
    };

    /**
        Enable the WEBGL_depth_texture extension. Allows for writing depth values
        to a texture, which will be stored in the depthTexture property of a Framebuffer
        object.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.depthTextures = function() {
        this.depthTexturesEnabled = !!this.gl.getExtension("WEBGL_depth_texture");
        
        if (!this.depthTexturesEnabled) {
            console.warn("Extension WEBGL_depth_texture unavailable. Cannot enable depth textures.");
        }
        
        return this;
    };

    /**
        Enable the OES_texture_float extension. Allows for creating float textures as
        render targets on FrameBuffer objects. E.g. app.createFramebuffer(1, NanoGL.FLOAT).

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.floatTextures = function() {
        this.floatTexturesEnabled = !!this.gl.getExtension("OES_texture_float");
        
        if (!this.floatTexturesEnabled) {
            console.warn("Extension OES_texture_float unavailable. Cannot enable float textures.");
        }
        
        return this;
    };

    /**
        Enable the OES_texture_float_linear extension. Allows for linear blending on float textures.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.linearFloatTextures = function() {
        this.linearFloatTexturesEnabled = !!this.gl.getExtension("OES_texture_float_linear");
        
        if (!this.linearFloatTexturesEnabled) {
            console.warn("Extension OES_texture_float_linear unavailable. Cannot enable float texture linear filtering.");
        }
        
        return this;
    };

    /**
        Read a pixel's color value from the canvas. Note that the RGBA values will be encoded 
        as 0-255.

        @method
        @param {number} x The x coordinate of the pixel.
        @param {number} y The y coordinate of the pixel.
        @param {Uint8Array} outColor 4-element Uint8Array to store the pixel's color.
    */
    NanoGL.App.prototype.readPixel = function(x, y, outColor) {
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, outColor);

        return this;
    };

    /**
        Resize the drawing surface.

        @method
        @param {number} width The new canvas width.
        @param {number} height The new canvas height.
    */
    NanoGL.App.prototype.resize = function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        this.width = this.gl.drawingBufferWidth;
        this.height = this.gl.drawingBufferHeight;
        this.gl.viewport(0, 0, this.width, this.height);    

        return this;
    };

    NanoGL.App.prototype.createProgram = function(vsSource, fsSource) {
        return new NanoGL.Program(this.gl, vsSource, fsSource);
    };

    NanoGL.App.prototype.createArrayBuffer = function(type, itemSize, data) {
        return new NanoGL.ArrayBuffer(this.gl, type, itemSize, data);
    };

    NanoGL.App.prototype.createIndexBuffer = function(type, itemSize, data) {
        return new NanoGL.ArrayBuffer(this.gl, type, itemSize, data, true);
    };

    NanoGL.App.prototype.createTexture = function(image, options) {
        return new NanoGL.Texture(this.gl, image, options);
    };

    NanoGL.App.prototype.createCubemap = function(options) {
        return new NanoGL.Cubemap(this.gl, options);
    };

    NanoGL.App.prototype.createFramebuffer = function(numColorTextures, colorTargetType) {
        return new NanoGL.Framebuffer(this.gl, this.drawBuffersExtension, numColorTextures, colorTargetType, this.depthTexturesEnabled);
    };

    NanoGL.App.prototype.createDrawCall = function(program, primitive) {
        return new NanoGL.DrawCall(this.gl, program, primitive);
    };

    NanoGL.App.prototype.draw = function() {
        for (var i = 0, len = this.currentDrawCalls.length; i < len; i++) {
            this.currentDrawCalls[i].draw(this.currentState);
        }

        return this;
    };

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";


    NanoGL.Program = function Program(gl, vsSource, fsSource) {
        var lines, i;

        var vshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vshader, vsSource);
        gl.compileShader(vshader);
        if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vshader));
            lines = vsSource.split("\n");
            for (i = 0; i < lines.length; ++i) {
                console.error((i + 1) + ":", lines[i]);
            }
        }

        var fshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fshader, fsSource);
        gl.compileShader(fshader);
        if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fshader));
            lines = fsSource.split("\n");
            for (i = 0; i < lines.length; ++i) {
                console.error((i + 1) + ":", lines[i]);
            }
        }

        var program = gl.createProgram();
        gl.attachShader(program, vshader);
        gl.attachShader(program, fshader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(program));
        }

        this.gl = gl;
        this.program = program;
        this.attributes = {};
        this.uniforms = {};

        var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (i = 0; i < numAttributes; ++i) {
            var attributeInfo = gl.getActiveAttrib(program, i);
            var attributeHandle = this.gl.getAttribLocation(this.program, attributeInfo.name);
            this.attributes[attributeInfo.name] = attributeHandle;
        }

        for (i = 0; i < numUniforms; ++i) {
            var uniformInfo = gl.getActiveUniform(program, i);
            var uniformHandle = gl.getUniformLocation(this.program, uniformInfo.name);
            var UniformClass = null;
            switch (uniformInfo.type) {
                case gl.INT: 
                case gl.SAMPLER_2D: 
                case gl.SAMPLER_CUBE: 
                    UniformClass = NanoGL.IntUniform;
                    break;
                case gl.FLOAT: 
                    UniformClass = NanoGL.FloatUniform;
                    break;
                case gl.FLOAT_VEC2: 
                    UniformClass = NanoGL.Vec2Uniform;
                    break;
                case gl.FLOAT_VEC3: 
                    UniformClass = NanoGL.Vec3Uniform;
                    break;
                case gl.FLOAT_VEC4: 
                    UniformClass = NanoGL.Vec4Uniform;
                    break;
                case gl.FLOAT_MAT4: 
                    UniformClass = NanoGL.Mat4Uniform;
                    break;
            }

            this.uniforms[uniformInfo.name] = new UniformClass(gl, uniformHandle);
        }
    };

    NanoGL.Program.prototype.bindAttribute = function(name, buffer) {
        buffer.bind(this.attributes[name]);
    };

    NanoGL.Program.prototype.setUniform = function(name, value) {
        this.uniforms[name].set(value);
    };

})();

;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    NanoGL.ArrayBuffer = function ArrayBuffer(gl, type, itemSize, data, indexArray) {
        this.gl = gl;
        this.buffer = gl.createBuffer();
        this.type = type;
        this.itemSize = itemSize;
        this.numItems = data.length / itemSize;
        this.indexArray = !!indexArray;
        this.binding = this.indexArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

        gl.bindBuffer(this.binding, this.buffer);
        gl.bufferData(this.binding, data, gl.STATIC_DRAW);
        gl.bindBuffer(this.binding, null);
    };

    NanoGL.ArrayBuffer.prototype.bind = function(attribute) {
        this.gl.bindBuffer(this.binding, this.buffer);

        if (!this.indexArray) {
            this.gl.vertexAttribPointer(attribute, this.itemSize, this.type, false, 0, 0);
            this.gl.enableVertexAttribArray(attribute); 
        }
    };

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";


    NanoGL.FloatUniform = function FloatUniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = 0;
    };

    NanoGL.FloatUniform.prototype.set = function(value) {
        if (this.value !== value) {
            this.gl.uniform1f(this.handle, value);
            this.value = value;
        }
    };

    NanoGL.IntUniform = function IntUniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = 0;
    };

    NanoGL.IntUniform.prototype.set = function(value) {
        if (this.value !== value) {
            this.gl.uniform1i(this.handle, value);
            this.value = value;
        }
    };

    NanoGL.Vec2Uniform = function Vec2Uniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = new Float32Array(2);
    };

    NanoGL.Vec2Uniform.prototype.set = function(value) {
        if (this.value[0] !== value[0] ||
            this.value[1] !== value[1]) {
            this.gl.uniform2fv(this.handle, value);
            this.value.set(value);
        }
    };

    NanoGL.Vec3Uniform = function Vec3Uniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = new Float32Array(3);
    };

    NanoGL.Vec3Uniform.prototype.set = function(value) {
        if (this.value[0] !== value[0] ||
            this.value[1] !== value[1] ||
            this.value[2] !== value[2]) {
            this.gl.uniform3fv(this.handle, value);
            this.value.set(value);
        }
    };

    NanoGL.Vec4Uniform = function Vec4Uniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = new Float32Array(4);
    };

    NanoGL.Vec4Uniform.prototype.set = function(value) {
        if (this.value[0] !== value[0] ||
            this.value[1] !== value[1] ||
            this.value[2] !== value[2] ||
            this.value[3] !== value[3]) {
            this.gl.uniform4fv(this.handle, value);
            this.value.set(value);
        }
    };

    NanoGL.Mat4Uniform = function Mat4Uniform(gl, handle) {
        this.gl = gl;
        this.handle = handle;
        this.value = new Float32Array(16);
    };

    NanoGL.Mat4Uniform.prototype.set = function(value) {
        if (this.value[0] !== value[0] ||
            this.value[1] !== value[1] ||
            this.value[2] !== value[2] ||
            this.value[3] !== value[3] ||
            this.value[4] !== value[4] ||
            this.value[5] !== value[5] ||
            this.value[6] !== value[6] ||
            this.value[7] !== value[7] ||
            this.value[8] !== value[8] ||
            this.value[9] !== value[9] ||
            this.value[10] !== value[10] ||
            this.value[11] !== value[11] ||
            this.value[12] !== value[12] ||
            this.value[13] !== value[13] ||
            this.value[14] !== value[14] ||
            this.value[15] !== value[15]) {
            this.gl.uniformMatrix4fv(this.handle, false, value);
            this.value.set(value);
        }
    };

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    NanoGL.Texture = function Texture(gl, image, options) {
        this.gl = gl;
        this.texture = gl.createTexture();

        options = options || NanoGL.DUMMY_OBJECT;

        var array = options.array || false;
        var width = options.width || 0;
        var height = options.height || 0;
        var flipY = options.flipY !== undefined ? options.flipY : true;
        var minFilter = options.minFilter || gl.LINEAR_MIPMAP_NEAREST;
        var magFilter = options.magFilter || gl.LINEAR;
        var wrapS = options.wrapS || gl.REPEAT;
        var wrapT = options.wrapT || gl.REPEAT;
        var generateMipmaps = options.generateMipmaps !== false && 
                            (minFilter === gl.LINEAR_MIPMAP_NEAREST || minFilter === gl.LINEAR_MIPMAP_LINEAR);

        this.internalFormat = options.internalFormat || gl.RGBA;
        this.type = options.type || gl.UNSIGNED_BYTE;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        if (array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, width, height, 0, this.internalFormat, this.type, image);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.internalFormat, this.type, image);
        }

        if (generateMipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

    };

    NanoGL.Texture.prototype.image = function(image, width, height) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        if (width && height) {
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.internalFormat, width, height, 0, this.internalFormat, this.type, image);
        } else {
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.internalFormat, this.internalFormat, this.type, image);
        }
    };  

    NanoGL.Texture.prototype.bind = function(unit) {
        this.gl.activeTexture(unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    };   

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

        NanoGL.Cubemap = function Texture(gl, options) {
        this.gl = gl;
        this.texture = gl.createTexture();

        options = options || NanoGL.DUMMY_OBJECT;
        var negX = options.negX;
        var posX = options.posX;
        var negY = options.negY;
        var posY = options.posY;
        var negZ = options.negZ;
        var posZ = options.posZ;
        
        var array = options.array || false;
        var width = options.width || 0;
        var height = options.height || 0;
        var flipY = options.flipY !== undefined ? options.flipY : false;
        var minFilter = options.minFilter || gl.LINEAR_MIPMAP_NEAREST;
        var magFilter = options.magFilter || gl.LINEAR;
        var wrapS = options.wrapS || gl.REPEAT;
        var wrapT = options.wrapT || gl.REPEAT;
        var generateMipmaps = options.generateMipmaps !== false && 
                            (minFilter === gl.LINEAR_MIPMAP_NEAREST || minFilter === gl.LINEAR_MIPMAP_LINEAR);

        var internalFormat = options.internalFormat || gl.RGBA;
        var type = options.type || gl.UNSIGNED_BYTE;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapT);

        if (array) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, internalFormat, width, height, 0, internalFormat, type, negX);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, internalFormat, width, height, 0, internalFormat, type, posX);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, internalFormat, width, height, 0, internalFormat, type, negY);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, internalFormat, width, height, 0, internalFormat, type, posY);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, internalFormat, width, height, 0, internalFormat, type, negZ);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, internalFormat, width, height, 0, internalFormat, type, posZ);
        } else {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, internalFormat, internalFormat, type, negX);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, internalFormat, internalFormat, type, posX);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, internalFormat, internalFormat, type, negY);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, internalFormat, internalFormat, type, posY);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, internalFormat, internalFormat, type, negZ);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, internalFormat, internalFormat, type, posZ);
        }

        if (generateMipmaps) {
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }

    };

    NanoGL.Cubemap.prototype.bind = function(unit) {
        this.gl.activeTexture(unit);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
    };    

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    NanoGL.Framebuffer = function Framebuffer(gl, drawBuffers, numColorTargets, colorTargetType, depthTexturesEnabled) {
        this.gl = gl;
        this.drawBuffers = drawBuffers;
        this.framebuffer = gl.createFramebuffer();
        this.width = gl.drawingBufferWidth;
        this.height = gl.drawingBufferHeight;
        this.numColorTargets = numColorTargets !== undefined ? numColorTargets : 1;

        if (!drawBuffers) {
            this.numColorTargets = 1;
        }

        this.colorTextures = new Array(this.numColorTargets);
        this.colorAttachments = new Array(this.numColorTargets);
        this.depthTexture = null;
        this.depthBuffer =  null;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        for (var i = 0; i < this.numColorTargets; ++i) {
            this.colorTextures[i] = new NanoGL.Texture(gl, null, {
                array: true,
                type: colorTargetType || gl.UNSIGNED_BYTE,
                width: this.width,
                height: this.height,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                generateMipmaps: false
            });

            if (this.drawBuffers) {
                this.colorAttachments[i] = this.drawBuffers["COLOR_ATTACHMENT" + i + "_WEBGL"];
            } else {
                this.colorAttachments[i] = gl.COLOR_ATTACHMENT0;
            }
            
            gl.framebufferTexture2D(gl.FRAMEBUFFER, this.colorAttachments[i], gl.TEXTURE_2D, this.colorTextures[i].texture, 0);
        }

        if (depthTexturesEnabled) {
            this.depthTexture = new NanoGL.Texture(gl, null, {
                array: true,
                internalFormat: this.gl.DEPTH_COMPONENT,
                type: this.gl.UNSIGNED_INT,
                width: this.width,
                height: this.height,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                generateMipmaps: false
            });

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.texture, 0);
        } else {
            this.depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.log("Frame buffer error: " + gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString());
        }

        if (this.drawBuffers) {
            this.drawBuffers.drawBuffersWEBGL(this.colorAttachments);
        } 

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }; 

    NanoGL.Framebuffer.prototype.resize = function() {

        this.width = this.gl.drawingBufferWidth;
        this.height = this.gl.drawingBufferHeight;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

        for (var i = 0; i < this.numColorTargets; ++i) {
            this.colorTextures[i].image(null, this.width, this.height);
            // this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.colorAttachments[i], this.gl.TEXTURE_2D, this.colorTextures[i].texture, 0);
        }

        if (this.depthTexture) {
            this.depthTexture.image(null, this.width, this.height);
            // this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture.texture, 0);
        } else {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
            this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.width, this.height);
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    };

})();
;///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    NanoGL.DrawCall = function DrawCall(gl, program, primitive) {
            this.gl = gl;
        this.program = program || null;
        this.uniforms = {};
        this.attributes = {};
        this.textures = {};
        this.numItems = 0;
        this.indexArray = null;
        this.primitive = primitive !== undefined ? primitive : NanoGL.TRIANGLES;
        this.currentTextureUnit = 0;
    };

    NanoGL.DrawCall.prototype.uniform = function(name, value) {
        this.uniforms[name] = value;

        return this;
    };

    NanoGL.DrawCall.prototype.attribute = function(name, buffer) {
        this.attributes[name] = buffer;
        if (this.numItems === 0) {
            this.numItems = buffer.numItems;
        }

        return this;
    };

    NanoGL.DrawCall.prototype.indices = function(buffer) {
        this.indexArray = buffer;
        this.numItems = buffer.numItems;
        
        return this;
    };

    NanoGL.DrawCall.prototype.texture = function(name, texture) {
        var unit = this.uniforms[name];
        if (unit === undefined) {
            unit = this.currentTextureUnit++;
            this.uniforms[name] = unit;
        }
        
        var textureUnit = this.gl["TEXTURE" + unit];   
        this.textures[textureUnit] = texture;
        
        return this;
    };

    NanoGL.DrawCall.prototype.draw = function(state) {
        var uniforms = this.uniforms;
        var attributes = this.attributes;
        var textures = this.textures;

        if (state.program !== this.program) {
            this.gl.useProgram(this.program.program);
            state.program = this.program;
        }

        for (var uName in uniforms) {
            this.program.setUniform(uName, uniforms[uName]);
        }

        for (var aName in attributes) {
            this.program.bindAttribute(aName, attributes[aName]);
        }

        for (var unit in textures) {
            textures[unit].bind(unit);
        }

        if (this.indexArray) {
            this.indexArray.bind();
            this.gl.drawElements(this.primitive, this.numItems * 3, this.indexArray.type, 0);
        } else {
            this.gl.drawArrays(this.primitive, 0, this.numItems);
        }
    };

})();


