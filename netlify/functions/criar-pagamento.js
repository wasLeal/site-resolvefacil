// Arquivo: /netlify/functions/criar-pagamento.js (Versão de Produção)

const allowedOrigin = 'https://www.resolvefacil.online';

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { name, email, cpf } = JSON.parse(event.body);
        if (!name || !email || !cpf) {
            return { statusCode: 400, headers, body: 'Nome, e-mail e CPF são obrigatórios.' };
        }

        const dadosDaCobranca = {
            billingType: "PIX",
            // --- ALTERAÇÃO: Preço Final ---
            value: 5.99,
            dueDate: new Date().toISOString().split('T')[0],
            description: "Acesso ao Gerador de Currículo Profissional",
            customer: {
                name: name,
                email: email,
                cpfCnpj: cpf
            }
        };

        // --- ALTERAÇÃO: URL de Produção ---
        const response = await fetch('https://www.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY
            },
            body: JSON.stringify(dadosDaCobranca)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("ERRO RETORNADO PELA API ASAAS:", error);
            throw new Error('Falha ao criar cobrança na Asaas.');
        }

        const cobranca = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ checkout_url: cobranca.invoiceUrl })
        };

    } catch (error) {
        console.error("ERRO NA EXECUÇÃO DA FUNÇÃO:", error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Erro interno ao processar o pagamento.' })
        };
    }
};