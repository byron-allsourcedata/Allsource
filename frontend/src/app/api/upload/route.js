export async function POST(req, res) {
  if (req.method === "POST") {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const filePath = "your/file/path";

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
