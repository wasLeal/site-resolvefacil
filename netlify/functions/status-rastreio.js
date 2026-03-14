const admin = require('firebase-admin');

if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Erro Firebase Init:", error.message);
    }
}

exports.handler = async function(event) {
    // Headers para permitir que o navegador leia a resposta (CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

    try {
        const id = event.queryStringParameters.id;
        
        if (!id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "ID não fornecido" }) };
        }

        if (!admin.apps.length) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Firebase não conectado" }) };
        }

        const doc = await admin.firestore().collection('pedidos_pesquisa').doc(id).get();
        
        if (!doc.exists) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: "Pedido não encontrado" }) };
        }

        // Retorna a data exata em que o Pix foi gerado lá no Firebase
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                dataPedido: doc.data().dataPedido,
                status: doc.data().status
            })
        };

    } catch (error) {
        console.error("Erro no status-rastreio:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};