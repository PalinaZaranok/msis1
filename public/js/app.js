const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {existsSync} = require("node:fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/css/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../css', filename);

    if (existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/css');
        res.sendFile(filePath);
    } else {
        res.status(404).send('CSS file not found');
    }
});

app.get('/js/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../js', filename);

    if (existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/js');
        res.sendFile(filePath);
    } else {
        res.status(404).send('JS file not found');
    }
});

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../index.html')
    res.sendFile(filePath);
});

app.post('/analyze', (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }

        const { extractHalsteadTokens, getParseTree } = require('./temp.js');

        const tree = getParseTree(code);
        const { operators, operands } = extractHalsteadTokens(tree.rootNode);

        res.json({
            operands: operands,
            operators: operators,
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Error analyzing code: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});