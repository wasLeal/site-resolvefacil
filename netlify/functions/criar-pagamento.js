// Arquivo: /netlify/functions/criar-pagamento.js (Versão Final - Híbrida com Firebase)
// Esta versão preserva 100% dos produtos antigos e adiciona os novos serviços.

const allowedOrigins = [
    'https://www.resolvefacil.online',
    'https://resolvefacil.online'
];

// --- INICIALIZAÇÃO DO FIREBASE ---
const admin = require('firebase-admin');

// Inicializa o Firebase apenas se ainda não houver uma instância e se a chave estiver presente
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase conectado com sucesso via Function!");
    } catch (error) {
        console.error("Erro crítico ao inicializar Firebase:", error);
    }
}

// --- NOSSO CATÁLOGO DE PRODUTOS (UNIFICADO) ---
const catalogoProdutos = {
    // Produtos Antigos (Mantidos Intactos para não parar o site)
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
    
    // Novos Serviços de Pesquisa (Margem de lucro superior a 50%)
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

    // Configuração de CORS
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
        // Captura os dados enviados pelo site
        const { productId, name, email, cpf, targetData } = JSON.parse(event.body);

        // Validação de campos obrigatórios
        if (!productId || !name || !email || !cpf) {
            return { statusCode: 400, headers: headers, body: 'Dados incompletos (ID do produto, nome, e-mail e CPF são obrigatórios).' };
        }

        const produto = catalogoProdutos[productId];

        if (!produto) {
            console.error("Tentativa de compra com productId inválido:", productId);
            return { statusCode: 404, headers: headers, body: 'Produto não encontrado.' };
        }

        // 1. GERAÇÃO DA COBRANÇA NA ASAAS
        const dadosDaCobranca = {
            billingType: "PIX",
            value: produto.valor,
            dueDate: new Date().toISOString().split('T')[0],
            description: produto.descricao,
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
            const errorData = await response.json();
            console.error("Erro retornado pela Asaas:", errorData);
            throw new Error('Falha ao criar cobrança na Asaas.');
        }

        const cobranca = await response.json();

        // 2. SALVAMENTO NO FIREBASE (APENAS PARA PESQUISAS)
        // Se o produto for de pesquisa e o Firebase estiver ativo, guardamos a "ficha do alvo"
        if (productId.startsWith('pesquisa_') && targetData && admin.apps.length) {
            try {
                const db = admin.firestore();
                // Usamos o ID da cobrança da Asaas como nome do documento para facilitar o rastreio
                await db.collection('pedidos_pesquisa').doc(cobranca.id).set({
                    cobrancaId: cobranca.id,
                    servico: produto.descricao,
                    servicoId: productId,
                    valor: produto.valor,
                    cliente: {
                        nome: name,
                        email: email,
                        cpf: cpf
                    },
                    alvo: targetData,
                    status: 'aguardando_pagamento',
                    dataPedido: new Date().toISOString()
                });
                console.log(`Sucesso: Dados da pesquisa ${cobranca.id} salvos no Firebase.`);
            } catch (fbError) {
                console.error("Erro ao salvar no Firebase (o Pix foi gerado mas os dados do alvo não foram salvos):", fbError);
            }
        }

        // Retorna a URL de checkout para o site redirecionar o cliente
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ checkout_url: cobranca.invoiceUrl })
        };

    } catch (error) {
        console.error("Erro na execução da função:", error.message);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ message: 'Erro interno ao processar o pagamento.' })
        };
    }
};