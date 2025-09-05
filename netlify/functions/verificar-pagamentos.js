// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL COM TEXTO DO E-MAIL OTIMIZADO)

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
        const pagamentosAprovados = todosPagamentosRecebidos.filter(pagamento => pagamento.externalReference !== "EMAIL_ENVIADO");

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo para processar.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos para processar.`);

        for (const pagamento of pagamentosAprovados) {
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
            
            // ========== INÍCIO DA ALTERAÇÃO FINAL NO TEXTO DO E-MAIL ==========
            const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";
            
            const htmlContent = `
                <p>Olá! Seu pagamento foi aprovado com sucesso.</p>
                <p>Clique no botão abaixo para acessar seu Gerador de Currículo Profissional:</p>
                <p style="text-align: center; margin: 20px 0;">
                    <a href="${linkDoProduto}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Produto Agora</a>
                </p>
                <p style="font-size: 0.9em; color: #555;">Se o botão não funcionar, por favor, copie e cole o seguinte endereço no seu navegador:</p>
                <p style="font-size: 0.9em; color: #333; word-break: break-all;">${linkDoProduto}</p>
                <hr style="margin: 20px 0;">
                <p><b>Importante:</b> Seu acesso é válido por <strong>24 meses</strong> e poderá ser usado sempre que precisar através deste mesmo link.</p>
                <p>Obrigado pela sua compra!</p>
            `;
            // ========== FIM DA ALTERAÇÃO ==========
            
            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: "ResolveFácil", email: "contato@resolvefacil.online" }, // Lembre-se de configurar seu e-mail profissional
                    to: [{ email: customerEmail }],
                    subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                    htmlContent: htmlContent
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