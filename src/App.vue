<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { ShepardTone } from "./shepard";
import { useCounterStore } from "./stores/counter";
import { useSongStore } from "./stores/song";

function playTones() {
  const dummyStore = useCounterStore();
  const audioContext = dummyStore.audioContext;
  audioContext.resume();

  const shepardTone = new ShepardTone(audioContext, 440, 3600);
  shepardTone.type = "triangle";

  const now = audioContext.currentTime;

  const vibrato = audioContext.createOscillator();
  const vibratoDepth = audioContext.createGain();
  vibrato.connect(vibratoDepth).connect(shepardTone.detune);
  vibratoDepth.gain.setValueAtTime(10, now);
  vibrato.frequency.setValueAtTime(2, now);
  vibrato.start();

  const gain = audioContext.createGain();
  shepardTone.connect(gain).connect(audioContext.destination);
  shepardTone.start(now);
  for (let i = 0; i < 36; ++i) {
    const time = now + 0.3 * i;
    shepardTone.setFrequency(440 * 2 ** (i / 12), time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
    gain.gain.setValueAtTime(0.4, time + 0.25);
    gain.gain.linearRampToValueAtTime(0, time + 0.26);
  }
  shepardTone.stop(now + 0.3 * 36);
}

const counter = useCounterStore();
const song = useSongStore();

function playSong() {
  if (song.startTime === null) {
    return;
  }
  const audioContext = song.audioContext;
  const now = audioContext.currentTime;

  const shepardTone = new ShepardTone(audioContext, 440.0, 3000.0);
  shepardTone.type = "triangle";

  const gain = audioContext.createGain();

  gain.gain.setValueAtTime(0.0, now);

  shepardTone.connect(gain).connect(audioContext.destination);

  shepardTone.start();

  let time = now;
  for (const [recordedOn, frequency, recordedOff] of song.notes) {
    time = recordedOn - song.startTime + now;
    shepardTone.setFrequency(frequency, time);
    gain.gain.setValueAtTime(0.25, time);
    time = (recordedOff || recordedOn + 0.1) - song.startTime + now;
    gain.gain.setValueAtTime(0.0, time);
  }
  shepardTone.stop(time + 0.5);

  song.startTime = null;
}
</script>

<template>
  <nav id="app-navigation">
    <ul id="app-tabs">
      <li>
        <RouterLink to="/about"><strong>Sw</strong> Studio</RouterLink>
      </li>
      <li><RouterLink to="/">Home</RouterLink></li>
      <li><RouterLink to="/grid">Grid</RouterLink></li>
    </ul>
  </nav>
  <RouterView />
</template>

<style>
@import "@/assets/base.css";

#app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100vh;
}

nav#app-navigation {
  flex: 0 0 auto;
  display: flex;
}

#app > main {
  flex: 1 1 auto;
  overflow-y: hidden;
}

/* Navigation tabs */
nav#app-navigation {
  background-color: var(--color-accent);
  color: white;
  max-width: 100%;
  overflow-x: auto;
}
ul#app-tabs {
  padding: 0px;
  margin: 0px;
  white-space: nowrap;
}
nav#app-navigation ul li {
  list-style-type: none;
  display: inline-block;
}
nav#app-navigation ul li a {
  display: inline-block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  cursor: default;
}

nav#app-navigation ul#app-tabs li a:hover {
  background-color: var(--color-accent-deeper);
}

nav#app-navigation ul#app-tabs li a.router-link-exact-active,
nav#app-navigation ul#app-tabs li a.router-link-exact-active:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

/* Status indicator tray */
#app-tray {
  width: 100%;
  text-align: right;
  cursor: default;
}

#app-tray ul {
  display: inline-block;
  padding: 0.75rem 1rem;
  background-color: var(--color-accent-deeper);
}

#app-tray ul li {
  color: var(--color-accent);
}

#app-tray ul li .active {
  color: var(--color-accent-text);
}
</style>
