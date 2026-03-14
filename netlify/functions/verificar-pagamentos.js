// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO COM DIAGNÓSTICO PROFUNDO DA BREVO)

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
    
    // PORTA SECRETA 1: TESTE DIRETO DA BREVO COM RELATÓRIO DE ERRO NA TELA
    if (event.queryStringParameters && event.queryStringParameters.teste === 'brevo') {
        const resultado = await enviarEmail("resolvefacil70@gmail.com", "Admin", "🚨 TESTE DE VIDA: Brevo Operante!", "<h2 style='color:green;'>Sucesso!</h2><p>O Netlify e a Brevo estão a comunicar perfeitamente.</p>");
        
        if (resultado.sucesso) {
            return { statusCode: 200, body: "TESTE BREVO: SUCESSO! Vá olhar o seu e-mail agora." };
        } else {
            // AQUI ESTÁ A MÁGICA: Ele vai imprimir o erro da Brevo direto na sua tela!
            return { statusCode: 200, body: `TESTE BREVO: FALHA.\n\nMotivo exato retornado pela Brevo:\n${resultado.erro}` };
        }
    }

    try {
        // PORTA SECRETA 2: TESTE TOTAL SEM PAGAR
        let statusBusca = "RECEIVED"; 
        
        if (event.queryStringParameters && event.queryStringParameters.teste === 'pendente') {
            statusBusca = "PENDING"; 
        }

        const asaasUrl = `https://www.asaas.com/api/v3/payments?status=${statusBusca}&limit=30`;
        
        const searchResponse = await fetch(asaasUrl, {
            headers: { 'access_token': process.env.ASAAS_API_KEY }
        });

        if (!searchResponse.ok) throw new Error(`Erro Asaas: ${await searchResponse.text()}`);
        
        const { data: pagamentos } = await searchResponse.json();
        const pendentes = (pagamentos || []).filter(p => p.externalReference !== "EMAIL_ENVIADO");

        if (pendentes.length === 0) {
            return { statusCode: 200, body: `Nenhum pagamento ${statusBusca} novo para processar.` };
        }

        let processados = 0;

        for (const pagamento of pendentes) {
            if (statusBusca === "PENDING" && processados >= 1) break;

            const customerResp = await fetch(`https://www.asaas.com/api/v3/customers/${pagamento.customer}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });
            const cliente = await customerResp.json();

            // ROTA A: PRODUTOS DIGITAIS
            const prodDigital = catalogoEntrega[pagamento.description];
            if (prodDigital) {
                const html = `
                    <p>Olá ${cliente.name}, seu acesso foi libertado!</p>
                    <p><a href="${prodDigital.link}" style="background:#007bff; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">Acessar Agora</a></p>
                `;
                const resultado = await enviarEmail(cliente.email, cliente.name, prodDigital.assunto, html);
                if (resultado.sucesso) await marcarEnviado(pagamento.id);
                processados++;
            }

            // ROTA B: SERVIÇOS DE PESQUISA
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
                    <h3>Novo pedido!</h3>
                    <p><b>Cliente:</b> ${cliente.name} (${cliente.email})</p>
                    <hr>${dadosAlvo}
                `);

                // 2. E-mail para o CLIENTE (Rastreio)
                const linkRastreio = `https://resolvefacil-curriculos.netlify.app/rastreio.html?id=${pagamento.id}`;
                const htmlCliente = `
                    <h2>Pagamento Confirmado! 🔍</h2>
                    <p>Olá ${cliente.name}, sua pesquisa <strong>${pagamento.description}</strong> foi iniciada.</p>
                    <p>Acompanhe o progresso em tempo real:</p>
                    <p><a href="${linkRastreio}" style="background:#009EE3; color:#fff; padding:15px 25px; text-decoration:none; border-radius:5px; font-weight:bold;">Ver Status da Pesquisa</a></p>
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
// FUNÇÃO DE E-MAIL (AGORA RETORNA O ERRO EXATO DA BREVO)
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
        return { sucesso: false, erro: erroTexto }; // DEVOLVE O ERRO PARA IMPRIMIR NA TELA
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