const API_URL = 'https://thesimpsonsapi.com/api/characters';
const IMAGE_BASE = 'https://thesimpsonsapi.com';
const ITEMS_PER_PAGE = 20;
const MAX_API_PAGES = 90;
const BATCH_SIZE = 8;

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
    phrases: ['Doh!', 'Woo-hoo!', 'Mmm... (food)... *drooling*']
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
    phrases: ['Hrmmm...', 'Oh, Homie!']
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
    phrases: ['¡Ay Caramba!', 'Eat my shorts!', 'I didnt do it!']
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
    phrases: ['Bart!', 'If anyone wants me, Ill be in my room.']
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
    phrases: ['*suck-suck*']
  },
  {
    id: 13,
    age: 1381,
    birthdate: null,
    gender: 'Male',
    name: 'Charles Montgomery Burns',
    occupation: 'Owner & Director of the Springfield Nuclear Power Plant',
    status: 'Alive',
    portrait_path: '/character/13.webp',
    phrases: ['Excellent!', 'Release the hounds!']
  }
];

const state = {
  allCharacters: [],
  currentPage: 1,
  totalFromApi: 0,
  usingFallback: false,
  loading: false
};

const cardsContainer = document.getElementById('cardsContainer');
const loader = document.getElementById('loader');
const apiStatus = document.getElementById('apiStatus');
const totalCharacters = document.getElementById('totalCharacters');
const totalPhotos = document.getElementById('totalPhotos');
const totalResults = document.getElementById('totalResults');
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
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeHtml(text = '') {
  return text
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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

function statusClass(status) {
  return ['Deceased', 'Dead'].includes(status) ? 'dead' : 'alive';
}

function translateOccupation(text) {
  if (!text) return 'No disponible';

  const exactDictionary = {
    'Safety Inspector': 'Inspector de seguridad',
    'Unemployed': 'Sin empleo',
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
    ['former', 'anterior'],
    ['formerly', 'anteriormente'],
    ['Retired', 'Jubilado'],
    ['Housewife', 'Ama de casa'],
    ['Bartender', 'Cantinero'],
    ['Nuclear Power Plant', 'Planta Nuclear'],
    ['Springfield Elementary School', 'Escuela Primaria de Springfield'],
    ['Unknown', 'No disponible'],
    ['School', 'Escuela'],
    ['Scientist', 'Científico/a'],
    ['Doctor', 'Doctor/a'],
    ['Police', 'Policía'],
    ['Mayor', 'Alcalde'],
    ['Clown', 'Payaso'],
    ['Reverend', 'Reverendo'],
    ['Lawyer', 'Abogado/a'],
    ['Nurse', 'Enfermero/a'],
    ['Chef', 'Cocinero/a'],
    ['Singer', 'Cantante'],
    ['Actor', 'Actor'],
    ['Actress', 'Actriz'],
    ['Reporter', 'Reportero/a']
  ];

  return replacements.reduce((result, [english, spanish]) => result.replaceAll(english, spanish), text);
}

function translatePhrase(phrase) {
  if (!phrase) return 'No disponible';

  const phraseDictionary = {
    'Doh!': '¡Doh!',
    'Woo-hoo!': '¡Yuju!',
    'Hrmmm...': 'Mmm...',
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
  const remoteCandidates = [
    character.portrait_path,
    character.thumbnail_path,
    character.image,
    character.image_url,
    character.avatar,
    character.photo
  ]
    .filter(Boolean)
    .map((path) => path.startsWith('http') ? path : `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}`);

  return unique(remoteCandidates);
}

function imageMarkup(character) {
  const candidates = getImageCandidates(character);
  if (!candidates.length) {
    return '<div class="card-image-wrap"><div class="no-photo">Sin foto</div></div>';
  }

  const [first, ...rest] = candidates;
  const queue = encodeURIComponent(JSON.stringify(rest));

  return `
    <div class="card-image-wrap">
      <img src="${escapeHtml(first)}" alt="Imagen de ${escapeHtml(character.name)}" loading="lazy" data-next-images="${queue}" />
    </div>
  `;
}

function handleImageError(event) {
  const img = event.target;
  const nextImages = JSON.parse(decodeURIComponent(img.dataset.nextImages || '[]'));

  if (nextImages.length > 0) {
    const next = nextImages.shift();
    img.dataset.nextImages = encodeURIComponent(JSON.stringify(nextImages));
    img.src = next;
    return;
  }

  const wrapper = img.closest('.card-image-wrap') || img.parentElement;
  if (wrapper) wrapper.innerHTML = '<div class="no-photo">Sin foto</div>';
}

function extractCharacters(payload) {
  if (Array.isArray(payload)) return payload;

  const directKeys = ['docs', 'results', 'characters', 'data', 'items'];
  for (const key of directKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (payload?.data && typeof payload.data === 'object') {
    for (const key of directKeys) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
  }

  return [];
}

function extractTotalPages(payload, currentPage, loadedItems) {
  const value = Number(
    payload?.totalPages ||
    payload?.pages ||
    payload?.meta?.totalPages ||
    payload?.pagination?.totalPages ||
    payload?.pagination?.pages ||
    payload?.pageCount ||
    currentPage
  );

  if (Number.isFinite(value) && value > 0) return Math.min(value, MAX_API_PAGES);
  return loadedItems > 0 ? currentPage + 1 : currentPage;
}

function extractTotalItems(payload, loadedCount) {
  const value = Number(
    payload?.totalDocs ||
    payload?.total ||
    payload?.count ||
    payload?.meta?.total ||
    payload?.pagination?.total ||
    payload?.pagination?.count ||
    loadedCount
  );

  return Number.isFinite(value) && value > 0 ? value : loadedCount;
}

async function fetchCharactersPage(page) {
  const response = await fetch(`${API_URL}?page=${page}`);
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  const payload = await response.json();
  const items = extractCharacters(payload);
  const totalPages = extractTotalPages(payload, page, items.length);
  const totalItems = extractTotalItems(payload, items.length);
  return { items, totalPages, totalItems };
}

async function fetchRemainingPages(startPage, totalPages) {
  const all = [];

  for (let page = startPage; page <= totalPages; page += BATCH_SIZE) {
    const pages = Array.from(
      { length: Math.min(BATCH_SIZE, totalPages - page + 1) },
      (_, index) => page + index
    );

    const results = await Promise.all(pages.map((currentPage) => fetchCharactersPage(currentPage)));
    results.forEach((result) => all.push(...result.items));
    setStatus(`Cargando personajes ${Math.min(page + BATCH_SIZE - 1, totalPages)} de ${totalPages}...`);
  }

  return all;
}

async function loadAllCharacters() {
  if (state.loading) return;

  state.loading = true;
  state.usingFallback = false;
  showLoader(true);
  setStatus('Consultando personajes...');
  cardsContainer.innerHTML = '';

  try {
    const firstResult = await fetchCharactersPage(1);
    const totalPages = Math.min(firstResult.totalPages || 1, MAX_API_PAGES);
    const remaining = totalPages > 1 ? await fetchRemainingPages(2, totalPages) : [];
    const all = [...firstResult.items, ...remaining];

    state.allCharacters = uniqueById(all);
    state.totalFromApi = firstResult.totalItems || state.allCharacters.length;
    state.currentPage = 1;
    setStatus('Catálogo actualizado correctamente', 'success');
  } catch (error) {
    console.error(error);
    state.allCharacters = fallbackCharacters;
    state.totalFromApi = fallbackCharacters.length;
    state.currentPage = 1;
    state.usingFallback = true;
    setStatus('Modo demostración: conexión no disponible', 'error');
  } finally {
    state.loading = false;
    showLoader(false);
    render();
  }
}

function uniqueById(items) {
  const map = new Map();
  items.forEach((item, index) => {
    const key = item.id ?? `${item.name}-${index}`;
    if (!map.has(key)) map.set(key, item);
  });
  return [...map.values()];
}

function getFilteredCharacters() {
  const query = normalizeText(searchInput.value.trim());
  const gender = genderFilter.value;
  const status = statusFilter.value;
  const photo = photoFilter.value;

  return state.allCharacters.filter((character) => {
    const normalizedName = normalizeText(character.name);
    const normalizedOccupation = normalizeText(translateOccupation(character.occupation));
    const matchesQuery = !query || normalizedName.includes(query) || normalizedOccupation.includes(query);
    const matchesGender = !gender || character.gender === gender;
    const matchesStatus = !status || character.status === status || (status === 'Deceased' && ['Deceased', 'Dead'].includes(character.status)) || (status === 'Unknown' && !character.status);
    const matchesPhoto = !photo || (photo === 'withPhoto' ? hasPhoto(character) : !hasPhoto(character));
    return matchesQuery && matchesGender && matchesStatus && matchesPhoto;
  });
}

function render() {
  const filtered = getFilteredCharacters();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  state.currentPage = Math.min(state.currentPage, totalPages);

  const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);
  const photos = state.allCharacters.filter(hasPhoto).length;

  totalCharacters.textContent = state.totalFromApi || state.allCharacters.length;
  totalPhotos.textContent = photos;
  totalResults.textContent = filtered.length;
  resultsInfo.textContent = `${filtered.length} resultado(s) encontrados · ${photos} personaje(s) con fotografía`;
  pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
  prevPage.disabled = state.currentPage <= 1;
  nextPage.disabled = state.currentPage >= totalPages;

  if (!pageItems.length) {
    cardsContainer.innerHTML = '<div class="empty-state">No se encontraron personajes con los filtros seleccionados.</div>';
    return;
  }

  cardsContainer.innerHTML = pageItems.map((character, index) => characterCard(character, index)).join('');
}

function characterCard(character, index) {
  const occupation = translateOccupation(character.occupation);
  const status = translateStatus(character.status);
  const phrase = translatePhrase(character.phrases?.[0] || '');
  const age = safeValue(character.age, 'No disponible');
  const featured = index === 0 && state.currentPage === 1 ? 'featured' : '';

  return `
    <article class="character-card ${featured}">
      ${imageMarkup(character)}
      <h3>${escapeHtml(character.name)}</h3>
      <p class="occupation">${escapeHtml(occupation)}</p>
      <div class="card-pills">
        <span class="pill">Edad: ${escapeHtml(age)}</span>
        <span class="pill ${statusClass(character.status)}">${escapeHtml(status)}</span>
      </div>
      <p class="phrase">“${escapeHtml(phrase)}”</p>
      <button class="card-detail-btn" type="button" data-character-id="${escapeHtml(character.id)}">Ver detalles</button>
    </article>
  `;
}

function openCharacterDetails(character) {
  const phrases = (character.phrases || []).slice(0, 8);
  const phraseItems = phrases.length
    ? phrases.map((phrase) => `<li>${escapeHtml(translatePhrase(phrase))}</li>`).join('')
    : '<li>No disponible</li>';

  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-image">
        ${imageMarkup(character)}
      </div>
      <div class="dialog-info">
        <h3>${escapeHtml(character.name)}</h3>
        <div class="detail-list">
          <div class="detail-row"><strong>Edad</strong><span>${escapeHtml(safeValue(character.age))}</span></div>
          <div class="detail-row"><strong>Género</strong><span>${escapeHtml(translateGender(character.gender))}</span></div>
          <div class="detail-row"><strong>Estado</strong><span>${escapeHtml(translateStatus(character.status))}</span></div>
          <div class="detail-row"><strong>Ocupación</strong><span>${escapeHtml(translateOccupation(character.occupation))}</span></div>
          <div class="detail-row"><strong>Nacimiento</strong><span>${escapeHtml(safeValue(character.birthdate))}</span></div>
        </div>
        <h4>Frases principales</h4>
        <ul class="phrases-list">${phraseItems}</ul>
      </div>
    </div>
  `;

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    document.body.classList.add('dialog-open');
  } else {
    alert(`${character.name}\n${translateOccupation(character.occupation)}`);
  }
}

cardsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('[data-character-id]');
  if (!button) return;

  const id = button.dataset.characterId;
  const character = state.allCharacters.find((item) => String(item.id) === String(id));
  if (character) openCharacterDetails(character);
});

cardsContainer.addEventListener('error', handleImageError, true);
dialogContent.addEventListener('error', handleImageError, true);

[searchInput, genderFilter, statusFilter, photoFilter].forEach((control) => {
  control.addEventListener('input', () => {
    state.currentPage = 1;
    render();
  });
});

prevPage.addEventListener('click', () => {
  state.currentPage -= 1;
  render();
  document.getElementById('personajes').scrollIntoView({ behavior: 'smooth' });
});

nextPage.addEventListener('click', () => {
  state.currentPage += 1;
  render();
  document.getElementById('personajes').scrollIntoView({ behavior: 'smooth' });
});

btnReload.addEventListener('click', loadAllCharacters);

btnClearFilters.addEventListener('click', () => {
  searchInput.value = '';
  genderFilter.value = '';
  statusFilter.value = '';
  photoFilter.value = '';
  state.currentPage = 1;
  render();
});

closeDialog.addEventListener('click', () => dialog.close());

dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
});

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.addEventListener('click', () => {
  navLinks.classList.remove('open');
});

loadAllCharacters();
