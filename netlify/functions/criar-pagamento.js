// Arquivo: /netlify/functions/criar-pagamento.js (Versão para Teste com R$ 1,00)

// Domínio da sua loja. ESSENCIAL para a segurança.
const allowedOrigin = 'https://www.resolvefacil.online';

exports.handler = async function(event) {
    // Headers de permissão (CORS) para permitir a comunicação entre os sites
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Responde à requisição de verificação do navegador
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers, body: 'E-mail é obrigatório.' };
        }

        const dadosDaPreferencia = {
            items: [{
                title: 'Gerador de Currículo Profissional',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 1.00 // <-- VALOR AJUSTADO PARA O TESTE
            }],
            payer: {
                email: email
            },
            back_urls: {
                success: 'https://resolvefacil-curriculos.netlify.app/curriculo-pago.html',
                failure: 'https://www.resolvefacil.online/loja.html',
            },
            auto_return: 'approved',
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            },
            body: JSON.stringify(dadosDaPreferencia)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Erro do Mercado Pago:", error);
            throw new Error('Falha ao se comunicar com o Mercado Pago.');
        }

        const preference = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ checkout_url: preference.init_point })
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