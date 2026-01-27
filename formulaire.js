// Slider de rayon
const rayonSlider = document.getElementById('rayon');
const rayonValue = document.getElementById('rayon-value');

function updateRayonValue() {
    const value = rayonSlider.value;
    rayonValue.textContent = value + ' km';
}

rayonSlider.addEventListener('input', updateRayonValue);

// Initialiser la valeur au chargement
updateRayonValue();

// Autocomplétion des villes avec l'API du gouvernement français
const villeInput = document.getElementById('ville');
const villeCodeInput = document.getElementById('ville_code');
const autocompleteList = document.getElementById('autocomplete-list');

let debounceTimer;
let selectedCityData = null;

villeInput.addEventListener('input', function() {
    const query = this.value.trim();

    // Réinitialiser le code de ville si l'utilisateur modifie le texte
    villeCodeInput.value = '';
    selectedCityData = null;

    // Effacer le timer précédent
    clearTimeout(debounceTimer);

    if (query.length < 2) {
        autocompleteList.classList.remove('show');
        autocompleteList.innerHTML = '';
        return;
    }

    // Attendre 300ms après que l'utilisateur arrête de taper
    debounceTimer = setTimeout(() => {
        searchCities(query);
    }, 300);
});

async function searchCities(query) {
    autocompleteList.innerHTML = '<div class="autocomplete-loading">Recherche en cours...</div>';
    autocompleteList.classList.add('show');

    try {
        // Utiliser l'API geo.api.gouv.fr pour rechercher uniquement les communes
        const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&boost=population&limit=10`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la recherche');
        }

        const cities = await response.json();

        if (cities.length === 0) {
            autocompleteList.innerHTML = '<div class="autocomplete-no-results">Aucune ville trouvée</div>';
            return;
        }

        displayCities(cities);

    } catch (error) {
        console.error('Erreur complète:', error);

        // Fallback: utiliser des données de test si l'API ne fonctionne pas
        const testCities = [
            {nom: 'Paris', code: '75056', codesPostaux: ['75001'], codeDepartement: '75', population: 2161000},
            {nom: 'Lyon', code: '69123', codesPostaux: ['69001'], codeDepartement: '69', population: 516092},
            {nom: 'Marseille', code: '13055', codesPostaux: ['13001'], codeDepartement: '13', population: 869815},
            {nom: 'Toulouse', code: '31555', codesPostaux: ['31000'], codeDepartement: '31', population: 479553},
            {nom: 'Nice', code: '06088', codesPostaux: ['06000'], codeDepartement: '06', population: 340017}
        ].filter(city => city.nom.toLowerCase().includes(query.toLowerCase()));

        if (testCities.length > 0) {
            displayCities(testCities);
        } else {
            autocompleteList.innerHTML = '<div class="autocomplete-no-results">Service temporairement indisponible. Essayez: Paris, Lyon, Marseille, Toulouse, Nice</div>';
        }
    }
}

function displayCities(cities) {
    autocompleteList.innerHTML = '';

    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';

        const cityName = document.createElement('div');
        cityName.className = 'city-name';
        cityName.textContent = city.nom;

        const cityDetails = document.createElement('div');
        cityDetails.className = 'city-details';

        // Construire les détails de la ville
        let detailsText = '';
        if (city.codesPostaux && city.codesPostaux.length > 0) {
            detailsText += city.codesPostaux[0];
        }
        if (city.codeDepartement) {
            detailsText += detailsText ? ` - Dép. ${city.codeDepartement}` : `Dép. ${city.codeDepartement}`;
        }
        if (city.population) {
            detailsText += ` - ${city.population.toLocaleString('fr-FR')} hab.`;
        }

        cityDetails.textContent = detailsText;

        item.appendChild(cityName);
        item.appendChild(cityDetails);

        item.addEventListener('click', () => {
            selectCity(city);
        });

        autocompleteList.appendChild(item);
    });
}

function selectCity(city) {
    // Remplir le champ visible avec le nom de la ville
    villeInput.value = city.nom;

    // Stocker le code INSEE de la ville dans le champ caché
    villeCodeInput.value = city.code;

    // Stocker les données complètes de la ville
    selectedCityData = city;

    // Fermer la liste
    autocompleteList.classList.remove('show');
    autocompleteList.innerHTML = '';
}

// Fermer la liste si on clique en dehors
document.addEventListener('click', function(e) {
    if (!e.target.closest('.autocomplete-container')) {
        autocompleteList.classList.remove('show');
        autocompleteList.innerHTML = '';
    }
});

// Empêcher la saisie d'adresses complètes
villeInput.addEventListener('keydown', function(e) {
    // Bloquer les chiffres pour éviter les numéros de rue
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        return false;
    }
});

// Validation du formulaire
document.getElementById('immobilierForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Vérifier qu'une ville a été sélectionnée
    if (!villeCodeInput.value || !selectedCityData) {
        alert('Veuillez sélectionner une ville dans la liste proposée.');
        villeInput.focus();
        return;
    }

    // Récupérer toutes les données du formulaire
    const formData = new FormData(this);
    const data = {};

    // Convertir FormData en objet
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Si la clé existe déjà, convertir en tableau
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    // Ajouter les données complètes de la ville
    data.ville_data = selectedCityData;

    // Afficher les données dans la console
    console.log('Données du formulaire:', data);

    // Afficher un message de confirmation
    alert(`Recherche lancée pour ${selectedCityData.nom} !\nConsultez la console pour voir les données.`);
});
