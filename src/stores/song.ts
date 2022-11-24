import { reactive, ref } from "vue";
import { defineStore } from "pinia";

export const useSongStore = defineStore("song", () => {
  const startTime = ref<number | null>(null);

  const notes = reactive<[number, number, number?][]>([]);

  return { startTime, notes };
});
