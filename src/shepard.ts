import {
  centOffsetToFrequency,
  frequencyToCentOffset,
  mmod,
} from "xen-dev-utils";

/** Twice differentiable spectral window from 0 to 1 and back down. */
function spectralWindow(x: number) {
  x = Math.abs(2 * x);
  if (x > 2) {
    return 0;
  }
  if (x > 1) {
    return x * (0.5 * x - 2) + 2;
  }
  return 1 - 0.5 * x * x;
}

export class ShepardTone {
  baseFrequency: number;
  private skirtCents: number;
  private equaveCents: number;
  private detuneNode: ConstantSourceNode;
  private oscillators: OscillatorNode[];
  private gains: GainNode[];

  constructor(
    audioContext: AudioContext,
    baseFrequency: number,
    skirtCents: number,
    equaveCents = 1200
  ) {
    this.baseFrequency = baseFrequency;
    this.skirtCents = skirtCents;
    this.equaveCents = equaveCents;

    const detuneNode = audioContext.createConstantSource();
    this.detuneNode = detuneNode;
    detuneNode.addEventListener("ended", () => {
      detuneNode.disconnect();
    });

    const numOscillators = Math.max(2, 2 * Math.ceil(skirtCents / equaveCents));
    this.oscillators = [];
    this.gains = [];
    for (let i = 0; i < numOscillators; ++i) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      detuneNode.connect(oscillator.detune);
      oscillator.connect(gain);
      this.oscillators.push(oscillator);
      this.gains.push(gain);

      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
      });
    }
  }

  get type() {
    return this.oscillators[0].type;
  }
  set type(value: OscillatorType) {
    for (const oscillator of this.oscillators) {
      oscillator.type = value;
    }
  }

  get detune() {
    return this.detuneNode.offset;
  }

  addEventListener(
    type: "ended",
    listener: (this: OscillatorNode, ev: Event) => any
  ) {
    this.oscillators[0].addEventListener(type, listener);
  }

  get onended() {
    return this.oscillators[0].onended;
  }

  setPeriodicWave(periodicWave: PeriodicWave) {
    for (const oscillator of this.oscillators) {
      oscillator.setPeriodicWave(periodicWave);
    }
  }

  setFrequency(frequency: number, startTime: number) {
    let cents = frequencyToCentOffset(frequency, this.baseFrequency);
    cents = mmod(cents, this.equaveCents);

    const n = this.oscillators.length;
    const m = n / 2;
    const skirts: number[] = [];
    let totalSkirt = 0;
    for (let i = 0; i < n; ++i) {
      const voiceCents = cents + (i - m) * this.equaveCents;
      this.oscillators[i].frequency.setValueAtTime(
        centOffsetToFrequency(voiceCents, this.baseFrequency),
        startTime
      );
      const skirt = spectralWindow(voiceCents / this.skirtCents);
      skirts.push(skirt);
      totalSkirt += skirt;
    }
    for (let i = 0; i < n; ++i) {
      this.gains[i].gain.setValueAtTime(skirts[i] / totalSkirt, startTime);
    }
  }

  connect(destination: AudioNode) {
    for (const gain of this.gains) {
      gain.connect(destination);
    }
    return destination;
  }

  disconnect() {
    for (const gain of this.gains) {
      gain.disconnect();
    }
  }

  start(when?: number) {
    this.detuneNode.start(when);
    for (const oscillator of this.oscillators) {
      oscillator.start(when);
    }
  }

  stop(when?: number) {
    this.detuneNode.stop(when);
    for (const oscillator of this.oscillators) {
      oscillator.stop(when);
    }
  }
}
