const axios = require('axios');
require('dotenv').config();

const pagarmeApi = axios.create({
    baseURL: 'https://api.pagar.me/core/v5',
    auth: {
        username: process.env.PAGARME_API_KEY,
        password: ''
    },
    headers: {
        'Content-Type': 'application/json'
    }
});

module.exports = { pagarmeApi };
