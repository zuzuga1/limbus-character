// script.js

const defaultCharacter = {
    name: '',
    player: '',
    age: '',
    gender: '',
    attributes: {
        physical: { strength: 0, dexterity: 0, stamina: 0 },
        social: { charisma: 0, manipulation: 0, appearance: 0 },
        mental: { perception: 0, intelligence: 0, wits: 0 }
    },
    abilities: {
        talents: {
            athletics: 0,
            alertness: 0,
            brawl: 0,
            intimidation: 0,
            expression: 0,
            streetwise: 0,
            subterfuge: 0,
            awareness: 0
        },
        skills: {
            driving: 0,
            larceny: 0,
            survival: 0,
            crafts: 0,
            stealth: 0,
            firearms: 0,
            melee: 0,
            etiquette: 0
        },
        knowledges: {
            investigation: 0,
            finance: 0,
            electronics: 0,
            implants: 0,
            singularity: 0,
            science: 0,
            chemistry: 0,
            taboo: 0,
            occult: 0
        }
    },
    disciplines: [],
    virtues: { conscience: 0, selfControl: 0, courage: 0 },
    humanity: 0,
    willpower: { current: 0, permanent: 0 },
    health: {
        bruised: false,
        hurt: false,
        injured: false,
        wounded: false,
        mauled: false,
        crippled: false,
        incapacitated: false
    },
    experience: 0,
    history: '',
    goals: '',
    notes: ''
};

let character = { ...defaultCharacter };

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (let part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

function setValueByPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = sourceValue;
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
        } else {
            target[key] = sourceValue;
        }
    });
    return target;
}

// ===== ОТРИСОВКА ТОЧЕК =====
function renderDots(element, value, max = 5) {
    element.innerHTML = '';
    for (let i = 0; i < max; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i < value ? ' filled' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            const field = element.dataset.field;
            const maxVal = parseInt(element.dataset.max) || 5;
            let newValue = i + 1;
            if (value === newValue) {
                newValue = i;
            }
            setValueByPath(character, field, newValue);
            element.dataset.value = newValue;
            renderDots(element, newValue, maxVal);
            saveUIToCharacter();
        });
        element.appendChild(dot);
    }
}

// ===== ЗАГРУЗКА В UI =====
function loadCharacterToUI() {
    document.querySelectorAll('.dots').forEach(element => {
        const field = element.getAttribute('data-field');
        const max = parseInt(element.dataset.max) || 5;
        const value = getValueByPath(character, field);
        const val = value !== undefined ? value : 0;
        element.dataset.value = val;
        renderDots(element, val, max);
    });

    document.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        const value = getValueByPath(character, field);
        if (value !== undefined) {
            element.value = value;
        }
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        const value = getValueByPath(character, field);
        element.checked = value || false;
    });

    renderDisciplines();
}

// ===== СОХРАНЕНИЕ ИЗ UI =====
function saveUIToCharacter() {
    document.querySelectorAll('.dots').forEach(element => {
        const field = element.getAttribute('data-field');
        const value = parseInt(element.dataset.value) || 0;
        setValueByPath(character, field, value);
    });

    document.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        setValueByPath(character, field, element.value);
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        setValueByPath(character, field, element.checked);
    });

    saveDisciplines();
}

// ===== ДИСЦИПЛИНЫ =====
function renderDisciplines() {
    const container = document.querySelector('.discipline-container');
    if (!container) return;
    container.innerHTML = '';
    character.disciplines.forEach((disc, index) => {
        const div = document.createElement('div');
        div.className = 'discipline';
        div.innerHTML = `
            <input type="text" placeholder="Название" value="${disc.name}" data-discipline-name="${index}">
            <input type="number" min="0" max="5" placeholder="Уровень" value="${disc.level}" data-discipline-level="${index}">
            <button data-discipline-remove="${index}">✕</button>
        `;
        container.appendChild(div);
    });
    attachDisciplineListeners();
}

function saveDisciplines() {
    const inputs = document.querySelectorAll('[data-discipline-name]');
    const newDisciplines = [];
    inputs.forEach(input => {
        const index = parseInt(input.getAttribute('data-discipline-name'));
        const levelInput = document.querySelector(`[data-discipline-level="${index}"]`);
        if (input.value.trim() !== '') {
            newDisciplines.push({
                name: input.value.trim(),
                level: parseInt(levelInput.value) || 0
            });
        }
    });
    character.disciplines = newDisciplines;
}

function attachDisciplineListeners() {
    document.querySelectorAll('[data-discipline-name]').forEach(input => {
        input.removeEventListener('input', handleDisciplineChange);
        input.addEventListener('input', handleDisciplineChange);
    });
    document.querySelectorAll('[data-discipline-level]').forEach(input => {
        input.removeEventListener('input', handleDisciplineChange);
        input.addEventListener('input', handleDisciplineChange);
    });
    document.querySelectorAll('[data-discipline-remove]').forEach(button => {
        button.removeEventListener('click', handleDisciplineRemove);
        button.addEventListener('click', handleDisciplineRemove);
    });
}

function handleDisciplineChange() {
    saveDisciplines();
}

function handleDisciplineRemove(e) {
    const index = parseInt(e.target.getAttribute('data-discipline-remove'));
    character.disciplines.splice(index, 1);
    renderDisciplines();
}

function addDiscipline() {
    character.disciplines.push({ name: '', level: 0 });
    renderDisciplines();
}

// ===== СОХРАНЕНИЕ В localStorage =====
function saveToLocalStorage() {
    saveUIToCharacter();
    localStorage.setItem('limbusCharacter', JSON.stringify(character));
    alert('💾 Персонаж сохранен!');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('limbusCharacter');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            character = mergeDeep({ ...defaultCharacter }, parsed);
            loadCharacterToUI();
            console.log('✅ Персонаж загружен!');
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();

    document.getElementById('saveBtn')?.addEventListener('click', saveToLocalStorage);
    document.getElementById('addDisciplineBtn')?.addEventListener('click', addDiscipline);

    document.getElementById('exportBtn')?.addEventListener('click', () => {
        saveUIToCharacter();
        const dataStr = JSON.stringify(character, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'limbus_character.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('importBtn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    character = mergeDeep({ ...defaultCharacter }, imported);
                    loadCharacterToUI();
                    saveToLocalStorage();
                    alert('✅ Персонаж импортирован!');
                } catch (err) {
                    alert('❌ Ошибка импорта: неверный формат файла');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', () => { saveUIToCharacter(); });
        element.addEventListener('change', () => { saveUIToCharacter(); });
    });

    if (character.disciplines.length === 0) {
        character.disciplines.push({ name: '', level: 0 });
    }
    renderDisciplines();
    loadCharacterToUI();
});