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

import { CONSTANTS } from "./constants";

/**
    A DrawCall represents the program and values of associated
    attributes, uniforms and textures for a single draw call.

    @class
    @prop {WebGLRenderingContext} gl The WebGL context.
    @prop {Program} currentProgram The program to use for this draw call.
    @prop {VertexArray} currentVertexArray Vertex array to use for this draw call.
    @prop {TransformFeedback} currentTransformFeedback Transform feedback to use for this draw call.
    @prop {Array} uniformBuffers Ordered list of active uniform buffers.
    @prop {Array} uniformBlockNames Ordered list of uniform block names.
    @prop {Object} uniformBlockBases Map of uniform blocks to uniform buffer bases.
    @prop {Number} uniformBlockCount Number of active uniform blocks for this draw call.
    @prop {Object} uniformIndices Map of uniform names to indices in the uniform arrays.
    @prop {Array} uniformNames Ordered list of uniform names.
    @prop {Array} uniformValue Ordered list of uniform values.
    @prop {number} uniformCount The number of active uniforms for this draw call.
    @prop {Array} textures Array of active textures.
    @prop {number} textureCount The number of active textures for this draw call.
    @prop {GLEnum} primitive The primitive type being drawn.
    @prop {Object} appState Tracked GL state.
    @prop {GLsizei} numElements The number of element to draw.
    @prop {GLsizei} numInstances The number of instances to draw.
*/
export class DrawCall {

    constructor(gl, appState, program, vertexArray, primitive = CONSTANTS.TRIANGLES) {
        this.gl = gl;
        this.currentProgram = program;
        this.currentVertexArray = vertexArray;
        this.currentTransformFeedback = null;
        this.appState = appState;

        this.uniformIndices = {};
        this.uniformNames = new Array(CONSTANTS.WEBGL_INFO.MAX_UNIFORMS);
        this.uniformValues = new Array(CONSTANTS.WEBGL_INFO.MAX_UNIFORMS);
        this.uniformCount = 0;
        this.uniformBuffers = new Array(CONSTANTS.WEBGL_INFO.MAX_UNIFORM_BUFFERS);
        this.uniformBlockNames = new Array(CONSTANTS.WEBGL_INFO.MAX_UNIFORM_BUFFERS);
        this.uniformBlockBases = {};
        this.uniformBlockCount = 0;
        this.samplerIndices = {};
        this.textures = new Array(CONSTANTS.WEBGL_INFO.MAX_TEXTURE_UNITS);
        this.textureCount = 0;
        this.primitive = primitive;

        this.numElements = this.currentVertexArray.numElements;
        this.numInstances = this.currentVertexArray.numInstances;
    }

    /**
        Set the current TransformFeedback object for draw

        @method
        @param {TransformFeedback} transformFeedback Transform Feedback to set.
        @return {DrawCall} The DrawCall object.
    */
    transformFeedback(transformFeedback) {
        this.currentTransformFeedback = transformFeedback;

        return this;
    }

    /**
        Set the value for a uniform. Array uniforms are supported by
        using appending "[0]" to the array name and passing a flat array
        with all required values.

        @method
        @param {string} name Uniform name.
        @param {any} value Uniform value.
        @return {DrawCall} The DrawCall object.
    */
    uniform(name, value) {
        let index = this.uniformIndices[name];
        if (index === undefined) {
            index = this.uniformCount++;
            this.uniformIndices[name] = index;
            this.uniformNames[index] = name;
        }
        this.uniformValues[index] = value;

        return this;
    }

    /**
        Set texture to bind to a sampler uniform.

        @method
        @param {string} name Sampler uniform name.
        @param {Texture|Cubemap} texture Texture or Cubemap to bind.
        @return {DrawCall} The DrawCall object.
    */
    texture(name, texture) {
        let unit = this.currentProgram.samplers[name];
        this.textures[unit] = texture;

        return this;
    }

    /**
        Set uniform buffer to bind to a uniform block.

        @method
        @param {string} name Uniform block name.
        @param {UniformBuffer} buffer Uniform buffer to bind.
        @return {DrawCall} The DrawCall object.
    */
    uniformBlock(name, buffer) {
        let base = this.currentProgram.uniformBlocks[name];
        this.uniformBuffers[base] = buffer;

        return this;
    }

    /**
        Set numElements property to allow number of elements to be drawn

        @method
        @param {GLsizei} [count=0] Number of element to draw, 0 set to all.
        @return {DrawCall} The DrawCall object.
    */
    elementCount(count = 0) {
        if (count > 0) {
            this.numElements = Math.min(count, this.currentVertexArray.numElements);
        } else {
            this.numElements = this.currentVertexArray.numElements;
        }

        return this;
    }

    /**
        Set numInstances property to allow number of instances be drawn

        @method
        @param {GLsizei} [count=0] Number of instance to draw, 0 set to all.
        @return {DrawCall} The DrawCall object.
    */
    instanceCount(count = 0) {
        if (count > 0) {
            this.numInstances = Math.min(count, this.currentVertexArray.numInstances);
        } else {
            this.numInstances = this.currentVertexArray.numInstances;
        }

        return this;
    }

    /**
        Draw based on current state.

        @method
        @return {DrawCall} The DrawCall object.
    */
    draw() {
        let uniformNames = this.uniformNames;
        let uniformValues = this.uniformValues;
        let uniformBuffers = this.uniformBuffers;
        let uniformBlockCount = this.currentProgram.uniformBlockCount;
        let textures = this.textures;
        let textureCount = this.currentProgram.samplerCount;

        this.currentProgram.bind();
        this.currentVertexArray.bind();

        for (let uIndex = 0; uIndex < this.uniformCount; ++uIndex) {
            this.currentProgram.uniform(uniformNames[uIndex], uniformValues[uIndex]);
        }

        for (let base = 0; base < uniformBlockCount; ++base) {
            uniformBuffers[base].bind(base);
        }

        for (let tIndex = 0; tIndex < textureCount; ++tIndex) {
            textures[tIndex].bind(tIndex);
        }

        if (this.currentTransformFeedback) {
            this.currentTransformFeedback.bind();
            this.gl.beginTransformFeedback(this.primitive);
        }

        if (this.currentVertexArray.instanced) {
            if (this.currentVertexArray.indexed) {
                this.gl.drawElementsInstanced(this.primitive, this.numElements, this.currentVertexArray.indexType, 0, this.numInstances);
            } else {
                this.gl.drawArraysInstanced(this.primitive, 0, this.numElements, this.numInstances);
            }
        } else if (this.currentVertexArray.indexed) {
            this.gl.drawElements(this.primitive, this.numElements, this.currentVertexArray.indexType, 0);
        } else {
            this.gl.drawArrays(this.primitive, 0, this.numElements);
        }

        if (this.currentTransformFeedback) {
            this.gl.endTransformFeedback();
            // TODO(Tarek): Need to rebind buffers due to bug in older version of ANGLE that FF is using.
            // Remove this when that's fixed.
            for (let i = 0, len = this.currentTransformFeedback.angleBugBuffers.length; i < len; ++i) {
                this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, i, null);
            }
        }

        return this;
    }

}
