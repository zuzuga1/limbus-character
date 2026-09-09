// script.js - Survival Company

const defaultCharacter = {
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    rank: '9-й',
    class: '',
    subclass: '',
    multiclass: '',
    photo: '',
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
            taboo: 0,
            occult: 0
        }
    },
    disciplines: [],
    virtues: { conscience: 0, selfControl: 0, courage: 0 },
    humanity: 0,
    willpower: { current: 0, permanent: 0 },
    light: { current: 0, permanent: 0 },
    health: {
        bruised: 0,
        hurt: 0,
        injured: 0,
        wounded: 0,
        mauled: 0,
        crippled: 0,
        incapacitated: 0
    },
    experience: 0,
    history: '',
    goals: '',
    equipment: '',
    notes: ''
};

let character = { ...defaultCharacter };

// ===== ВСЕ ПОДКЛАССЫ ДЛЯ МУЛЬТИКЛАССА =====
const allSubclasses = [
    'Фехтовальщик', 'Авангард', 'Убийца',
    'Комбинатор', 'Снайпер', 'Тамб', 'Метатель',
    'Мастер', 'Имплантер', 'Миддл',
    'Мутант', 'Вампир', 'Цельнометаллический',
    'Атакующая', 'Защищающая', 'Поддерживающая'
];

// ===== ДАННЫЕ ДЛЯ КЛАССОВ =====
const classData = {
    'Мечник': ['Фехтовальщик', 'Авангард', 'Убийца'],
    'Стрелок': ['Комбинатор', 'Снайпер', 'Тамб', 'Метатель'],
    'Боец': ['Мастер', 'Имплантер', 'Миддл'],
    'Исключительный': ['Мутант', 'Вампир', 'Цельнометаллический'],
    'Владелец Сингулярности': ['Атакующая', 'Защищающая', 'Поддерживающая']
};

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

// ===== ОТРИСОВКА ТОЧЕК (С АВТОЗАПОЛНЕНИЕМ ДЛЯ ЗДОРОВЬЯ) =====
function renderDots(element, value, max = 5) {
    element.innerHTML = '';
    const field = element.dataset.field;
    const isHealth = field && field.startsWith('health.');
    
    for (let i = 0; i < max; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i < value ? ' filled' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            const maxVal = parseInt(element.dataset.max) || 5;
            let newValue = i + 1;
            if (value === newValue) {
                newValue = i;
            }
            
            // Для здоровья: автоматическое заполнение предыдущих точек
            if (isHealth) {
                // Если ставим точку (увеличиваем) - заполняем все до неё
                // Если убираем (уменьшаем) - убираем все от неё
                const currentVal = getValueByPath(character, field);
                if (newValue > currentVal) {
                    // Заполняем все точки до нового значения
                    setValueByPath(character, field, newValue);
                } else {
                    // Убираем все точки от нового значения
                    setValueByPath(character, field, newValue);
                }
            } else {
                setValueByPath(character, field, newValue);
            }
            
            const finalValue = getValueByPath(character, field);
            element.dataset.value = finalValue;
            renderDots(element, finalValue, maxVal);
            saveUIToCharacter();
        });
        element.appendChild(dot);
    }
}

// ===== ОБНОВЛЕНИЕ ПОДКЛАССОВ =====
function updateSubclasses(selectedClass) {
    const subclassSelect = document.getElementById('subclassSelect');
    
    subclassSelect.innerHTML = '<option value="">— Сначала выберите класс —</option>';
    
    if (selectedClass && classData[selectedClass]) {
        const subclasses = classData[selectedClass];
        subclasses.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subclassSelect.appendChild(option);
        });
    }
}

// ===== ОБНОВЛЕНИЕ МУЛЬТИКЛАССА =====
function updateMulticlass() {
    const multiclassSelect = document.getElementById('multiclassSelect');
    
    multiclassSelect.innerHTML = '<option value="">— Без мультикласса —</option>';
    
    allSubclasses.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        multiclassSelect.appendChild(option);
    });
}

// ===== ЗАГРУЗКА В UI =====
function loadCharacterToUI() {
    // Точки
    document.querySelectorAll('.dots').forEach(element => {
        const field = element.getAttribute('data-field');
        const max = parseInt(element.dataset.max) || 5;
        const value = getValueByPath(character, field);
        const val = value !== undefined ? value : 0;
        element.dataset.value = val;
        renderDots(element, val, max);
    });

    // Поля ввода
    document.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        const value = getValueByPath(character, field);
        if (value !== undefined) {
            element.value = value;
        }
    });

    // Обновляем подклассы если выбран класс
    const classSelect = document.getElementById('classSelect');
    if (classSelect && classSelect.value && classData[classSelect.value]) {
        updateSubclasses(classSelect.value);
        if (character.subclass) {
            document.getElementById('subclassSelect').value = character.subclass;
        }
    }

    // Всегда обновляем мультикласс со всеми подклассами
    updateMulticlass();
    if (character.multiclass) {
        document.getElementById('multiclassSelect').value = character.multiclass;
    }

    // Фото
    if (character.photo) {
        const placeholder = document.getElementById('photoPlaceholder');
        if (placeholder) {
            const img = document.createElement('img');
            img.src = character.photo;
            img.alt = 'Фото персонажа';
            placeholder.innerHTML = '';
            placeholder.appendChild(img);
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.id = 'photoInput';
            input.addEventListener('change', handlePhotoUpload);
            placeholder.appendChild(input);
        }
    }

    renderDisciplines();
}

// ===== СОХРАНЕНИЕ ИЗ UI =====
function saveUIToCharacter() {
    // Точки
    document.querySelectorAll('.dots').forEach(element => {
        const field = element.getAttribute('data-field');
        const value = parseInt(element.dataset.value) || 0;
        setValueByPath(character, field, value);
    });

    // Поля ввода
    document.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(element => {
        const field = element.getAttribute('data-field');
        if (!field) return;
        setValueByPath(character, field, element.value);
    });

    saveDisciplines();
}

// ===== ФОТО =====
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const photoData = event.target.result;
        character.photo = photoData;
        const placeholder = document.getElementById('photoPlaceholder');
        if (placeholder) {
            placeholder.innerHTML = '';
            const img = document.createElement('img');
            img.src = photoData;
            img.alt = 'Фото персонажа';
            placeholder.appendChild(img);
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.id = 'photoInput';
            input.addEventListener('change', handlePhotoUpload);
            placeholder.appendChild(input);
        }
        saveToLocalStorage();
    };
    reader.readAsDataURL(file);
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
            <input type="number" min="0" max="5" placeholder="Ур." value="${disc.level}" data-discipline-level="${index}">
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
    localStorage.setItem('survivalCompany', JSON.stringify(character));
    alert('💾 Персонаж сохранен!');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('survivalCompany');
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
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();

    // Класс → обновление подклассов
    document.getElementById('classSelect')?.addEventListener('change', function() {
        const selected = this.value;
        updateSubclasses(selected);
        if (selected && classData[selected]) {
            character.class = selected;
            character.subclass = '';
        }
        saveUIToCharacter();
    });

    // Подкласс
    document.getElementById('subclassSelect')?.addEventListener('change', function() {
        character.subclass = this.value;
        saveUIToCharacter();
    });

    // Мультикласс
    document.getElementById('multiclassSelect')?.addEventListener('change', function() {
        character.multiclass = this.value;
        saveUIToCharacter();
    });

    // Кнопка сохранения
    document.getElementById('saveBtn')?.addEventListener('click', saveToLocalStorage);
    
    // Кнопка добавления дисциплины
    document.getElementById('addDisciplineBtn')?.addEventListener('click', addDiscipline);

    // Загрузка фото
    document.getElementById('photoInput')?.addEventListener('change', handlePhotoUpload);

    // Экспорт
    document.getElementById('exportBtn')?.addEventListener('click', function() {
        saveUIToCharacter();
        const dataStr = JSON.stringify(character, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'survival_company.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Импорт
    document.getElementById('importBtn')?.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
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

    // Автосохранение при изменении полей
    document.querySelectorAll('input, select, textarea').forEach(function(element) {
        element.addEventListener('input', function() { saveUIToCharacter(); });
        element.addEventListener('change', function() { saveUIToCharacter(); });
    });

    if (character.disciplines.length === 0) {
        character.disciplines.push({ name: '', level: 0 });
    }
    renderDisciplines();
    loadCharacterToUI();
});