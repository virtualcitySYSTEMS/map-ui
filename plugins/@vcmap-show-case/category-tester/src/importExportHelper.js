import { downloadText } from '@vcmap/ui';

export function exportCategoryCallback(app, collectionComponent, category) {
  const serialized = category.serializeModule(app.dynamicModuleId);
  serialized.items = serialized.items.filter((i) =>
    collectionComponent.selection.value.find((s) => s.title === i.name),
  );
  downloadText(JSON.stringify(serialized, null, 2), `${category.name}.json`);
}

export async function importCategoryCallback(app, files) {
  const promises = files.map((file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        try {
          const { name, items } = JSON.parse(e.target.result);
          app.categories.parseCategoryItems(name, items, app.dynamicModuleId);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  });

  await Promise.all(promises);
}
