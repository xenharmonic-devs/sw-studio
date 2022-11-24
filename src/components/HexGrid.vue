<script setup lang="ts">
import { ShepardTone } from "@/shepard";
import { onMounted, onUnmounted, ref } from "vue";
import { useSongStore } from "../stores/song";

const viewLeft = -10;
const viewTop = -10;
const viewRight = 10;
const viewBottom = 10;

const viewBox = `${viewLeft} ${viewTop} ${viewRight - viewLeft} ${
  viewBottom - viewTop
}`;

const phi = Math.PI * 0.05;
const cPhi = Math.cos(phi);
const sPhi = Math.sin(phi);
const xScale = Math.sqrt(3);
const edgeScale = 1 / Math.sin(Math.PI / 3);

/** Pre-rotated hex cell of unit radius (center-to-edge) */
function hexCellD() {
  let d = `M${edgeScale * Math.cos(phi)} ${edgeScale * Math.sin(phi)} `;
  for (let i = 1; i < 6; ++i) {
    const theta = (2 * Math.PI * i) / 6 + phi;
    d += `L${edgeScale * Math.cos(theta)} ${edgeScale * Math.sin(theta)} `;
  }
  return d + "Z";
}

/** View box x-coordinate for a hex cell */
function vbX(u: number, v: number) {
  return u * xScale * cPhi - (2 * v + u) * sPhi;
}

/** View box y-coordinate for a hex cell */
function vbY(u: number, v: number) {
  return (2 * v + u) * cPhi + u * xScale * sPhi;
}

function visibleCells() {
  const result = [];
  for (let u = -10; u <= 10; ++u) {
    for (let v = -10; v <= 10; ++v) {
      const x = vbX(u, v);
      const y = vbY(u, v);
      if (
        x > viewLeft - 1 &&
        x < viewRight + 1 &&
        y > viewTop - 1 &&
        y < viewBottom + 1
      ) {
        result.push([u, v, x, y]);
      }
    }
  }
  return result;
}

function tricolor(u: number, v: number) {
  let n = (v + 2 * u) % 3;
  n = (n + 3) % 3;
  if (n === 0) {
    return "lightgreen";
  }
  if (n === 1) {
    return "lightblue";
  }
  if (n === 2) {
    return "salmon";
  }
}

function label(u: number, v: number) {
  if (u >= 0) {
    if (v >= 0) {
      return `${3 ** u * 5 ** v}/1`;
    }
    return `${3 ** u}/${5 ** -v}`;
  }
  if (v >= 0) {
    return `${5 ** v}/${3 ** -u}`;
  }
  return `1/${3 ** -u * 5 ** -v}`;
}

const mouseTone = ref<ShepardTone | null>(null);

function onTouchStart(event: Event, u: number, v: number) {
  event.preventDefault();
  console.log(u, v);
}

function onMouseDown(event: Event, u: number, v: number) {
  event.preventDefault();
  const song = useSongStore();
  const audioContext = song.audioContext;
  audioContext.resume();

  let frequency = 3 ** u * 5 ** v;

  const now = audioContext.currentTime;
  if (song.startTime === null) {
    song.startTime = now;
  }
  song.notes.push([now, frequency, undefined]);

  if (mouseTone.value !== null) {
    mouseTone.value.stop();
  }
  const shepardTone = new ShepardTone(audioContext, 440, 3000.0);
  const gain = audioContext.createGain();
  shepardTone.addEventListener("ended", () => {
    shepardTone.disconnect();
    gain.disconnect();
  });
  shepardTone.type = "triangle";
  shepardTone.setFrequency(frequency, now);
  gain.gain.setValueAtTime(0.25, now);
  shepardTone.connect(gain).connect(audioContext.destination);
  shepardTone.start();
  mouseTone.value = shepardTone;
}

function onMouseUp() {
  if (mouseTone.value !== null) {
    const song = useSongStore();
    const now = song.audioContext.currentTime;
    song.notes[song.notes.length - 1][2] = now;
    mouseTone.value.stop();
  }
  mouseTone.value = null;
}

onMounted(() => {
  window.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <svg width="100%" height="100%" :viewBox="viewBox">
    <defs>
      <path id="hexCell" :d="hexCellD()" />
    </defs>
    <template v-for="[u, v, x, y] of visibleCells()" :key="u + ',' + v">
      <use
        href="#hexCell"
        :x="x"
        :y="y"
        v-bind:fill="tricolor(u, v)"
        @touchstart="onTouchStart($event, u, v)"
        @mousedown="onMouseDown($event, u, v)"
      />
      <text
        :x="x"
        :y="y"
        :font-size="3 / label(u, v).length"
        text-anchor="middle"
        dominant-baseline="middle"
        pointer-events="none"
        style="user-select: none"
      >
        {{ label(u, v) }}
      </text>
    </template>
  </svg>
</template>
