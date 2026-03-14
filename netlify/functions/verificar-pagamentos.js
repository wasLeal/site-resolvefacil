// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL DE PRODUÇÃO)

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

const catalogoEntrega = {
    "Acesso ao Gerador de Currículo Profissional": {
        link: "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html",
        assunto: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil"
    },
    "Acesso ao Gerador de Contrato de Terreno": {
        link: "https://resolvefacil-curriculos.netlify.app/gerador-contrato-terreno.html",
        assunto: "Seu Acesso ao Gerador de Contrato de Terreno | ResolveFácil"
    },
    "Acesso ao Gerador de Contrato de Aluguel": {
        link: "https://resolvefacil-curriculos.netlify.app/gerador-contrato-aluguel.html",
        assunto: "Seu Acesso ao Gerador de Contrato de Aluguel | ResolveFácil"
    }
};

const catalogoPesquisas = {
    "Dossiê Investigativo Completo": true,
    "Rastreio Avançado": true,
    "Busca de Contato": true
};

exports.handler = async function(event, context) {
    try {
        // Busca sempre os últimos 30 pagamentos RECEBIDOS.
        // Sem filtro de data para evitar falhas de fuso horário. A trava EMAIL_ENVIADO evita repetição.
        const asaasUrl = `https://www.asaas.com/api/v3/payments?status=RECEIVED&limit=30`;
        
        const searchResponse = await fetch(asaasUrl, {
            headers: { 'access_token': process.env.ASAAS_API_KEY }
        });

        if (!searchResponse.ok) throw new Error(`Erro Asaas: ${await searchResponse.text()}`);
        
        const { data: pagamentos } = await searchResponse.json();
        const pendentes = (pagamentos || []).filter(p => p.externalReference !== "EMAIL_ENVIADO");

        if (pendentes.length === 0) {
            return { statusCode: 200, body: `Nenhum pagamento novo e não enviado.` };
        }

        let processados = 0;

        for (const pagamento of pendentes) {
            const customerResp = await fetch(`https://www.asaas.com/api/v3/customers/${pagamento.customer}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });
            const cliente = await customerResp.json();

            // =========================================================================
            // ROTA A: PRODUTOS DIGITAIS (Currículos e Contratos)
            // =========================================================================
            const prodDigital = catalogoEntrega[pagamento.description];
            if (prodDigital) {
                const html = `
                    <p>Olá ${cliente.name}, seu pagamento foi aprovado com sucesso!</p>
                    <p>Clique no botão abaixo para acessar sua ferramenta:</p>
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="${prodDigital.link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Agora</a>
                    </p>
                    <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                    <p style="font-size: 0.9em; color: #333; word-break: break-all;">${prodDigital.link}</p>
                    <hr style="margin: 20px 0;">
                    <p>Obrigado pela sua compra!</p>
                `;
                const resultado = await enviarEmail(cliente.email, cliente.name, prodDigital.assunto, html);
                if (resultado.sucesso) await marcarEnviado(pagamento.id);
                processados++;
            }

            // =========================================================================
            // ROTA B: SERVIÇOS DE PESQUISA (Dossiê, Rastreio, etc)
            // =========================================================================
            else if (catalogoPesquisas[pagamento.description]) {
                let dadosAlvo = "Dados não encontrados no Firebase.";
                
                if (admin.apps.length) {
                    try {
                        const doc = await admin.firestore().collection('pedidos_pesquisa').doc(pagamento.id).get();
                        if (doc.exists) {
                            const data = doc.data().alvo;
                            dadosAlvo = `
                                <b>Alvo:</b> ${data.nomeAlvo}<br>
                                <b>CPF/CNPJ:</b> ${data.cpfCnpjAlvo || 'Não informado'}<br>
                                <b>Mãe:</b> ${data.filiacaoAlvo || 'Não informada'}<br>
                                <b>Local:</b> ${data.localAlvo || 'Não informado'}
                            `;
                            await admin.firestore().collection('pedidos_pesquisa').doc(pagamento.id).update({ status: 'em_andamento' });
                        }
                    } catch (e) { console.error("Firebase Error:", e.message); }
                }

                // 1. E-mail para VOCÊ (Admin)
                await enviarEmail("resolvefacil70@gmail.com", "Administrador", `🚨 NOVA PESQUISA: ${pagamento.description}`, `
                    <h3>Novo pedido pago!</h3>
                    <p><b>Cliente:</b> ${cliente.name} (${cliente.email})</p>
                    <hr>${dadosAlvo}
                    <hr><p>ID: ${pagamento.id}</p>
                `);

                // 2. E-mail para o CLIENTE (Rastreio)
                const linkRastreio = `https://resolvefacil-curriculos.netlify.app/rastreio.html?id=${pagamento.id}`;
                const htmlCliente = `
                    <div style="font-family: Arial; line-height: 1.6; color: #333;">
                        <h2 style="color: #003459;">Pagamento Confirmado! 🔍</h2>
                        <p>Olá ${cliente.name}, sua pesquisa <strong>${pagamento.description}</strong> foi iniciada.</p>
                        <div style="background-color: #f4f7f6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #ff6600;">Acompanhe em Tempo Real</h3>
                            <a href="${linkRastreio}" style="display: inline-block; background-color: #009EE3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">Ver Status da Pesquisa</a>
                        </div>
                        <p style="font-size: 0.9em; color: #666;">Seu relatório será enviado em resposta a este e-mail assim que concluído.</p>
                    </div>
                `;

                const resultado = await enviarEmail(cliente.email, cliente.name, "Sua pesquisa está em andamento!", htmlCliente);
                if (resultado.sucesso) await marcarEnviado(pagamento.id);
                processados++;
            }
        }

        return { statusCode: 200, body: `Processados ${processados} pagamentos com sucesso.` };

    } catch (error) {
        console.error("Erro Geral:", error.message);
        return { statusCode: 500, body: error.message };
    }
};

// ============================================================================
// FUNÇÃO DE E-MAIL (PADRÃO OURO)
// ============================================================================
async function enviarEmail(para, nome, assunto, html) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY, 
            'content-type': 'application/json' 
        },
        body: JSON.stringify({
            sender: { 
                name: 'ResolveFácil', 
                email: 'resolvefacil70@gmail.com' 
            },
            to: [{ email: para, name: nome }],
            subject: assunto,
            htmlContent: html
        })
    });
    
    if (!response.ok) {
        const erroTexto = await response.text();
        console.error(`Erro Brevo para ${para}:`, erroTexto);
        return { sucesso: false, erro: erroTexto };
    }
    return { sucesso: true };
}

async function marcarEnviado(id) {
    await fetch(`https://www.asaas.com/api/v3/payments/${id}`, {
        method: 'POST',
        headers: { 'access_token': process.env.ASAAS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalReference: "EMAIL_ENVIADO" })
    });
}