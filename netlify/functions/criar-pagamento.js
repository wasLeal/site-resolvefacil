// Arquivo: /netlify/functions/criar-pagamento.js (Versão com CPF de Teste Correto)

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

        // ======================================================
        // INÍCIO DA CORREÇÃO: USANDO UM CPF VÁLIDO PARA O AMBIENTE SANDBOX DA ASAAS
        // ======================================================
        const cpfCnpjDeTeste = "24313511031"; 
        // ======================================================
        // FIM DA CORREÇÃO
        // ======================================================

        const dadosDaCobranca = {
            billingType: "PIX",
            value: 1.00, // Preço de teste
            dueDate: new Date().toISOString().split('T')[0],
            description: "Acesso ao Gerador de Currículo Profissional",
            customer: {
                name: "Cliente de Teste",
                email: email,
                cpfCnpj: cpfCnpjDeTeste
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