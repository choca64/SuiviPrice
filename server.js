const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.post('/save', (req, res) => {
    fs.writeFileSync('data.json', JSON.stringify(req.body, null, 2), 'utf-8');
    res.status(200).send({ message: 'Data saved successfully!' });
});

// Utilisation d'un port dynamique avec une valeur par défaut
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
