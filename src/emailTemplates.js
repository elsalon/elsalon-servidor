/**
 * Function to create an email template with a logo.
 * @param {Object} params - Parameters for the email.
 * @param {string} params.baseUrl - The base URL of the backend server.
 * @param {string} params.title - The title of the email.
 * @param {string} params.content - The email content.
 * @returns {string} - The HTML email template.
 */
export const simpleEmailTemplate = ({ baseUrl, title, content }) => {
    const logoUrl = `${baseUrl}/salon_logo_lg_600x80.png`;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
            }
            .header {
                padding: 20px;
                text-align: center;
                color: white;
            }
            .header img {
                max-width: 150px; /* Adjust logo size */
            }
            .content {
                padding: 20px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #888;
                padding: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="El Salon">
            </div>
            <div class="content">
                <h2>${title}</h2>
                <p>${content}</p>
            </div>
            <div class="footer">
                <p>El Salón</p>
            </div>
        </div>
    </body>
    </html>
    `;
}