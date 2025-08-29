// Arquivo: /netlify/functions/notificacao-pagamento-background.js (VERSÃO "CAIXA-PRETA")

exports.handler = async function(event) {
    // A PRIMEIRA COISA QUE FAZEMOS É REGISTRAR QUE A FUNÇÃO FOI CHAMADA.
    console.log("--- FUNÇÃO 'CAIXA-PRETA' INICIADA ---");
    console.log("Registrando o evento bruto recebido, antes de qualquer processamento.");

    try {
        // TENTAMOS APENAS REGISTRAR O CORPO DA REQUISIÇÃO.
        const bodyBruto = event.body;
        console.log("Corpo (body) bruto recebido:", bodyBruto);

        // AGORA, TENTAMOS PROCESSAR (PARSE) O CORPO DENTRO DE UM BLOCO SEGURO.
        console.log("Tentando fazer o parse do corpo como JSON...");
        const bodyProcessado = JSON.parse(bodyBruto);
        console.log("Parse do JSON foi bem-sucedido. Conteúdo:", JSON.stringify(bodyProcessado, null, 2));

    } catch (error) {
        // SE QUALQUER COISA DENTRO DO 'TRY' FALHAR, NÓS PEGAMOS O ERRO.
        console.error("ERRO CRÍTICO DURANTE O PROCESSAMENTO INICIAL:", error);
    } finally {
        // ESTA LINHA SEMPRE SERÁ REGISTRADA, NÃO IMPORTA O QUE ACONTEÇA.
        console.log("--- FUNÇÃO 'CAIXA-PRETA' CONCLUÍDA ---");
    }

    // A RESPOSTA PARA O MERCADO PAGO CONTINUA SENDO IMEDIATA.
    return {
        statusCode: 200,
        body: 'Webhook recebido pela caixa-preta.'
    };
};