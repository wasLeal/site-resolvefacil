// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL - MÚLTIPLOS PRODUTOS)

// --- NOSSO CATÁLOGO DE ENTREGA ---
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
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, por favor, copie e cole o seguinte endereço no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso é válido por <strong>24 meses</strong> e poderá ser usado sempre que precisar através deste mesmo link.</p>
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
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, por favor, copie e cole o seguinte endereço no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso à ferramenta é válido por <strong>12 meses</strong>.</p>
            <p>Obrigado pela sua compra!</p>
        `
    },
    // NOVO PRODUTO ADICIONADO ABAIXO
    "Acesso ao Gerador de Contrato de Aluguel": {
        link: "https://resolvefacil-curriculos.netlify.app/gerador-contrato-aluguel.html",
        assunto: "Seu Acesso ao Gerador de Contrato de Aluguel | ResolveFácil",
        htmlContent: (link) => `
            <p>Olá! Seu pagamento foi aprovado com sucesso.</p>
            <p>Clique no botão abaixo para acessar seu Gerador de Contrato de Aluguel:</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Ferramenta Agora</a>
            </p>
            <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, por favor, copie e cole o seguinte endereço no seu navegador:</p>
            <p style="font-size: 0.9em; color: #333; word-break: break-all;">${link}</p>
            <hr style="margin: 20px 0;">
            <p><b>Importante:</b> Seu acesso à ferramenta é válido por <strong>12 meses</strong>.</p>
            <p>Obrigado pela sua compra!</p>
        `
    }
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

            // Busca o produto no catálogo de entrega
            const produtoParaEntregar = catalogoEntrega[productDescription];

            if (!produtoParaEntregar) {
                console.warn(`PAG-${paymentId}: Produto com descrição "${productDescription}" não encontrado no catálogo de entrega. Pulando.`);
                continue;
            }

            const customerResponse = await fetch(`https://www.asaas.com/api/v3/customers/${customerId}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });

            if (!customerResponse.ok) {
                console.warn(`PAG-${paymentId}: Falha ao buscar cliente. Pulando.`);
                continue;
            }

            const cliente = await customerResponse.json();
            const customerEmail = cliente.email;

            if (!customerEmail || !customerEmail.includes('@')) {
                console.warn(`PAG-${paymentId}: Cliente sem e-mail válido ('${customerEmail}'). Pulando.`);
                continue;
            }

            console.log(`PAG-${paymentId}: Enviando e-mail de "${produtoParaEntregar.assunto}" para ${customerEmail}`);
            
            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: "ResolveFácil", email: "contato@resolvefacil.online" },
                    to: [{ email: customerEmail }],
                    subject: produtoParaEntregar.assunto,
                    htmlContent: produtoParaEntregar.htmlContent(produtoParaEntregar.link)
                })
            });

            if (!brevoResponse.ok) {
                console.error(`PAG-${paymentId}: Brevo REJEITOU o envio para ${customerEmail}.`, await brevoResponse.text());
                continue; 
            }
            
            console.log(`--- SUCESSO! PAG-${paymentId}: E-mail para ${customerEmail} enviado. ---`);

            console.log(`PAG-${paymentId}: Marcando como 'EMAIL_ENVIADO' na Asaas...`);
            const updateResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
                method: 'POST',
                headers: { 'access_token': process.env.ASAAS_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalReference: "EMAIL_ENVIADO" })
            });

            if (!updateResponse.ok) {
                console.error(`PAG-${paymentId}: FALHA CRÍTICA ao marcar pagamento como enviado.`, await updateResponse.text());
            } else {
                console.log(`PAG-${paymentId}: Pagamento marcado com sucesso.`);
            }
        }

        return { statusCode: 200, body: "Processamento concluído." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO:", error);
        return { statusCode: 500, body: "Erro interno." };
    }
};