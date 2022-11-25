<script setup lang="ts">
import { ShepardTone } from "@/shepard";
import { calculateViewport } from "@/utils";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useSongStore } from "../stores/song";

const outerContainer = ref<HTMLElement | null>(null);
const container = ref<SVGAElement | null>(null);

// View box should always be contained in the view port.
const viewBox = "-8 -8 16 16";
// Minimal view port to contain the view box.
const viewLeft = ref(-8);
const viewTop = ref(-8);
const viewRight = ref(8);
const viewBottom = ref(8);

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

const visibleCells = computed(() => {
  const result = [];
  for (let u = -30; u <= 30; ++u) {
    for (let v = -30; v <= 30; ++v) {
      const x = vbX(u, v);
      const y = vbY(u, v);
      if (
        x > viewLeft.value - 1 &&
        x < viewRight.value + 1 &&
        y > viewTop.value - 1 &&
        y < viewBottom.value + 1
      ) {
        result.push([u, v, x, y]);
      }
    }
  }
  return result;
});

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
  const threes = -u - v;
  const fives = u;
  if (threes >= 0) {
    if (fives >= 0) {
      return `${3 ** threes * 5 ** fives}/1`;
    }
    return `${3 ** threes}/${5 ** -fives}`;
  }
  if (fives >= 0) {
    return `${5 ** fives}/${3 ** -threes}`;
  }
  return `1/${3 ** -threes * 5 ** -fives}`;
}

const mouseTone = ref<ShepardTone | null>(null);

const touchTones = reactive<Map<string, ShepardTone>>(new Map());

function createTone(u: number, v: number) {
  const song = useSongStore();
  const audioContext = song.audioContext;
  audioContext.resume();

  let frequency = 3 ** (-u - v) * 5 ** u;

  const now = audioContext.currentTime;

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

  return shepardTone;
}

function onTouchStart(event: TouchEvent, u: number, v: number) {
  event.preventDefault();

  const shepardTone = createTone(u, v);

  const key = `${u},${v}`;

  const oldTone = touchTones.get(key);
  if (oldTone !== undefined) {
    oldTone.stop();
  }
  touchTones.set(key, shepardTone);
}

function onTouchEnd(event: TouchEvent, u: number, v: number) {
  event.preventDefault();
  const key = `${u},${v}`;
  const tone = touchTones.get(key);
  if (tone !== undefined) {
    tone.stop();
  }
  touchTones.delete(key);
}

function onMouseDown(event: Event, u: number, v: number) {
  event.preventDefault();

  // const song = useSongStore();
  // const audioContext = song.audioContext;
  // audioContext.resume();

  // let frequency = 3 ** u * 5 ** v;

  // const now = audioContext.currentTime;
  // if (song.startTime === null) {
  //   song.startTime = now;
  // }
  // song.notes.push([now, frequency, undefined]);

  if (mouseTone.value !== null) {
    mouseTone.value.stop();
  }
  const shepardTone = createTone(u, v);
  mouseTone.value = shepardTone;
}

function onMouseUp() {
  if (mouseTone.value !== null) {
    // const song = useSongStore();
    // const now = song.audioContext.currentTime;
    // song.notes[song.notes.length - 1][2] = now;
    mouseTone.value.stop();
  }
  mouseTone.value = null;
}

onMounted(() => {
  window.addEventListener("mouseup", onMouseUp);

  const r = new ResizeObserver(() => {
    if (container.value === null) {
      return;
    }
    const viewport = calculateViewport(container.value);
    if (viewport === undefined) {
      return;
    }
    viewLeft.value = viewport.x;
    viewRight.value = viewport.x + viewport.width;
    viewTop.value = viewport.y;
    viewBottom.value = viewport.y + viewport.height;
  });
  r.observe(outerContainer.value!);
});

onUnmounted(() => {
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <main ref="outerContainer">
    <svg
      width="100%"
      height="100%"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      ref="container"
    >
      <defs>
        <path id="hexCell" :d="hexCellD()" />
      </defs>
      <template v-for="[u, v, x, y] of visibleCells" :key="u + ',' + v">
        <use
          href="#hexCell"
          :x="x"
          :y="y"
          v-bind:fill="tricolor(u, v)"
          @touchstart="onTouchStart($event, u, v)"
          @touchend="onTouchEnd($event, u, v)"
          @touchcancel="onTouchEnd($event, u, v)"
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
  </main>
</template>
