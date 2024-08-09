const express = require('express');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' })); // Increasee the limit if your base64 strings are large

// Function to solve the captcha
const solveCaptcha = async (imagePath) => {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');

  // Basic cleaning of the OCR result
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const elements = cleanText.split(' ');

  if (elements.length !== 3) {
    throw new Error("Unexpected CAPTCHA format");
  }

  const num1 = parseInt(elements[0]);
  const operator = elements[1];
  const num2 = parseInt(elements[2]);

  let result;

  switch (operator) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      result = num1 - num2;
      break;
    case '*':
      result = num1 * num2;
      break;
    case '/':
      result = num1 / num2;
      break;
    default:
      throw new Error("Unknown operator");
  }

  return result;
};

// Route to solve the CAPTCHA from base64 image
app.post('/solve_captcha', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "Base64 image data is required" });
  }

  // Decode base64 image
  const buffer = Buffer.from(base64Image, 'base64');
  const imagePath = path.join(__dirname, 'captcha.png');

  // Save the image temporarily
  fs.writeFileSync(imagePath, buffer);

  try {
    const result = await solveCaptcha(imagePath);
    res.json({ solution: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    // Clean up the temporary file
    fs.unlinkSync(imagePath);
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});