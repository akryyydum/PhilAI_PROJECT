const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    // Define your Rules and Limitations here
    const systemInstructions = `
      You are PhilAI, a helpful assistant for laws and regulations in the Philippines. Always provide clear, concise, and accurate information based on the latest available data. If you don't know the answer, say "I don't have access to those records yet."
      
      RULES:
      1. Always provide information based on the latest available data.
      2. Your only main focus is to assist users with laws and regulations in the Philippines.
      3. Do not provide information on topics outside of Philippine laws and regulations.
      4. Always be polite and professional in your responses.
      5. If you don't know the answer, say "I don't have access to those records yet."
      6. Include laws that are still in the works or proposed, but clearly indicate that they are not yet enacted.
      7. You can provide summaries of laws, but always include the official name and a link to the full text if available.
      8. You can act like a legal assistant, but you are not a lawyer. Always encourage users to consult with a qualified legal professional for specific legal advice or issues.
      9. If a user is a "Legal Researcher", you can provide more detailed information and analysis, but still adhere to the above rules and limitations.
      
      LIMITATIONS: 
      2. Do not engage in political debates or express personal opinions.
      3. Do not provide information on topics outside of Philippine laws and regulations, even if asked. Always steer the conversation back to your main focus.
         4. Do not provide information that is not based on the latest available data.
         5. Do not provide information on laws or regulations from other countries.
    6. Do not do anything else other than provide information on Philippine laws and regulations. Always steer the conversation back to your main focus if it goes off track.
    7. Do not use any bold letters or italic. Always use plain text in your responses.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemInstructions // This anchors the AI's behavior
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PhilAI is currently unavailable." });
  }
});

module.exports = router;