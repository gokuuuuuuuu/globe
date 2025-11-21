import fs from 'fs';
import path from 'path';

const WORLD_PATH = path.join('public', 'data', 'world.json');
const CHINA_PATH = 'china_provinces.json';
const OUT_PATH = path.join('public', 'data', 'world.json'); // Overwrite

// 映射 DataV 的 adcode 到名称 (可选，如果 properties 里已经有 name)
// DataV properties: { adcode: 110000, name: '北京市', ... }

async function mergeMaps() {
  try {
    const worldRaw = fs.readFileSync(WORLD_PATH, 'utf8');
    const chinaRaw = fs.readFileSync(CHINA_PATH, 'utf8');

    const worldData = JSON.parse(worldRaw);
    const chinaData = JSON.parse(chinaRaw);

    console.log(`Original world features: ${worldData.features.length}`);

    // 1. Remove China, Taiwan, Hong Kong, Macao from world data
    // Codes: CHN, TWN, HKG, MAC
    const idsToRemove = ['CHN', 'TWN', 'HKG', 'MAC'];
    const filteredFeatures = worldData.features.filter(f => {
      const id = f.id || f.properties?.ISO_A3 || f.properties?.iso_a3;
      return !idsToRemove.includes(id);
    });

    console.log(`Filtered world features: ${filteredFeatures.length}`);

    // 2. Process China features
    const chinaFeatures = chinaData.features.map(f => {
      // Ensure format matches
      const props = f.properties || {};
      
      // Modify properties to integrate with the app
      // Set iso_a2 to CN so they are all treated as "China" for global selection
      // Or we can set specific IDs if we want provincial selection later
      
      // For now, let's set a property that identifies them as China
      // but also keeps their province identity.
      
      return {
        type: 'Feature',
        // We don't set top-level ID to CN, to avoid duplicate key issues in React lists if not careful
        // But the app uses feature index sometimes.
        properties: {
          ...props,
          iso_a2: 'CN', // Make sure deriveIsoCode returns 'CN'
          name: props.name, // Province name
          isProvince: true // Marker
        },
        geometry: f.geometry
      };
    });

    console.log(`China province features: ${chinaFeatures.length}`);

    // 3. Merge
    const newWorldData = {
      type: 'FeatureCollection',
      features: [...filteredFeatures, ...chinaFeatures]
    };

    console.log(`New world features: ${newWorldData.features.length}`);

    // 4. Write back
    fs.writeFileSync(OUT_PATH, JSON.stringify(newWorldData));
    console.log('Successfully merged map data.');

  } catch (err) {
    console.error('Error merging maps:', err);
  }
}

mergeMaps();

