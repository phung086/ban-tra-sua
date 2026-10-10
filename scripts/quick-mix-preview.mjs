// Production-preview evidence for the real fast-mix gameplay choice.
// Chromium emulation is not physical Android/iPhone validation.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:5194";
const output = process.env.PREVIEW_OUTPUT || "quick-mix-preview-artifacts";
const sizes = [[360,800],[390,844],[844,390],[1280,800]];
const browser = await chromium.launch({ headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--enable-webgl",
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
] });
const report = { environment: "Production Vite preview, headless Chromium, software WebGL; not a physical phone",
  cases: [], failures: [] };
await mkdir(output, { recursive: true });
try {
  for (const [width,height] of sizes) {
    const ctx = await browser.newContext({ viewport: {width,height}, deviceScaleFactor: 1,
      isMobile: width < 1000, hasTouch: width < 1000, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    page.on("pageerror", error => report.failures.push(width+"x"+height+": "+error.message));
    try {
      await page.addInitScript(() => localStorage.setItem("tiem-tra-chibi-ui-v1",
        JSON.stringify({renderEngine:"three",graphics:"light",coachCompleted:true,motion:false,sound:false,music:false})));
      await page.goto(base, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.getByRole("button", {name:/Mở cửa tiệm/}).click({timeout:60000});
      await page.locator(".craft-stations button").nth(2).click({timeout:20000});
      const choice = page.locator(".quick-mix-choice");
      await choice.waitFor({timeout:20000});
      const before = await choice.textContent();
      if (!before?.includes("Pha kỹ hay pha nhanh")) throw new Error("No initial choice");
      const button = choice.getByRole("button", {name:/Pha nhanh/});
      const tapHeight = await button.evaluate(el => el.getBoundingClientRect().height);
      if (tapHeight < 48) throw new Error("Fast-mix target below 48px: "+tapHeight);
      await choice.screenshot({path:path.join(output,`choice-before-${width}x${height}.png`),timeout:60000});
      await button.click({timeout:20000});
      if (!(await choice.textContent())?.includes("Đã chọn pha nhanh"))
        throw new Error("Fast mix did not enter rushed state");
      if (await page.getByRole("button",{name:/Bắt đầu rót/}).count())
        throw new Error("Manual gauges still active after quick mix");
      await choice.screenshot({path:path.join(output,`choice-after-${width}x${height}.png`),timeout:60000});
      await choice.getByRole("button",{name:/Pha kỹ lại/}).click({timeout:20000});
      if (!(await choice.textContent())?.includes("Pha kỹ hay pha nhanh"))
        throw new Error("Careful reset did not restore choice");
      if (!(await page.getByRole("button",{name:/Bắt đầu rót/}).count()))
        throw new Error("Careful reset did not restore gauges");
      const geometry = await page.evaluate(() => ({
        viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
      }));
      if (geometry.documentWidth > geometry.viewport + 2)
        throw new Error("Horizontal overflow: "+JSON.stringify(geometry));
      report.cases.push({viewport:`${width}x${height}`,tapHeight,choice:true,fastMix:true,carefulReset:true,geometry});
    } catch(error) {
      report.failures.push(`${width}x${height}: ${String(error)}`);
    } finally {
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(path.join(output,"report.json"),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
if (report.failures.length || report.cases.length !== sizes.length) process.exitCode = 1;
