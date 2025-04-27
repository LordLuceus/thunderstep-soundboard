export interface Sound {
  id: string;
  name: string;
  fileId: string;
  hotkey: string;
  category: string;
  volume: number;
  loop: boolean;
}

export interface SoundBank {
  name: string;
  sounds: Sound[];
}
