/**
 * Mapper pour convertir les données du formulaire en paramètres d'URL LeBonCoin
 */

/**
 * Génère une URL LeBonCoin à partir des données du formulaire
 * @param {Object} data - Données du formulaire
 * @returns {string} URL complète pour LeBonCoin
 */
function normalizeNumberInput(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
        return undefined;
    }
    const normalized = trimmed.replace(/\s+/g, '');
    return normalized.length > 0 ? normalized : undefined;
}

function formatRange(minValue, maxValue) {
    const min = normalizeNumberInput(minValue);
    const max = normalizeNumberInput(maxValue);

    if (!min && !max) {
        return undefined;
    }
    if (min && max) {
        return `${min}-${max}`;
    }
    if (min) {
        return `${min}-`;
    }
    return `-${max}`;
}

function parseRangeSelection(values) {
    const numericValues = [];
    let openEnded = false;

    const pushValue = (entry) => {
        if (entry === undefined || entry === null) {
            return;
        }
        const raw = String(entry).trim();
        if (!raw) {
            return;
        }

        if (raw.endsWith('+')) {
            openEnded = true;
            const base = raw.slice(0, -1).trim();
            if (base) {
                const num = Number(base);
                if (Number.isFinite(num)) {
                    numericValues.push(num);
                }
            }
            return;
        }

        if (raw.includes(',')) {
            raw.split(',').forEach(pushValue);
            return;
        }

        if (raw.includes('-')) {
            const [minRaw, maxRaw] = raw.split('-').map((part) => part.trim());
            if (minRaw) {
                const min = Number(minRaw);
                if (Number.isFinite(min)) {
                    numericValues.push(min);
                }
            }
            if (maxRaw) {
                const max = Number(maxRaw);
                if (Number.isFinite(max)) {
                    numericValues.push(max);
                }
            }
            return;
        }

        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            numericValues.push(numeric);
        }
    };

    if (Array.isArray(values)) {
        values.forEach(pushValue);
    } else {
        pushValue(values);
    }

    if (numericValues.length === 0) {
        return undefined;
    }

    return {
        min: Math.min(...numericValues),
        max: openEnded ? undefined : Math.max(...numericValues)
    };
}

function formatRangeFromSelection(values) {
    const range = parseRangeSelection(values);
    if (!range) {
        return undefined;
    }
    if (range.max !== undefined && range.min === range.max) {
        return String(range.min);
    }
    return formatRange(range.min, range.max);
}

function mapToLeboncoinURL(data) {
    const baseUrl = 'https://www.leboncoin.fr/recherche';
    const params = new URLSearchParams();
    
    // Catégorie immobilier
    params.append('category', '9'); // 9 = ventes_immobilieres par défaut
    
    // Type de transaction (vente/location)
    if (data.bien === 'vente') {
        params.set('category', '9'); // Vente immobilière
    } else if (data.bien === 'location') {
        params.set('category', '10'); // Location
    }
    
    // Type de bien immobilier
    // 1 = Appartement, 2 = Maison, 3 = Terrain, 4 = Parking
    const realEstateTypeMap = {
        'appartement': '1',
        'maison': '2',
        'terrain': '3',
        'parking': '4'
    };
    if (data.type_bien) {
        const typeBien = Array.isArray(data.type_bien) ? data.type_bien : [data.type_bien];
        const realEstateTypes = typeBien
            .map(type => realEstateTypeMap[type])
            .filter(type => type);
        
        if (realEstateTypes.length > 0) {
            params.append('real_estate_type', realEstateTypes.join(','));
        }
    }
    
    // Type d'annonce (offre/demande)
    if (data.type_annonces === 'offres') {
        params.append('ad_type', 'offer');
    } else if (data.type_annonces === 'demandes') {
        params.append('ad_type', 'demand');
    }
    
    // Localisation avec rayon
    if (data.ville_data) {
        const city = data.ville_data;
        const postalCode = city.codesPostaux && city.codesPostaux.length > 0 ? city.codesPostaux[0] : '';
        const radiusKm = data.rayon ? parseInt(data.rayon, 10) : 0;
        const radiusMeters = Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm * 1000 : undefined;
        const centre = city.centre && Array.isArray(city.centre.coordinates) ? city.centre.coordinates : null;
        const lon = centre && centre.length >= 2 ? centre[0] : undefined;
        const lat = centre && centre.length >= 2 ? centre[1] : undefined;

        let locationStr = postalCode ? `${city.nom}_${postalCode}` : `${city.nom}`;
        if (
            radiusMeters !== undefined &&
            Number.isFinite(lat) &&
            Number.isFinite(lon)
        ) {
            locationStr = `${locationStr}__${lat}_${lon}_${radiusMeters}`;
        }
        params.append('locations', locationStr);
    }
    
    // Prix
    const priceRange = formatRange(data.prix_min, data.prix_max);
    if (priceRange) {
        params.append('price', priceRange);
    }
    
    // Surface habitable
    const squareRange = formatRange(data.surface_min, data.surface_max);
    if (squareRange) {
        params.append('square', squareRange);
    }
    
    // Type de vente
    const saleTypeMap = {
        'ancien': 'old',
        'neuf': 'new',
        'viager': 'viager'
    };
    if (data.type_vente) {
        const typeVente = Array.isArray(data.type_vente) ? data.type_vente : [data.type_vente];
        const saleTypes = typeVente
            .map(type => saleTypeMap[type] || type)
            .filter(type => type);
        
        if (saleTypes.length > 0) {
            params.append('immo_sell_type', saleTypes.join(','));
        }
    }
    
    // Surface du terrain
    const landPlotRange = formatRange(data.surface_terrain, data.surface_terrain_max);
    if (landPlotRange) {
        params.append('land_plot_surface', landPlotRange);
    }
    
    // Nombre de pièces
    const roomsRange = formatRangeFromSelection(data.pieces);
    if (roomsRange) {
        params.append('rooms', roomsRange);
    }
    
    // Nombre de chambres
    const bedroomsRange = formatRangeFromSelection(data.chambres);
    if (bedroomsRange) {
        params.append('bedrooms', bedroomsRange);
    }
    
    // Extérieur
    if (data.exterieur) {
        const exterieur = Array.isArray(data.exterieur) ? data.exterieur : [data.exterieur];
        const exterieurMap = {
            'balcon': 'balcony',
            'terrasse': 'terrace',
            'jardin': 'garden',
            'piscine': 'pool'
        };
        const exterieurFormatted = exterieur.map(e => exterieurMap[e] || e).join(',');
        params.append('outside_access', exterieurFormatted);
    }
    
    // Étage
    const etageMap = {
        'rdc': 'ground_floor',
        'eleve': 'upper_floor',
        'dernier': 'last_stage'
    };
    if (data.etage) {
        const etage = Array.isArray(data.etage) ? data.etage : [data.etage];
        const floorValues = etage
            .map(e => etageMap[e] || e)
            .filter(e => e);
        
        if (floorValues.length > 0) {
            params.append('floor_property', floorValues.join(','));
        }
    }
    
    // Ascenseur
    if (data.ascenseur === 'oui') {
        params.append('elevator', '1');
    }
    
    // État du bien
    const etatMap = {
        'tres_bon': '1',
        'bon': '2',
        'renove': '3',
        'rafraichir': '4',
        'travaux': '5'
    };
    if (data.etat) {
        const etat = Array.isArray(data.etat) ? data.etat : [data.etat];
        const conditionValues = etat
            .map(e => etatMap[e] || e)
            .filter(e => e);
        
        if (conditionValues.length > 0) {
            conditionValues.sort((a, b) => Number(a) - Number(b));
            params.append('global_condition', conditionValues.join(','));
        }
    }
    
    // Classe énergétique (DPE)
    if (data.dpe) {
        const dpeValues = Array.isArray(data.dpe) ? data.dpe : [data.dpe];
        const dpeMap = {
            'A': 'a',
            'B': 'b',
            'C': 'c',
            'D': 'd',
            'E': 'e',
            'F': 'f',
            'G': 'g',
            'vierge': 'v',
            'non_soumis': 'n'
        };
        const dpeFormatted = dpeValues.map(d => dpeMap[d] || d.toLowerCase()).join(',');
        params.append('energy_rate', dpeFormatted);
    }
    
    // Annonce urgente
    if (data.urgente === 'oui') {
        params.append('urgent', '1');
    }
    
    // Tri par défaut (plus récentes)
    params.append('sort_by', 'time');
    params.append('sort_order', 'desc');
    
    return `${baseUrl}?${params.toString()}`;
}
