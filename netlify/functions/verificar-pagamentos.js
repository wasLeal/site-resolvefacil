// Importa a ferramenta para fazer chamadas de API
const fetch = require('node-fetch');

// A função principal que a Netlify irá executar de forma agendada
exports.handler = async function(event) {
    console.log("Guardião iniciado. Verificando pagamentos pendentes...");

    try {
        // --- 1. Define o Período de Busca ---
        // Pega a hora atual e a hora 12 minutos atrás. Usamos 12 minutos como margem de segurança para uma janela de 10 minutos.
        const now = new Date();
        const past = new Date(now.getTime() - 12 * 60 * 1000); // 12 minutos atrás

        // Formata as datas para o padrão que a API do Mercado Pago aceita (ISO 8601)
        const dateEnd = now.toISOString();
        const dateBegin = past.toISOString();

        console.log(`Buscando pagamentos aprovados entre ${dateBegin} e ${dateEnd}`);

        // --- 2. Busca Pagamentos Aprovados no Mercado Pago ---
        const mpSearchResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&status=approved&begin_date=${dateBegin}&end_date=${dateEnd}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            }
        );

        if (!mpSearchResponse.ok) {
            throw new Error(`Falha ao buscar pagamentos no MP: ${mpSearchResponse.statusText}`);
        }

        const searchResult = await mpSearchResponse.json();
        const approvedPayments = searchResult.results;

        if (approvedPayments.length === 0) {
            console.log("Nenhum pagamento novo encontrado. Encerrando o Guardião.");
            return { statusCode: 200, body: 'Nenhum pagamento novo.' };
        }

        console.log(`Encontrados ${approvedPayments.length} pagamentos aprovados. Verificando entregas...`);

        // --- 3. Processa cada Pagamento Encontrado ---
        for (const payment of approvedPayments) {
            const customerEmail = payment.payer.email;
            const customerName = payment.payer.first_name || 'Cliente';
            const paymentId = payment.id;
            
            // --- VERIFICAÇÃO SIMPLES - ESTE PASSO PODE SER MELHORADO NO FUTURO ---
            // Por enquanto, vamos assumir que se o Guardião encontrou, o webhook provavelmente falhou.
            // Em uma versão futura, poderíamos verificar um banco de dados ou os logs da Brevo para evitar duplicados.
            // Por agora, o foco é GARANTIR A ENTREGA.
            
            console.log(`Processando entrega para o pagamento ${paymentId} - Cliente: ${customerEmail}`);

            // --- 4. Envia o E-mail de Entrega via Brevo (Lógica Reutilizada) ---
            const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";
            const emailSubject = "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil";
            const senderEmail = "resolvefacil70@gmail.com";
            const senderName = "ResolveFácil";

            const emailHtmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #003459;">Olá, ${customerName}!</h2>
                    <p>Muito obrigado por sua compra na ResolveFácil!</p>
                    <p>Seu pagamento foi confirmado com sucesso e seu acesso ao <strong>Gerador de Currículo Profissional</strong> já está liberado.</p>
                    <p style="text-align: center; margin: 25px 0;">
                        <a href="${linkDoProduto}" style="background-color: #003459; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">ACESSAR MEU PRODUTO</a>
                    </p>
                    <p>Qualquer dúvida, basta responder a este e-mail.</p>
                    <p>Atenciosamente,<br>Equipe ResolveFácil</p>
                </div>`;

            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: customerEmail, name: customerName }],
                    subject: emailSubject,
                    htmlContent: emailHtmlContent
                })
            });

            if (!brevoResponse.ok) {
                const errorBody = await brevoResponse.text();
                console.error(`Guardião falhou ao enviar e-mail para ${customerEmail} (Pagamento ID: ${paymentId}):`, errorBody);
                // Continua para o próximo pagamento mesmo que um falhe
            } else {
                console.log(`Guardião enviou e-mail de entrega com sucesso para ${customerEmail} (Pagamento ID: ${paymentId}).`);
            }
        }

        return { statusCode: 200, body: 'Verificação do Guardião concluída.' };

    } catch (error) {
        console.error('ERRO CRÍTICO NA EXECUÇÃO DO GUARDIÃO:', error);
        return { statusCode: 500, body: 'Erro interno no Guardião.' };
    }
};