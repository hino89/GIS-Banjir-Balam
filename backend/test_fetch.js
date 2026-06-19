fetch('http://localhost:5000/api/layer/banjir').then(r => r.json()).then(d => console.log(d.features?.length)).catch(console.error);
