/**
 * Mapper pour convertir les données du formulaire en paramètres d'URL LeBonCoin
 */

/**
 * Génère une URL LeBonCoin à partir des données du formulaire
 * @param {Object} data - Données du formulaire
 * @returns {string} URL complète pour LeBonCoin
 */
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
    if (data.type_bien && realEstateTypeMap[data.type_bien]) {
        params.append('real_estate_type', realEstateTypeMap[data.type_bien]);
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
        const rayon = data.rayon ? parseInt(data.rayon) * 1000 : 3000; // Convertir km en mètres
        
        // Format: NomVille_CodePostal__latitude_longitude_codeInsee_rayon
        const locationStr = `${city.nom}_${city.codesPostaux[0]}__${rayon}_${rayon}`;
        params.append('locations', locationStr);
    }
    
    // Prix
    if (data.prix_min || data.prix_max) {
        let priceRange = '';
        if (data.prix_min) priceRange += data.prix_min;
        priceRange += '-';
        if (data.prix_max) priceRange += data.prix_max;
        else priceRange += 'max';
        params.append('price', priceRange);
    }
    
    // Surface habitable
    if (data.surface_min || data.surface_max) {
        let squareRange = '';
        if (data.surface_min) squareRange += data.surface_min;
        squareRange += '-';
        if (data.surface_max) squareRange += data.surface_max;
        else squareRange += 'max';
        params.append('square', squareRange);
    }
    
    // Type de vente
    const saleTypeMap = {
        'ancien': 'old',
        'neuf': 'new',
        'viager': 'viager'
    };
    if (data.type_vente && saleTypeMap[data.type_vente]) {
        params.append('sale_type', saleTypeMap[data.type_vente]);
    }
    
    // Surface du terrain
    if (data.surface_terrain) {
        params.append('land_plot_surface', `${data.surface_terrain}-max`);
    }
    
    // Nombre de pièces
    if (data.pieces) {
        const pieces = Array.isArray(data.pieces) ? data.pieces : [data.pieces];
        const piecesFormatted = pieces.map(p => p === '8+' ? '8' : p).join(',');
        params.append('rooms', piecesFormatted);
    }
    
    // Nombre de chambres
    if (data.chambres) {
        const chambres = Array.isArray(data.chambres) ? data.chambres : [data.chambres];
        const chambresFormatted = chambres.map(c => c === '8+' ? '8' : c).join(',');
        params.append('bedrooms', chambresFormatted);
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
        'eleve': 'not_ground_floor',
        'dernier': 'last_floor'
    };
    if (data.etage && etageMap[data.etage]) {
        params.append('floor', etageMap[data.etage]);
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
    if (data.etat && etatMap[data.etat]) {
        params.append('global_condition', etatMap[data.etat]);
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
            'vierge': 'blank',
            'non_soumis': 'not_applicable'
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
