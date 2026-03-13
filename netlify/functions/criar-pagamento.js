// Arquivo: /netlify/functions/criar-pagamento.js (Versão Múltiplos Produtos + Serviços de Pesquisa)

const allowedOrigins = [
    'https://www.resolvefacil.online',
    'https://resolvefacil.online'
];

// --- NOSSO CATÁLOGO DE PRODUTOS E SERVIÇOS ---
const catalogoProdutos = {
    // Produtos Digitais (Geradores)
    'curriculo_pago': {
        descricao: "Acesso ao Gerador de Currículo Profissional",
        valor: 5.99
    },
    'contrato_terreno': {
        descricao: "Acesso ao Gerador de Contrato de Terreno",
        valor: 16.99
    },
    'contrato_aluguel': {
        descricao: "Acesso ao Gerador de Contrato de Aluguel",
        valor: 16.99
    },
    // NOVOS SERVIÇOS DE PESQUISA ADICIONADOS ABAIXO (Preservando os antigos intactos)
    'pesquisa_completa': {
        descricao: "Relatório de Localização Completa (Pessoa Física)",
        valor: 149.00
    },
    'pesquisa_situacao': {
        descricao: "Relatório de Situação Pública (Processos/Dívidas)",
        valor: 97.00
    },
    'pesquisa_empresarial': {
        descricao: "Relatório de Consulta Empresarial (CNPJ)",
        valor: 79.00
    }
};

exports.handler = async function(event) {
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // CORS - Permite que apenas o seu site oficial faça requisições aqui
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
        // ATUALIZAÇÃO CIRÚRGICA: Adicionamos o 'targetData' aqui. 
        // Se a compra for de currículo/contrato, ele será 'undefined' e não atrapalhará em nada.
        const { productId, name, email, cpf, targetData } = JSON.parse(event.body);

        // Validação dos dados recebidos (exatamente igual ao original)
        if (!productId || !name || !email || !cpf) {
            return { statusCode: 400, headers: headers, body: 'Dados incompletos (ID do produto, nome, e-mail e CPF são obrigatórios).' };
        }

        // Busca o produto/serviço no nosso catálogo
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

        // ==========================================================
        // PASSO CIRÚRGICO FUTURO (ETAPA 2 - FIREBASE)
        // O código do Firebase entrará exatamente aqui na próxima etapa.
        // ==========================================================

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