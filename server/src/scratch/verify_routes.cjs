const axios = require('axios');
const cookie = 'connect.sid=...'; // I don't have the real cookie, but I can check 404 vs 401

async function checkRoute() {
    try {
        console.log('--- Checking /api/admin/projects ---');
        const res = await axios.get('http://localhost:4000/api/admin/projects', {
            validateStatus: () => true
        });
        console.log('Status GET:', res.status);
        console.log('Body GET:', res.data);

        console.log('\n--- Checking PATCH /api/admin/projects/invalid_id/archive ---');
        const res2 = await axios.patch('http://localhost:4000/api/admin/projects/69e0335139dc0706c2abe573/archive', {}, {
            validateStatus: () => true
        });
        console.log('Status PATCH:', res2.status);
        console.log('Body PATCH:', res2.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkRoute();
