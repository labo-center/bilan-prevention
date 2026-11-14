// Harnais de développement : monte la brique seule, comme le ferait un shell hôte.
import './harnais.css';
import { mount } from './brick';

const conteneur = document.getElementById('root');
if (conteneur) mount(conteneur, { theme: 'clair' });
