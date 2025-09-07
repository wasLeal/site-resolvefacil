// Arquivo: /netlify/functions/criar-pagamento.js (Versão Múltiplos Produtos)

const allowedOrigins = [
    'https://www.resolvefacil.online',
    'https://resolvefacil.online'
];

// --- NOSSO CATÁLOGO DE PRODUTOS ---
const catalogoProdutos = {
    'curriculo_pago': {
        descricao: "Acesso ao Gerador de Currículo Profissional",
        valor: 5.99
    },
    'contrato_terreno': {
        descricao: "Acesso ao Gerador de Contrato de Terreno",
        valor: 16.99
    }
    // Para adicionar novos produtos no futuro, basta adicionar um novo bloco aqui.
};

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
        const { productId, name, email, cpf } = JSON.parse(event.body);

        // Validação dos dados recebidos
        if (!productId || !name || !email || !cpf) {
            return { statusCode: 400, headers: headers, body: 'Dados incompletos (ID do produto, nome, e-mail e CPF são obrigatórios).' };
        }

        // Busca o produto no nosso catálogo
        const produto = catalogoProdutos[productId];

        // Se o produto não for encontrado no catálogo, retorna um erro
        if (!produto) {
            console.error("Tentativa de compra com productId inválido:", productId);
            return { statusCode: 404, headers: headers, body: 'Produto não encontrado.' };
        }

        const dadosDaCobranca = {
            billingType: "PIX",
            value: produto.valor, // Pega o valor do catálogo
            dueDate: new Date().toISOString().split('T')[0],
            description: produto.descricao, // Pega a descrição do catálogo
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