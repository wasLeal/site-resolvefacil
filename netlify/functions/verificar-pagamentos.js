// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO DESATIVADA)

exports.handler = async function(event) {
    // Esta função foi intencionalmente desativada para focar na depuração do webhook principal.
    // Ela não executará nenhuma lógica de verificação ou envio de e-mail.
    
    const mensagem = "Função 'verificar-pagamentos' (Guardião) está desativada.";
    console.log(mensagem);

    return {
        statusCode: 200,
        body: mensagem
    };
};