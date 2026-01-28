const fs = require('fs');
eval(fs.readFileSync('mapper.js', 'utf8'));

const payload = {
  ville_display: 'Saint-Étienne',
  ville: '42218',
  rayon: '3',
  bien: 'vente',
  type_bien: 'appartement',
  type_annonces: 'offres',
  prix_min: '',
  prix_max: '80000',
  surface_min: '',
  surface_max: '100',
  chambres: '3,4',
  type_vente: ['ancien', 'neuf'],
  etat: ['tres_bon', 'bon', 'renove'],
  ville_data: {
    nom: 'Saint-Étienne',
    code: '42218',
    codesPostaux: ['42000']
  }
};

console.log('Payload type_vente:', payload.type_vente);
console.log('Payload etat:', payload.etat);
const url = mapToLeboncoinURL(payload);
console.log('\nURL générée:');
console.log(url);
console.log('\n--- Paramètres ---');
const params = new URL(url).searchParams;
for (const [key, value] of params.entries()) {
  console.log(`${key} = ${value}`);
}
console.log('\nimmo_sell_type présent?', params.has('immo_sell_type'));
console.log('global_condition présent?', params.has('global_condition'));
