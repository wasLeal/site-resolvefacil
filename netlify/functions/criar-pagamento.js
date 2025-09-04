// Arquivo: /netlify/functions/criar-pagamento.js (Versão Final para Asaas)

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
        const { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers, body: 'E-mail é obrigatório.' };
        }

        // A API da Asaas requer um CPF para criar um cliente.
        // Como não pedimos isso no formulário, usaremos um CPF genérico válido para testes.
        const cpfCnpjGenerico = "51333957053"; 

        const dadosDaCobranca = {
            billingType: "PIX",
            value: 3.99, // PREÇO FINAL DO PRODUTO
            dueDate: new Date().toISOString().split('T')[0], // Vencimento para hoje
            description: "Acesso ao Gerador de Currículo Profissional",
            customer: {
                name: "Novo Cliente ResolveFácil",
                email: email,
                cpfCnpj: cpfCnpjGenerico
            },
            redirectUrl: "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html"
        };

        const response = await fetch('https://sandbox.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY
            },
            body: JSON.stringify(dadosDaCobranca)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Erro da API Asaas:", error);
            throw new Error('Falha ao criar cobrança na Asaas.');
        }

        const cobranca = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ checkout_url: cobranca.invoiceUrl })
        };

    } catch (error) {
        console.error("Erro na função criar-pagamento:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Erro interno ao processar o pagamento.' })
        };
    }
};