// server.js
import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/check-result", async (req, res) => {
  const { exam, year, board, roll, reg } = req.query;

  if (!exam || !year || !board || !roll || !reg) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("http://www.educationboardresults.gov.bd/", {
      waitUntil: "domcontentloaded",
    });

    await page.select('select[name="exam"]', exam);
    await page.select('select[name="year"]', year);
    await page.select('select[name="board"]', board);
    await page.type('input[name="roll"]', roll);
    await page.type('input[name="reg"]', reg);
    await page.select('select[name="type"]', "individual");

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    ]);

    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll(".result_table tr");
      const result = {};
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 2) {
          result[cells[0].innerText.trim()] = cells[1].innerText.trim();
        }
      });
      return result;
    });

    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
