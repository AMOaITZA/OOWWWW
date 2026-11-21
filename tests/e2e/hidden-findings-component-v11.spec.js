import {test,expect} from '@playwright/test';

test('a discovery journal shows the earned message, keeps the collection and cleans up its voice action',async({page})=>{
  await page.route('**/__finding-component',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="es"><body><main id="root"></main></body></html>'}));
  await page.goto('/__finding-component');
  await page.evaluate(async()=>{
    const {mount}=await import('/game/experiences/hallazgo.js');
    const {SECRETS}=await import('/game/hidden-secrets.js');
    window.__findingSave={hiddenSecrets:{found:['cofre-luna']}};
    window.__findingLines=[];window.__findingWrites=0;
    window.__findingCleanup=mount(document.getElementById('root'),{},
      {save:window.__findingSave,getCurrentDiscovery:()=>SECRETS[0],
        onLeoSay:line=>window.__findingLines.push(line),onProgressChange:()=>window.__findingWrites++});
  });
  await expect(page.locator('.hidden-finding')).toHaveAttribute('data-secret','cofre-cerezo');
  await expect(page.locator('.finding-message')).toContainText('conmigo siempre puedes descansar');
  await expect(page.locator('.finding-progress')).toHaveText('2 / 3 secretos');
  await expect(page.locator('.finding-collection li[data-found="true"]')).toHaveCount(2);
  await expect(page.locator('.finding-collection li[data-found="false"]')).toHaveText('Un secreto por descubrir');
  await page.getByRole('button',{name:'Escuchar a Leo',exact:true}).click();
  expect(await page.evaluate(()=>window.__findingLines.length)).toBe(1);
  expect(await page.evaluate(()=>window.__findingWrites)).toBe(1);
  await page.evaluate(()=>{window.__findingCleanup();document.querySelector('.finding-button').click();});
  expect(await page.evaluate(()=>window.__findingLines.length)).toBe(1);
});
