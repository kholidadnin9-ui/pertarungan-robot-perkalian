export type RobotId = 'blue' | 'yellow' | 'pink' | 'green';

export interface RobotDef {
  id: RobotId;
  name: string;
  colorName: string;
  tagline: string;
  attack: string;
  image: string;
  main: string;
  light: string;
  dark: string;
  beam: string;
  glow: string;
}

export const ROBOTS: RobotDef[] = [
  {
    id: 'blue',
    name: 'BLUE STORM',
    colorName: 'Biru',
    tagline: 'Secepat badai petir!',
    attack: 'Laser Badai',
    image: 'images/robot-blue.png',
    main: '#2f7cf6',
    light: '#8cc8ff',
    dark: '#173f8f',
    beam: '#3ab8ff',
    glow: 'rgba(56,160,255,0.85)',
  },
  {
    id: 'yellow',
    name: 'YELLOW TITAN',
    colorName: 'Kuning',
    tagline: 'Kuat seperti baja!',
    attack: 'Meriam Petir',
    image: 'images/robot-yellow.png',
    main: '#f5c211',
    light: '#ffeb7a',
    dark: '#946600',
    beam: '#ffd21f',
    glow: 'rgba(255,205,30,0.85)',
  },
  {
    id: 'pink',
    name: 'PINK NOVA',
    colorName: 'Pink',
    tagline: 'Bersinar bagai bintang!',
    attack: 'Plasma Bintang',
    image: 'images/robot-pink.png',
    main: '#f2449a',
    light: '#ffa3d1',
    dark: '#94174f',
    beam: '#ff5cb3',
    glow: 'rgba(255,80,170,0.85)',
  },
  {
    id: 'green',
    name: 'GREEN VIPER',
    colorName: 'Hijau',
    tagline: 'Gesit & pantang menyerah!',
    attack: 'Rudal Hijau',
    image: 'images/robot-green.png',
    main: '#3fcf3a',
    light: '#a3f597',
    dark: '#1b6e1d',
    beam: '#5cff5c',
    glow: 'rgba(80,255,90,0.85)',
  },
];

export const robotById = (id: RobotId): RobotDef => ROBOTS.find((r) => r.id === id) ?? ROBOTS[0];

export const BG_IMAGE = 'images/city-bg.jpg';
