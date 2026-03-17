// Arquivo: /netlify/functions/criar-pagamento.js (Versão Final e Segura - Apenas PIX)

const allowedOrigins = [
    'https://www.resolvefacil.online',
    'https://resolvefacil.online',
    'https://resolvefacil-curriculos.netlify.app'
];

const admin = require('firebase-admin');

// Inicialização segura do Firebase
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

// CATÁLOGO DE PRODUTOS ATUALIZADO
const catalogoProdutos = {
    'curriculo_pago': { descricao: "Acesso ao Gerador de Currículo Profissional", valor: 5.99 },
    'contrato_terreno': { descricao: "Acesso ao Gerador de Contrato de Terreno", valor: 16.99 },
    'contrato_aluguel': { descricao: "Acesso ao Gerador de Contrato de Aluguel", valor: 16.99 },
    
    // --- NOVOS PLANOS DE PESQUISA (RESOLVEFÁCIL) ---
    'pesquisa_dossie': { descricao: "Dossiê Investigativo Completo", valor: 67.00 },
    'pesquisa_avancada': { descricao: "Rastreio Avançado", valor: 47.00 },
    'pesquisa_contato': { descricao: "Busca de Contato", valor: 37.00 }
};

exports.handler = async function(event) {
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (allowedOrigins.includes(origin) || !origin) {
        headers['Access-Control-Allow-Origin'] = origin || '*';
    }

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

    try {
        const { productId, name, email, cpf, targetData } = JSON.parse(event.body);

        const produto = catalogoProdutos[productId];
        if (!produto) return { statusCode: 404, headers, body: JSON.stringify({ message: 'Produto não encontrado.' }) };

        const asaasKey = process.env.ASAAS_API_KEY;

        // ========================================================
        // 1. BUSCAR OU CRIAR O CLIENTE NA ASAAS (Obrigatório)
        // ========================================================
        const cpfLimpo = cpf.replace(/\D/g, ''); // Garante que só vão números limpos para a Asaas
        
        let customerId = '';
        const searchCustomer = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${cpfLimpo}`, {
            headers: { 'access_token': asaasKey }
        });
        const searchResult = await searchCustomer.json();

        if (searchResult.data && searchResult.data.length > 0) {
            customerId = searchResult.data[0].id;
        } else {
            const createCustomer = await fetch('https://www.asaas.com/api/v3/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
                body: JSON.stringify({ name, email, cpfCnpj: cpfLimpo })
            });
            const createResult = await createCustomer.json();
            
            if (!createCustomer.ok) {
                const errorMessage = createResult.errors && createResult.errors.length > 0 
                    ? createResult.errors[0].description 
                    : 'Erro ao cadastrar cliente na Asaas.';
                return { statusCode: 400, headers, body: JSON.stringify({ message: errorMessage }) };
            }
            customerId = createResult.id;
        }

        // ========================================================
        // 2. GERAR A COBRANÇA (EXCLUSIVO PIX COMO SOLICITADO)
        // ========================================================
        const response = await fetch('https://www.asaas.com/api/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': asaasKey
            },
            body: JSON.stringify({
                billingType: "PIX", // RETORNADO PARA APENAS PIX
                value: produto.valor,
                dueDate: new Date().toISOString().split('T')[0],
                description: produto.descricao,
                customer: customerId 
            })
        });

        const cobranca = await response.json();

        if (!response.ok) {
            const errorMsg = cobranca.errors && cobranca.errors.length > 0 
                ? cobranca.errors[0].description 
                : 'Erro ao gerar cobrança na Asaas.';
            return { statusCode: 400, headers, body: JSON.stringify({ message: errorMsg }) };
        }

        // ========================================================
        // 3. SALVAR A FICHA DE PESQUISA NO FIREBASE
        // ========================================================
        // Como mantivemos o prefixo "pesquisa_", ele continuará salvando os alvos automaticamente
        if (productId.startsWith('pesquisa_') && targetData && admin.apps.length) {
            try {
                const db = admin.firestore();
                await db.collection('pedidos_pesquisa').doc(cobranca.id).set({
                    cobrancaId: cobranca.id,
                    servico: produto.descricao,
                    servicoId: productId,
                    cliente: { nome: name, email, cpf },
                    alvo: targetData,
                    status: 'aguardando_pagamento',
                    dataPedido: new Date().toISOString()
                });
            } catch (err) {
                console.error("Erro ao salvar no banco (mas PIX foi gerado):", err.message);
            }
        }

        return { statusCode: 200, headers, body: JSON.stringify({ checkout_url: cobranca.invoiceUrl }) };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ message: 'Erro interno no servidor', error: error.message }) };
    }
};