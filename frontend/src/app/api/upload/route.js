import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (req.method === "POST") {
      const chunks = [];
      req.on("data", (chunk) => {
        chunks.push(chunk);
      });
  
      req.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const uploadsDir = path.join(process.cwd(), "/public/uploads");
  
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
  
        const filePath = path.join(uploadsDir, `uploaded_file_${Date.now()}.csv`);
        fs.writeFileSync(filePath, buffer);
  
        res.status(200).json({ message: "Файл загружен", filePath });
      });
  
      req.on("error", (err) => {
        console.error(err);
        res.status(500).json({ message: "Ошибка загрузки файла" });
      });
    } else {
      res.status(405).json({ message: "Метод не разрешен" });
    }
  }