// Arquivo: /netlify/functions/criar-pagamento.js (Versão de DIAGNÓSTICO FORÇADO)

const allowedOrigins = [
    'https://www.resolvefacil.online',
    'https://resolvefacil.online'
];

exports.handler = async function(event) {
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: headers, body: 'Method Not Allowed' };
    }

    try {
        // ============ INÍCIO DO LOG DE DIAGNÓSTICO ============
        console.log("-----------------------------------------");
        console.log("--- DIAGNÓSTICO DE DADOS RECEBIDOS ---");
        console.log("HORÁRIO DO TESTE:", new Date().toISOString());
        console.log("CONTEÚDO BRUTO RECEBIDO (event.body):", event.body);
        console.log("-----------------------------------------");
        // ============ FIM DO LOG DE DIAGNÓSTICO ============

        const { name, email, cpf } = JSON.parse(event.body);
        if (!name || !email || !cpf) {
            return { statusCode: 400, headers: headers, body: 'Nome, e-mail e CPF são obrigatórios.' };
        }

        const dadosDaCobranca = {
            billingType: "PIX",
            value: 5.99,
            dueDate: new Date().toISOString().split('T')[0],
            description: "Acesso ao Gerador de Currículo Profissional",
            customer: {
                name: name,
                email: email,
                cpfCnpj: cpf
            }
        };

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
            headers: headers,
            body: JSON.stringify({ checkout_url: cobranca.invoiceUrl })
        };

    } catch (error) {
        console.error("ERRO NA EXECUÇÃO DA FUNÇÃO:", error.message);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ message: 'Erro interno ao processar o pagamento.' })
        };
    }
};