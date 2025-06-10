// 這是一個 Netlify Function，它會在伺服器上安全地執行
// 它的功能是作為一個代理，去呼叫 Google AI API

exports.handler = async function(event, context) {
    // 只允許 POST 請求
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 從前端傳來的請求中，解析出商品名稱
        const { productName } = JSON.parse(event.body);
        if (!productName) {
            return { statusCode: 400, body: 'Missing productName' };
        }

        // 從 Netlify 的安全環境變數中，讀取您的 API 金鑰
        // 這個金鑰絕對不會暴露在前端程式碼中
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: 'API Key not configured on the server.' };
        }

        // 準備要傳送給 Google AI 的指令
        const prompt = `你是一位擅長寫作的店主，你的店鋪風格是溫暖的日式懷舊雜貨店。請為這件商品「${productName}」寫一段吸引人的商品描述，大約50-70個字，要能引發人們的懷舊情感與購買慾望。`;
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // 由伺服器代表您去呼叫 Google AI
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Google AI API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "無法產生文案。";
        
        // 將 AI 產生的結果，安全地回傳給前端
        return {
            statusCode: 200,
            body: JSON.stringify({ description: generatedText })
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred.' })
        };
    }
};
