// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL - MÚLTIPLOS PRODUTOS E PESQUISAS)

const admin = require('firebase-admin');

// Inicialização segura do Firebase (Para podermos puxar os dados do alvo)
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Erro Firebase Init no Guardião:", error.message);
    }
}

// --- NOSSO CATÁLOGO DE ENTREGA (PRODUTOS DIGITAIS INSTANTÂNEOS) ---
const catalogoEntrega = {
    "Acesso ao Gerador de Currículo Profissional": {
        link: "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html",
        assunto: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
        htmlContent: (link) => `
            <p>Olá! Seu pagamento foi aprovado com sucesso.</p>
            <p>Clique no botão abaixo para acessar seu Gerador de Currículo Profissional:</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Produto Agora</a>
            </p>
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso é válido por <strong>24 meses</strong>.</p>
            <p>Obrigado pela sua compra!</p>
        `
    },
    "Acesso ao Gerador de Contrato de Terreno": {
        link: "https://resolvefacil-curriculos.netlify.app/gerador-contrato-terreno.html",
        assunto: "Seu Acesso ao Gerador de Contrato de Terreno | ResolveFácil",
        htmlContent: (link) => `
            <p>Olá! Seu pagamento foi aprovado com sucesso.</p>
            <p>Clique no botão abaixo para acessar seu Gerador de Contrato de Terreno:</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Ferramenta Agora</a>
            </p>
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso à ferramenta é válido por <strong>12 meses</strong>.</p>
            <p>Obrigado pela sua compra!</p>
        `
    },
    "Acesso ao Gerador de Contrato de Aluguel": {
        link: "https://resolvefacil-curriculos.netlify.app/gerador-contrato-aluguel.html",
        assunto: "Seu Acesso ao Gerador de Contrato de Aluguel | ResolveFácil",
        htmlContent: (link) => `
            <p>Olá! Seu pagamento foi aprovado com sucesso.</p>
            <p>Clique no botão abaixo para acessar seu Gerador de Contrato de Aluguel:</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Ferramenta Agora</a>
            </p>
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso à ferramenta é válido por <strong>12 meses</strong>.</p>
            <p>Obrigado pela sua compra!</p>
        `
    }
};

// --- CATÁLOGO DE SERVIÇOS DE PESQUISA (NOVO) ---
const catalogoPesquisas = {
    "Dossiê Investigativo Completo": true,
    "Rastreio Avançado": true,
    "Busca de Contato": true
};

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO ASAAS INICIADO (PRODUÇÃO) ---");
    try {
        const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const asaasUrl = `https://www.asaas.com/api/v3/payments?status=RECEIVED&paymentDate[ge]=${dezMinutosAtras}`;
        
        const searchResponse = await fetch(asaasUrl, {
            headers: { 'access_token': process.env.ASAAS_API_KEY }
        });

        if (!searchResponse.ok) { throw new Error(`Erro ao buscar na Asaas: ${await searchResponse.text()}`); }
        
        const todosPagamentosRecebidos = (await searchResponse.json()).data || [];
        const pagamentosAprovados = todosPagamentosRecebidos.filter(pagamento => pagamento.externalReference !== "EMAIL_ENVIADO");

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo para processar.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos para processar.`);

        for (const pagamento of pagamentosAprovados) {
            const paymentId = pagamento.id;
            const customerId = pagamento.customer;
            const productDescription = pagamento.description;

            // Busca os dados do cliente na Asaas
            const customerResponse = await fetch(`https://www.asaas.com/api/v3/customers/${customerId}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });

            if (!customerResponse.ok) {
                console.warn(`PAG-${paymentId}: Falha ao buscar cliente. Pulando.`);
                continue;
            }

            const cliente = await customerResponse.json();
            const customerEmail = cliente.email;
            const customerName = cliente.name;

            if (!customerEmail || !customerEmail.includes('@')) {
                console.warn(`PAG-${paymentId}: Cliente sem e-mail válido. Pulando.`);
                continue;
            }

            // =========================================================================
            // ROTA A: PRODUTOS DIGITAIS (Currículos e Contratos)
            // =========================================================================
            const produtoDigital = catalogoEntrega[productDescription];
            
            if (produtoDigital) {
                console.log(`PAG-${paymentId}: Enviando Produto Digital para ${customerEmail}`);
                
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: "ResolveFácil", email: "contato@resolvefacil.online" },
                        to: [{ email: customerEmail }],
                        subject: produtoDigital.assunto,
                        htmlContent: produtoDigital.htmlContent(produtoDigital.link)
                    })
                });

                if (!brevoResponse.ok) { console.error(`Erro Brevo:`, await brevoResponse.text()); continue; }
            } 
            
            // =========================================================================
            // ROTA B: SERVIÇOS DE PESQUISA (NOVO FLUXO)
            // =========================================================================
            else if (catalogoPesquisas[productDescription]) {
                console.log(`PAG-${paymentId}: Processando nova PESQUISA para ${customerEmail}`);

                // 1. Puxar os dados do alvo salvos no Firebase
                let dadosAlvo = "Dados não encontrados no Firebase.";
                let uidPesquisa = paymentId;
                
                if (admin.apps.length) {
                    try {
                        const db = admin.firestore();
                        const docRef = db.collection('pedidos_pesquisa').doc(paymentId);
                        const doc = await docRef.get();
                        
                        if (doc.exists) {
                            const data = doc.data().alvo;
                            dadosAlvo = `
                                <b>Nome do Alvo:</b> ${data.nomeAlvo || 'Não informado'}<br>
                                <b>CPF/CNPJ:</b> ${data.cpfCnpjAlvo || 'Não informado'}<br>
                                <b>Sexo:</b> ${data.sexoAlvo || 'Não informado'}<br>
                                <b>Nome da Mãe:</b> ${data.filiacaoAlvo || 'Não informado'}<br>
                                <b>Local:</b> ${data.localAlvo || 'Não informado'}<br>
                                <b>Infos Extras:</b> ${data.infoExtraAlvo || 'Nenhuma'}
                            `;
                            
                            // Atualiza o status no Firebase para a tela de rastreio saber que começou
                            await docRef.update({ status: 'em_andamento', horaInicio: admin.firestore.FieldValue.serverTimestamp() });
                        }
                    } catch (err) {
                        console.error("Erro ao buscar no Firebase:", err);
                    }
                }

                // 2. Enviar E-mail para VOCÊ (O Administrador)
                const emailAdminHtml = `
                    <div style="font-family: Arial; padding: 20px; border: 2px solid #ff6600; border-radius: 10px;">
                        <h2 style="color: #ff6600;">🚨 NOVO SERVIÇO PAGO: ${productDescription}</h2>
                        <p>O cliente <b>${customerName}</b> (${customerEmail}) acabou de pagar pelo serviço.</p>
                        <hr>
                        <h3>DADOS DO ALVO A SER PESQUISADO:</h3>
                        <p>${dadosAlvo}</p>
                        <hr>
                        <p>O cliente já recebeu o link de rastreio e está aguardando o relatório no prazo de 40 a 90 minutos.</p>
                        <p>ID do Pagamento: ${paymentId}</p>
                    </div>
                `;

                await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: "Sistema ResolveFácil", email: "contato@resolvefacil.online" },
                        to: [{ email: "resolvefacil70@gmail.com", name: "Administrador" }],
                        subject: `🚨 URGENTE: Nova Pesquisa Paga (${productDescription})`,
                        htmlContent: emailAdminHtml
                    })
                });

                // 3. Enviar E-mail de RASTREIO para o CLIENTE (URL CORRIGIDA AQUI)
                const linkRastreio = `https://resolvefacil-curriculos.netlify.app/rastreio.html?id=${paymentId}`;
                const emailClienteHtml = `
                    <div style="font-family: Arial; line-height: 1.6; color: #333;">
                        <h2 style="color: #003459;">Pagamento Confirmado! 🔍</h2>
                        <p>Olá ${customerName}, recebemos a confirmação do seu pagamento para o serviço <strong>${productDescription}</strong>.</p>
                        <p>Nossa equipe já foi notificada e os cruzamentos de dados oficiais foram iniciados neste exato momento.</p>
                        <div style="background-color: #f4f7f6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #ff6600;">Acompanhe em Tempo Real</h3>
                            <p style="font-size: 0.9em;">Clique no botão abaixo para acessar o painel de rastreio da sua investigação:</p>
                            <a href="${linkRastreio}" style="display: inline-block; background-color: #009EE3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">Ver Status da Pesquisa</a>
                        </div>
                        <p style="font-size: 0.9em; color: #666;">Seu relatório em PDF será enviado em resposta a este e-mail assim que o dossiê for concluído.</p>
                        <p>Atenciosamente,<br><strong>Equipe ResolveFácil</strong></p>
                    </div>
                `;

                await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: "ResolveFácil", email: "contato@resolvefacil.online" },
                        to: [{ email: customerEmail, name: customerName }],
                        subject: "Pagamento Aprovado! Acompanhe sua pesquisa.",
                        htmlContent: emailClienteHtml
                    })
                });
            } else {
                console.warn(`PAG-${paymentId}: Produto "${productDescription}" desconhecido. Pulando.`);
                continue;
            }

            // =========================================================================
            // MARCA COMO CONCLUÍDO NA ASAAS (Para não repetir)
            // =========================================================================
            const updateResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
                method: 'POST',
                headers: { 'access_token': process.env.ASAAS_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalReference: "EMAIL_ENVIADO" })
            });

            if (!updateResponse.ok) {
                console.error(`PAG-${paymentId}: FALHA CRÍTICA ao marcar pagamento como enviado.`);
            } else {
                console.log(`PAG-${paymentId}: Pagamento concluído com sucesso em todas as frentes.`);
            }
        }

        return { statusCode: 200, body: "Processamento concluído." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO:", error);
        return { statusCode: 500, body: "Erro interno." };
    }
};