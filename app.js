const API_URL = 'https://thesimpsonsapi.com/api/characters';
const IMAGE_BASE = 'https://thesimpsonsapi.com';

const fallbackCharacters = [
  {
    id: 1,
    age: 39,
    gender: 'Male',
    name: 'Homer Simpson',
    occupation: 'Safety Inspector',
    status: 'Alive',
    portrait_path: '/character/1.webp',
    phrases: ['Doh!', 'Woo-hoo!', 'Mmm... food...']
  },
  {
    id: 2,
    age: 39,
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
    gender: 'Female',
    name: 'Lisa Simpson',
    occupation: 'Student at Springfield Elementary School',
    status: 'Alive',
    portrait_path: '/character/4.webp',
    phrases: ['Bart!', 'If anyone wants me, Ill be in my room.']
  },
  {
    id: 13,
    age: 1381,
    gender: 'Male',
    name: 'Charles Montgomery Burns',
    occupation: 'Owner & Director of the Springfield Nuclear Power Plant',
    status: 'Alive',
    portrait_path: '/character/13.webp',
    phrases: ['Excellent!', 'Release the hounds!']
  },
  {
    id: 16,
    age: null,
    gender: 'Male',
    name: 'Moe Szyslak',
    occupation: "Bartender and Owner of Moe's Tavern",
    status: 'Alive',
    portrait_path: '/character/16.webp',
    phrases: ['How ya doing?', 'Whaaaaaaat?']
  }
];

const state = {
  characters: [],
  page: 1,
  totalPages: 1,
  totalCount: 0,
  usingFallback: false
};

const cardsContainer = document.getElementById('cardsContainer');
const loader = document.getElementById('loader');
const apiStatus = document.getElementById('apiStatus');
const totalCharacters = document.getElementById('totalCharacters');
const searchInput = document.getElementById('searchInput');
const genderFilter = document.getElementById('genderFilter');
const statusFilter = document.getElementById('statusFilter');
const pageInfo = document.getElementById('pageInfo');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const btnReload = document.getElementById('btnReload');
const dialog = document.getElementById('characterDialog');
const dialogContent = document.getElementById('dialogContent');
const closeDialog = document.getElementById('closeDialog');

function showLoader(show) {
  loader.classList.toggle('hidden', !show);
}

function setStatus(message, isError = false) {
  apiStatus.textContent = message;
  apiStatus.classList.toggle('error', isError);
}

function imageUrl(character) {
  if (!character.portrait_path) return '';
  return character.portrait_path.startsWith('http')
    ? character.portrait_path
    : `${IMAGE_BASE}${character.portrait_path}`;
}

function safeValue(value, fallback = 'No disponible') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function getFilteredCharacters() {
  const search = searchInput.value.trim().toLowerCase();
  const gender = genderFilter.value;
  const status = statusFilter.value;

  return state.characters.filter((character) => {
    const matchesName = character.name.toLowerCase().includes(search);
    const matchesGender = !gender || character.gender === gender;
    const matchesStatus = !status || character.status === status;
    return matchesName && matchesGender && matchesStatus;
  });
}

function renderCards() {
  const characters = getFilteredCharacters();

  if (characters.length === 0) {
    cardsContainer.innerHTML = '<p class="empty">No se encontraron personajes con los filtros seleccionados.</p>';
    updatePagination();
    return;
  }

  cardsContainer.innerHTML = characters.map((character) => `
    <article class="card">
      <div class="card-img">
        ${imageUrl(character)
          ? `<img src="${imageUrl(character)}" alt="Imagen de ${character.name}" onerror="this.replaceWith(createPlaceholder())" />`
          : '<span class="placeholder-img">🍩</span>'}
      </div>
      <div class="card-content">
        <h3>${character.name}</h3>
        <div class="badges">
          <span class="badge">${safeValue(character.gender, 'Sin género')}</span>
          <span class="badge">${safeValue(character.status, 'Sin estado')}</span>
        </div>
        <p><strong>Ocupación:</strong> ${safeValue(character.occupation)}</p>
        <button class="btn primary" type="button" onclick="openCharacter(${character.id})">Ver detalles</button>
      </div>
    </article>
  `).join('');

  updatePagination();
}

function updatePagination() {
  pageInfo.textContent = `Página ${state.page} de ${state.totalPages}`;
  prevPage.disabled = state.page <= 1 || state.usingFallback;
  nextPage.disabled = state.page >= state.totalPages || state.usingFallback;
}

function createPlaceholder() {
  const placeholder = document.createElement('span');
  placeholder.className = 'placeholder-img';
  placeholder.textContent = '🍩';
  return placeholder;
}

async function loadCharacters(page = 1) {
  showLoader(true);
  setStatus('Consultando API...');

  try {
    const response = await fetch(`${API_URL}?page=${page}`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    state.characters = data.results || [];
    state.page = page;
    state.totalPages = data.pages || 1;
    state.totalCount = data.count || state.characters.length;
    state.usingFallback = false;

    totalCharacters.textContent = state.totalCount;
    setStatus('Datos cargados desde la API');
  } catch (error) {
    console.error('No se pudo consultar la API:', error);
    state.characters = fallbackCharacters;
    state.page = 1;
    state.totalPages = 1;
    state.totalCount = fallbackCharacters.length;
    state.usingFallback = true;

    totalCharacters.textContent = state.totalCount;
    setStatus('Modo demostración sin conexión', true);
  } finally {
    showLoader(false);
    renderCards();
  }
}

window.openCharacter = function openCharacter(id) {
  const character = state.characters.find((item) => item.id === id);
  if (!character) return;

  const phrases = character.phrases && character.phrases.length > 0
    ? character.phrases.slice(0, 5).map((phrase) => `<li>${phrase}</li>`).join('')
    : '<li>No registra frases.</li>';

  dialogContent.innerHTML = `
    <section class="dialog-body">
      <div class="dialog-top">
        ${imageUrl(character)
          ? `<img src="${imageUrl(character)}" alt="Imagen de ${character.name}" onerror="this.replaceWith(createPlaceholder())" />`
          : '<span class="placeholder-img">🍩</span>'}
        <div>
          <p class="eyebrow">Ficha del personaje</p>
          <h2>${character.name}</h2>
          <p><strong>Edad:</strong> ${safeValue(character.age)}</p>
          <p><strong>Género:</strong> ${safeValue(character.gender)}</p>
          <p><strong>Estado:</strong> ${safeValue(character.status)}</p>
          <p><strong>Ocupación:</strong> ${safeValue(character.occupation)}</p>
        </div>
      </div>
      <h3>Frases destacadas</h3>
      <ul>${phrases}</ul>
    </section>
  `;

  dialog.showModal();
};

searchInput.addEventListener('input', renderCards);
genderFilter.addEventListener('change', renderCards);
statusFilter.addEventListener('change', renderCards);

prevPage.addEventListener('click', () => {
  if (state.page > 1) loadCharacters(state.page - 1);
});

nextPage.addEventListener('click', () => {
  if (state.page < state.totalPages) loadCharacters(state.page + 1);
});

btnReload.addEventListener('click', () => loadCharacters(state.page));
closeDialog.addEventListener('click', () => dialog.close());

loadCharacters();
