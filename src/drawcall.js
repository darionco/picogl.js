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
        A DrawCall represents the program and values of associated
        attributes, uniforms and textures for a single draw call.

        @class
        @prop {WebGLRenderingContext} gl The WebGL context.
        @prop {WebGLProgram} program Handle to the program to use for this drawcall.
        @prop {Object} attributes Map of attribute handles to ArrayBuffers.
        @prop {Object} uniform Map of uniform handles to values.
        @prop {Object} textures Map of texture units to Textures.
        @prop {number} textureCount The number of active textures for this draw call. 
        @prop {ArrayBuffer} indexArray Index array to use for indexed drawing.
        @prop {number} numItems The number of items that will be drawn.
        @prop {GLEnum} primitive The primitive type being drawn. 
    */
    NanoGL.DrawCall = function DrawCall(gl, program, primitive) {
        this.gl = gl;
        this.program = program || null;
        this.attributes = {};
        this.uniforms = {};
        this.textures = {};
        this.textureCount = 0;
        this.indexArray = null;
        this.numItems = 0;
        this.primitive = primitive !== undefined ? primitive : NanoGL.TRIANGLES;
    };

    /**
        Set the Arraybuffer to bind to an attribute.

        @method
        @param {string} name Attribute name.
        @param {Arraybuffer} buffer Arraybuffer to bind.
    */
    NanoGL.DrawCall.prototype.attribute = function(name, buffer) {
        this.attributes[name] = buffer;
        if (this.numItems === 0) {
            this.numItems = buffer.numItems;
        }

        return this;
    };

    /**
        Set the index ArrayBuffer.

        @method
        @param {Arraybuffer} buffer Index Arraybuffer.
    */
    NanoGL.DrawCall.prototype.indices = function(buffer) {
        this.indexArray = buffer;
        this.numItems = buffer.numItems;
        
        return this;
    };

    /**
        Set the value for a uniform.

        @method
        @param {string} name Uniform name.
        @param {any} value Uniform value.
    */
    NanoGL.DrawCall.prototype.uniform = function(name, value) {
        this.uniforms[name] = value;

        return this;
    };

    /**
        Set texture to bind to a sampler uniform.

        @method
        @param {string} name Sampler uniform name.
        @param {Texture} texture Texture to bind.
    */
    NanoGL.DrawCall.prototype.texture = function(name, texture) {
        var unit = this.uniforms[name];
        if (unit === undefined) {
            unit = this.textureCount++;
            this.uniforms[name] = unit;
        }
        
        var textureUnit = this.gl["TEXTURE" + unit];   
        this.textures[textureUnit] = texture;
        
        return this;
    };

    /**
        Draw something.

        @method
        @param {Object} state Current app state.
    */
    NanoGL.DrawCall.prototype.draw = function(state) {
        var uniforms = this.uniforms;
        var attributes = this.attributes;
        var textures = this.textures;

        if (state.program !== this.program) {
            this.gl.useProgram(this.program.program);
            state.program = this.program;
        }

        for (var uName in uniforms) {
            this.program.uniform(uName, uniforms[uName]);
        }

        for (var aName in attributes) {
            this.program.attribute(aName, attributes[aName]);
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

