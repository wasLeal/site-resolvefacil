// Arquivo: /netlify/functions/criar-pagamento.js (Versão Original com Logs Visíveis)

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
            console.error("Erro: E-mail não foi fornecido no corpo da requisição.");
            return { statusCode: 400, headers, body: 'E-mail é obrigatório.' };
        }

        const dadosDaCobranca = {
            billingType: "PIX",
            value: 1.00,
            dueDate: new Date().toISOString().split('T')[0],
            description: "Acesso ao Gerador de Currículo Profissional",
            customer: {
                name: "Cliente ResolveFácil", // Nome genérico para o teste
                email: email,
                cpfCnpj: "24313511031" // CPF de teste que você já tinha
            }
        };

        const response = await fetch('https://sandbox.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY // Usando a NOVA chave de API
            },
            body: JSON.stringify(dadosDaCobranca)
        });

        if (!response.ok) {
            const error = await response.json();
            // ESTE É O LOG QUE ANTES NÃO APARECIA E AGORA VAI APARECER
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