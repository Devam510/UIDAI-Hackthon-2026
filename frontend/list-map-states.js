const India = require('@svg-maps/india');

console.log('Total states in map:', India.locations.length);
console.log('\nMap State Names:');
India.locations.forEach(loc => {
    console.log(`${loc.id.toUpperCase().padEnd(4)} - ${loc.name}`);
});
