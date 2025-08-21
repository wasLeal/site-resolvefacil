// Arquivo: netlify/functions/enviar-curriculo.js

// Importa as novas ferramentas, mais compatíveis
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// Função para gerar o PDF a partir do HTML
async function generatePdf(htmlContent) {
  let browser = null;
  try {
    // Inicia o "navegador invisível" usando a nova biblioteca
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });

    return pdfBuffer;

  } catch (error) {
    console.error("Erro ao gerar o PDF:", error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

// Função principal que gerencia o processo
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userEmail, userName, resumeHtml } = JSON.parse(event.body);
    const apiKey = process.env.BREVO_API_KEY;

    const pdfBuffer = await generatePdf(resumeHtml);
    const pdfBase64 = pdfBuffer.toString('base64');

    const emailBody = {
      sender: {
        name: 'ResolveFácil',
        email: 'resolvefacil70@gmail.com' 
      },
      to: [{ email: userEmail, name: userName }],
      subject: `Seu currículo profissional está pronto, ${userName}!`,
      htmlContent: `<html><body><p>Olá, ${userName}!</p><p>Seu currículo foi gerado com sucesso e está em anexo neste e-mail.</p><p>Agradecemos por usar nossos serviços!</p><p>Atenciosamente,<br>Equipe ResolveFácil</p></body></html>`,
      attachment: [
        {
          name: 'curriculo.pdf',
          content: pdfBase64
        }
      ]
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
      body: JSON.stringify({ message: "E-mail com PDF anexado enviado com sucesso!" })
    };

  } catch (error) {
    console.error('Erro na função:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Ocorreu um erro no servidor ao gerar o PDF.' })
    };
  }
};