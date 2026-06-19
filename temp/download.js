const axios = require('axios');
const fs = require('fs');
async function run() {
  try {
    // Try to fetch from Alf-Anas/batas-administrasi-indonesia
    // Actually, getting just Bandar Lampung is hard from the big geojson.
    // Let's check chmdznr/indonesia-geojson 
    // Wait, the API for overpass with osmtogeojson is better.
    console.log('Will test overpass');
  } catch(e) {
    console.error(e);
  }
}
run();
