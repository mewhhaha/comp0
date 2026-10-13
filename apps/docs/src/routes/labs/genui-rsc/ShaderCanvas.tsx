"use client";

import { useEffect, useRef } from "react";
import { useGenUIValue } from "@comp0/genui/rsc/client";
import { labState } from "./contract.js";

const vertexSource = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentSource = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float scale;
uniform float hue;
vec3 palette(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67) + hue / 360.0));
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y * scale;
  float v = sin(uv.x + time) + sin(uv.y * 1.3 - time) + sin(length(uv) * 1.7 + time * 0.7);
  gl_FragColor = vec4(palette(v * 0.25), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** A host component the model can place with `<Shader />`. */
export function ShaderCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const speed = useGenUIValue(labState, "speed");
  const scale = useGenUIValue(labState, "scale");
  const hue = useGenUIValue(labState, "hue");
  // The draw loop reads the latest values without restarting WebGL on every change.
  const uniforms = useRef({ speed, scale, hue });
  useEffect(() => {
    uniforms.current = { speed, scale, hue };
  }, [speed, scale, hue]);

  useEffect(() => {
    const element = canvas.current;
    const gl = element?.getContext("webgl");
    if (!element || !gl) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const location = (name: string) => gl.getUniformLocation(program, name);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let phase = 0;
    let last = performance.now();
    const draw = (now: number) => {
      phase += ((now - last) / 1000) * uniforms.current.speed;
      last = now;
      element.width = element.clientWidth * devicePixelRatio;
      element.height = element.clientHeight * devicePixelRatio;
      gl.viewport(0, 0, element.width, element.height);
      gl.uniform2f(location("resolution"), element.width, element.height);
      gl.uniform1f(location("time"), still ? 0 : phase);
      gl.uniform1f(location("scale"), uniforms.current.scale);
      gl.uniform1f(location("hue"), uniforms.current.hue);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <figure className="m-0">
      <canvas ref={canvas} aria-hidden="true" className="aspect-video w-full rounded-lg" />
      <figcaption className="sr-only">
        {`Plasma shader: speed ${speed}, scale ${scale}, hue ${hue} degrees`}
      </figcaption>
    </figure>
  );
}
