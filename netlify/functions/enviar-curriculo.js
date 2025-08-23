// Arquivo: netlify/functions/enviar-curriculo.js

// Função para adicionar o contato à lista da Brevo
async function addContactToList(apiKey, email, name) {
  // ===================================================================
  // IMPORTANTE: Coloque aqui o ID da sua lista de contatos da Brevo.
  // Você encontra esse número no painel da Brevo, na seção Contatos > Listas.
  const LIST_ID = 2; [cite_start]// <--- TROQUE ESTE NÚMERO PELO ID DA SUA LISTA [cite: 1]
  // ===================================================================

  const url = 'https://api.brevo.com/v3/contacts';
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      attributes: {
        'NOME': name // Na Brevo, você pode criar um atributo de contato chamado "NOME"
      },
      [cite_start]listIds: [LIST_ID] // Adiciona o contato à lista especificada [cite: 1]
    })
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Se o contato já existir, a API retorna um erro, o que é normal.
      // Não vamos tratar como um erro fatal.
      const errorData = await response.json();
      console.warn('Aviso ao adicionar contato (pode já existir):', errorData.message);
    } else {
      console.log('Contato adicionado/atualizado com sucesso na Brevo.');
    }
  } catch (error) {
    console.error('Erro ao tentar adicionar contato na Brevo:', error);
  }
}


// Função principal que envia o e-mail e gerencia o processo
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userEmail, userName, resumeHtml } = JSON.parse(event.body);
    const apiKey = process.env.BREVO_API_KEY;

    // TAREFA 1: Adicionar o contato à lista de marketing
    // Isso acontece em paralelo, não esperamos a conclusão para enviar o e-mail.
    addContactToList(apiKey, userEmail, userName);

    // TAREFA 2: Enviar o e-mail transacional com o currículo
    const emailBody = {
      sender: {
        name: 'ResolveFácil',
        // ===================================================================
        // ALTERAÇÃO FEITA AQUI: Usando o e-mail do Gmail que já está verificado na Brevo
        email: 'resolvefacil70@gmail.com' 
        // ===================================================================
      },
      to: [{ email: userEmail, name: userName }],
      subject: `Seu currículo profissional está pronto, ${userName}!`,
      htmlContent: resumeHtml
    };

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Erro da API Brevo ao enviar e-mail:', errorData);
      throw new Error('Falha ao enviar o e-mail pela Brevo.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "E-mail enviado com sucesso!" })
    };

  } catch (error) {
    console.error('Erro na função:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Ocorreu um erro no servidor.' })
    };
  }
};