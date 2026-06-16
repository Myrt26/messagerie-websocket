const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;  // Important pour Render

// Servir les fichiers du dossier public
app.use(express.static(path.join(__dirname, '../public')));

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Démarrer le serveur HTTP
const server = app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Stocker tous les clients connectés
const clients = new Map();

wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(clientId, ws);
    
    console.log(`🔵 Nouveau client connecté: ${clientId}`);
    console.log(`👥 Clients connectés: ${clients.size}`);
    
    // Envoyer l'ID au client
    ws.send(JSON.stringify({
        type: 'init',
        clientId: clientId,
        message: 'Bienvenue dans la messagerie!'
    }));

    // Recevoir un message
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Ajouter des infos au message
            const messageData = {
                ...data,
                clientId: clientId,
                timestamp: new Date().toISOString()
            };
            
            console.log(`💬 Message de ${clientId}: ${data.text}`);
            
            // Envoyer à TOUS les clients
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(messageData));
                }
            });
        } catch (error) {
            console.error('❌ Erreur:', error);
        }
    });

    // Déconnexion
    ws.on('close', () => {
        console.log(`🔴 Client déconnecté: ${clientId}`);
        clients.delete(clientId);
        
        // Prévenir les autres
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'disconnect',
                    clientId: clientId,
                    message: `Client ${clientId} a quitté`
                }));
            }
        });
    });
});

console.log('🚀 Serveur WebSocket prêt!');