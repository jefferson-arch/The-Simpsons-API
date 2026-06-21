const API_URL = 'https://thesimpsonsapi.com/api/characters';
const IMAGE_BASE = 'https://thesimpsonsapi.com';
const ITEMS_PER_PAGE = 20;

const fallbackCharacters = [
  {
    id: 1,
    age: 39,
    birthdate: '1956-05-12',
    gender: 'Male',
    name: 'Homer Simpson',
    occupation: 'Safety Inspector',
    status: 'Alive',
    portrait_path: '/character/1.webp',
    phrases: ['¡Doh!', '¡Woo-hoo!', 'Mmm... comida...']
  },
  {
    id: 2,
    age: 39,
    birthdate: null,
    gender: 'Female',
    name: 'Marge Simpson',
    occupation: 'Unemployed',
    status: 'Alive',
    portrait_path: '/character/2.webp',
    phrases: ['Mmm...', '¡Oh, Homero!']
  },
  {
    id: 3,
    age: 10,
    birthdate: '1980-02-23',
    gender: 'Male',
    name: 'Bart Simpson',
    occupation: 'Student at Springfield Elementary School',
    status: 'Alive',
    portrait_path: '/character/3.webp',
    phrases: ['¡Ay, caramba!', '¡Cómete mis pantalones!', '¡Yo no fui!']
  },
  {
    id: 4,
    age: 8,
    birthdate: '1982-05-09',
    gender: 'Female',
    name: 'Lisa Simpson',
    occupation: 'Student at Springfield Elementary School, CTU Agent, Hall-monitor, Member of PETA',
    status: 'Alive',
    portrait_path: '/character/4.webp',
    phrases: ['¡Bart!', 'Si alguien me necesita, estaré en mi habitación.']
  },
  {
    id: 5,
    age: 1,
    birthdate: '1990-11-07',
    gender: 'Female',
    name: 'Maggie Simpson',
    occupation: 'Unknown',
    status: 'Alive',
    portrait_path: '/character/5.webp',
    phrases: ['Chupete...', 'Buenas noches.']
  },
  {
    id: 13,
    age: 81,
    birthdate: '1886-09-15',
    gender: 'Male',
    name: 'Charles Montgomery Burns',
    occupation: 'Owner & Director of the Springfield Nuclear Power Plant',
    status: 'Alive',
    portrait_path: '/character/13.webp',
    phrases: ['¡Excelente!', '¡Suelten a los perros!']
  }
];

const state = {
  allCharacters: [],
  currentPage: 1,
  totalFromApi: 0,
  totalApiPages: 1,
  usingFallback: false,
  loading: false
};

const cardsContainer = document.getElementById('cardsContainer');
const loader = document.getElementById('loader');
const apiStatus = document.getElementById('apiStatus');
const totalCharacters = document.getElementById('totalCharacters');
const photoCounter = document.getElementById('photoCounter');
const searchInput = document.getElementById('searchInput');
const genderFilter = document.getElementById('genderFilter');
const statusFilter = document.getElementById('statusFilter');
const photoFilter = document.getElementById('photoFilter');
const resultsInfo = document.getElementById('resultsInfo');
const pageInfo = document.getElementById('pageInfo');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const btnReload = document.getElementById('btnReload');
const btnClearFilters = document.getElementById('btnClearFilters');
const dialog = document.getElementById('characterDialog');
const dialogContent = document.getElementById('dialogContent');
const closeDialog = document.getElementById('closeDialog');

function showLoader(show) {
  loader.classList.toggle('hidden', !show);
}

function setStatus(message, type = 'normal') {
  apiStatus.textContent = message;
  apiStatus.classList.toggle('error', type === 'error');
  apiStatus.classList.toggle('success', type === 'success');
}

function safeValue(value, fallback = 'No disponible') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function normalizeText(text = '') {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugify(text = '') {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function translateGender(gender) {
  const map = {
    Male: 'Masculino',
    Female: 'Femenino',
    Nonbinary: 'No binario',
    Unknown: 'Desconocido'
  };
  return map[gender] || safeValue(gender, 'Desconocido');
}

function translateStatus(status) {
  const map = {
    Alive: 'Vivo',
    Deceased: 'Fallecido',
    Dead: 'Fallecido',
    Unknown: 'Desconocido'
  };
  return map[status] || safeValue(status, 'Desconocido');
}

function translateOccupation(text) {
  if (!text) return 'No disponible';

  const exactDictionary = {
    'Safety Inspector': 'Inspector de seguridad',
    'Unemployed': 'Desempleada/o',
    'Student at Springfield Elementary School': 'Estudiante de la Escuela Primaria de Springfield',
    'Student at Springfield Elementary School, CTU Agent, Hall-monitor, Member of PETA': 'Estudiante de la Escuela Primaria de Springfield, agente CTU, monitora de pasillo y miembro de PETA',
    'Unknown': 'No disponible',
    'Retired': 'Jubilado',
    'Springfield DMV Employee': 'Empleada del Departamento de Vehículos de Springfield',
    'Employee of Department of Motor Vehicles': 'Empleada del Departamento de Vehículos Motorizados',
    'The Leftorium (formerly)': 'Antiguo propietario de The Leftorium',
    'Housewife (former)': 'Ama de casa',
    'Student at Springfield Elementary SchoolStudent at a religious private school (formerly)': 'Estudiante de la Escuela Primaria de Springfield y anteriormente de una escuela religiosa privada',
    'Owner & Director of the Springfield Nuclear Power Plant': 'Dueño y director de la Planta Nuclear de Springfield',
    'Assistant to Mr. Burns': 'Asistente del Sr. Burns',
    'Television personality': 'Personalidad de televisión',
    "Bartender and Owner of Moe's Tavern": 'Cantinero y propietario de la Taberna de Moe',
    'Owner of the Kwik-E-Mart': 'Dueño del Kwik-E-Mart',
    'Principal of Springfield Elementary School': 'Director de la Escuela Primaria de Springfield',
    'Superintendent of Springfield Elementary School': 'Superintendente de la Escuela Primaria de Springfield',
    'Fourth grade teacher at Springfield Elementary School (formerly)': 'Exprofesora de cuarto grado en la Escuela Primaria de Springfield'
  };

  if (exactDictionary[text]) return exactDictionary[text];

  const replacements = [
    ['Owner', 'Dueño'],
    ['Director', 'Director'],
    ['Assistant', 'Asistente'],
    ['Student', 'Estudiante'],
    ['Teacher', 'Profesor/a'],
    ['Principal', 'Director'],
    ['Employee', 'Empleado/a'],
    ['Former', 'Anterior'],
    ['formerly', 'anteriormente'],
    ['Retired', 'Jubilado'],
    ['Housewife', 'Ama de casa'],
    ['Bartender', 'Cantinero'],
    ['Nuclear Power Plant', 'Planta Nuclear'],
    ['Springfield Elementary School', 'Escuela Primaria de Springfield'],
    ['Unknown', 'No disponible']
  ];

  return replacements.reduce((result, [english, spanish]) => {
    return result.replaceAll(english, spanish);
  }, text);
}

function translatePhrase(phrase) {
  if (!phrase) return 'No disponible';

  const phraseDictionary = {
    'Doh!': '¡Doh!',
    'Woo-hoo!': '¡Yuju!',
    '¡Ay Caramba!': '¡Ay, caramba!',
    'Eat my shorts!': '¡Cómete mis pantalones!',
    'I didnt do it!': '¡Yo no fui!',
    'Dont have a cow, man.': 'No te alteres, viejo.',
    'Bart!': '¡Bart!',
    'Excellent!': '¡Excelente!',
    'Release the hounds!': '¡Suelten a los perros!',
    'Yes, sir?': '¿Sí, señor?',
    'Hey hey, kids!': '¡Hola, hola, niños!',
    'Thank you! Come again.': '¡Gracias, vuelva pronto!',
    'Howdily-doodily, neighborino!': '¡Hola, vecinillo!',
    'Hi-diddly-ho!': '¡Hola, holita!'
  };

  return phraseDictionary[phrase] || phrase;
}

function hasPhoto(character) {
  return Boolean(character.portrait_path || character.thumbnail_path || character.image || character.image_url || character.avatar || character.photo);
}

function getImageCandidates(character) {
  const slug = slugify(character.name);
  const remoteCandidates = [
    character.portrait_path,
    character.thumbnail_path,
    character.image,
    character.image_url,
    character.avatar,
    character.photo
  ]
    .filter(Boolean)
    .map((path) => path.startsWith('http') ? path : `${IMAGE_BASE}${path}`);

  const localCandidates = [
    `img/personajes/${character.id}.webp`,
    `img/personajes/${character.id}.png`,
    `img/personajes/${character.id}.jpg`,
    `img/personajes/${slug}.webp`,
    `img/personajes/${slug}.png`,
    `img/personajes/${slug}.jpg`,
    `img/personajes/${slug}.jpeg`
  ];

  return unique([...remoteCandidates, ...localCandidates]);
}

function buildImageMarkup(character, className = '') {
  const candidates = getImageCandidates(character);

  if (candidates.length === 0) {
    return '<span class="placeholder-img">Sin foto</span>';
  }

  const fallbackList = encodeURIComponent(JSON.stringify(candidates.slice(1)));
  return `
    <img
      src="${candidates[0]}"
      alt="Fotografía de ${character.name}"
      class="${className}"
      loading="lazy"
      data-fallbacks="${fallbackList}"
      onerror="handleImageError(this)"
    />
  `;
}

window.handleImageError = function handleImageError(img) {
  try {
    const fallbackList = JSON.parse(decodeURIComponent(img.dataset.fallbacks || '%5B%5D'));

    if (fallbackList.length > 0) {
      const next = fallbackList.shift();
      img.dataset.fallbacks = encodeURIComponent(JSON.stringify(fallbackList));
      img.src = next;
      return;
    }
  } catch (error) {
    console.warn('No se pudo procesar la imagen de respaldo:', error);
  }

  img.replaceWith(createPlaceholder());
};

function createPlaceholder() {
  const placeholder = document.createElement('span');
  placeholder.className = 'placeholder-img';
  placeholder.textContent = 'Sin foto';
  return placeholder;
}

function normalizeCharacter(character) {
  return {
    ...character,
    name: safeValue(character.name, 'Sin nombre'),
    occupationLabel: translateOccupation(character.occupation),
    genderLabel: translateGender(character.gender),
    statusLabel: translateStatus(character.status),
    photoAvailable: hasPhoto(character)
  };
}

function getFilteredCharacters() {
  const search = normalizeText(searchInput.value.trim());
  const gender = genderFilter.value;
  const status = statusFilter.value;
  const photo = photoFilter.value;

  return state.allCharacters.filter((character) => {
    const matchesName = normalizeText(character.name).includes(search);
    const matchesGender = !gender || character.gender === gender;
    const matchesStatus = !status || character.status === status;
    const matchesPhoto = !photo || (photo === 'withPhoto' ? character.photoAvailable : !character.photoAvailable);
    return matchesName && matchesGender && matchesStatus && matchesPhoto;
  });
}

function getVisibleCharacters() {
  const filtered = getFilteredCharacters();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  if (state.currentPage > totalPages) state.currentPage = totalPages;

  const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  return {
    filtered,
    totalPages,
    visible: filtered.slice(start, end)
  };
}

function renderCards() {
  const { filtered, totalPages, visible } = getVisibleCharacters();

  if (visible.length === 0) {
    cardsContainer.innerHTML = '<p class="empty">No se encontraron personajes con los filtros seleccionados.</p>';
    resultsInfo.textContent = '0 resultados encontrados';
    updatePagination(totalPages, filtered.length);
    return;
  }

  cardsContainer.innerHTML = visible.map((character) => `
    <article class="card">
      <div class="card-img">
        ${buildImageMarkup(character)}
      </div>
      <div class="card-content">
        <h3>${character.name}</h3>
        <div class="badges">
          <span class="badge">${character.genderLabel}</span>
          <span class="badge ${character.status === 'Alive' ? 'success' : character.status === 'Deceased' ? 'danger' : ''}">${character.statusLabel}</span>
        </div>
        <p><strong>Ocupación:</strong> ${safeValue(character.occupationLabel)}</p>
        <button class="btn primary" type="button" onclick="openCharacter(${character.id})">Ver detalles</button>
      </div>
    </article>
  `).join('');

  resultsInfo.textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
  updatePagination(totalPages, filtered.length);
}

function updatePagination(totalPages = 1) {
  pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
  prevPage.disabled = state.currentPage <= 1;
  nextPage.disabled = state.currentPage >= totalPages;
}

function updateCounters() {
  const photos = state.allCharacters.filter((character) => character.photoAvailable).length;
  totalCharacters.textContent = state.totalFromApi || state.allCharacters.length;
  photoCounter.textContent = photos;
}

async function fetchPage(page) {
  const response = await fetch(`${API_URL}?page=${page}`);

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return response.json();
}

async function loadAllCharacters() {
  state.loading = true;
  state.currentPage = 1;
  showLoader(true);
  setStatus('Consultando la API...');
  loader.textContent = 'Cargando página 1 de la API...';

  try {
    const firstPage = await fetchPage(1);
    const totalPages = firstPage.pages || 1;
    const allResults = [...(firstPage.results || [])];

    state.totalFromApi = firstPage.count || allResults.length;
    state.totalApiPages = totalPages;
    state.allCharacters = allResults.map(normalizeCharacter);
    state.usingFallback = false;
    updateCounters();
    renderCards();

    for (let page = 2; page <= totalPages; page += 1) {
      loader.textContent = `Cargando página ${page} de ${totalPages} de la API...`;
      const data = await fetchPage(page);
      allResults.push(...(data.results || []));
      state.allCharacters = allResults.map(normalizeCharacter);
      updateCounters();
      renderCards();
    }

    setStatus('Datos e imágenes cargados desde la API', 'success');
  } catch (error) {
    console.error('No se pudo consultar la API:', error);
    state.allCharacters = fallbackCharacters.map(normalizeCharacter);
    state.totalFromApi = fallbackCharacters.length;
    state.totalApiPages = 1;
    state.usingFallback = true;
    updateCounters();
    setStatus('Modo demostración sin conexión', 'error');
  } finally {
    state.loading = false;
    showLoader(false);
    renderCards();
  }
}

window.openCharacter = function openCharacter(id) {
  const character = state.allCharacters.find((item) => item.id === id);
  if (!character) return;

  const phrases = character.phrases && character.phrases.length > 0
    ? character.phrases.slice(0, 6).map((phrase) => `<li>${translatePhrase(phrase)}</li>`).join('')
    : '<li>No registra frases célebres.</li>';

  dialogContent.innerHTML = `
    <section class="dialog-body">
      <div class="dialog-top">
        ${buildImageMarkup(character, 'dialog-image')}
        <div>
          <p class="eyebrow">Ficha del personaje</p>
          <h2>${character.name}</h2>
          <p><strong>Edad:</strong> ${safeValue(character.age)}</p>
          <p><strong>Fecha de nacimiento:</strong> ${safeValue(character.birthdate)}</p>
          <p><strong>Género:</strong> ${character.genderLabel}</p>
          <p><strong>Estado:</strong> ${character.statusLabel}</p>
          <p><strong>Ocupación:</strong> ${safeValue(character.occupationLabel)}</p>
          <p><strong>Fotografía:</strong> ${character.photoAvailable ? 'Disponible desde la API' : 'No disponible'}</p>
        </div>
      </div>
      <h3>Frases destacadas</h3>
      <ul>${phrases}</ul>
    </section>
  `;

  dialog.showModal();
};

function resetToFirstPageAndRender() {
  state.currentPage = 1;
  renderCards();
}

searchInput.addEventListener('input', resetToFirstPageAndRender);
genderFilter.addEventListener('change', resetToFirstPageAndRender);
statusFilter.addEventListener('change', resetToFirstPageAndRender);
photoFilter.addEventListener('change', resetToFirstPageAndRender);

prevPage.addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage -= 1;
    renderCards();
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

nextPage.addEventListener('click', () => {
  const { totalPages } = getVisibleCharacters();
  if (state.currentPage < totalPages) {
    state.currentPage += 1;
    renderCards();
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

btnReload.addEventListener('click', loadAllCharacters);
btnClearFilters.addEventListener('click', () => {
  searchInput.value = '';
  genderFilter.value = '';
  statusFilter.value = '';
  photoFilter.value = '';
  resetToFirstPageAndRender();
});
closeDialog.addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

loadAllCharacters();
