const India = require('@svg-maps/india');

India.locations.forEach(loc => {
    const coords = loc.path.match(/[\d.]+/g).map(Number);
    const xCoords = coords.filter((_, i) => i % 2 === 0);
    const yCoords = coords.filter((_, i) => i % 2 === 1);
    const centerX = Math.round((Math.min(...xCoords) + Math.max(...xCoords)) / 2);
    const centerY = Math.round((Math.min(...yCoords) + Math.max(...yCoords)) / 2);
    console.log(`        '${loc.id}': { x: ${centerX}, y: ${centerY} },           // ${loc.name}`);
});
