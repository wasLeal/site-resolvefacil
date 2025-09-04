// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL COM CONTORNO)

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO ASAAS INICIADO (PRODUÇÃO) ---");
    try {
        // Buscamos pagamentos recentes, sem o filtro defeituoso da Asaas.
        const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const asaasUrl = `https://www.asaas.com/api/v3/payments?status=RECEIVED&paymentDate[ge]=${dezMinutosAtras}`;
        
        const searchResponse = await fetch(asaasUrl, {
            headers: { 'access_token': process.env.ASAAS_API_KEY }
        });

        if (!searchResponse.ok) { throw new Error(`Erro ao buscar na Asaas: ${await searchResponse.text()}`); }
        
        const todosPagamentosRecebidos = (await searchResponse.json()).data || [];

        // ========== INÍCIO DO CONTORNO PARA O BUG DA ASAAS ==========
        // Filtramos os pagamentos AQUI, no nosso código, em vez de na API deles.
        const pagamentosAprovados = todosPagamentosRecebidos.filter(pagamento => pagamento.externalReference !== "EMAIL_ENVIADO");
        // ========== FIM DO CONTORNO ==========

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo para processar.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos para processar.`);

        for (const pagamento of pagamentosAprovados) {
            // O resto do código permanece o mesmo
            const paymentId = pagamento.id;
            const customerId = pagamento.customer;

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

            console.log(`PAG-${paymentId}: Enviando e-mail para ${customerEmail}`);
            
            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: "ResolveFácil", email: "contato@resolvefacil.online" },
                    to: [{ email: customerEmail }],
                    subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                    htmlContent: `<p>Olá! Seu pagamento foi aprovado com sucesso.</p><p>Clique no link abaixo para acessar seu Gerador de Currículo Profissional:</p><p><a href="https://resolvefacil-curriculos.netlify.app/curriculo-pago.html">Acessar Produto</a></p><p>Obrigado pela sua compra!</p>`
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