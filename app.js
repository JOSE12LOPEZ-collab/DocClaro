const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const resultContainer = document.getElementById('result-container');
const aiResponse = document.getElementById('ai-response');

// Clave de API de Gemini (puedes colocar tu clave de Google AI Studio aquí)
const API_KEY = "AQ.Ab8RN6IlqNJ8BTwKTFJKq9G438v-s17IY3U-gnpbET5KgZ1gAQ";

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        dropZone.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        aiResponse.innerHTML = `<p>⏳ Leyendo tu recibo con inteligencia artificial...</p>`;

        try {
            // Convertimos la imagen cargada a formato base64 para enviarla a la API
            const base64Data = await convertFileToBase64(file);
            
            // Llamada real a la API de Gemini 2.5 Flash
            const analysisResult = await analyzeReceiptWithGemini(base64Data, file.type);
            
            aiResponse.innerHTML = analysisResult;
        } catch (error) {
            console.error(error);
            aiResponse.innerHTML = `<p style="color: red;">Hubo un error al procesar el recibo. Por favor, verifica tu conexión o clave de API.</p>`;
        }
    }
});

// Función para convertir imagen a base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// Función que se conecta con la API de Google Gemini
async function analyzeReceiptWithGemini(base64Image, mimeType) {
    const promptText = `Actúa como un asistente amable, experto y directo. Analiza la imagen de este recibo de servicio público. Ignora los códigos de barras y la información irrelevante. Devuelve la información exclusivamente en este formato sencillo, usando viñetas claras y sin rodeos ni lenguaje técnico:

- **1. Total a Pagar y Fecha Límite:** [Monto exacto con su moneda] a pagar antes del [Fecha]. (Agrega una breve alerta si la fecha está muy cerca).
- **2. Consumo:** Explica en una sola frase sencilla si se consumió más o menos en comparación con el periodo anterior.
- **3. Cargos extra:** Explica brevemente si hay conceptos adicionales (mora, mantenimiento, alumbrado público, etc.) y cuánto suman.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: promptText },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }
            ]
        })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content) {
        let text = data.candidates[0].content.parts[0].text;
        // Convertimos saltos de línea a etiquetas <br> para que se vea ordenado en HTML
        return text.replace(/\n/g, '<br>');
    } else {
        throw new Error("No se pudo obtener una respuesta válida de la IA.");
    }
}

function resetApp() {
    fileInput.value = '';
    resultContainer.classList.add('hidden');
    dropZone.classList.remove('hidden');
}