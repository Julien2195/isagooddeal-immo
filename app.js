/**
 * Application principale - Gestion du formulaire de recherche immobilière
 */

// Variables globales
let selectedCityData = null;
let debounceTimer;
const WEBHOOK_QUERY_PARAM = 'webhook';

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initSlider();
    initCityAutocomplete();
    initFormSubmit();
});

/**
 * Initialisation du slider de rayon
 */
function initSlider() {
    const rayonSlider = document.getElementById('rayon');
    const rayonValue = document.getElementById('rayon-value');

    function updateRayonValue() {
        const value = rayonSlider.value;
        rayonValue.textContent = value + ' km';
        
        // Mettre à jour la progression du slider
        const progress = (value / 200) * 100;
        rayonSlider.style.setProperty('--slider-progress', progress + '%');
    }

    rayonSlider.addEventListener('input', updateRayonValue);
    
    // Initialiser la valeur au chargement
    updateRayonValue();
}

/**
 * Initialisation de l'autocomplétion des villes
 */
function initCityAutocomplete() {
    const villeInput = document.getElementById('ville');
    const villeCodeInput = document.getElementById('ville_code');
    const autocompleteList = document.getElementById('autocomplete-list');

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

    // Empêcher la saisie d'adresses complètes (bloquer les chiffres)
    villeInput.addEventListener('keydown', function(e) {
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            return false;
        }
    });

    // Fermer la liste si on clique en dehors
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-container')) {
            autocompleteList.classList.remove('show');
            autocompleteList.innerHTML = '';
        }
    });
}

/**
 * Recherche des villes via l'API gouvernement
 */
async function searchCities(query) {
    const autocompleteList = document.getElementById('autocomplete-list');
    
    autocompleteList.innerHTML = '<div class="autocomplete-loading">Recherche en cours...</div>';
    autocompleteList.classList.add('show');
    
    try {
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

/**
 * Affiche la liste des villes
 */
function displayCities(cities) {
    const autocompleteList = document.getElementById('autocomplete-list');
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

/**
 * Sélectionne une ville dans la liste
 */
function selectCity(city) {
    const villeInput = document.getElementById('ville');
    const villeCodeInput = document.getElementById('ville_code');
    const autocompleteList = document.getElementById('autocomplete-list');
    
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

/**
 * Résout l'URL du webhook n8n depuis le paramètre d'URL, une variable globale ou l'attribut data-webhook-url.
 */
function resolveWebhookUrl() {
    const queryParamUrl = new URLSearchParams(window.location.search).get(WEBHOOK_QUERY_PARAM);
    if (queryParamUrl && queryParamUrl.trim()) {
        return queryParamUrl.trim();
    }

    if (window.N8N_WEBHOOK_URL) {
        return String(window.N8N_WEBHOOK_URL).trim();
    }

    const form = document.getElementById('immobilierForm');
    if (form) {
        const isLocal =
            window.location.protocol === 'file:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0';

        if (isLocal && form.dataset.webhookUrlTest) {
            return form.dataset.webhookUrlTest.trim();
        }

        if (form.dataset.webhookUrl) {
            return form.dataset.webhookUrl.trim();
        }
    }

    return '';
}

/**
 * Envoie les données vers un webhook n8n si une URL est configurée.
 */
async function sendToWebhook(formData, data, leboncoinUrl) {
    const webhookUrl = resolveWebhookUrl();
    if (!webhookUrl) {
        console.info('Webhook n8n non configuré (data-webhook-url, window.N8N_WEBHOOK_URL ou ?webhook=...).');
        return { sent: false, reason: 'missing' };
    }

    if (!/\/webhook(-test)?\//.test(webhookUrl)) {
        console.warn('L\'URL du webhook n8n ne ressemble pas à un endpoint webhook:', webhookUrl);
    }

    const payload = new FormData();
    for (const [key, value] of formData.entries()) {
        payload.append(key, value);
    }

    payload.append('ville_data', JSON.stringify(data.ville_data || null));
    payload.append('payload_json', JSON.stringify(data));
    payload.append('leboncoin_url', leboncoinUrl || '');
    payload.append('submitted_at', new Date().toISOString());
    payload.append('source', 'form-lbc');

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            body: payload,
            mode: 'no-cors',
            keepalive: true
        });
        console.log('Données envoyées au webhook n8n.');
        return { sent: true };
    } catch (error) {
        console.error('Erreur envoi webhook n8n:', error);
        return { sent: false, reason: 'network' };
    }
}

/**
 * Initialisation de la soumission du formulaire
 */
function initFormSubmit() {
    document.getElementById('immobilierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const villeCodeInput = document.getElementById('ville_code');
        const villeInput = document.getElementById('ville');
        
        // Vérifier qu'une ville a été sélectionnée
        if (!villeCodeInput.value || !selectedCityData) {
            alert('Veuillez sélectionner une ville dans la liste proposée.');
            villeInput.focus();
            return;
        }
        
        // Récupérer toutes les données du formulaire
        const formData = new FormData(this);
        const data = collectFormData(formData);
        
        // Ajouter les données complètes de la ville
        data.ville_data = selectedCityData;
        
        // Mapper vers les paramètres LeBonCoin
        const leboncoinUrl = mapToLeboncoinURL(data);
        data.leboncoin_url = leboncoinUrl;

        // Envoyer les données vers le webhook n8n (si configuré)
        void sendToWebhook(formData, data, leboncoinUrl);
        
        // Afficher les données dans la console
        console.log('Données du formulaire:', data);
        console.log('URL LeBonCoin générée:', leboncoinUrl);
        
        // Afficher l'URL et proposer de l'ouvrir
        const openUrl = confirm(`URL LeBonCoin générée :\n\n${leboncoinUrl}\n\nVoulez-vous ouvrir cette recherche ?`);
        if (openUrl) {
            window.open(leboncoinUrl, '_blank');
        }
    });
}

/**
 * Collecte les données du formulaire
 */
function collectFormData(formData) {
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
    
    return data;
}
