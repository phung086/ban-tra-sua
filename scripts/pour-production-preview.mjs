import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ args: ["--no-sandbox","--enable-unsafe-swiftshader"] });
await mkdir("pour-preview-artifacts", { recursive: true });
let failures = 0;
for (const [width,height] of [[360,800],[390,844],[844,390],[1280,800]]) {
  const page = await browser.newPage({ viewport: { width,height }, reducedMotion: "reduce" });
  try {
    await page.goto("http://127.0.0.1:5195");
    await page.getByRole("button",{name:/Mở cửa tiệm/}).click();
    await page.locator(".craft-stations button").nth(2).click();
    const cup = page.locator(".manual-pour");
    await cup.screenshot({path:`pour-preview-artifacts/before-${width}x${height}.png`});
    const hold = cup.locator(".manual-pour-hold");
    const box = await hold.boundingBox();
    if (!box) throw Error("No pour control");
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    await page.waitForTimeout(1200);
    await page.mouse.up();
    const amount = Number(await cup.getByRole("progressbar").getAttribute("aria-valuenow"));
    if (amount < 10) throw Error("Pour did not advance");
    await cup.screenshot({path:`pour-preview-artifacts/after-${width}x${height}.png`});
    console.log(width,height,amount);
  } catch (e) { failures++; console.error(width,height,e); }
  await page.close();
}
await browser.close();
if (failures) process.exitCode = 1;
