// Arquivo: netlify/functions/verificar-pagamentos.js (Versão de Produção)

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO ASAAS INICIADO (PRODUÇÃO) ---");
    try {
        const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        // --- ALTERAÇÃO: URL de Produção ---
        const asaasUrl = `https://www.asaas.com/api/v3/payments?status=RECEIVED&paymentDate[ge]=${dezMinutosAtras}`;
        
        const searchResponse = await fetch(asaasUrl, {
            headers: { 'access_token': process.env.ASAAS_API_KEY }
        });

        if (!searchResponse.ok) { throw new Error(await searchResponse.text()); }
        
        const pagamentosAprovados = (await searchResponse.json()).data || [];

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo nos últimos 10 minutos.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos para processar.`);

        for (const pagamento of pagamentosAprovados) {
            // --- ALTERAÇÃO: URL de Produção ---
            const customerResponse = await fetch(`https://www.asaas.com/api/v3/customers/${pagamento.customer}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });

            if (!customerResponse.ok) {
                console.warn(`PAG-${pagamento.id}: Falha ao buscar cliente. Pulando.`);
                continue;
            }

            const cliente = await customerResponse.json();
            const customerEmail = cliente.email;

            if (!customerEmail || !customerEmail.includes('@')) {
                console.warn(`PAG-${pagamento.id}: Cliente sem e-mail válido ('${customerEmail}'). Pulando.`);
                continue;
            }

            console.log(`PAG-${pagamento.id}: Enviando e-mail para ${customerEmail}`);
            
            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: "ResolveFácil", email: "resolvefacil70@gmail.com" },
                    to: [{ email: customerEmail }],
                    subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                    htmlContent: `<p>Olá! Seu pagamento foi aprovado com sucesso.</p><p>Clique no link abaixo para acessar seu Gerador de Currículo Profissional:</p><p><a href="https://resolvefacil-curriculos.netlify.app/curriculo-pago.html">Acessar Produto</a></p><p>Obrigado pela sua compra!</p>`
                })
            });

            if (!brevoResponse.ok) {
                console.error(`PAG-${pagamento.id}: Brevo REJEITOU o envio para ${customerEmail}.`, await brevoResponse.text());
            } else {
                console.log(`--- SUCESSO! PAG-${pagamento.id}: E-mail para ${customerEmail} enviado. ---`);
            }
        }

        return { statusCode: 200, body: "Processamento concluído." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO:", error);
        return { statusCode: 500, body: "Erro interno." };
    }
};