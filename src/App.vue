<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import HelloWorld from "./components/HelloWorld.vue";
import { ShepardTone } from "./shepard";
import { useCounterStore } from "./stores/counter";

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
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
      <button @click="playTones">Play shepard tones</button>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
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

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
